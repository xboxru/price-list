import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownNarrowWide,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ChevronDown,
  Flame,
  Ghost,
  ListFilter,
  Plus,
  Search,
  Send,
  ShoppingCart,
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
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

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



function ContactDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="contact-help-wrap">
      <button
        className={`contact-help-trigger ${open ? "expanded" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Send size={16} />
        <span>Связаться с нами</span>
        <ChevronDown size={14} className={`chevron ${open ? "up" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="contact-help-links"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="contact-help-grid">
              <a className="uv-btn" href={TG_PM} target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Telegram
              </a>
              <a className="uv-btn" href="https://clck.ru/3TFLbT" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 51C8 45 6 38 6 30C6 16 17 6 32 6C46 6 58 18 58 32C58 46 47 58 33 58C25 58 19 56 14 52L9 57C7 59 4 57 5 54L6 50C6 50 9 52 12 51Z" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                MAX
              </a>
              <a className="uv-btn" href="https://vk.com/rus_xbox" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.77 18.52h1.12s.34-.04.51-.22c.16-.17.16-.49.16-.49s-.02-1.49.67-1.71c.68-.22 1.56 1.47 2.49 2.12.7.49 1.24.39 1.24.39l2.49-.04s1.3-.08.68-1.11c-.05-.08-.36-.76-1.87-2.14-1.58-1.45-1.37-1.21.53-3.72.67-.91 1.63-2.29 1.48-2.77-.14-.45-1-.33-1-.33l-2.81.02s-.21-.03-.36.06c-.15.09-.25.31-.25.31s-.44 1.18-1.03 2.19c-1.24 2.12-1.74 2.24-1.94 2.1-.47-.31-.35-1.24-.35-1.9 0-2.07.31-2.93-.61-3.15-.31-.07-.53-.12-1.31-.13-.99-.01-1.83 0-2.31.24-.32.15-.56.5-.41.52.19.02.62.12.85.43.3.4.29 1.31.29 1.31s.17 2.44-.4 2.74c-.39.21-.93-.22-2.09-2.15-.59-.98-1.04-2.07-1.04-2.07s-.09-.21-.24-.33c-.18-.14-.44-.18-.44-.18l-2.67.02s-.4.01-.55.18c-.13.16-.01.48-.01.48s2.09 4.89 4.45 7.35c2.17 2.27 4.63 2.12 4.63 2.12z" />
                </svg>
                VK
              </a>
              <a className="uv-btn" href="https://jivo.chat/Mky3kA5Dsf" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Чат
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Catalog({ games, loading, cartIds, addToCart, openCart }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("none");
  const [visible, setVisible] = useState(CHUNK);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setQuery(custom.detail ?? "");
      setVisible(CHUNK);
    };
    window.addEventListener("catalog-search", handler as EventListener);
    return () => window.removeEventListener("catalog-search", handler as EventListener);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    let list = q ? games.filter((g) => g.search.includes(q)) : games.slice();
    if (sort === "asc") list.sort((a, b) => a.priceValue - b.priceValue);
    else if (sort === "desc") list.sort((b, a) => a.priceValue - b.priceValue);
    return list;
  }, [games, query, sort]);

  useEffect(() => { setVisible(CHUNK); }, [query, sort, games.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible((v) => Math.min(v + CHUNK, filtered.length)); },
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

  const handleToggleCart = (g: Game, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(`game-${g.id}`, g.name, g.price);
  };

  const cycleSort = () => setSort((s) => (s === "none" ? "asc" : s === "asc" ? "desc" : "none"));

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
            id="catalogSearch"
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
          {sort === "asc" ? <ArrowDownNarrowWide size={17} /> : sort === "desc" ? <ArrowUpNarrowWide size={17} /> : <ArrowUpDown size={17} />}
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
          <p>Попробуйте изменить запрос — или напишите нам, и мы подберём игру под заказ.</p>
          <ContactDropdown />
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
              {chunk.map((g, ri) => {
                const inCart = cartIds.has(`game-${g.id}`);
                return (
                  <div
                    className={`row ${g.hot ? "hot" : ""} ${inCart ? "in-cart-row" : ""}`}
                    key={g.id}
                    onClick={(e) => handleToggleCart(g, e)}
                    title={inCart ? "Убрать из корзины" : "Добавить в корзину"}
                  >
                    <span className="row-idx">
                      {String(ci * CHUNK + ri + 1).padStart(4, "0")}
                    </span>
                    <span className="row-name">
                      {(g.hot || g.isNew || g.isPreorder) && (
                        <span style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {g.isPreorder && (
                            <span className="hot-badge preorder-badge">
                              ПРЕДЗАКАЗ
                            </span>
                          )}
                          {g.isNew && (
                            <span className="hot-badge new-badge">
                              НОВИНКА
                            </span>
                          )}
                          {g.hot && (
                            <span className="hot-badge">
                              <Flame size={10} />
                              ТОП
                            </span>
                          )}
                        </span>
                      )}
                      <span className="row-name-text">
                        <Highlighted name={g.name} query={searching ? query.trim() : ""} />
                      </span>
                    </span>
                    <span className="row-price">{g.price}</span>
                    {inCart ? (
                      <button
                        type="button"
                        className="order-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCart();
                        }}
                        title="Открыть корзину"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    ) : (
                      <span
                        className="cart-row-btn"
                        title="Добавить в корзину"
                      >
                        <Plus size={14} />
                      </span>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div ref={sentinelRef}>
          {shown < filtered.length ? (
            <div className="sentinel-note">
              Показано {shown.toLocaleString("ru-RU")} из {filtered.length.toLocaleString("ru-RU")} — листайте дальше…
            </div>
          ) : (
            <>
              <div className="sentinel-note">
                Конец списка · Не нашли игру?
              </div>
              <div style={{ marginTop: 12, marginBottom: 8 }}>
                <ContactDropdown />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
