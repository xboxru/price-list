import type { Game } from "./games.ts";
import { seededRandom } from "./games.ts";
import { normalizeTitle } from "./coverLookup.ts";

export interface CollectionCard {
  id: string;
  /** Название для показа (без платформы) */
  title: string;
  price: string;
  platforms: string[];
  badge: string;
  collection: string;
  /** Необязательно: своя обложка. Иначе подбирается автоматически по названию. */
  cover?: string;
}

/**
 * ============================================================
 * ПОДБОРКА ДНЯ — собирается автоматически из прайса
 * ============================================================
 */

/** Сколько игр в подборке */
export const COLLECTION_COUNT = 12;

/** Из скольких самых дешёвых игр прайса выбираем (чем больше, тем разнообразнее по дням) */
const POOL_SIZE = 48;

/** Ниже этой цены не берём (отсекает дополнения, валюту и т.п.) */
const MIN_PRICE = 300;

/** Названия, которые не считаем играми (дополнения, подписки, пополнения) */
const EXCLUDE_RE =
  /dlc|дополнени|набор|pack|coins|points|монет|валют|подписк|game pass|ea play|gift|подарочн|карта оплаты|top.?up|season pass|battle pass/i;

/** Ключ текущего дня в локальном времени, например 20261026 */
export function dayKey(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function detectPlatforms(name: string): string[] {
  const n = name.toLowerCase();
  const list: string[] = [];
  if (/xbox/.test(n)) {
    const one = /xbox\s*one|one\s*\|\s*xs/.test(n);
    const series = /series|x\s*\|\s*s|\|\s*xs/.test(n);
    if (one) list.push("Xbox One");
    if (series) list.push("Xbox Series X|S");
    if (!one && !series) list.push("Xbox");
  }
  if (/\+\s*pc|\bpc\b/.test(n)) list.push("PC");
  return list.length ? list : ["Xbox"];
}

export function displayTitle(name: string): string {
  return (
    name
      .replace(/\s*[|\-–—]?\s*xbox\b.*$/i, "")
      .replace(/[-–—]?\s*цифровая версия/gi, "")
      .replace(/[-–—|\s]+$/g, "")
      .trim() || name
  );
}

/**
 * Каждый день выбирает COLLECTION_COUNT игр из самых дешёвых позиций прайса.
 * Набор меняется раз в сутки и одинаков для всех посетителей в этот день.
 */
export function resolveCollection(games: Game[], date = new Date()): CollectionCard[] {
  const eligible = games
    .filter((g) => g.priceValue >= MIN_PRICE && !g.isPreorder && !EXCLUDE_RE.test(g.name))
    .sort((a, b) => a.priceValue - b.priceValue || a.id - b.id);

  // Убираем дубли разных изданий одной игры (остаётся самое дешёвое)
  const seen = new Set<string>();
  const pool: Game[] = [];
  for (const g of eligible) {
    const key = normalizeTitle(g.name) || g.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(g);
    if (pool.length >= POOL_SIZE) break;
  }

  // Перемешиваем с сидом от даты: в течение дня порядок не меняется
  const rand = seededRandom(dayKey(date) * 7919);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool
    .slice(0, COLLECTION_COUNT)
    .map((g) => toCard(g, "Низкая цена", "Подборка дня"));
}

/** Карточка игры для раздела «Подборки» */
export function toCard(g: Game, badge: string, collection: string): CollectionCard {
  return {
    id: String(g.id),
    title: displayTitle(g.name),
    price: g.price,
    platforms: detectPlatforms(g.name),
    badge,
    collection,
  };
}
