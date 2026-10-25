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
import Marquee from "./components/Marquee";
import Navbar from "./components/Navbar";
import Subscriptions from "./components/Subscriptions";
import { ScrollTop, Toast } from "./components/Overlays";
import { useCopyToast } from "./hooks/useCopyToast";
import { Deal, Game, fallbackGames, fetchGames, resolveDeals } from "./lib/games";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [page, setPage] = useState<"games" | "subs" | "collections">("games");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpenSignal, setCartOpenSignal] = useState(0);
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

  const openCart = useCallback(() => {
    setCartOpenSignal((n) => n + 1);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-wrapper">
        <Background />
        <Navbar currentPage={page} setPage={setPage} />

        <div className="shell" style={{ paddingTop: "60px" }}>
          <Header total={games.length} />

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
        </div>

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
              <Deals deals={deals} cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
            )}

            <Marquee />

            <Catalog games={games} loading={loading} cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
          </>
        ) : page === "collections" ? (
          <Collections cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
        ) : (
          <Subscriptions cartIds={cartIds} addToCart={addToCart} openCart={openCart} />
        )}
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
