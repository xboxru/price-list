import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Flame,
  Gamepad2,
  HelpCircle,
  Layers3,
  LayoutGrid,
  List,
  Menu,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TG_CHANNEL, TG_PM } from "../lib/games";
import { MenuContact } from "./Navbar";

type Page = "games" | "subs" | "collections";

interface SiteHeaderProps {
  page: Page;
  setPage: (page: Page) => void;
  onSearch: (query: string) => void;
  total: number;
  cartCount: number;
  cartTotal: number;
  openCart: () => void;
  /** Вид карточек на телефоне: список в один столбец или плитка в два */
  view: "list" | "grid";
  onToggleView: () => void;
}

/** Плавная прокрутка к блоку на странице */
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ContactPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // закрываем по клику вне блока и по Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="hdr-contact" ref={ref}>
      <button
        className="hdr-btn hdr-btn-primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Связаться с нами"
      >
        <Send size={16} />
        <span>Связаться с нами</span>
        <ChevronDown size={14} className={`hdr-chevron ${open ? "up" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="hdr-contact-pop"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="contact-help-grid">
              <a className="uv-btn" href={TG_PM} target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Telegram
              </a>
              <a className="uv-btn" href="https://clck.ru/3TFLbT" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 51C8 45 6 38 6 30C6 16 17 6 32 6C46 6 58 18 58 32C58 46 47 58 33 58C25 58 19 56 14 52L9 57C7 59 4 57 5 54L6 50C6 50 9 52 12 51Z" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                MAX
              </a>
              <a className="uv-btn" href="https://vk.com/rus_xbox" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.77 18.52h1.12s.34-.04.51-.22c.16-.17.16-.49.16-.49s-.02-1.49.67-1.71c.68-.22 1.56 1.47 2.49 2.12.7.49 1.24.39 1.24.39l2.49-.04s1.3-.08.68-1.11c-.05-.08-.36-.76-1.87-2.14-1.58-1.45-1.37-1.21.53-3.72.67-.91 1.63-2.29 1.48-2.77-.14-.45-1-.33-1-.33l-2.81.02s-.21-.03-.36.06c-.15.09-.25.31-.25.31s-.44 1.18-1.03 2.19c-1.24 2.12-1.74 2.24-1.94 2.1-.47-.31-.35-1.24-.35-1.9 0-2.07.31-2.93-.61-3.15-.31-.07-.53-.12-1.31-.13-.99-.01-1.83 0-2.31.24-.32.15-.56.5-.41.52.19.02.62.12.85.43.3.4.29 1.31.29 1.31s.17 2.44-.4 2.74c-.39.21-.93-.22-2.09-2.15-.59-.98-1.04-2.07-1.04-2.07s-.09-.21-.24-.33c-.18-.14-.44-.18-.44-.18l-2.67.02s-.4.01-.55.18c-.13.16-.01.48-.01.48s2.09 4.89 4.45 7.35c2.17 2.27 4.63 2.12 4.63 2.12z" />
                </svg>
                VK
              </a>
              <a className="uv-btn" href="https://jivo.chat/Mky3kA5Dsf" target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Чат
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SiteHeader({
  page,
  setPage,
  onSearch,
  total,
  cartCount,
  cartTotal,
  openCart,
  view,
  onToggleView,
}: SiteHeaderProps) {
  const [query, setQuery] = useState("");
  const submit = () => onSearch(query.trim());
  const searchInputRef = useRef<HTMLInputElement>(null);

  /** Сбрасываем фильтр каталога, не прокручивая страницу */
  const resetCatalogSearch = () =>
    window.dispatchEvent(new CustomEvent("catalog-search", { detail: "" }));

  const clearQuery = () => {
    setQuery("");
    resetCatalogSearch();
    searchInputRef.current?.focus();
  };

  // Бургер-меню на телефоне: все разделы и связь внутри него, чтобы шапка не занимала место
  const [menuOpen, setMenuOpen] = useState(false);

  // Поиск на телефоне: иконка открывает панель, которая выезжает слева
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const clearMobileQuery = () => {
    setMobileQuery("");
    resetCatalogSearch();
    mobileInputRef.current?.focus();
  };
  const submitMobile = () => {
    onSearch(mobileQuery.trim());
    setSearchOpen(false);
  };

  // Переход в раздел страницы и прокрутка к блоку внутри него
  const goPage = (p: Page, anchor?: string) => {
    setPage(p);
    window.setTimeout(() => (anchor ? scrollToId(anchor) : window.scrollTo({ top: 0, behavior: "smooth" })), 80);
  };

  // Пункт бургер-меню: закрыть меню и выполнить действие
  const fromMenu = (fn: () => void) => () => {
    setMenuOpen(false);
    window.setTimeout(fn, 150);
  };

  const tabs: { label: string; icon: typeof Gamepad2; active: boolean; onClick: () => void }[] = [
    { label: "Игры Xbox", icon: Gamepad2, active: page === "games", onClick: () => goPage("games") },
    { label: "Подборки", icon: LayoutGrid, active: page === "collections", onClick: () => goPage("collections") },
    { label: "Скидки недели", icon: Flame, active: false, onClick: () => goPage("games", "deals") },
    { label: "Подписки", icon: Layers3, active: page === "subs", onClick: () => goPage("subs") },
    { label: "Как заказать", icon: HelpCircle, active: false, onClick: () => scrollToId("howto") },
  ];

  return (
    <header className="hdr">
      {/* Верхний ярус: справочная информация */}
      <div className="hdr-top">
        <div className="hdr-top-left">
          <span className="hdr-live">
            <span className="hdr-live-dot" />
            Ежедневно с 11:00 до 23:00 мск
          </span>
          <span className="hdr-top-note">
            Цены обновляются автоматически{total > 0 ? ` · в прайсе ${total.toLocaleString("ru-RU")} позиций` : ""}
          </span>
        </div>
        <div className="hdr-top-links">
          <a href={TG_CHANNEL} target="_blank" rel="noreferrer">
            <Send size={13} className="hdr-top-icon" aria-hidden />
            Telegram-канал
          </a>
          <a href="#howto" onClick={(e) => { e.preventDefault(); scrollToId("howto"); }}>
            <ShoppingBag size={13} className="hdr-top-icon" aria-hidden />
            Как заказать
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToId("faq"); }}>
            <HelpCircle size={13} className="hdr-top-icon" aria-hidden />
            Частые вопросы
          </a>
        </div>
      </div>

      {/* Основной ярус: логотип, поиск, корзина, связь */}
      <div className="hdr-main">
        <a
          className="hdr-brand"
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          aria-label="XP Box — наверх"
        >
          <img src="./logo.png" alt="" width={46} height={46} />
          <span className="hdr-brand-text">
            <b>XP Box</b>
            <span>Прайс-лист игр и подписок Xbox</span>
          </span>
        </a>

        <div className="hdr-search">
          <Search size={18} />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Найти игру или подписку…"
            aria-label="Поиск по прайсу"
            value={query}
            ref={searchInputRef}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {query && (
            <button type="button" className="hdr-clear" onClick={clearQuery} aria-label="Очистить поиск">
              <X size={14} />
            </button>
          )}
          <button className="hdr-search-go" onClick={submit}>Найти</button>
        </div>

        <div className="hdr-actions">
          {/* телефон: выбор вида — один столбец или плитка в два */}
          <button
            className="nav-search-btn hdr-view"
            onClick={onToggleView}
            aria-pressed={view === "grid"}
            aria-label={view === "grid" ? "Показывать по одному в ряд" : "Показывать по два в ряд"}
            title={view === "grid" ? "Один в ряд" : "Два в ряд"}
          >
            {view === "grid" ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button
            className="nav-search-btn hdr-search-icon"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
            aria-label="Поиск"
          >
            <Search size={20} />
          </button>
          <button className="hdr-btn hdr-btn-ghost" onClick={openCart} aria-label="Открыть корзину">
            <ShoppingCart size={18} />
            <span className="hdr-cart-label">
              {cartCount > 0 ? `${cartTotal.toLocaleString("ru-RU")} ₽` : "Корзина"}
            </span>
            {cartCount > 0 && <span className="hdr-cart-count">{cartCount}</span>}
          </button>
          <ContactPopover />
          <button
            className="burger-btn hdr-burger"
            onClick={() => {
              setSearchOpen(false);
              setMenuOpen((v) => !v);
            }}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Нижний ярус: разделы */}
      <nav className="hdr-nav" aria-label="Разделы сайта">
        {tabs.map((t) => (
          <button
            key={t.label}
            className={`hdr-tab ${t.active ? "active" : ""}`}
            aria-current={t.active ? "page" : undefined}
            onClick={t.onClick}
          >
            <t.icon className="hdr-tab-icon" size={15} strokeWidth={2.1} aria-hidden />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Панель поиска для телефона: выезжает слева (выносим в <body>, чтобы была поверх остальных кнопок) */}
      {createPortal(
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                key="search-overlay"
                className="search-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSearchOpen(false)}
              />
              <motion.div
                key="search-panel"
                className="nav-search-panel"
                role="search"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
              >
                <div className="nav-search-inner">
                  <Search size={18} className="nav-search-icon" />
                  <input
                    className="nav-search-input"
                    type="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder="Поиск игры…"
                    value={mobileQuery}
                    ref={mobileInputRef}
                    onChange={(e) => setMobileQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitMobile();
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    autoFocus
                  />
                  {mobileQuery && (
                    <button type="button" className="hdr-clear" onClick={clearMobileQuery} aria-label="Очистить поиск">
                      <X size={14} />
                    </button>
                  )}
                  <button className="nav-search-go" onClick={submitMobile}>
                    Найти
                  </button>
                  <button
                    className="nav-search-close"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Закрыть поиск"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Бургер-меню (телефон): выезжает справа, как в прежней версии */}
      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                key="menu-overlay"
                className="menu-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                key="menu-panel"
                className="mobile-menu"
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <div className="menu-header">
                  <h3>Навигация</h3>
                  <button onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
                    <X size={24} />
                  </button>
                </div>

                <div className="menu-sections">
                  <div className="menu-group">
                    <span className="group-label">Разделы</span>
                    <button className={`menu-link ${page === "games" ? "active" : ""}`} onClick={fromMenu(() => goPage("games"))}>
                      <Gamepad2 size={20} />
                      Игры Xbox
                    </button>
                    <button className={`menu-link ${page === "collections" ? "active" : ""}`} onClick={fromMenu(() => goPage("collections"))}>
                      <LayoutGrid size={20} />
                      Подборки
                    </button>
                    <button className="menu-link" onClick={fromMenu(() => goPage("games", "deals"))}>
                      <Flame size={20} />
                      Скидки недели
                    </button>
                    <button className={`menu-link ${page === "subs" ? "active" : ""}`} onClick={fromMenu(() => goPage("subs"))}>
                      <Layers3 size={20} />
                      Подписки
                    </button>
                  </div>

                  <div className="menu-group">
                    <span className="group-label">Информация</span>
                    <button className="menu-link" onClick={fromMenu(() => scrollToId("howto"))}>
                      <HelpCircle size={20} />
                      Как заказать
                    </button>
                    <button className="menu-link" onClick={fromMenu(() => scrollToId("faq"))}>
                      <HelpCircle size={20} />
                      Частые вопросы
                    </button>
                    <a className="menu-link" href={TG_CHANNEL} target="_blank" rel="noreferrer">
                      <Send size={20} />
                      Telegram-канал
                    </a>
                  </div>

                  <div className="menu-group">
                    <span className="group-label">Связаться с нами</span>
                    <MenuContact />
                  </div>
                </div>

                <div className="menu-footer">
                  <p>XP Box · Xbox Россия</p>
                  <p className="sub">Цены обновляются автоматически · ежедневно 11:00–23:00 мск</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
