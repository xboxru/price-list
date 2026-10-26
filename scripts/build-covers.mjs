/**
 * Сборка обложек и жанров ТОЛЬКО для игр, которые сайт покажет в «Подборке дня»
 * и в «Скидках недели».
 *
 * Запускается в GitHub Actions при каждой сборке (и раз в сутки по расписанию):
 *   1. скачивает прайс (тот же Google Sheet, что и сайт);
 *   2. теми же функциями, что и сайт, определяет игры подборки и скидок
 *      на вчера, сегодня и ближайшие дни (чтобы любой часовой пояс был покрыт);
 *   3. для новых игр ищет обложку и жанры в RAWG (если задан секрет RAWG_KEY), иначе/запасной вариант — Steam;
 *   4. сохраняет картинки в папку сайта. Посетители грузят их с вашего же домена,
 *      поэтому VPN не нужен.
 *
 * Локально: npm run covers   (нужен Node 22+)
 *
 * Переменная окружения RAWG_KEY (секрет репозитория) включает RAWG как основной источник.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SHEET_URL, parseSheet } from "../src/lib/games.ts";
import { normalizeTitle } from "../src/lib/coverLookup.ts";
import { resolveCollection } from "../src/lib/collections.ts";
import { resolveDeals } from "../src/lib/games.ts";

const UA = "Mozilla/5.0 (compatible; xpbox-cover-bot/1.0)";
const DELAY_MS = 900; // пауза между запросами к Steam (у них есть лимиты)
const TIME_BUDGET_MS = 20 * 60 * 1000; // не дольше 20 минут за запуск
const RETRY_MISS_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // не нашли — пробуем снова через неделю
/** На сколько дней вперёд/назад считаем наборы: вчера, сегодня, завтра, послезавтра */
const DAY_OFFSETS = [-1, 0, 1, 2];
/** Менять при улучшении поиска: тогда ранее ненайденные игры будут искаться заново */
const SEARCH_VERSION = 3;
const MIN_MATCH = 0.6; // доля слов запроса, которая должна совпасть с названием в Steam

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
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
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

function overlap(term, name) {
  const a = norm(term).split(" ").filter(Boolean);
  const b = new Set(norm(name).split(" "));
  if (!a.length) return 0;
  return a.filter((w) => b.has(w)).length / a.length;
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

const steamImageUrls = (id) => [
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
  `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`,
];

async function steamDetails(id) {
  try {
    const res = await get(
      `https://store.steampowered.com/api/appdetails?appids=${id}&l=english&cc=us`
    );
    const data = (await res.json())?.[id]?.data;
    return { name: data?.name, genres: mapGenres(data?.genres?.map((g) => g.description)) };
  } catch {
    return { name: undefined, genres: [] };
  }
}

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
    await sleep(DELAY_MS);
  }
  const file = `steam-${id}.jpg`;
  if (!(await downloadImage(steamImageUrls(id), path.join(imagesDir, file)))) return null;
  const { genres } = await steamDetails(id);
  return { image: `images/${file}`, genres };
}

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
  if (!best) return null;

  // RAWG умеет отдавать уменьшенную копию: файл ~50 КБ вместо нескольких сотен
  const original = best.background_image;
  const small = original.replace("/media/", "/media/crop/600/400/");
  const file = `rawg-${best.id}.jpg`;
  if (!(await downloadImage([small, original], path.join(imagesDir, file)))) return null;
  return { image: `images/${file}`, genres: mapGenres(best.genres?.map((g) => g.name)) };
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

export async function run({ outDir, cacheDir = ".covers-cache", games, overrides = {} }) {
  const imagesDir = path.join(cacheDir, "images");
  await fs.mkdir(imagesDir, { recursive: true });
  const statePath = path.join(cacheDir, "state.json");
  const state = await readJson(statePath, {});
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
    const fresh =
      entry && (!entry.miss || Date.now() - entry.miss < RETRY_MISS_AFTER_MS) && !overrides[key];
    const hasFile = entry?.image && (await fs.stat(path.join(cacheDir, entry.image)).catch(() => null));
    if (fresh && (entry.miss || hasFile)) continue;

    if (Date.now() - started > TIME_BUDGET_MS) {
      skipped++;
      continue;
    }

    const override = overrides[key];
    const term = typeof override === "string" ? override : key;
    const forcedId = typeof override === "number" ? override : undefined;

    let meta = null;
    try {
      if (forcedId) {
        meta = await fromSteam(term, imagesDir, forcedId);
      } else {
        const variants = termVariants(term);
        // RAWG — основной источник (1 запрос на игру), Steam — запасной
        const sources = process.env.RAWG_KEY
          ? [fromRawg, fromSteam]
          : [fromSteam, fromRawg];
        for (const source of sources) {
          for (const t of variants) {
            meta = await source(t, imagesDir);
            if (meta) break;
            await sleep(DELAY_MS);
          }
          if (meta) break;
        }
      }
    } catch (err) {
      console.warn(`  ! ${key}: ${err.message}`);
    }
    await sleep(DELAY_MS);

    if (meta) {
      state[key] = meta;
      found++;
      console.log(`  + ${key} -> ${meta.image} [${meta.genres.join(", ")}]`);
    } else {
      state[key] = { miss: Date.now() };
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
        ". Добавьте их в scripts/cover-overrides.json или задайте секрет RAWG_KEY."
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
  await run({ outDir, games, overrides });
}
