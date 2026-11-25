import { AnimatePresence, motion } from "framer-motion";
import { Flame, Plus, ShoppingCart, Sparkles, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { CoverView } from "./CoverImage";
import { useGameCover } from "../hooks/useGameCover";
import { Deal, formatPrice, isoWeek } from "../lib/games";
import { detectPlatforms, displayTitle } from "../lib/collections";

interface DealsProps {
  deals: Deal[];
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

const ease = [0.2, 0.7, 0.2, 1] as const;

type ZoomTarget = { src: string; name: string };

/** Обложка, по клику открывающая увеличение */
function ZoomCover({
  title,
  cover,
  loading,
  onZoom,
}: {
  title: string;
  cover?: string;
  loading?: "lazy" | "eager";
  onZoom: (target: ZoomTarget) => void;
}) {
  const { src, loading: pending } = useGameCover(title, cover);
  return (
    <button
      type="button"
      className="deal-cover"
      onClick={() => src && onZoom({ src, name: title })}
      disabled={!src}
      title={src ? "Увеличить обложку" : undefined}
      aria-label={`Увеличить обложку: ${title}`}
    >
      <CoverView title={title} src={src} pending={pending} loading={loading} />
    </button>
  );
}

/** Жанры игры из индекса обложек; пока не загрузились — нейтральная подпись */
function DealVibe({ title, fallback }: { title: string; fallback: string }) {
  const { genres } = useGameCover(title);
  return <>{genres.length ? genres.join(" · ") : fallback}</>;
}

/** Платформы бейджами, как в подборках */
function Platforms({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`store-platforms ${className}`}>
      {detectPlatforms(name).map((platform) => (
        <span className="store-platform" key={platform}>
          {platform}
        </span>
      ))}
    </div>
  );
}

export default function Deals({ deals, cartIds, addToCart, openCart }: DealsProps) {
  const cd = useCountdown();
  const [zoomed, setZoomed] = useState<ZoomTarget | null>(null);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const { spotlight, cards, maxDiscount } = useMemo(() => {
    if (deals.length === 0) return { spotlight: undefined, cards: [], maxDiscount: 0 };
    const idx = isoWeek() % deals.length;
    const spot = deals[idx];
    return {
      spotlight: spot,
      cards: deals.filter((d) => d !== spot),
      maxDiscount: Math.round(Math.max(...deals.map((d) => d.discount)) * 100),
    };
  }, [deals]);

  if (!spotlight) return null;

  const handleAddToCart = (d: Deal) => {
    addToCart(`deal-${d.game.id}`, d.game.name, d.salePrice);
  };

  const spotInCart = cartIds.has(`deal-${spotlight.game.id}`);

  return (
    <section className="deals-section" id="deals">
      <div className="section-head">
        <div>
          <div className="section-kicker">01 · горячие предложения</div>
          <h2 className="section-title">
            <span className="ticon">
              <Flame size={22} />
            </span>
            Скидки <em>недели</em>
          </h2>
        </div>
        <div className="countdown-pill" title="В понедельник подборка обновится">
          <Timer size={16} />
          До обновления
          <span className="t">{cd.label}</span>
        </div>
      </div>

      <div className="deals-grid" key={spotlight.game.id}>
        {/* ── SPOTLIGHT ── */}
        <article className="deal-spot deals-fadein">
          <div className="art">
            <ZoomCover
              title={spotlight.game.name}
              cover={spotlight.cover}
              loading="eager"
              onZoom={setZoomed}
            />
          </div>
          <div className="deal-spot-body">
            <span className="discount-badge wide pulse">
              <Sparkles size={15} />
              −{Math.round(spotlight.discount * 100)}% СДЕЛКА НЕДЕЛИ
            </span>
            <h3>{displayTitle(spotlight.game.name)}</h3>
            <Platforms name={spotlight.game.name} className="deal-platforms" />
            <div className="deal-vibe">
              <Sparkles size={14} />
              <DealVibe title={spotlight.game.name} fallback={spotlight.vibe} />
            </div>
            <div className="deal-price-row">
              <span className="price-old">{spotlight.basePrice}</span>
              <span className="price-new">{spotlight.salePrice}</span>
              <span className="price-save">
                Выгода {formatPrice(spotlight.baseValue - spotlight.saleValue)}
              </span>
            </div>
            <div className="btn-row">
              {spotInCart ? (
                <button className="btn btn-primary" onClick={openCart}>
                  <ShoppingCart size={16} />
                  <span>Открыть корзину</span>
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleAddToCart(spotlight)}>
                  <Plus size={16} />
                  <span>В корзину</span>
                </button>
              )}
            </div>
          </div>
        </article>

        {/* ── SIDE CARDS ── */}
        <div className="deal-cards">
          {cards.map((deal, i) => (
            <DealCard
              key={deal.game.id}
              deal={deal}
              index={i}
              inCart={cartIds.has(`deal-${deal.game.id}`)}
              onAddToCart={() => handleAddToCart(deal)}
              onOpenCart={openCart}
              onZoom={setZoomed}
            />
          ))}
        </div>
      </div>

      {maxDiscount > 0 && (
        <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--muted)", fontWeight: 600, textAlign: "right" }}>
          * цены со скидкой действуют до конца недели — успейте заказать
        </p>
      )}

      <AnimatePresence>
        {zoomed && (
          <motion.div
            className="cover-zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setZoomed(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Обложка: ${zoomed.name}`}
          >
            <motion.div
              className="cover-zoom-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2, ease }}
            >
              <img src={zoomed.src} alt={zoomed.name} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DealCard({
  deal,
  index,
  inCart,
  onAddToCart,
  onOpenCart,
  onZoom,
}: {
  deal: Deal;
  index: number;
  inCart: boolean;
  onAddToCart: () => void;
  onOpenCart: () => void;
  onZoom: (target: ZoomTarget) => void;
}) {
  return (
    <article
      className={`deal-card deals-fadein-side ${inCart ? "in-cart-row" : ""}`}
      style={{ animationDelay: `${0.05 + index * 0.06}s` }}
    >
      <div className="deal-thumb">
        <span className="discount-badge off">−{Math.round(deal.discount * 100)}%</span>
        <ZoomCover title={deal.game.name} cover={deal.cover} onZoom={onZoom} />
      </div>
      <div className="deal-info">
        <h4>{displayTitle(deal.game.name)}</h4>
        <Platforms name={deal.game.name} />
        <div className="vibe">
          <DealVibe title={deal.game.name} fallback={deal.vibe} />
        </div>
      </div>
      <div className="deal-side">
        <span className="old">{deal.basePrice}</span>
        <span className="new">{deal.salePrice}</span>
        {inCart ? (
          <button className="order-mini" onClick={onOpenCart} title="Открыть корзину">
            <ShoppingCart size={14} />
          </button>
        ) : (
          <button className="cart-row-btn in-deal" onClick={onAddToCart} title="Добавить в корзину">
            <Plus size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
