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
      card,
    });
  }
  return slides;
}
