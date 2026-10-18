import { motion } from "framer-motion";
import {
  ArrowDownNarrowWide,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Check,
  Copy,
  Flame,
  Ghost,
  ListFilter,
  Search,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Game, TG_PM, normalize } from "../lib/games";

const CHUNK = 60;
const ease = [0.2, 0.7, 0.2, 1] as const;

type SortMode = "none" | "asc" | "desc";

interface CatalogProps {
  games: Game[];
  loading: boolean;
  onCopy: (text: string, message?: string) => void;
}

/** light 1:1 normalization (keeps indices aligned with original string) */
const lightNorm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

function Highlighted({ name, query }: { name: string; query: string }) {
  if (!query) return <>{name}</>;
  const idx = lightNorm(name).indexOf(lightNorm(query));
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark>{name.slice(idx, idx + query.length)}</mark>
      {name.slice(idx + query.length)}
    </>
  );
}

export default function Catalog({ games, loading, onCopy }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("none");
  const [visible, setVisible] = useState(CHUNK);
  const [flashId, setFlashId] = useState<number | null>(null);   // кратковременный ✓
  const [orderedIds, setOrderedIds] = useState<Set<number>>(new Set()); // остаётся зелёной
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    let list = q ? games.filter((g) => g.search.includes(q)) : games.slice();
    if (sort === "asc") list.sort((a, b) => a.priceValue - b.priceValue);
    else if (sort === "desc") list.sort((b, a) => a.priceValue - b.priceValue);
    return list;
  }, [games, query, sort]);

  useEffect(() => {
    setVisible(CHUNK);
  }, [query, sort, games.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + CHUNK, filtered.length));
        }
      },
      { rootMargin: "900px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const chunks = useMemo(() => {
    const out: Game[][] = [];
    const list = filtered.slice(0, visible);
    for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
    return out;
  }, [filtered, visible]);

  const copyRow = (g: Game) => {
    onCopy(`${g.name} — ${g.price}`, `${g.price} · добавлено в буфер`);
    setFlashId(g.id);
    setOrderedIds((prev) => new Set(prev).add(g.id));
    window.setTimeout(() => setFlashId((cur) => (cur === g.id ? null : cur)), 900);
  };

  const cycleSort = () =>
    setSort((s) => (s === "none" ? "asc" : s === "asc" ? "desc" : "none"));

  const searching = normalize(query).length > 0;
  const shown = Math.min(visible, filtered.length);

  return (
    <section className="catalog" id="catalog">
      <div className="section-head">
        <div>
          <div className="section-kicker">02 · полный каталог</div>
          <h2 className="section-title">
            <span className="ticon" style={{ background: "var(--accent-soft)", borderColor: "rgba(0,255,157,.3)", color: "var(--accent)" }}>
              <ListFilter size={22} />
            </span>
            Все <em>игры</em>
          </h2>
        </div>
        <div className="countdown-pill" style={{ borderStyle: "dashed" }}>
          <Search size={15} />
          {searching ? (
            <span className="t">Найдено: {filtered.length.toLocaleString("ru-RU")}</span>
          ) : (
            <span className="t">{filtered.length.toLocaleString("ru-RU")} позиций</span>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={17} />
          <input
            className="search-input"
            type="text"
            placeholder="Поиск по названию — например, «witcher»…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Поиск игры"
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery("")} aria-label="Очистить поиск">
              <X size={15} />
            </button>
          )}
        </div>
        <button
          className={`sort-btn ${sort !== "none" ? "active" : ""}`}
          onClick={cycleSort}
          title="Сортировка по цене"
        >
          {sort === "asc" ? (
            <ArrowDownNarrowWide size={17} />
          ) : sort === "desc" ? (
            <ArrowUpNarrowWide size={17} />
          ) : (
            <ArrowUpDown size={17} />
          )}
          <span className="lbl">
            {sort === "asc" ? "Сначала дешёвые" : sort === "desc" ? "Сначала дорогие" : "По цене"}
          </span>
        </button>
        <span className="count-chip">
          <b>{shown.toLocaleString("ru-RU")}</b> / {filtered.length.toLocaleString("ru-RU")}
        </span>
      </div>

      <div className="list-head" aria-hidden="true">
        <span>#</span>
        <span className="h-name">Название игры</span>
        <span className="r">Цена</span>
        <span />
      </div>

      {loading ? (
        <div className="rows">
          {Array.from({ length: 18 }).map((_, i) => (
            <div className="skel-row" key={i} style={{ opacity: 1 - i * 0.045 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Ghost size={44} strokeWidth={1.4} />
          <h3>Ничего не найдено</h3>
          <p>
            Попробуйте изменить запрос — или напишите нам, и мы подберём игру под заказ.
          </p>
          <a className="btn btn-primary" href={TG_PM} target="_blank" rel="noreferrer">
            <Send size={16} style={{ position: "relative", top: "2px" }} />
            <span style={{ position: "relative", top: "-1px" }}>Спросить в личке</span>
          </a>
        </div>
      ) : (
        <div className="rows">
          {chunks.map((chunk, ci) => (
            <motion.div
              key={`${ci}-${chunk[0]?.id ?? 0}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "120px" }}
              transition={{ duration: 0.45, ease }}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              {chunk.map((g, ri) => (
                <button
                  className={`row ${g.hot ? "hot" : ""}`}
                  key={g.id}
                  onClick={() => copyRow(g)}
                  title="Нажмите, чтобы скопировать название и цену"
                >
                  <span className="row-idx">
                    {String(ci * CHUNK + ri + 1).padStart(4, "0")}
                  </span>
                  <span className="row-name">
                    {g.hot && (
                      <span className="hot-badge">
                        <Flame size={10} />
                        ТОП
                      </span>
                    )}
                    <span className="row-name-text">
                      <Highlighted name={g.name} query={searching ? query.trim() : ""} />
                    </span>
                  </span>
                  <span className="row-price">{g.price}</span>
                  {/* После копирования — мини-кнопка «Оформить», иначе иконка копирования */}
                  {orderedIds.has(g.id) ? (
                    <a
                      className={`order-mini ${flashId === g.id ? "flash" : ""}`}
                      href={TG_PM}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Оформить заказ в Telegram"
                    >
                      {flashId === g.id ? <Check size={14} /> : <ShoppingBag size={14} />}
                    </a>
                  ) : (
                    <span className="copy-ico">
                      <Copy size={15} />
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div ref={sentinelRef}>
          {shown < filtered.length ? (
            <div className="sentinel-note">
              Показано {shown.toLocaleString("ru-RU")} из{" "}
              {filtered.length.toLocaleString("ru-RU")} — листайте дальше…
            </div>
          ) : (
            <div className="sentinel-note">
              Конец списка · Не нашли игру?{" "}
              <a href={TG_PM} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 800 }}>
                Напишите нам
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
