import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Check, Gamepad, Plus, ShoppingCart, Sparkles, UserPlus } from "lucide-react";
import { formatPrice } from "../lib/games";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_NEW, SUBSCRIPTIONS_PS, SubscriptionPlan } from "../lib/subscriptions";
import { fetchSubscriptionPrices } from "../lib/adminSheet";

const ease = [0.2, 0.7, 0.2, 1] as const;

// Цены из листа «Подписки» Google Таблицы грузим один раз за сессию
let pricesPromise: Promise<Record<string, number> | null> | null = null;
const loadPrices = () => (pricesPromise ??= fetchSubscriptionPrices());

/** Цены из таблицы; ready=false, пока идёт загрузка (цены не показываем, чтобы не мигали старые) */
function useSheetPrices() {
  const [state, setState] = useState<{ ready: boolean; prices: Record<string, number> }>({
    ready: false,
    prices: {},
  });

  useEffect(() => {
    let cancelled = false;
    loadPrices().then((prices) => {
      if (!cancelled) setState({ ready: true, prices: prices ?? {} });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

interface SubCardProps {
  plan: SubscriptionPlan;
  index: number;
  accent?: "green" | "violet" | "ps";
  inCart?: boolean;
  priceReady?: boolean;
  onAddToCart: () => void;
  onOpenCart: () => void;
}

function SubCard({ plan, index, accent = "green", inCart = false, priceReady = true, onAddToCart, onOpenCart }: SubCardProps) {
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
        {isPs && (
          <div className={`sub-series ${
            plan.name.includes("Deluxe") ? "sub-series-deluxe" :
            plan.name.includes("Extra") ? "sub-series-extra" :
            "sub-series-essential"
          }`}>{plan.name}</div>
        )}
        <h3>{plan.duration}</h3>
        <div className="sub-price-row">
          <div className="sub-price" style={priceReady ? undefined : { opacity: 0.35 }}>
            {priceReady ? formatPrice(plan.price) : "…"}
          </div>
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
      {inCart ? (
        <button
          className={`btn ${btnClass}`}
          style={{ width: "100%", marginTop: "auto" }}
          onClick={onOpenCart}
        >
          <ShoppingCart size={16} />
          <span style={{ position: "relative", top: "-1px" }}>Открыть корзину</span>
        </button>
      ) : (
        <button
          className={`btn ${btnClass}`}
          style={{ width: "100%", marginTop: "auto" }}
          onClick={onAddToCart}
          disabled={!priceReady}
        >
          <Plus size={16} />
          <span style={{ position: "relative", top: "-1px" }}>В корзину</span>
        </button>
      )}
    </motion.div>
  );
}

export default function Subscriptions({
  cartIds,
  addToCart,
  openCart,
}: {
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}) {
  const { ready, prices } = useSheetPrices();
  const withPrices = (plans: SubscriptionPlan[]) =>
    plans.map((p) => ({ ...p, price: prices[p.id.toLowerCase()] ?? p.price }));
  const plansOwn = useMemo(() => withPrices(SUBSCRIPTIONS), [prices]);
  const plansNew = useMemo(() => withPrices(SUBSCRIPTIONS_NEW), [prices]);
  const plansPs = useMemo(() => withPrices(SUBSCRIPTIONS_PS), [prices]);

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
        {plansOwn.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="green"
            priceReady={ready}
            inCart={cartIds.has(`sub-${plan.id}`)}
            onAddToCart={() => addToCart(`sub-${plan.id}`, `${plan.name} · ${plan.duration}`, formatPrice(plan.price))}
            onOpenCart={openCart}
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
        {plansNew.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="violet"
            priceReady={ready}
            inCart={cartIds.has(`sub-new-${plan.id}`)}
            onAddToCart={() => addToCart(`sub-new-${plan.id}`, `${plan.name} · ${plan.duration}`, formatPrice(plan.price))}
            onOpenCart={openCart}
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
        {plansPs.map((plan, i) => (
          <SubCard
            key={plan.id}
            plan={plan}
            index={i}
            accent="ps"
            priceReady={ready}
            inCart={cartIds.has(`sub-ps-${plan.id}`)}
            onAddToCart={() => addToCart(`sub-ps-${plan.id}`, `${plan.name} · ${plan.duration}`, formatPrice(plan.price))}
            onOpenCart={openCart}
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
