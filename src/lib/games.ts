// ---------------------------------------------------------------------------
// Data layer: live Google Sheets pricing + weekly deals logic
// ---------------------------------------------------------------------------

export const SHEET_ID = "1MzBvxOzI6Yn3sRkAdJZeG-mdSeoQwPRYKv9thY9_U-0";
export const API_KEY = "AIzaSyAz6NMjP-Sgq2P9FgGOc8T1prYM57b-An0";
export const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/ru%20price!A:B?key=${API_KEY}`;

export const TG_CHANNEL = "https://t.me/spelonline";
export const TG_PM = "https://t.me/realfurys";

export interface Game {
  id: number;
  name: string;        // cleaned display name
  search: string;      // normalized lowercase for search (ё -> е)
  price: string;       // original price string, e.g. "1690 ₽"
  priceValue: number;  // numeric price
  hot: boolean;        // had a flame marker in the sheet
  isNew: boolean;      // had a 🆕 marker in the sheet
  isPreorder: boolean; // had a 📆 marker in the sheet
}

export interface DealDef {
  /** unique substring to locate the game in the sheet (case-insensitive) */
  match: string;
  /** 0..1 fraction, e.g. 0.45 === -45% */
  discount: number;
  /** Необязательно: если не задана, обложка подбирается автоматически по названию */
  cover?: string;
  /** Подпись под названием. Реальные жанры подставляются автоматически в интерфейсе. */
  vibe: string;
}

export interface Deal extends DealDef {
  game: Game;
  saleValue: number;    // discounted price rounded to tens
  salePrice: string;    // formatted "1 850 ₽"
  baseValue: number;    // original high price before discount
  basePrice: string;    // formatted original
}

// ---------------------------------------------------------------------------
// Weekly deals — auto-generated from the price list each week.
// ---------------------------------------------------------------------------

/**
 * Количество игр в «скидках недели».
 * Каждую неделю набор меняется автоматически.
 */
const DEALS_COUNT = 6;

/**
 * Насколько повышаем цену перед тем как показать «скидку недели».
 * Итоговая старая цена = текущая цена + случайная надбавка в этом диапазоне.
 */
const DEAL_BUMP_MIN = 1000;
const DEAL_BUMP_MAX = 1500;


// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;

export const normalize = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();

export function parsePrice(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function cleanName(raw: string): { name: string; hot: boolean; isNew: boolean; isPreorder: boolean } {
  const hot = /\u{1F525}|⭐|🏆/u.test(raw);
  const isNew = /\ud83c\udd95/u.test(raw) || /🆕/.test(raw);
  const isPreorder = /📆/.test(raw) || /\u{1F4C6}/u.test(raw);
  const name = raw.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
  return { name: name || raw, hot, isNew, isPreorder };
}

export function parseSheet(values: string[][] | undefined): Game[] {
  if (!values) return [];
  const games: Game[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || !row[0] || !row[1]) continue;
    const { name, hot, isNew, isPreorder } = cleanName(String(row[0]));
    const price = String(row[1]).trim();
    games.push({
      id: i,
      name,
      search: normalize(name),
      price,
      priceValue: parsePrice(price),
      hot,
      isNew,
      isPreorder,
    });
  }
  return games;
}

export async function fetchGames(signal?: AbortSignal): Promise<Game[]> {
  const res = await fetch(SHEET_URL, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return parseSheet(json.values as string[][]);
}

// ---------------------------------------------------------------------------
// Deals resolution
// ---------------------------------------------------------------------------

/** round to nearest "nice" ten, e.g. 1848 -> 1850 */
export const roundTen = (v: number) => Math.round(v / 10) * 10;

/**
 * Простой сидированный PRNG (mulberry32).
 * Один и тот же сид даёт одну и ту же последовательность,
 * поэтому в течение недели набор скидок не меняется.
 */
export function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Автоматически выбирает DEALS_COUNT игр из прайса на основе
 * текущей календарной недели. Каждый понедельник набор обновляется.
 */
export function resolveDeals(games: Game[]): Deal[] {
  if (games.length < DEALS_COUNT) return [];

  // Фильтруем игры: берём только с ценой >= 500 ₽
  const eligible = games.filter((g) => g.priceValue >= 500);
  if (eligible.length < DEALS_COUNT) return [];

  const week = isoWeek();
  const rand = seededRandom(week * 7919); // простое число для лучшего разброса

  // Перемешиваем копию массива по Фишеру-Йетсу с сидом
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = shuffled.slice(0, DEALS_COUNT);
  const deals: Deal[] = [];

  for (let i = 0; i < picked.length; i++) {
    const game = picked[i];

    // Текущая цена из прайса становится «ценой со скидкой»
    const saleValue = game.priceValue;

    // Формируем старую цену: повышаем её на случайную сумму 1000–1500 ₽
    const bump = Math.round(DEAL_BUMP_MIN + rand() * (DEAL_BUMP_MAX - DEAL_BUMP_MIN));
    const oldValue = roundTen(game.priceValue + bump);

    // Показываем процент скидки относительно старой цены
    const discountRounded = Math.round(((oldValue - saleValue) / oldValue) * 100) / 100;

    deals.push({
      match: game.name,
      discount: discountRounded,
      vibe: "Скидка недели",
      game,
      saleValue,
      salePrice: formatPrice(saleValue),
      baseValue: oldValue,
      basePrice: formatPrice(oldValue),
    });
  }

  return deals;
}

/** ISO week number — used to rotate the spotlight deal week to week */
export function isoWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ---------------------------------------------------------------------------
// Fallback snapshot — shown only if the live sheet cannot be loaded,
// so the interface never appears broken.
// ---------------------------------------------------------------------------

export const FALLBACK_ROWS: [string, string][] = [
  ["🔥 Call of Duty®: Modern Warfare® 4 - Vault Edition | Xbox Series X|S (Предзаказ)", "8250 ₽"],
  ["🔥 Call of Duty®: Modern Warfare® 4 | Xbox Series X|S (Предзаказ)", "6180 ₽"],
  ["ELDEN RING NIGHTREIGN XBOX ONE|XS", "2641 ₽"],
  ["RED DEAD REDEMPTION 2 XBOX ONE|XS", "1690 ₽"],
  ["GRAND THEFT AUTO V GTA 5 2022 XBOX ONE|XS", "2408 ₽"],
  ["HOGWARTS LEGACY - DIGITAL DELUXE EDITION XBOX", "1327 ₽"],
  ["BLACK MYTH: WUKONG XBOX SERIES X|S", "3267 ₽"],
  ["BALDURS GATE 3 - DIGITAL DELUXE EDITION XBOX ONE|XS", "3794 ₽"],
  ["THE WITCHER 3: WILD HUNT – COMPLETE XBOX", "1727 ₽"],
  ["FORZA HORIZON 5 STANDARD EDITION XBOX+PC", "2759 ₽"],
  ["DIABLO IV - STANDARD EDITION XBOX", "1527 ₽"],
  ["MORTAL KOMBAT 1: DEFINITIVE EDITION XBOX|XS", "1999 ₽"],
  ["IT TAKES TWO- ЦИФРОВАЯ ВЕРСИЯ XBOX", "1297 ₽"],
  ["HALO INFINITE (КАМПАНИЯ) XBOX ONE|XS+PC", "2090 ₽"],
  ["STARFIELD XBOX|XS+PC", "2140 ₽"],
  ["ATOMIC HEART XBOX ONE|XS", "1866 ₽"],
];

export function fallbackGames(): Game[] {
  return parseSheet([["Название:", "Цена:"], ...FALLBACK_ROWS]);
}
