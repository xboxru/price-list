import type { Game } from "./games.ts";
import { toCard, type CollectionCard } from "./collections.ts";
import { normalizeTitle } from "./coverLookup.ts";

/**
 * ============================================================
 * АВТОРСКИЕ ПОДБОРКИ — редактируйте этот список
 * ============================================================
 *
 * Каждая подборка это вкладка в разделе «Подборки».
 *  - id          — латиницей, без пробелов (используется внутри сайта)
 *  - title       — название вкладки
 *  - description — короткое описание под вкладками
 *  - badge       — необязательно: надпись на картинке (по умолчанию «Выбор автора»)
 *  - games       — названия игр. Пишите как в прайсе, но без платформы и издания
 *                  (например "Elden Ring", а не "ELDEN RING XBOX ONE|XS").
 *                  Цена и платформы берутся из прайса автоматически,
 *                  картинки подбираются сами. Если игры нет в прайсе, она
 *                  просто не показывается (в логе сборки будет предупреждение).
 *
 *                  Можно задать «порог хорошей цены»: { game: "Elden Ring", maxPrice: 1500 }.
 *                  Игра показывается, только пока её цена в прайсе не выше 1500 ₽.
 *                  Если цена выросла, она сама пропадёт из подборки, а когда
 *                  снова станет дешевле, вернётся.
 *
 * Ниже примеры — замените их на свои подборки.
 */
/** Название игры или название с порогом цены */
export type PickEntry = string | { game: string; maxPrice?: number };

export interface AuthorCollectionDef {
  id: string;
  title: string;
  description: string;
  badge?: string;
  games: PickEntry[];
}

export const AUTHOR_COLLECTIONS: AuthorCollectionDef[] = [
  {
    // ВАШ ВЫБОР: добавляйте сюда игры, которые сейчас продаются по отличной цене
    id: "great-price",
    title: "Отличная цена",
    description: "Игры, которые мы выбрали вручную: сейчас они стоят особенно выгодно.",
    badge: "Отличная цена",
    games: [
      // Примеры — замените на свои. maxPrice (в рублях) необязателен.
      { game: "Elden Ring", maxPrice: 2500 },
      { game: "Red Dead Redemption 2", maxPrice: 1500 },
      "Hogwarts Legacy",
    ],
  },
  {
    id: "coop",
    title: "Играем вдвоём",
    description: "Кооператив и игры для двоих: на диване или по сети.",
    games: ["It Takes Two", "A Way Out", "Overcooked! All You Can Eat", "Unravel Two", "Split Fiction"],
  },
  {
    id: "horror",
    title: "Хорроры",
    description: "Для тех, кто любит бояться. Играйте с выключенным светом.",
    games: ["Resident Evil Village", "Alan Wake 2", "Dead Space", "The Evil Within 2", "Outlast"],
  },
  {
    id: "open-world",
    title: "Открытые миры",
    description: "Огромные карты и сотни часов приключений.",
    games: [
      "Red Dead Redemption 2",
      "Grand Theft Auto V",
      "Cyberpunk 2077",
      "The Witcher 3: Wild Hunt",
      "Elden Ring",
      "Hogwarts Legacy",
    ],
  },
];

export interface AuthorCollection {
  id: string;
  title: string;
  description: string;
  cards: CollectionCard[];
  /** Игры из списка, которые не показаны: нет в прайсе или цена выше порога */
  missing: string[];
}

const tokens = (s: string) => new Set(normalizeTitle(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean));

/** Ищет в прайсе игру по названию: сначала точное совпадение, затем «все слова названия есть» */
function findGame(entry: string, candidates: { game: Game; key: string; words: Set<string> }[]) {
  const key = normalizeTitle(entry);
  const words = tokens(entry);
  if (!words.size) return undefined;

  const cheapest = (list: typeof candidates) =>
    list.sort((a, b) => a.game.priceValue - b.game.priceValue)[0]?.game;

  const exact = cheapest(candidates.filter((c) => c.key === key));
  if (exact) return exact;

  const partial = candidates
    .filter((c) => [...words].every((w) => c.words.has(w)))
    .sort((a, b) => a.words.size - b.words.size || a.game.priceValue - b.game.priceValue);
  return partial[0]?.game;
}

export function resolveAuthorCollections(games: Game[]): AuthorCollection[] {
  const candidates = games
    .filter((g) => g.priceValue > 0 && !g.isPreorder)
    .map((game) => ({ game, key: normalizeTitle(game.name), words: tokens(game.name) }));

  return AUTHOR_COLLECTIONS.map((def) => {
    const cards: CollectionCard[] = [];
    const missing: string[] = [];
    const seen = new Set<string>();

    for (const pick of def.games) {
      const name = typeof pick === "string" ? pick : pick.game;
      const maxPrice = typeof pick === "string" ? undefined : pick.maxPrice;

      const game = findGame(name, candidates);
      if (!game) {
        missing.push(`${name} (нет в прайсе)`);
        continue;
      }
      if (maxPrice !== undefined && game.priceValue > maxPrice) {
        missing.push(`${name} (цена ${game.price} выше порога ${maxPrice} ₽)`);
        continue;
      }
      const card = toCard(game, def.badge ?? "Выбор автора", def.title);
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      cards.push(card);
    }
    return { id: def.id, title: def.title, description: def.description, cards, missing };
  });
}
