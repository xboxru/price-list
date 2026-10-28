import { BadgeCheck, Clock, Copy, MessageCircleQuestion, Send, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { TG_CHANNEL, TG_PM } from "../lib/games";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** «28 октября 2026» (без «г.») */
const formatToday = () => dateFormat.format(new Date()).replace(/\s*г\.$/, "");

/** Сегодняшняя дата; сама обновляется в полночь и при возвращении на вкладку */
function useToday() {
  const [today, setToday] = useState(formatToday);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        setToday(formatToday());
        schedule();
      }, nextMidnight.getTime() - now.getTime());
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === "visible") setToday(formatToday());
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return today;
}

export default function Footer() {
  const today = useToday();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="./logo.png"
              alt="XP Box"
              width={44}
              height={44}
              style={{ borderRadius: 13, border: "1px solid var(--line-strong)" }}
            />
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 15, textTransform: "uppercase" }}>
              XP Box
            </strong>
          </div>
          <p>
            Xbox Россия — игры и подписки по честным ценам. Прайс подтягивается
            автоматически: вы всегда видите актуальную стоимость.
          </p>
        </div>

        <div>
          <h5>Связь</h5>
          <a className="footer-link" href={TG_CHANNEL} target="_blank" rel="noreferrer">
            <Send size={15} />
            Канал — игры и подписки
          </a>
          <a className="footer-link" href={TG_PM} target="_blank" rel="noreferrer">
            <MessageCircleQuestion size={15} />
            Личные сообщения
          </a>
          <span className="footer-link" style={{ cursor: "default" }}>
            <Clock size={15} />
            Ежедневно 11:00 — 23:00 мск
          </span>
        </div>

        <div>
          <h5>Как заказать</h5>
          <div className="footer-hint">
            <ShoppingCart size={15} />
            Нажмите на игру в каталоге — игра добавится в корзину
          </div>
          <div className="footer-hint">
            <Copy size={15} />
            Нажмите скопировать список, заказать и свяжитесь с нами удобным способом
          </div>
          <div className="footer-hint">
            <BadgeCheck size={15} />
            Оплатите и получите игру на свой аккаунт
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>XP Box · прайс-лист игр на {today}</span>
        <span>Цены обновляются автоматически · скидки недели — каждый понедельник</span>
      </div>
    </footer>
  );
}
