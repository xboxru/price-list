import { motion } from "framer-motion";
import { Check, Copy, Flame, Plus, Send, ShoppingBag, Sparkles, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { Deal, TG_PM, formatPrice, isoWeek } from "../lib/games";

const ease = [0.2, 0.7, 0.2, 1] as const;

interface DealsProps {
  deals: Deal[];
  onCopy: (text: string, message?: string) => void;
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
}

export default function Deals({ deals, onCopy, cartIds, addToCart }: DealsProps) {
  const cd = useCountdown();
  const [flashId, setFlashId] = useState<number | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());

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

  const copyDeal = (d: Deal) => {
    onCopy(`${d.game.name} — ${d.salePrice}`, `Скопировано: ${d.salePrice} · скидка −${Math.round(d.discount * 100)}%`);
    setFlashId(d.game.id);
    setCopiedIds((prev) => new Set(prev).add(d.game.id));
    window.setTimeout(() => setFlashId((cur) => (cur === d.game.id ? null : cur)), 900);
  };

  const handleAddToCart = (d: Deal) => {
    addToCart(`deal-${d.game.id}`, d.game.name, d.salePrice);
  };

  const spotFlash = flashId === spotlight.game.id;
  const spotCopied = copiedIds.has(spotlight.game.id);
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
              <a className="btn btn-primary" href={TG_PM} target="_blank" rel="noreferrer">
                <Send size={16} style={{ position: "relative", top: "2px" }} />
                <span style={{ position: "relative", top: "-1px" }}>Купить в Telegram</span>
              </a>
              {/* Копировать */}
              {spotCopied ? (
                <a
                  className={`btn btn-ordered ${spotFlash ? "flash" : ""}`}
                  href={TG_PM}
                  target="_blank"
                  rel="noreferrer"
                >
                  {spotFlash ? <Check size={16} /> : <ShoppingBag size={16} />}
                  <span>{spotFlash ? "Скопировано!" : "Оформить заказ"}</span>
                </a>
              ) : (
                <button className="btn btn-ghost" onClick={() => copyDeal(spotlight)}>
                  <Copy size={16} style={{ position: "relative", top: "1px" }} />
                  <span style={{ position: "relative", top: "-1px" }}>Скопировать</span>
                </button>
              )}
              {/* В корзину */}
              {spotInCart ? (
                <span className="btn-icon-sq added" title="Уже в корзине">
                  <Check size={18} />
                </span>
              ) : (
                <button
                  className="btn-icon-sq"
                  onClick={() => handleAddToCart(spotlight)}
                  title="Добавить в корзину"
                >
                  <Plus size={18} />
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
              flash={flashId === deal.game.id}
              copied={copiedIds.has(deal.game.id)}
              inCart={cartIds.has(`deal-${deal.game.id}`)}
              onCopy={() => copyDeal(deal)}
              onAddToCart={() => handleAddToCart(deal)}
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
  flash,
  copied,
  inCart,
  onCopy,
  onAddToCart,
}: {
  deal: Deal;
  index: number;
  flash: boolean;
  copied: boolean;
  inCart: boolean;
  onCopy: () => void;
  onAddToCart: () => void;
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
        <div style={{ display: "flex", gap: 6 }}>
          {/* Копирование */}
          {copied ? (
            <a
              className={`order-mini ${flash ? "flash" : ""}`}
              href={TG_PM}
              target="_blank"
              rel="noreferrer"
              title="Оформить заказ в Telegram"
            >
              {flash ? <Check size={14} /> : <ShoppingBag size={14} />}
            </a>
          ) : (
            <button className="copy-ico" onClick={onCopy} title="Скопировать название и цену">
              <Copy size={14} />
            </button>
          )}
          {/* Корзина */}
          {inCart ? (
            <span className="order-mini" title="Уже в корзине" style={{ background: "var(--violet)", boxShadow: "0 4px 14px -4px rgba(167,139,250,0.55)" }}>
              <Check size={14} />
            </span>
          ) : (
            <button className="cart-row-btn in-deal" onClick={onAddToCart} title="Добавить в корзину">
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
