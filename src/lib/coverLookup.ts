/**
 * Автоподбор обложки по названию игры через RAWG API (https://rawg.io/apidocs).
 * Нужен бесплатный ключ: положите его в .env как VITE_RAWG_KEY=...
 *
 * Результат кэшируется в localStorage, чтобы не дёргать API при каждой загрузке.
 */

/**
 * ВСТАВЬТЕ СВОЙ КЛЮЧ RAWG СЮДА (между кавычками), например: "abc123def456".
 * Получить бесплатно: https://rawg.io/apidocs
 * Если оставить пустым, ключ берётся из переменной VITE_RAWG_KEY (если она задана).
 */
const RAWG_KEY = "a2dce82a4459453280bf9cfa36d05e2e";

const API_KEY: string = RAWG_KEY || import.meta.env.VITE_RAWG_KEY || "";
const CACHE_KEY = "game-meta-v2";

export interface GameMeta {
  image: string;
  /** Жанры на русском, например ["Экшен", "RPG"] */
  genres: string[];
}

type CoverCache = Record<string, GameMeta>;

const GENRE_RU: Record<string, string> = {
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

const inflight = new Map<string, Promise<GameMeta | null>>();
const misses = new Set<string>(); // промахи помним только в рамках сессии

function readCache(): CoverCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(key: string, meta: GameMeta) {
  try {
    const cache = readCache();
    cache[key] = meta;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage недоступен — не страшно */
  }
}

/**
 * Превращает название из прайса в поисковую строку:
 * «BALDURS GATE 3 - DIGITAL DELUXE EDITION XBOX ONE|XS» → «baldurs gate 3»
 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/[™®©]/g, "")
    .replace(/\bxbox\b.*$/i, " ") // отрезаем платформу и всё после неё
    .replace(/\b(ps[45]|playstation.*|nintendo.*|switch)\b.*$/i, " ")
    .replace(/цифровая версия|цифровое издание|ключ|аренда/gi, " ")
    .replace(
      /\b(deluxe|ultimate|premium|gold|standard|complete|definitive|game of the year|goty|edition|bundle|digital|cross-gen|next-gen)\b/gi,
      " "
    )
    .replace(/[|+]/g, " ")
    .replace(/\s[-–—]+(\s|$)/g, " ") // висящие тире
    .replace(/[-–—:\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getCachedMeta(title: string): GameMeta | null {
  return readCache()[normalizeTitle(title)] ?? null;
}

export function fetchGameMeta(title: string, query?: string): Promise<GameMeta | null> {
  const key = normalizeTitle(title);
  const cached = readCache()[key];
  if (cached) return Promise.resolve(cached);
  if (!API_KEY) {
    if (!misses.has("__nokey")) {
      misses.add("__nokey");
      console.warn(
        "[covers] Ключ RAWG не задан. Вставьте его в константу RAWG_KEY в начале файла src/lib/coverLookup.ts."
      );
    }
    return Promise.resolve(null);
  }
  if (misses.has(key)) return Promise.resolve(null);

  const running = inflight.get(key);
  if (running) return running;

  const term = query ?? key;
  const url =
    `https://api.rawg.io/api/games?key=${API_KEY}` +
    `&search=${encodeURIComponent(term)}&search_precise=true&page_size=1`;

  const request = fetch(url)
    .then((res) =>
      res.ok ? res.json() : Promise.reject(new Error(`RAWG вернул HTTP ${res.status}`))
    )
    .then((data) => {
      const first = data?.results?.[0];
      const image: string | undefined = first?.background_image;
      if (image) {
        const genres: string[] = (first?.genres ?? [])
          .map((g: { name: string }) => GENRE_RU[g.name] ?? g.name)
          .slice(0, 2);
        const meta: GameMeta = { image, genres };
        writeCache(key, meta);
        return meta;
      }
      console.warn(`[covers] RAWG ничего не нашёл по запросу «${term}»`);
      misses.add(key);
      return null;
    })
    .catch((err) => {
      console.warn(`[covers] Не удалось получить обложку «${title}»:`, err);
      misses.add(key);
      return null;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}
