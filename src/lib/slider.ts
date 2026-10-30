import type { Game } from "./games.ts";
import { toCard, type CollectionCard } from "./collections.ts";
import { buildCandidates, findGame } from "./authorCollections.ts";

/**
 * Слайдер вверху сайта: топовые игры и новинки.
 * Слайды берутся из листа «Слайдер» в Google Таблице (см. src/lib/adminSheet.ts).
 * Список ниже — запасной: используется, только если листа в таблице нет.
 */
export interface SlideDef {
  /** Название игры (как в прайсе, без платформы). Картинка, цена и кнопка «В корзину» подставятся сами */
  game: string;
  /** Метка на слайде: «Новинка», «Топ продаж», «Скоро» … */
  label?: string;
  /** Свой заголовок (по умолчанию — название игры) */
  title?: string;
  /** Короткий текст под заголовком */
  text?: string;
  /** Цвет метки: зелёный, оранжевый, красный, синий, фиолетовый, розовый, жёлтый, голубой или #RRGGBB */
  color?: string;
}

export const SLIDES_FALLBACK: SlideDef[] = [];

/** Максимум слайдов */
export const MAX_SLIDES = 8;

export interface Slide {
  id: string;
  /** Название для поиска обложки */
  coverTitle: string;
  title: string;
  label?: string;
  text?: string;
  color?: string;
  /** Игра из прайса (цена и корзина); нет, если игры пока нет в прайсе */
  card?: CollectionCard;
}

export function resolveSlides(games: Game[], defs: SlideDef[]): Slide[] {
  // предзаказы тоже подходят: в слайдере часто показывают игры, которые скоро выйдут
  const candidates = buildCandidates(games, true);
  const slides: Slide[] = [];

  for (const def of defs.slice(0, MAX_SLIDES)) {
    const game = findGame(def.game, candidates);
    const card = game ? toCard(game, def.label ?? "", "Слайдер") : undefined;
    slides.push({
      id: `${slides.length}-${card?.id ?? def.game}`,
      coverTitle: card?.title ?? def.game,
      title: def.title || card?.title || def.game,
      label: def.label,
      text: def.text,
      color: def.color,
      card,
    });
  }
  return slides;
}

/* ---------- цвета меток ---------- */

interface Tone {
  bg: string;
  fg: string;
}

const TONES: Record<string, Tone> = {
  green: { bg: "#90f910", fg: "#151515" },
  orange: { bg: "#ffa23a", fg: "#1a0e00" },
  red: { bg: "#ff4d5e", fg: "#ffffff" },
  violet: { bg: "#8b6cff", fg: "#ffffff" },
  blue: { bg: "#3aa0ff", fg: "#04121f" },
  pink: { bg: "#ff5cb8", fg: "#2a0618" },
  yellow: { bg: "#ffd93a", fg: "#1a1500" },
  cyan: { bg: "#34e1e1", fg: "#031a1a" },
};

const TONE_ALIASES: Record<string, string> = {
  зеленый: "green", зелёный: "green", green: "green",
  оранжевый: "orange", orange: "orange",
  красный: "red", red: "red",
  фиолетовый: "violet", violet: "violet", purple: "violet",
  синий: "blue", blue: "blue",
  розовый: "pink", pink: "pink",
  жёлтый: "yellow", желтый: "yellow", yellow: "yellow",
  голубой: "cyan", бирюзовый: "cyan", cyan: "cyan",
};

/** Подбор цвета по смыслу метки: «Новинка» — зелёный, «Топ/Хит» — оранжевый, «Скоро» — фиолетовый, «Скидка» — красный */
const KEYWORD_TONES: [RegExp, string][] = [
  [/новинк|new|релиз/i, "green"],
  [/топ|хит|top|hit|популяр|лидер|бестселлер/i, "orange"],
  [/скоро|предзаказ|анонс|soon|ожида/i, "violet"],
  [/скидк|акци|sale|распродаж|выгодн|цена/i, "red"],
  [/эксклюзив|exclusive/i, "pink"],
  [/подписк|game pass|ps plus/i, "blue"],
];

const CYCLE = ["green", "orange", "violet", "blue", "pink", "cyan", "yellow", "red"];

function hexTone(hex: string): Tone | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return { bg: `#${m[1]}`, fg: luminance > 0.6 ? "#0a0a0f" : "#ffffff" };
}

/**
 * Цвет метки. Приоритет: цвет, заданный в таблице → по смыслу слова («Новинка», «Скоро»…) →
 * стабильный цвет из палитры по тексту метки (разные метки получают разные цвета).
 */
export function labelTone(label: string, color?: string): Tone {
  if (color) {
    const named = TONE_ALIASES[color.trim().toLowerCase()];
    if (named) return TONES[named];
    const custom = hexTone(color);
    if (custom) return custom;
  }
  for (const [re, name] of KEYWORD_TONES) if (re.test(label)) return TONES[name];

  let hash = 0;
  for (const ch of label.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[CYCLE[hash % CYCLE.length]];
}
