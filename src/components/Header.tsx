import { AnimatePresence, motion } from "framer-motion";
import { Clock, Gamepad2, Send, ShoppingCart } from "lucide-react";
import { TG_CHANNEL, TG_PM } from "../lib/games";

const ease = [0.2, 0.7, 0.2, 1] as const;

export default function Header({ total, hasCopied }: { total: number; hasCopied: boolean }) {
  return (
    <header className="hero">
      <motion.div
        className="hero-logo"
        initial={{ opacity: 0, scale: 0.6, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
      >
        <img src="./hero-logo.png" alt="XP Box — Xbox Россия" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
      >
        <span className="hero-kicker">
          <span className="live-dot" />
          Xbox Россия · Игры и подписки
        </span>
      </motion.div>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease }}
      >
        Прайс-лист
        <br />
        <span className="grad">игр и подписок</span>
      </motion.h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.28, ease }}
      >
        Актуальные цены, обновляются автоматически. Нажмите на игру — название
        и цена скопируются для заказа.
      </motion.p>

      <motion.div
        className="hero-chips"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.38, ease }}
      >
        <a className="chip" href={TG_CHANNEL} target="_blank" rel="noreferrer">
          <Send size={15} />
          Канал Telegram
        </a>
        <span className="chip chip-muted">
          <Clock size={15} />
          Ежедневно с 11:00 до 23:00 мск
        </span>
        <span className="chip chip-stat chip-muted">
          <Gamepad2 size={15} />
          В прайсе <b>{total > 0 ? total.toLocaleString("ru-RU") : "…"}</b> позиций
        </span>

        <AnimatePresence>
          {hasCopied && (
            <motion.a
              className="chip chip-order"
              href={TG_PM}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <ShoppingCart size={15} />
              Оформить заказ
            </motion.a>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
