import { SHEET_ID, API_KEY } from "./games.ts";
import type { AuthorCollectionDef, PickEntry } from "./authorCollections.ts";
import type { SlideDef } from "./slider.ts";

/**
 * «Админка» в Google Таблице.
 *
 * В той же таблице, где лежит прайс, можно завести два дополнительных листа
 * (названия листов — строго такие):
 *
 *  Лист «Подборки»  (авторские подборки — вкладки на сайте)
 *    A: Подборка      — название вкладки (можно оставлять пустым у следующих игр той же подборки)
 *    B: Игра          — название игры (как в прайсе, без платформы; издание учитывается)
 *    C: Макс. цена    — необязательно: показывать, только пока цена не выше (₽)
 *    D: Описание      — необязательно: текст под вкладками (достаточно в первой строке подборки)
 *    E: Надпись       — необязательно: надпись на картинке (по умолчанию «Выбор автора»)
 *
 *  Лист «Обложки»  (если у игры нет картинки или она не та)
 *    A: Игра          — название игры
 *    B: Ссылка        — хвост ссылки Xbox (the-sims-4-v-restorane/brtfkmgz6rf2),
 *                       ссылка на Steam/RAWG/IGDB/SteamGridDB или другое название для поиска
 *
 *  Лист «Слайдер»  (баннеры вверху сайта: топовые игры, новинки)
 *    A: Игра          — название игры как в прайсе (картинка, цена и «В корзину» подставятся сами)
 *    B: Метка         — необязательно: «Новинка», «Топ продаж», «Скоро» …
 *    C: Заголовок     — необязательно: свой заголовок (по умолчанию — название игры)
 *    D: Описание      — необязательно: короткий текст
 *    E: Показывать    — необязательно: «нет» скрывает слайд, не удаляя строку
 *    F: Цвет          — необязательно: цвет метки (зелёный, оранжевый, красный, синий,
 *                       фиолетовый, розовый, жёлтый, голубой или #RRGGBB). Если пусто,
 *                       цвет подбирается по смыслу метки («Новинка» — зелёный, «Хит» — оранжевый…)
 *    Слайды идут сверху вниз в порядке строк, максимум 8.
 *
 *  Лист «Подписки»  (цены на подписки)
 *    A: ID            — код подписки (gpu-1, new-6, ps-extra-3 …, список в шаблоне Подписки.csv)
 *    B: Цена          — цена в рублях (можно с пробелами и значком ₽)
 *    C: Подписка      — справочно, для вашего удобства (сайт эту колонку не читает)
 *    Если ID нет в таблице, сайт показывает цену из subscriptions.ts.
 *
 * Если листа нет или он пуст, сайт использует список из authorCollections.ts.
 * Таблица должна быть доступна по ссылке («Все, у кого есть ссылка — просмотр»),
 * как и лист с прайсом.
 */

/** ID таблицы с листами «Подборки» и «Обложки». По умолчанию — та же таблица, что и прайс. */
export const ADMIN_SHEET_ID = SHEET_ID;
export const COLLECTIONS_TAB = "Подборки";
export const COVERS_TAB = "Обложки";
export const SUBSCRIPTIONS_TAB = "Подписки";
export const SLIDER_TAB = "Слайдер";

type Rows = string[][];

/** Таймаут, чтобы зависший запрос не блокировал сайт (на старых браузерах без AbortSignal.timeout — без таймаута) */
function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(ms) : undefined;
}

async function fetchTab(tab: string, range: string, init?: RequestInit): Promise<Rows | null> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${ADMIN_SHEET_ID}/values/` +
    `${encodeURIComponent(`${tab}!${range}`)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { signal: timeoutSignal(8000), ...init });
    if (!res.ok) return null; // листа нет или нет доступа
    const json = await res.json();
    return (json.values ?? []) as Rows;
  } catch {
    return null;
  }
}

const cell = (row: string[], i: number) => String(row[i] ?? "").trim();

function parsePrice(s: string): number | undefined {
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseAuthorRows(rows: Rows): AuthorCollectionDef[] {
  const defs: AuthorCollectionDef[] = [];
  const byTitle = new Map<string, AuthorCollectionDef>();
  let currentTitle = "";

  rows.forEach((row, index) => {
    const [title0, game, max, description, badge] = [0, 1, 2, 3, 4].map((i) => cell(row, i));

    // строка-заголовок («Подборка | Игра | …»)
    if (index === 0 && /^подборк/i.test(title0) && /игр/i.test(game)) return;

    const title = title0 || currentTitle;
    if (!title) return;
    currentTitle = title;

    let def = byTitle.get(title);
    if (!def) {
      def = { id: `sheet-${defs.length + 1}`, title, description: "", games: [] };
      byTitle.set(title, def);
      defs.push(def);
    }
    if (description && !def.description) def.description = description;
    if (badge && !def.badge) def.badge = badge;

    if (game) {
      const maxPrice = parsePrice(max);
      const entry: PickEntry = maxPrice ? { game, maxPrice } : game;
      def.games.push(entry);
    }
  });

  return defs.filter((d) => d.games.length > 0);
}

export function parseCoverRows(rows: Rows): Record<string, string> {
  const out: Record<string, string> = {};
  rows.forEach((row, index) => {
    const name = cell(row, 0);
    const value = cell(row, 1);
    if (!name || !value) return;
    if (index === 0 && /игр|назван/i.test(name) && /ссыл|id|знач/i.test(value)) return;
    out[name] = value;
  });
  return out;
}

/** Авторские подборки из листа «Подборки»; null, если листа нет или он пуст */
export async function fetchAuthorDefs(init?: RequestInit): Promise<AuthorCollectionDef[] | null> {
  const rows = await fetchTab(COLLECTIONS_TAB, "A:E", init);
  if (!rows) return null;
  const defs = parseAuthorRows(rows);
  return defs.length ? defs : null;
}

/** Привязки обложек из листа «Обложки»; null, если листа нет */
export async function fetchCoverOverrides(init?: RequestInit): Promise<Record<string, string> | null> {
  const rows = await fetchTab(COVERS_TAB, "A:B", init);
  return rows ? parseCoverRows(rows) : null;
}

/** ID подписки → цена (₽) из листа «Подписки» */
export function parseSubscriptionRows(rows: Rows): Record<string, number> {
  const out: Record<string, number> = {};
  rows.forEach((row, index) => {
    const id = cell(row, 0).toLowerCase();
    const raw = cell(row, 1);
    if (!id) return;
    if (index === 0 && /^id$|^код$/i.test(id)) return; // строка-заголовок
    const price = parsePrice(raw);
    if (price) out[id] = price;
  });
  return out;
}

export async function fetchSubscriptionPrices(init?: RequestInit): Promise<Record<string, number> | null> {
  const rows = await fetchTab(SUBSCRIPTIONS_TAB, "A:C", init);
  return rows ? parseSubscriptionRows(rows) : null;
}

export function parseSlideRows(rows: Rows): SlideDef[] {
  const defs: SlideDef[] = [];
  rows.forEach((row, index) => {
    const [game, label, title, text, show, color] = [0, 1, 2, 3, 4, 5].map((i) => cell(row, i));
    if (!game) return;
    if (index === 0 && /^игр/i.test(game) && /метк/i.test(label)) return; // строка-заголовок
    if (/^(нет|no|0|скрыть|false)$/i.test(show)) return;
    defs.push({
      game,
      label: label || undefined,
      title: title || undefined,
      text: text || undefined,
      color: color || undefined,
    });
  });
  return defs;
}

/** Слайды из листа «Слайдер»; null, если листа нет (тогда запасной список из slider.ts) */
export async function fetchSliderDefs(init?: RequestInit): Promise<SlideDef[] | null> {
  const rows = await fetchTab(SLIDER_TAB, "A:F", init);
  return rows ? parseSlideRows(rows) : null;
}
