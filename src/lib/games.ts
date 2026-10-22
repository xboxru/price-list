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
}

export interface DealDef {
  /** unique substring to locate the game in the sheet (case-insensitive) */
  match: string;
  /** 0..1 fraction, e.g. 0.45 === -45% */
  discount: number;
  cover: string;
  vibe: string;
}

export interface Deal extends DealDef {
  game: Game;
  saleValue: number;    // discounted price rounded to tens
  salePrice: string;    // formatted "1 850 ₽"
  basePrice: string;    // formatted original
}

// ---------------------------------------------------------------------------
// Weekly deals — curated selection. Spotlight rotates each calendar week.
// ---------------------------------------------------------------------------

export const DEAL_DEFS: DealDef[] = [
  {
    match: "ELDEN RING NIGHTREIGN XBOX ONE|XS",
    discount: 0.3,
    cover: "./covers/eldenring.jpg",
    vibe: "Мрачное фэнтези · Кооператив",
  },
  {
    match: "RED DEAD REDEMPTION 2 XBOX ONE|XS",
    discount: 0.45,
    cover: "./covers/rdr2.jpg",
    vibe: "Вестерн · Открытый мир",
  },
  {
    match: "GRAND THEFT AUTO V GTA 5 2022 XBOX ONE|XS",
    discount: 0.35,
    cover: "./covers/gta.jpg",
    vibe: "Криминальная сага · Лос-Сантос",
  },
  {
    match: "HOGWARTS LEGACY - DIGITAL DELUXE EDITION XBOX",
    discount: 0.4,
    cover: "./covers/hogwarts.jpg",
    vibe: "Магия · Хогвартс XIX века",
  },
  {
    match: "BLACK MYTH: WUKONG XBOX SERIES X|S",
    discount: 0.25,
    cover: "./covers/wukong.jpg",
    vibe: "Мифология · Экшен-RPG",
  },
  {
    match: "BALDURS GATE 3 - DIGITAL DELUXE EDITION XBOX ONE|XS",
    discount: 0.33,
    cover: "./covers/bg3.jpg",
    vibe: "Легендарная RPG · D&D",
  },
];

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

export function cleanName(raw: string): { name: string; hot: boolean; isNew: boolean } {
  const hot = /\u{1F525}|⭐|🏆/u.test(raw);
  const isNew = /\ud83c\udd95/u.test(raw) || /🆕/.test(raw);
  const name = raw.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
  return { name: name || raw, hot, isNew };
}

export function parseSheet(values: string[][] | undefined): Game[] {
  if (!values) return [];
  const games: Game[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || !row[0] || !row[1]) continue;
    const { name, hot, isNew } = cleanName(String(row[0]));
    const price = String(row[1]).trim();
    games.push({
      id: i,
      name,
      search: normalize(name),
      price,
      priceValue: parsePrice(price),
      hot,
      isNew,
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
 * Matches deal definitions against live sheet data.
 * Deals whose game is not found are simply skipped, so the section
 * never breaks if the sheet is edited.
 */
export function resolveDeals(games: Game[]): Deal[] {
  const deals: Deal[] = [];
  const used = new Set<number>();
  for (const def of DEAL_DEFS) {
    const needle = def.match.toUpperCase();
    const game = games.find(
      (g) => !used.has(g.id) && g.name.toUpperCase().includes(needle)
    );
    if (!game) continue;
    used.add(game.id);
    const saleValue = roundTen(game.priceValue * (1 - def.discount));
    deals.push({
      ...def,
      game,
      saleValue,
      salePrice: formatPrice(saleValue),
      basePrice: game.price,
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
