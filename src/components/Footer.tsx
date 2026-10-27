import { BadgeCheck, Clock, Copy, MessageCircleQuestion, Send, ShoppingCart } from "lucide-react";
import { TG_CHANNEL, TG_PM } from "../lib/games";

export default function Footer() {
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
        <span>XP Box · прайс-лист игр</span>
        <span>Цены обновляются автоматически · скидки недели — каждый понедельник</span>
      </div>
    </footer>
  );
}
