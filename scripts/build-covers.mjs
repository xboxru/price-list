/**
 * Сборка обложек и жанров ТОЛЬКО для игр, которые сайт покажет в «Подборке дня»
 * и в «Скидках недели».
 *
 * Запускается в GitHub Actions при каждой сборке (и раз в сутки по расписанию):
 *   1. скачивает прайс (тот же Google Sheet, что и сайт);
 *   2. теми же функциями, что и сайт (плюс все игры из авторских подборок), определяет игры подборки и скидок
 *      на вчера, сегодня и ближайшие дни (чтобы любой часовой пояс был покрыт);
 *   3. для новых игр ищет обложку и жанры по очереди: RAWG → магазин Xbox → IGDB → SteamGridDB → Steam;
 *   4. сохраняет картинки в папку сайта. Посетители грузят их с вашего же домена,
 *      поэтому VPN не нужен.
 *
 * Локально: npm run covers   (нужен Node 22+)
 *
 * Ключи (секреты репозитория, все необязательные — источник без ключа пропускается):
 *   RAWG_KEY                         https://rawg.io/apidocs
 *   IGDB_CLIENT_ID, IGDB_CLIENT_SECRET   https://api-docs.igdb.com (аккаунт Twitch)
 *   STEAMGRIDDB_KEY                  https://www.steamgriddb.com/profile/preferences/api
 * Магазин Xbox и Steam работают без ключей.
 * Локально: RAWG_KEY=... npm run covers
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SHEET_URL, parseSheet } from "../src/lib/games.ts";
import { normalizeTitle } from "../src/lib/coverLookup.ts";
import { resolveCollection } from "../src/lib/collections.ts";
import { resolveAuthorCollections } from "../src/lib/authorCollections.ts";
import { fetchAuthorDefs, fetchCoverOverrides, fetchSliderDefs } from "../src/lib/adminSheet.ts";
import { resolveSlides, SLIDES_FALLBACK } from "../src/lib/slider.ts";
import { resolveDeals } from "../src/lib/games.ts";

const UA = "Mozilla/5.0 (compatible; xpbox-cover-bot/1.0)";
const DELAY_MS = 300; // пауза между запросами к RAWG
const STEAM_DELAY_MS = 900; // у Steam есть лимиты, поэтому пауза больше
const TIME_BUDGET_MS = 20 * 60 * 1000; // не дольше 20 минут за запуск
const RETRY_MISS_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // не нашли — пробуем снова через неделю
/** На сколько дней вперёд/назад считаем наборы: вчера, сегодня, завтра, послезавтра */
const DAY_OFFSETS = [-1, 0, 1, 2];
/** Менять при улучшении поиска: тогда ранее ненайденные игры будут искаться заново */
const SEARCH_VERSION = 7;

/** Ширина скачиваемых картинок (px). Больше — чётче, но тяжелее файл (1280 ≈ 100–250 КБ). */
const IMAGE_WIDTH = 1280;
/** Менять при смене качества/размера: тогда все картинки скачаются заново */
const IMAGE_VERSION = 3;
const MIN_MATCH = 0.75; // насколько название из источника должно совпасть с запросом (0…1)

const GENRES_RU = {
  Action: "Экшен",
  Adventure: "Приключения",
  RPG: "RPG",
  Shooter: "Шутер",
  Strategy: "Стратегия",
  Indie: "Инди",
  Casual: "Казуальная",
  Simulation: "Симулятор",
  Puzzle: "Головоломка",
  Arcade: "Аркада",
  Platformer: "Платформер",
  Racing: "Гонки",
  Sports: "Спорт",
  Fighting: "Файтинг",
  Family: "Семейная",
  "Massively Multiplayer": "MMO",
  "Board Games": "Настольная",
  Educational: "Обучающая",
  Card: "Карточная",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const mapGenres = (list) => (list ?? []).map((g) => GENRES_RU[g]).filter(Boolean).slice(0, 2);

async function get(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(i === 0 ? 5000 : 30000);
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await sleep(2000);
    }
  }
  throw lastErr;
}

const STOP_WORDS = new Set(["the", "a", "an", "of", "and"]);
// «III» и «3» — одно и то же: римские цифры приводим к арабским
const ROMAN = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10" };
const tokens = (s) =>
  new Set(
    norm(s)
      .split(" ")
      .filter((w) => w && !STOP_WORDS.has(w))
      .map((w) => ROMAN[w] ?? w)
  );

function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  const common = [...A].filter((w) => B.has(w)).length;
  return common / (A.size + B.size - common);
}

/**
 * Насколько название из источника совпадает с запросом (0…1).
 * Учитываются слова в обе стороны, поэтому «Joy Ball» ≠ «Joy Ball Adventure».
 * Название с подзаголовком («Game: Subtitle») сравнивается и по основной части.
 */
function overlap(term, name) {
  const head = name.split(/\s*[:–—]\s*|\s+-\s+/)[0];
  return Math.max(jaccard(term, name), head && head !== name ? jaccard(term, head) : 0);
}

async function downloadImage(urls, file) {
  for (const url of urls) {
    try {
      const res = await get(url, 2);
      if (!res.ok) continue;
      const type = res.headers.get("content-type") || "";
      const buf = Buffer.from(await res.arrayBuffer());
      if (!type.startsWith("image/") || buf.length < 1000) continue;
      await fs.writeFile(file, buf);
      return true;
    } catch {
      /* следующий адрес */
    }
  }
  return false;
}

/* ---------- Xbox / Microsoft Store (публичный DisplayCatalog) ---------- */

const XBOX_GENRES_RU = {
  "action & adventure": ["Экшен", "Приключения"],
  action: ["Экшен"],
  adventure: ["Приключения"],
  shooter: ["Шутер"],
  "role playing": ["RPG"],
  rpg: ["RPG"],
  "racing & flying": ["Гонки"],
  racing: ["Гонки"],
  sports: ["Спорт"],
  strategy: ["Стратегия"],
  fighting: ["Файтинг"],
  platformer: ["Платформер"],
  "puzzle & trivia": ["Головоломка"],
  puzzle: ["Головоломка"],
  simulation: ["Симулятор"],
  "family & kids": ["Семейная"],
  "card & board": ["Настольная"],
  educational: ["Обучающая"],
  casual: ["Казуальная"],
};

function mapXboxGenres(list) {
  const out = [];
  for (const g of list ?? []) {
    for (const ru of XBOX_GENRES_RU[String(g).toLowerCase()] ?? []) {
      if (!out.includes(ru)) out.push(ru);
    }
  }
  return out.slice(0, 2);
}

const DCAT = "https://displaycatalog.mp.microsoft.com/v7.0";
const XBOX_IMAGE_ORDER = [
  "TitledHeroArt",
  "SuperHeroArt",
  "BrandedKeyArt",
  "Hero",
  "BoxArt",
  "Poster",
];

const httpsUrl = (u) => (u?.startsWith("//") ? `https:${u}` : u);

async function xboxProduct(bigId) {
  const res = await get(
    `${DCAT}/products?bigIds=${encodeURIComponent(bigId)}&market=US&languages=en-US&MS-CV=DGU1mcuYo0WyAe7r.1`
  );
  if (!res.ok) return null;
  return (await res.json())?.Products?.[0] ?? null;
}

async function saveXboxGame(bigId, fallbackImage, imagesDir) {
  const product = await xboxProduct(bigId).catch(() => null);
  const images = product?.LocalizedProperties?.[0]?.Images ?? [];

  const urls = [];
  for (const purpose of XBOX_IMAGE_ORDER) {
    const img = images.find((i) => i.ImagePurpose === purpose && i.Uri);
    if (img) {
      const base = httpsUrl(img.Uri);
      urls.push(`${base}?q=95&w=${IMAGE_WIDTH}`, base); // сначала уменьшенная копия, потом оригинал
      break;
    }
  }
  if (fallbackImage) urls.push(`${httpsUrl(fallbackImage)}?q=95&w=${IMAGE_WIDTH}`, httpsUrl(fallbackImage));
  if (!urls.length) return null;

  const file = `xbox-${bigId}.jpg`;
  if (!(await downloadImage(urls, path.join(imagesDir, file)))) return null;

  const props = product?.Properties ?? {};
  const genres = mapXboxGenres([...(props.Categories ?? []), props.Category].filter(Boolean));
  return { image: `images/${file}`, genres };
}

/** Поиск игры в магазине Xbox по названию */
async function fromXbox(term, imagesDir) {
  const res = await get(
    `${DCAT}/productFamilies/autosuggest?market=US&languages=en-US&query=${encodeURIComponent(term)}&MS-CV=DGU1mcuYo0WyAe7r.1`
  );
  if (!res.ok) return null;
  const sets = (await res.json())?.ResultSets ?? [];
  const items = sets
    .flatMap((rs) => rs.Suggests ?? [])
    .filter((i) => i.Title && (!i.Source || /game/i.test(i.Source)));
  const t = norm(term);
  const best =
    items.find((i) => norm(i.Title) === t) ??
    items
      .map((i) => ({ i, score: overlap(term, i.Title) }))
      .filter((x) => x.score >= MIN_MATCH)
      .sort((x, y) => y.score - x.score)[0]?.i;
  if (!best) return null;

  const bigId = best.Metas?.find((m) => m.Key === "BigCatalogId")?.Value;
  if (!bigId) return null;
  return saveXboxGame(bigId, best.ImageUrl, imagesDir);
}

/** Игра из магазина Xbox по известному ID продукта (12 символов, из ссылки xbox.com/games/store/…/ID) */
async function fromXboxId(bigId, imagesDir) {
  return saveXboxGame(bigId, null, imagesDir);
}

/* ---------- IGDB (Twitch): нужны IGDB_CLIENT_ID и IGDB_CLIENT_SECRET ---------- */

const IGDB_GENRES_RU = {
  Shooter: "Шутер",
  "Role-playing (RPG)": "RPG",
  Adventure: "Приключения",
  Platform: "Платформер",
  Racing: "Гонки",
  Sport: "Спорт",
  Strategy: "Стратегия",
  "Real Time Strategy (RTS)": "Стратегия",
  "Turn-based strategy (TBS)": "Стратегия",
  Tactical: "Тактика",
  Fighting: "Файтинг",
  Puzzle: "Головоломка",
  Simulator: "Симулятор",
  Indie: "Инди",
  Arcade: "Аркада",
  "Hack and slash/Beat 'em up": "Экшен",
  "Point-and-click": "Квест",
  "Visual Novel": "Визуальная новелла",
  "Card & Board Game": "Настольная",
  "Quiz/Trivia": "Викторина",
  Music: "Музыкальная",
  MOBA: "MOBA",
};

let igdbToken = null;

async function igdbAuth() {
  if (igdbToken) return igdbToken;
  const id = process.env.IGDB_CLIENT_ID;
  const secret = process.env.IGDB_CLIENT_SECRET;
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
    { method: "POST", signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`Twitch OAuth: HTTP ${res.status}`);
  igdbToken = (await res.json()).access_token;
  return igdbToken;
}

async function igdbQuery(body) {
  if (!process.env.IGDB_CLIENT_ID || !process.env.IGDB_CLIENT_SECRET) return [];
  const token = await igdbAuth();
  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "user-agent": UA,
    },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`IGDB: HTTP ${res.status}`);
  return res.json();
}

const IGDB_FIELDS =
  "name,alternative_names.name,genres.name,artworks.image_id,screenshots.image_id,cover.image_id";

async function saveIgdbGame(game, imagesDir) {
  // широкая картинка лучше подходит карточкам: арт → скриншот → обложка
  const wide = game.artworks?.[0]?.image_id ?? game.screenshots?.[0]?.image_id;
  const urls = wide
    ? [`https://images.igdb.com/igdb/image/upload/t_720p/${wide}.jpg`]
    : game.cover?.image_id
      ? [`https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${game.cover.image_id}.jpg`]
      : [];
  if (!urls.length) return null;
  const file = `igdb-${game.id}.jpg`;
  if (!(await downloadImage(urls, path.join(imagesDir, file)))) return null;
  const genres = (game.genres ?? [])
    .map((g) => IGDB_GENRES_RU[g.name])
    .filter(Boolean)
    .filter((g, i, a) => a.indexOf(g) === i)
    .slice(0, 2);
  return { image: `images/${file}`, genres };
}

async function fromIgdb(term, imagesDir) {
  const safe = term.replace(/["\\]/g, " ");
  const games = await igdbQuery(`search "${safe}"; fields ${IGDB_FIELDS}; limit 8;`);
  const t = norm(term);
  const names = (g) => [g.name, ...(g.alternative_names ?? []).map((a) => a.name)].filter(Boolean);
  const best =
    games.find((g) => names(g).some((n) => norm(n) === t)) ??
    games
      .map((g) => ({ g, score: Math.max(0, ...names(g).map((n) => overlap(term, n))) }))
      .filter((x) => x.score >= MIN_MATCH)
      .sort((x, y) => y.score - x.score)[0]?.g;
  return best ? saveIgdbGame(best, imagesDir) : null;
}

async function fromIgdbId(id, imagesDir) {
  const where = /^\d+$/.test(String(id))
    ? `id = ${Number(id)}`
    : `slug = "${String(id).replace(/[^a-z0-9-]/gi, "")}"`;
  const games = await igdbQuery(`fields ${IGDB_FIELDS}; where ${where};`);
  return games[0] ? saveIgdbGame(games[0], imagesDir) : null;
}

/* ---------- SteamGridDB: нужен STEAMGRIDDB_KEY ---------- */

const SGDB = "https://www.steamgriddb.com/api/v2";

async function sgdbGet(pathname) {
  const res = await fetch(`${SGDB}${pathname}`, {
    headers: { Authorization: `Bearer ${process.env.STEAMGRIDDB_KEY}`, "user-agent": UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`SteamGridDB: HTTP ${res.status}`);
  return res.json();
}

async function saveSgdbGame(id, imagesDir) {
  // широкие «обложки» Steam 920×430 / 460×215; если их нет — любая сетка
  const wide = await sgdbGet(`/grids/game/${id}?dimensions=920x430,460x215&types=static&nsfw=false`);
  const any = wide?.data?.length ? wide : await sgdbGet(`/grids/game/${id}?types=static&nsfw=false`);
  const best = (any?.data ?? []).sort((a, b) => b.score - a.score)[0];
  if (!best?.url) return null;
  const file = `sgdb-${id}.jpg`;
  if (!(await downloadImage([best.url], path.join(imagesDir, file)))) return null;
  return { image: `images/${file}`, genres: [] }; // у SteamGridDB жанров нет
}

async function fromSgdb(term, imagesDir) {
  if (!process.env.STEAMGRIDDB_KEY) return null;
  const found = await sgdbGet(`/search/autocomplete/${encodeURIComponent(term)}`);
  const items = found?.data ?? [];
  const t = norm(term);
  const best =
    items.find((i) => norm(i.name) === t) ??
    items
      .map((i) => ({ i, score: overlap(term, i.name) }))
      .filter((x) => x.score >= MIN_MATCH)
      .sort((x, y) => y.score - x.score)[0]?.i;
  return best ? saveSgdbGame(best.id, imagesDir) : null;
}

async function fromSgdbId(id, imagesDir) {
  if (!process.env.STEAMGRIDDB_KEY) return null;
  return saveSgdbGame(id, imagesDir);
}

const steamImageUrls = (id) => [
  // capsule_616x353 заметно чётче, чем header.jpg (460×215)
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/capsule_616x353.jpg`,
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`,
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
  `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
];

async function steamGenres(id) {
  try {
    const res = await get(
      `https://store.steampowered.com/api/appdetails?appids=${id}&l=english&cc=us`
    );
    const data = (await res.json())?.[id]?.data;
    return mapGenres(data?.genres?.map((g) => g.description));
  } catch {
    return [];
  }
}

/** Запасной источник: Steam (поиск + картинка + жанры, 3 запроса на игру) */
async function fromSteam(term, imagesDir, forcedId) {
  let id = forcedId;
  if (!id) {
    const res = await get(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=us`
    );
    if (!res.ok) return null;
    const items = ((await res.json()).items ?? []).filter((i) => !i.type || i.type === "app");
    const t = norm(term);
    const best =
      items.find((i) => norm(i.name) === t) ??
      items
        .map((i) => ({ i, score: overlap(term, i.name) }))
        .sort((x, y) => y.score - x.score)[0]?.i;
    if (!best || (norm(best.name) !== t && overlap(term, best.name) < MIN_MATCH)) return null;
    id = best.id;
    await sleep(STEAM_DELAY_MS);
  }
  const file = `steam-${id}.jpg`;
  if (!(await downloadImage(steamImageUrls(id), path.join(imagesDir, file)))) return null;
  return { image: `images/${file}`, genres: await steamGenres(id) };
}

async function saveRawgGame(game, imagesDir) {
  if (!game?.background_image) return null;
  // RAWG умеет отдавать копию нужной ширины (resize/1280); если не получится — оригинал
  const original = game.background_image;
  const small = original.replace("/media/", `/media/resize/${IMAGE_WIDTH}/-/`);
  const file = `rawg-${game.id}.jpg`;
  if (!(await downloadImage([small, original], path.join(imagesDir, file)))) return null;
  return { image: `images/${file}`, genres: mapGenres(game.genres?.map((g) => g.name)) };
}

/** Поиск игры в RAWG по названию (1 запрос на игру + скачивание картинки) */
async function fromRawg(term, imagesDir) {
  const key = process.env.RAWG_KEY;
  if (!key) return null;
  const res = await get(
    `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(term)}&search_precise=true&page_size=5`
  );
  if (!res.ok) return null;
  const results = ((await res.json())?.results ?? []).filter((r) => r.background_image);
  const t = norm(term);
  const best =
    results.find((r) => norm(r.name ?? "") === t) ??
    results
      .map((r) => ({ r, score: overlap(term, r.name ?? "") }))
      .filter((x) => x.score >= MIN_MATCH)
      .sort((x, y) => y.score - x.score)[0]?.r;
  return saveRawgGame(best, imagesDir);
}

/** Игра из RAWG по известному id (для ручной привязки в cover-overrides.json) */
async function fromRawgId(id, imagesDir) {
  if (!process.env.RAWG_KEY) return null;
  const res = await get(`https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${process.env.RAWG_KEY}`);
  if (!res.ok) return null;
  return saveRawgGame(await res.json(), imagesDir);
}

/** Запасные варианты запроса: без подзаголовка («game: subtitle» → «game») */
function termVariants(term) {
  const list = [term];
  for (const sep of [":", " - ", " – ", " — "]) {
    const head = term.split(sep)[0].trim();
    if (head.length >= 3) list.push(head);
  }
  return [...new Set(list)];
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

/**
 * Разбор значения из cover-overrides.json. Можно вставлять что угодно из этого списка:
 *   "the-sims-4-v-restorane/brtfkmgz6rf2"        хвост ссылки Xbox (slug/ID)
 *   "https://www.xbox.com/.../9P6VQ73LDDWV"       ссылка на игру в магазине Xbox / Microsoft Store
 *   "9P6VQ73LDDWV"                                только ID продукта Xbox
 *   "https://store.steampowered.com/app/1245620"  ссылка Steam (или число 1245620)
 *   "https://rawg.io/games/elden-ring"            ссылка RAWG
 *   "https://www.steamgriddb.com/game/5254046"    ссылка SteamGridDB
 *   "https://www.igdb.com/games/elden-ring"       ссылка IGDB
 *   "xbox:ID", "rawg:ID", "igdb:ID", "sgdb:ID"    явная форма
 *   "Другое название"                             просто другой поисковый запрос
 */
export function parseOverride(value) {
  if (typeof value === "number") return { kind: "steam", id: String(value) };
  const v = String(value).trim();

  const tag = v.match(/^(xbox|rawg|igdb|sgdb|steam):\s*(.+)$/i);
  if (tag) return { kind: tag[1].toLowerCase(), id: tag[2].trim() };

  let m;
  if ((m = v.match(/steampowered\.com\/app\/(\d+)/i))) return { kind: "steam", id: m[1] };
  if ((m = v.match(/rawg\.io\/games\/([^/?#\s]+)/i))) return { kind: "rawg", id: m[1] };
  if ((m = v.match(/steamgriddb\.com\/game\/(\d+)/i))) return { kind: "sgdb", id: m[1] };
  if ((m = v.match(/igdb\.com\/games\/([^/?#\s]+)/i))) return { kind: "igdb", id: m[1] };

  // Xbox / Microsoft Store: ссылка или «slug/ID» — ID это последний сегмент из 12 символов
  if (/^(https?:\/\/|www\.)|\//i.test(v) || /^[A-Za-z0-9-]+\/[A-Za-z0-9]{12}$/.test(v)) {
    const segs = v.split(/[?#]/)[0].split("/").filter(Boolean);
    const last = segs[segs.length - 1];
    if (/^[A-Za-z0-9]{12}$/.test(last) && /\d/.test(last) && /[A-Za-z]/.test(last)) {
      return { kind: "xbox", id: last.toUpperCase() };
    }
  }
  // Голый ID Xbox: 12 символов; начинается с 9, либо с B и содержит минимум 2 цифры (чтобы не спутать с названием)
  if (
    /^9[A-Za-z0-9]{11}$/.test(v) ||
    (/^[Bb][A-Za-z0-9]{11}$/.test(v) && (v.match(/\d/g) ?? []).length >= 2)
  ) {
    return { kind: "xbox", id: v.toUpperCase() };
  }
  return { kind: "term", term: v };
}

export async function run({ outDir, cacheDir = ".covers-cache", games, overrides = {}, authorDefs, sliderDefs = SLIDES_FALLBACK }) {
  if (!process.env.RAWG_KEY) {
    console.warn(
      "::warning::Секрет RAWG_KEY не задан — обложки ищутся без RAWG. " +
        "Для лучшего результата добавьте RAWG_KEY (Settings → Secrets and variables → Actions)."
    );
  }
  // Ключи можно писать как угодно (в т.ч. прямо из прайса): приводим к виду сайта
  const ov = {};
  for (const [k, v] of Object.entries(overrides)) {
    if (k.startsWith("_")) continue;
    ov[normalizeTitle(k) || k.toLowerCase()] = v;
  }
  overrides = ov;

  const imagesDir = path.join(cacheDir, "images");
  await fs.mkdir(imagesDir, { recursive: true });
  const statePath = path.join(cacheDir, "state.json");
  const state = await readJson(statePath, {});
  if (state.__img !== IMAGE_VERSION) {
    for (const k of Object.keys(state)) if (!k.startsWith("__")) delete state[k];
    state.__img = IMAGE_VERSION;
  }
  if (state.__v !== SEARCH_VERSION) {
    for (const k of Object.keys(state)) if (state[k]?.miss) delete state[k];
    state.__v = SEARCH_VERSION;
  }

  // Нужны только игры подборки и скидок (за несколько дней, чтобы покрыть все часовые пояса)
  const titles = new Set();
  for (const offset of DAY_OFFSETS) {
    const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
    for (const c of resolveCollection(games, date)) titles.add(c.title);
    for (const d of resolveDeals(games, date)) titles.add(d.game.name);
  }
  // Авторские подборки: показываются всегда, поэтому обложки нужны для всех их игр
  for (const ac of resolveAuthorCollections(games, authorDefs)) {
    for (const card of ac.cards) titles.add(card.title);
    if (ac.missing.length) {
      console.log(`::warning::Авторская подборка «${ac.title}»: не показаны — ${ac.missing.join("; ")}`);
    }
  }
  // Слайдер вверху сайта: тоже всегда показывается
  const slides = resolveSlides(games, sliderDefs);
  for (const slide of slides) titles.add(slide.coverTitle);
  const noPrice = slides.filter((sl) => !sl.card).map((sl) => sl.coverTitle);
  if (noPrice.length) {
    console.log(
      `::warning::Слайдер: нет в прайсе (показываются без цены и кнопки «В корзину») — ${noPrice.join(", ")}. ` +
        "Проверьте, что название совпадает с прайсом."
    );
  }
  const wanted = new Map();
  for (const title of titles) {
    const key = normalizeTitle(title);
    if (key && !wanted.has(key)) wanted.set(key, key);
  }
  console.log(`Нужны обложки для ${wanted.size} игр (из ${games.length} в прайсе)`);

  const started = Date.now();
  let found = 0;
  let missed = 0;
  let skipped = 0;

  for (const key of wanted.keys()) {
    const entry = state[key];
    const sig = overrides[key] !== undefined ? String(overrides[key]) : undefined;
    const fresh = sig
      ? entry?.src === sig // привязка не менялась — повторно не качаем
      : entry && !entry.src && (!entry.miss || Date.now() - entry.miss < RETRY_MISS_AFTER_MS);
    const hasFile = entry?.image && (await fs.stat(path.join(cacheDir, entry.image)).catch(() => null));
    if (fresh && (entry.miss || hasFile)) continue;

    if (Date.now() - started > TIME_BUDGET_MS) {
      skipped++;
      continue;
    }

    const override = overrides[key];
    const spec = override !== undefined ? parseOverride(override) : { kind: "term", term: key };
    const term = spec.kind === "term" ? spec.term : key;

    let meta = null;
    try {
      if (spec.kind === "steam") {
        meta = await fromSteam(term, imagesDir, spec.id);
      } else if (spec.kind === "rawg") {
        meta = await fromRawgId(spec.id, imagesDir);
      } else if (spec.kind === "xbox") {
        meta = await fromXboxId(spec.id, imagesDir);
      } else if (spec.kind === "igdb") {
        meta = await fromIgdbId(spec.id, imagesDir);
      } else if (spec.kind === "sgdb") {
        meta = await fromSgdbId(spec.id, imagesDir);
      } else {
        const variants = termVariants(term);
        // Порядок источников: RAWG → магазин Xbox → IGDB → SteamGridDB → Steam
        // (источники без ключей пропускаются сами)
        const hasIgdb = process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET;
        const sources = [
          { fn: fromRawg, delay: process.env.RAWG_KEY ? DELAY_MS : 0 },
          { fn: fromXbox, delay: DELAY_MS },
          { fn: fromIgdb, delay: hasIgdb ? DELAY_MS : 0 },
          { fn: fromSgdb, delay: process.env.STEAMGRIDDB_KEY ? DELAY_MS : 0 },
          { fn: fromSteam, delay: STEAM_DELAY_MS },
        ];
        for (const { fn, delay } of sources) {
          for (const t of variants) {
            try {
              meta = await fn(t, imagesDir);
            } catch (err) {
              console.warn(`  ! ${key} (${fn.name}): ${err.message}`);
            }
            if (meta) break;
            if (delay) await sleep(delay);
          }
          if (meta) break;
        }
      }
    } catch (err) {
      console.warn(`  ! ${key}: ${err.message}`);
    }
    await sleep(DELAY_MS);

    if (meta) {
      state[key] = sig ? { ...meta, src: sig } : meta;
      found++;
      console.log(`  + ${key} -> ${meta.image} [${meta.genres.join(", ")}]`);
    } else {
      state[key] = sig ? { miss: Date.now(), src: sig } : { miss: Date.now() };
      missed++;
      console.log(`  - ${key}: не найдено`);
    }
    await fs.writeFile(statePath, JSON.stringify(state)); // сохраняем по ходу
  }

  // публичный индекс — только найденные игры из текущего прайса
  const index = {};
  const used = new Set();
  for (const key of wanted.keys()) {
    const e = state[key];
    if (e?.image) {
      index[key] = { image: e.image, genres: e.genres ?? [] };
      used.add(path.basename(e.image));
    }
  }

  const notFound = [...wanted.keys()].filter((k) => !index[k]);
  if (notFound.length) {
    console.log(`\nОбложка не найдена (${notFound.length}): ${notFound.join(" | ")}`);
    console.log(
      "::warning::Нет обложки для: " +
        notFound.join(", ") +
        ". Добавьте их в scripts/cover-overrides.json."
    );
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outDir, "images"), { recursive: true });
  for (const file of used) {
    await fs.copyFile(path.join(imagesDir, file), path.join(outDir, "images", file)).catch(() => {});
  }
  await fs.writeFile(path.join(outDir, "index.json"), JSON.stringify(index));

  console.log(
    `Готово: в индексе ${Object.keys(index).length}/${wanted.size}, новых ${found}, не найдено ${missed}, отложено ${skipped}`
  );
  return { index, found, missed, skipped };
}

// ---- запуск из командной строки ----
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = process.argv[2] ?? "public/game-covers";
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const overrides = await readJson(path.join(root, "scripts", "cover-overrides.json"), {});
  delete overrides._comment;

  // Ключ Google Sheets может быть ограничен адресом сайта, поэтому из CI
  // отправляем тот же Referer, что и браузер посетителя.
  const site = process.env.SITE_URL;
  const headers = {};
  if (site) {
    headers.Referer = site;
    headers.Origin = new URL(site).origin;
  }

  let games = [];
  try {
    const res = await fetch(SHEET_URL, { headers });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 400);
      throw new Error(`Google Sheets вернул HTTP ${res.status}: ${body}`);
    }
    games = parseSheet((await res.json()).values);
    console.log(`Прайс загружен: ${games.length} позиций (Referer: ${site ?? "не задан"})`);
  } catch (err) {
    console.error(`::error::Не удалось загрузить прайс: ${err.message}`);
    console.error(
      "Если ошибка 403 — в настройках API-ключа Google (Credentials) разрешите адрес сайта " +
        "или снимите ограничение по HTTP-referrer."
    );
    process.exit(1);
  }
  if (games.length === 0) {
    console.error("::error::Прайс пустой, обложки не собираются.");
    process.exit(1);
  }
  // Лист «Подборки» и лист «Обложки» из Google Таблицы (с тем же Referer, что и прайс)
  const authorDefs = (await fetchAuthorDefs({ headers })) ?? undefined;
  console.log(
    authorDefs
      ? `Авторские подборки из таблицы: ${authorDefs.map((d) => `${d.title} (${d.games.length})`).join(", ")}`
      : "Лист «Подборки» не найден или пуст — используется список из authorCollections.ts"
  );
  const sliderDefs = (await fetchSliderDefs({ headers })) ?? SLIDES_FALLBACK;
  console.log(`Слайдов в слайдере: ${sliderDefs.length}`);
  const sheetOverrides = await fetchCoverOverrides({ headers });
  if (sheetOverrides) {
    console.log(`Привязки обложек из таблицы: ${Object.keys(sheetOverrides).length}`);
  }

  await run({ outDir, games, overrides: { ...overrides, ...(sheetOverrides ?? {}) }, authorDefs, sliderDefs });
}
