import { MotionConfig } from "framer-motion";
import { RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Background from "./components/Background";
import Catalog from "./components/Catalog";
import Deals from "./components/Deals";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Marquee from "./components/Marquee";
import { ScrollTop, Toast } from "./components/Overlays";
import { useCopyToast } from "./hooks/useCopyToast";
import { Deal, Game, fallbackGames, fetchGames, resolveDeals } from "./lib/games";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast, copy: rawCopy } = useCopyToast();

  const copy = useCallback(
    (text: string, message?: string) => {
      rawCopy(text, message);
      setHasCopied(true);
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
      // show a small embedded snapshot so the UI never looks broken
      setGames((prev) => (prev.length ? prev : fallbackGames()));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deals: Deal[] = useMemo(() => resolveDeals(games), [games]);

  return (
    <MotionConfig reducedMotion="user">
      <Background />

      <div className="shell">
        <Header total={games.length} hasCopied={hasCopied} />

        {offline && (
          <div className="net-error" role="alert">
            <Unplug size={18} />
            <span>
              Не удалось обновить прайс — показана сохранённая копия цен.
            </span>
            <button onClick={load}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={13} /> Повторить
              </span>
            </button>
          </div>
        )}

        {!loading && deals.length > 0 && <Deals deals={deals} onCopy={copy} />}

        <Marquee />

        <Catalog games={games} loading={loading} onCopy={copy} />
      </div>

      <div className="shell">
        <Footer />
      </div>

      <Toast toast={toast} />
      <ScrollTop />
    </MotionConfig>
  );
}
