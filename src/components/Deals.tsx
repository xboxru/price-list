import { motion } from "framer-motion";
import { Flame, Plus, ShoppingCart, Sparkles, Timer } from "lucide-react";
import { useMemo } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { Deal, formatPrice, isoWeek } from "../lib/games";

const ease = [0.2, 0.7, 0.2, 1] as const;

interface DealsProps {
  deals: Deal[];
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

export default function Deals({ deals, cartIds, addToCart, openCart }: DealsProps) {
  const cd = useCountdown();

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
        <motion.article
          className="deal-spot"
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease }}
        >
          <div className="art">
            <img src={spotlight.cover} alt={spotlight.game.name} loading="eager" />
          </div>
          <div className="deal-spot-body">
            <span className="discount-badge pulse">
              <Sparkles size={15} />
              −{Math.round(spotlight.discount * 100)}% СДЕЛКА НЕДЕЛИ
            </span>
            <h3>{spotlight.game.name}</h3>
            <div className="deal-vibe">
              <Sparkles size={14} />
              {spotlight.vibe}
            </div>
            <div className="deal-price-row">
              <span className="price-old">{spotlight.basePrice}</span>
              <span className="price-new">{spotlight.salePrice}</span>
              <span className="price-save">
                Выгода {formatPrice(spotlight.game.priceValue - spotlight.saleValue)}
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
        </motion.article>

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
            />
          ))}
        </div>
      </div>

      {maxDiscount > 0 && (
        <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--muted)", fontWeight: 600, textAlign: "right" }}>
          * цены со скидкой действуют до конца недели — успейте заказать
        </p>
      )}
    </section>
  );
}

function DealCard({
  deal,
  index,
  inCart,
  onAddToCart,
  onOpenCart,
}: {
  deal: Deal;
  index: number;
  inCart: boolean;
  onAddToCart: () => void;
  onOpenCart: () => void;
}) {
  return (
    <motion.article
      className={`deal-card ${inCart ? "in-cart-row" : ""}`}
      initial={{ opacity: 0, x: 36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: 0.08 + index * 0.08, ease }}
    >
      <div className="deal-thumb">
        <span className="off">−{Math.round(deal.discount * 100)}%</span>
        <img src={deal.cover} alt={deal.game.name} loading="lazy" />
      </div>
      <div className="deal-info">
        <h4>{deal.game.name}</h4>
        <div className="vibe">{deal.vibe}</div>
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
    </motion.article>
  );
}
