/**
 * Обложки и жанры игр.
 *
 * Данные готовятся заранее скриптом scripts/build-covers.mjs (в GitHub Actions) и лежат
 * рядом с сайтом: game-covers/index.json и game-covers/images/*.jpg.
 * Посетитель грузит всё с вашего домена, внешние сервисы и VPN не нужны.
 */

const INDEX_PATH = "game-covers/index.json";

export interface GameMeta {
  image: string;
  /** Жанры на русском, например ["Экшен", "RPG"] */
  genres: string[];
}

type CoverIndex = Record<string, GameMeta>;

let loaded: CoverIndex | null = null;
let loading: Promise<CoverIndex> | null = null;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`;
}

function loadIndex(): Promise<CoverIndex> {
  if (loading) return loading;
  const base = new URL(INDEX_PATH, document.baseURI);
  loading = fetch(`${base.href}?d=${today()}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((raw: CoverIndex) => {
      const index: CoverIndex = {};
      for (const [key, meta] of Object.entries(raw)) {
        index[key] = { ...meta, image: new URL(meta.image, base).href };
      }
      loaded = index;
      return index;
    })
    .catch((err) => {
      console.warn("[covers] Не удалось загрузить game-covers/index.json:", err);
      loaded = {};
      return {} as CoverIndex;
    });
  return loading;
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

/** Мгновенный ответ, если индекс уже загружен */
export function getCachedMeta(title: string): GameMeta | null {
  return loaded?.[normalizeTitle(title)] ?? null;
}

export function fetchGameMeta(title: string): Promise<GameMeta | null> {
  return loadIndex().then((index) => index[normalizeTitle(title)] ?? null);
}
