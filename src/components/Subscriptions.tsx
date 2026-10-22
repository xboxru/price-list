import { motion } from "framer-motion";
import { useState } from "react";
import { BadgeCheck, Check, Copy, Gamepad, Send, ShoppingBag, Sparkles, UserPlus } from "lucide-react";
import { formatPrice, TG_PM } from "../lib/games";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_NEW, SUBSCRIPTIONS_PS, SubscriptionPlan } from "../lib/subscriptions";

const ease = [0.2, 0.7, 0.2, 1] as const;

interface SubCardProps {
  plan: SubscriptionPlan;
  index: number;
  accent?: "green" | "violet" | "ps";
  flash?: boolean;
  ordered?: boolean;
  onCopy: () => void;
}

function SubCard({ plan, index, accent = "green", flash = false, ordered = false, onCopy }: SubCardProps) {
  const isViolet = accent === "violet";
  const isPs = accent === "ps";
  
  const popularClass = isPs ? "popular-ps" : (isViolet ? "popular-alt" : "popular");
  const badgeClass = isPs ? "badge-ps" : (isViolet ? "badge-alt" : "");
  const btnClass = isPs ? "btn-ps" : (isViolet ? "btn-violet" : (plan.isPopular ? "btn-primary" : "btn-ghost"));

  return (
    <motion.div
      className={`sub-card ${plan.isPopular ? popularClass : ""}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease }}
    >
      {plan.isPopular && (
        <div className={`popular-badge ${badgeClass}`}>
          <Sparkles size={12} />
          Популярный выбор
        </div>
      )}
      <div className="sub-header">
        <h3>{plan.duration}</h3>
        <div className="sub-price-row">
          <div className="sub-price">{formatPrice(plan.price)}</div>
          {ordered ? (
            <a
              href={TG_PM}
              target="_blank"
              rel="noreferrer"
              className={`sub-order-mini ${flash ? "flash" : ""}`}
              title="Оформить заказ в Telegram"
              aria-label="Оформить заказ в Telegram"
            >
              {flash ? <Check size={14} /> : <ShoppingBag size={14} />}
            </a>
          ) : (
            <button
              type="button"
              className="sub-copy-mini"
              onClick={onCopy}
              title="Скопировать название подписки и цену"
              aria-label="Скопировать название подписки и цену"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="sub-desc">{plan.description}</p>
      <ul className="sub-features">
        {plan.features.map((f, i) => (
          <li key={i}>
            <Check size={16} />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={TG_PM}
        target="_blank"
        rel="noreferrer"
        className={`btn ${btnClass}`}
        style={{ width: "100%", marginTop: "auto" }}
      >
        <Send size={16} style={{ position: "relative", top: "2px" }} />
        <span style={{ position: "relative", top: "-1px" }}>Заказать</span>
      </a>
    </motion.div>
  );
}

export default function Subscriptions({
  onCopy,
}: {
  onCopy: (text: string, message?: string) => void;
}) {
  const [flashId, setFlashId] = useState<string | null>(null);
  const [orderedIds, setOrderedIds] = useState<Set<string>>(new Set());

  const copyPlan = (plan: SubscriptionPlan) => {
    const text = `${plan.name} · ${plan.duration} — ${formatPrice(plan.price)}`;
    onCopy(text, `Скопировано: ${plan.duration} · ${formatPrice(plan.price)}`);
    setFlashId(plan.id);
    setOrderedIds((prev) => new Set(prev).add(plan.id));
    window.setTimeout(() => {
      setFlashId((current) => (current === plan.id ? null : current));
    }, 900);
  };

  return (
    <section className="subs-section">
      {/* ── Подписки на свой аккаунт ── */}
      <div className="section-head">
        <div>
          <div className="section-kicker">01 · на свой аккаунт</div>
          <h2 className="section-title">
            <span className="ticon" style={{ background: "var(--accent-soft)", borderColor: "rgba(0,255,157,.3)", color: "var(--accent)" }}>
              <BadgeCheck size={22} />
            </span>
            Game Pass <em>Ultimate</em>
          </h2>
        </div>
      </div>

      <div className="subs-grid">
        {SUBSCRIPTIONS.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="green"
            flash={flashId === plan.id}
            ordered={orderedIds.has(plan.id)}
            onCopy={() => copyPlan(plan)}
          />
        ))}
      </div>

      <div className="subs-info-box">
        <p>
          <strong>На свой аккаунт:</strong> Подписка оформляется на ваш личный аккаунт Microsoft.
          Если у вас уже была подписка — это не проблема, мы поможем продлить.
        </p>
      </div>

      <div className="subs-divider" />

      {/* ── Подписки на новый аккаунт ── */}
      <div className="section-head">
        <div>
          <div className="section-kicker">02 · на новый аккаунт</div>
          <h2 className="section-title">
            <span className="ticon" style={{ background: "var(--violet-soft)", borderColor: "rgba(167,139,250,.3)", color: "var(--violet)" }}>
              <UserPlus size={22} />
            </span>
            Game Pass <em style={{ color: "var(--violet)" }}>Новый аккаунт</em>
          </h2>
        </div>
      </div>

      <div className="subs-grid">
        {SUBSCRIPTIONS_NEW.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="violet"
            flash={flashId === plan.id}
            ordered={orderedIds.has(plan.id)}
            onCopy={() => copyPlan(plan)}
          />
        ))}
      </div>

      <div className="subs-info-box" style={{ borderColor: "rgba(167,139,250,.25)" }}>
        <p>
          <strong>На новый аккаунт:</strong> Мы создадим для вас новый аккаунт Microsoft с активной подпиской.
          Вы получите логин и пароль — сразу готово к игре.
        </p>
      </div>

      {/* ── Разделитель ── */}
      <div className="subs-divider" />

      {/* ── Подписки PlayStation ── */}
      <div className="section-head">
        <div>
          <div className="section-kicker">03 · playstation plus</div>
          <h2 className="section-title">
            <span className="ticon" style={{ background: "rgba(0,112,209,0.15)", borderColor: "rgba(0,112,209,.3)", color: "#0070d1" }}>
              <Gamepad size={22} />
            </span>
            PlayStation <em style={{ color: "#0070d1" }}>Plus / EA Play</em>
          </h2>
        </div>
      </div>

      <div className="subs-grid">
        {SUBSCRIPTIONS_PS.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="ps"
            flash={flashId === plan.id}
            ordered={orderedIds.has(plan.id)}
            onCopy={() => copyPlan(plan)}
          />
        ))}
      </div>

      <div className="subs-info-box" style={{ borderColor: "rgba(0,112,209,0.25)" }}>
        <p>
          <strong>PlayStation:</strong> Подписки Essential, Extra и Deluxe для вашего аккаунта (любой регион). 
          Также доступна подписка EA Play для доступа к библиотеке Electronic Arts.
        </p>
      </div>
    </section>
  );
}
