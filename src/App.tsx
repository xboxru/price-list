import { MotionConfig } from "framer-motion";
import { RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Background from "./components/Background";
import Cart, { CartItem } from "./components/Cart";
import Catalog from "./components/Catalog";
import Collections from "./components/Collections";
import Deals from "./components/Deals";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HowToOrder from "./components/HowToOrder";
import Reviews from "./components/Reviews";
import Marquee from "./components/Marquee";
import Navbar from "./components/Navbar";
import SiteHeader from "./components/SiteHeader";
import Slider from "./components/Slider";
import Subscriptions from "./components/Subscriptions";
import { ScrollTop, Toast } from "./components/Overlays";
import { useCopyToast } from "./hooks/useCopyToast";
import { Deal, Game, fallbackGames, fetchGames, parsePrice, resolveDeals } from "./lib/games";

type PageId = "games" | "subs" | "collections" | "reviews";
const PAGES: PageId[] = ["games", "subs", "collections", "reviews"];

/** Вкладка из адреса: «#/collections» → collections; без хэша — главная («Игры Xbox») */
function pageFromHash(): PageId {
  const id = window.location.hash.match(/^#\/(\w+)/)?.[1] as PageId | undefined;
  return id && PAGES.includes(id) ? id : "games";
}

/**
 * Вид шапки:
 *  "two-tier" — двухъярусная: справочная строка, поиск/корзина/связь, меню разделов
 *  "classic"  — прежняя: верхняя панель, большой блок с заголовком и вкладки под слайдером
 */
const HEADER_STYLE: "two-tier" | "classic" = "two-tier";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  // Текущая вкладка хранится в адресе (#/collections, #/subs, #/reviews), поэтому
  // после перезагрузки страницы остаёмся на ней, а кнопка «Назад» возвращает на прошлую вкладку
  const [page, setPageState] = useState<PageId>(pageFromHash);
  const setPage = useCallback((next: PageId) => {
    setPageState(next);
    const hash = next === "games" ? "" : `#/${next}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash || window.location.pathname + window.location.search);
    }
  }, []);
  useEffect(() => {
    const onNavigate = () => setPageState(pageFromHash());
    window.addEventListener("popstate", onNavigate);
    window.addEventListener("hashchange", onNavigate);
    return () => {
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("hashchange", onNavigate);
    };
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpenSignal, setCartOpenSignal] = useState(0);
  // Вид прайса: «grid» — плитка (по умолчанию на телефоне и десктопе),
  // «list» — один в ряд. Выбор запоминается, чтобы не переключать при каждом входе.
  const [view, setView] = useState<"list" | "grid">(() => {
    try {
      return localStorage.getItem("xpbox:view:v2") === "list" ? "list" : "grid";
    } catch {
      return "grid";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("xpbox:view:v2", view);
    } catch {
      /* приватный режим: просто не запоминаем */
    }
  }, [view]);

  const toggleView = useCallback(() => setView((v) => (v === "grid" ? "list" : "grid")), []);
  const { toast, copy: rawCopy } = useCopyToast();

  const copy = useCallback(
    (text: string, message?: string) => {
      rawCopy(text, message);
    },
    [rawCopy]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGames();
      setGames(data);
      setOffline(false);
    } catch {
      setGames((prev) => (prev.length ? prev : fallbackGames()));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deals: Deal[] = useMemo(() => resolveDeals(games), [games]);

  // ── Корзина ──
  const cartIds = useMemo(() => new Set(cart.map((i) => i.id)), [cart]);

  const addToCart = useCallback((id: string, name: string, price: string) => {
    setCart((prev) => {
      if (prev.some((i) => i.id === id)) return prev;
      return [...prev, { id, name, price }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setCartOpenSignal(0); // сброс сигнала как при очистке
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartOpenSignal(0);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + parsePrice(i.price), 0), [cart]);

  const openCart = useCallback(() => {
    setCartOpenSignal((n) => n + 1);
  }, []);

  const openSearch = useCallback((query: string) => {
    setPage("games");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("catalog-search", { detail: query }));
      const input = document.getElementById("catalogSearch") as HTMLInputElement | null;
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => input.focus(), 250);
      }
    }, 80);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-wrapper ${view === "grid" ? "view-grid" : ""}`}>
        <Background />
        {HEADER_STYLE === "classic" && <Navbar currentPage={page} setPage={setPage} onSearch={openSearch} />}

        <div className="shell" style={{ paddingTop: HEADER_STYLE === "classic" ? "60px" : "0" }}>
          {HEADER_STYLE === "two-tier" ? (
            <SiteHeader
              page={page}
              setPage={setPage}
              onSearch={openSearch}
              total={games.length}
              cartCount={cart.length}
              cartTotal={cartTotal}
              openCart={openCart}
              view={view}
              onToggleView={toggleView}
            />
          ) : (
            <Header total={games.length} />
          )}

          <Slider games={games} cartIds={cartIds} addToCart={addToCart} openCart={openCart} />

        {HEADER_STYLE === "classic" && (
        <div className="nav-tabs">
          <button
            className={`nav-tab ${page === "games" ? "active" : ""}`}
            onClick={() => setPage("games")}
          >
            Игры Xbox
          </button>
          <button
            className={`nav-tab ${page === "collections" ? "active" : ""}`}
            onClick={() => setPage("collections")}
          >
            Подборки
          </button>
          <button
            className={`nav-tab ${page === "subs" ? "active" : ""}`}
            onClick={() => setPage("subs")}
          >
            Подписки
          </button>
          <button
            className={`nav-tab ${page === "reviews" ? "active" : ""}`}
            onClick={() => setPage("reviews")}
          >
            Отзывы
          </button>
        </div>
        )}

        {page === "games" ? (
          <>
            {offline && (
              <div className="net-error" role="alert">
                <Unplug size={18} />
                <span>Не удалось обновить прайс — показана сохранённая копия цен.</span>
                <button onClick={load}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <RefreshCw size={13} /> Повторить
                  </span>
                </button>
              </div>
            )}

            {!loading && deals.length > 0 && (
              <Deals deals={deals} cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} openCart={openCart} />
            )}

            <Marquee />

            <Catalog games={games} loading={loading} cartIds={cartIds} addToCart={addToCart} removeFromCart={removeFromCart} openCart={openCart} />
          </>
        ) : page === "collections" ? (
          <Collections games={games} cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
        ) : page === "reviews" ? (
          <Reviews />
        ) : (
          <Subscriptions cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
        )}

        <HowToOrder />
      </div>

      <div className="shell">
        <Footer />
      </div>

      <Toast toast={toast} />
      <Cart items={cart} onRemove={removeFromCart} onClear={clearCart} onCopy={copy} openSignal={cartOpenSignal} />
      <ScrollTop />
      </div>
    </MotionConfig>
  );
}
