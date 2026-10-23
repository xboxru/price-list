import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, Send, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TG_PM } from "../lib/games";

const MAX_ICON_SM = (
  <svg width="15" height="15" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="maxG2" x1="6" y1="58" x2="57" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22C8FF" />
        <stop offset="48%" stopColor="#4C8DFF" />
        <stop offset="100%" stopColor="#8A2BFF" />
      </linearGradient>
    </defs>
    <path d="M12 51C8 45 6 38 6 30C6 16 17 6 32 6C46 6 58 18 58 32C58 46 47 58 33 58C25 58 19 56 14 52L9 57C7 59 4 57 5 54L6 50C6 50 9 52 12 51Z" stroke="url(#maxG2)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VK_ICON_SM = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 12C0 3.3845 3.3845 0 12 0C20.6155 0 24 3.3845 24 12C24 20.6155 20.6155 24 12 24C3.3845 24 0 20.6155 0 12Z" fill="#0077FF"/>
    <path d="M12.915 16.5C8.805 16.5 6.45 13.6875 6.3525 9H8.4075C8.475 12.4425 9.99 13.8975 11.1975 14.1975V9H13.1325V11.97C14.3175 11.8425 15.585 10.4925 16.005 9H17.9475C17.6325 10.83 16.275 12.18 15.315 12.735C16.275 13.185 17.82 14.34 18.495 16.5H16.3575C15.825 14.8425 14.49 13.5675 13.1325 13.4325V16.5H12.915Z" fill="white"/>
  </svg>
);

export interface CartItem {
  id: string;
  name: string;
  price: string;
}

interface CartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopy: (text: string, message?: string) => void;
  openSignal?: number;
}

export default function Cart({ items, onRemove, onClear, onCopy, openSignal }: CartProps) {
  const [open, setOpen] = useState(false);
  const [showLinks, setShowLinks] = useState(false);

  // Если корзина опустела — сбрасываем статус "открыта"
  useEffect(() => {
    if (items.length === 0) {
      setOpen(false);
    }
  }, [items.length]);

  // Открываем корзину только при явном нажатии на кнопку (openSignal)
  const prevSignal = useRef(0);
  useEffect(() => {
    if (openSignal === undefined) return;
    if (openSignal === 0) {
      // Сброс после очистки — закрываем без анимации
      prevSignal.current = 0;
      return;
    }
    if (openSignal !== prevSignal.current) {
      prevSignal.current = openSignal;
      setOpen(true);
    }
  }, [openSignal]);
  const [copiedAll, setCopiedAll] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Закрываем при клике вне
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const total = items.reduce((sum, i) => {
    const n = parseInt(i.price.replace(/\D/g, ""), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const copyAll = () => {
    const text = items.map((i) => `${i.name} — ${i.price}`).join("\n");
    onCopy(text, `Скопировано ${items.length} позиций из корзины`);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1800);
  };

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.button
            className={`cart-fab ${open ? "open" : ""}`}
            onClick={() => setOpen((v) => !v)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            title="Открыть корзину"
          >
            <ShoppingCart size={20} />
            <motion.span
              className="cart-fab-badge"
              key={items.length}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
            >
              {items.length}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && items.length > 0 && (
          <div ref={drawerRef} className="cart-drawer-wrap">
            <motion.div
              className="cart-drawer"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              {/* Head */}
              <div className="cart-head">
                <div className="cart-title">
                  <ShoppingCart size={18} />
                  Корзина
                  <span className="cart-count">{items.length}</span>
                </div>
                <button className="cart-clear" onClick={handleClear} title="Очистить корзину">
                  <X size={15} />
                  Очистить
                </button>
              </div>

              {/* Items */}
              <div className="cart-items">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="cart-item">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">{item.price}</span>
                        <button
                          className="cart-item-remove"
                          onClick={() => onRemove(item.id)}
                          title="Убрать из корзины"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="cart-footer">
                <div className="cart-total">
                  Итого: <span>{total.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="cart-actions">
                  <button
                    className={`cart-copy-btn ${copiedAll ? "ok" : ""}`}
                    onClick={copyAll}
                  >
                    {copiedAll ? <Check size={16} /> : <Copy size={16} />}
                    {copiedAll ? "Скопировано!" : "Скопировать список"}
                  </button>
                  <button
                    className={`cart-order-btn ${showLinks ? "expanded" : ""}`}
                    onClick={() => setShowLinks((v) => !v)}
                  >
                    <Send size={15} />
                    Заказать
                    <ChevronDown size={14} className={`chevron ${showLinks ? "up" : ""}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {showLinks && (
                    <motion.div
                      className="cart-links"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <a className="cart-link tg" href={TG_PM} target="_blank" rel="noreferrer" title="Telegram">
                        <Send size={16} />
                        TG
                      </a>
                      <a className="cart-link max" href="https://clck.ru/3TFLbT" target="_blank" rel="noreferrer" title="MAX">
                        {MAX_ICON_SM}
                        MAX
                      </a>
                      <a className="cart-link vk" href="https://vk.com/rus_xbox" target="_blank" rel="noreferrer" title="ВКонтакте">
                        {VK_ICON_SM}
                        VK
                      </a>
                      <a className="cart-link jivo" href="https://jivo.chat/Mky3kA5Dsf" target="_blank" rel="noreferrer" title="Jivo чат">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" fill="#4CAF50" />
                          <path d="M7 9.5C7 8.672 7.672 8 8.5 8h7C16.328 8 17 8.672 17 9.5v4c0 .828-.672 1.5-1.5 1.5H10l-3 2v-2H8.5C7.672 15 7 14.328 7 13.5V9.5Z" fill="white" />
                        </svg>
                        Jivo
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
