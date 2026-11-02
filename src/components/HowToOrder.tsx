import { motion } from "framer-motion";
import { BadgeCheck, ChevronDown, Copy, HelpCircle, ShoppingCart } from "lucide-react";
import { FAQ } from "../lib/faq";

const STEPS = [
  {
    icon: ShoppingCart,
    title: "Выберите игру",
    text: "Нажмите на игру в каталоге — игра добавится в корзину",
  },
  {
    icon: Copy,
    title: "Оформите заказ",
    text: "Нажмите скопировать список, заказать и свяжитесь с нами удобным способом",
  },
  {
    icon: BadgeCheck,
    title: "Получите игру",
    text: "Оплатите и получите игру на свой аккаунт",
  },
];

const ease = [0.2, 0.7, 0.2, 1] as const;

export default function HowToOrder() {
  return (
    <section className="howto" id="howto">
      <div className="section-head">
        <div>
          <div className="section-kicker">как заказать</div>
          <h2 className="section-title">
            <span
              className="ticon"
              style={{
                background: "var(--accent-soft)",
                borderColor: "rgba(0,255,157,.3)",
                color: "var(--accent)",
              }}
            >
              <HelpCircle size={22} />
            </span>
            Заказ за <em>3 шага</em>
          </h2>
        </div>
      </div>

      <div className="howto-steps">
        {STEPS.map((step, i) => (
          <motion.article
            key={step.title}
            className="howto-step"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08, ease }}
          >
            <span className="howto-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="howto-icon">
              <step.icon size={20} />
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </motion.article>
        ))}
      </div>

      <div className="faq">
        <h3 className="faq-title">Частые вопросы</h3>
        {FAQ.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>
              <span>{item.question}</span>
              <ChevronDown size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
