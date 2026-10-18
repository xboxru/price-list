import { motion } from "framer-motion";
import { Check, Copy, Flame, Send, Sparkles, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { Deal, TG_PM, formatPrice, isoWeek } from "../lib/games";

const ease = [0.2, 0.7, 0.2, 1] as const;

interface DealsProps {
  deals: Deal[];
  onCopy: (text: string, message?: string) => void;
}

export default function Deals({ deals, onCopy }: DealsProps) {
  const cd = useCountdown();

  // The spotlight deal rotates week to week over the curated pool
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

  const copyDeal = (d: Deal) =>
    onCopy(`${d.game.name} — ${d.salePrice}`, `Скопировано: ${d.salePrice} · скидка −${Math.round(d.discount * 100)}%`);

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
        {/* ------------------------- SPOTLIGHT ------------------------- */}
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
              <button className="btn btn-ghost" onClick={() => copyDeal(spotlight)}>
                <Copy size={16} style={{ position: "relative", top: "1px" }} />
                <span style={{ position: "relative", top: "-1px" }}>Скопировать</span>
              </button>
            </div>
          </div>
        </motion.article>

        {/* ------------------------- SIDE CARDS ------------------------- */}
        <div className="deal-cards">
          {cards.map((deal, i) => (
            <DealCard
              key={deal.game.id}
              deal={deal}
              index={i}
              onCopy={() => copyDeal(deal)}
            />
          ))}
        </div>
      </div>

      {maxDiscount > 0 && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12.5,
            color: "var(--muted)",
            fontWeight: 600,
            textAlign: "right",
          }}
        >
          * цены со скидкой действуют до конца недели — успейте заказать
        </p>
      )}
    </section>
  );
}

function DealCard({
  deal,
  index,
  onCopy,
}: {
  deal: Deal;
  index: number;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handle = () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.article
      className="deal-card"
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
        <button
          className={`copy-ico ${copied ? "ok" : ""}`}
          onClick={handle}
          aria-label="Скопировать название и цену"
          title="Скопировать название и цену"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </motion.article>
  );
}
