import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gamepad2, Layers3, Menu, Search, Send, X, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { TG_PM } from "../lib/games";

interface NavbarProps {
  currentPage: "games" | "subs" | "collections";
  setPage: (page: "games" | "subs" | "collections") => void;
  onSearch: (query: string) => void;
}

function MenuContact() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <button
        className={`contact-help-trigger ${open ? "expanded" : ""}`}
        style={{ borderRadius: open ? "100px 100px 14px 14px" : "100px" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Send size={16} />
        <span>Спросить в личке</span>
        <ChevronDown size={14} className={`chevron ${open ? "up" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="contact-help-links"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="contact-help-grid">
              <a className="uv-btn" href={TG_PM} target="_blank" rel="noreferrer">
                <svg className="uv-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

export default function Navbar({ currentPage, setPage, onSearch }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { id: "games", label: "Игры Xbox", icon: LayoutGrid },
    { id: "collections", label: "Подборки", icon: Layers3 },
    { id: "subs", label: "Подписки", icon: Gamepad2 },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setSearchOpen(false);
  };

  const handlePageSelect = (page: "games" | "subs" | "collections") => {
    setPage(page);
    setIsOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchToggle = () => {
    setSearchOpen((v) => !v);
    setIsOpen(false);
  };

  const handleSearchSubmit = () => {
    onSearch(searchValue.trim());
    setSearchOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-content">
          <div className="navbar-logo" onClick={() => handlePageSelect("games")}>
            <img src="./logo.png" alt="XP Box" />
            <span>XP BOX</span>
          </div>

          <div className="navbar-actions">
            <button className="nav-search-btn" onClick={handleSearchToggle} aria-label="Поиск">
              <Search size={20} />
            </button>
            <button className="burger-btn" onClick={toggleMenu} aria-label="Меню">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="nav-search-panel"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="nav-search-inner">
              <Search size={18} className="nav-search-icon" />
              <input
                className="nav-search-input"
                type="text"
                placeholder="Поиск игры…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                autoFocus
              />
              <button className="nav-search-go" onClick={handleSearchSubmit}>
                Найти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="menu-header">
              <h3>Навигация</h3>
              <button onClick={toggleMenu}><X size={24} /></button>
            </div>

            <div className="menu-sections">
              <div className="menu-group">
                <span className="group-label">Разделы</span>
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    className={`menu-link ${currentPage === item.id ? "active" : ""}`}
                    onClick={() => handlePageSelect(item.id as "games" | "subs" | "collections")}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="menu-group">
                <span className="group-label">Спросить в личке</span>
                <MenuContact />
              </div>
            </div>

            <div className="menu-footer">
              <p>XP BOX · Xbox Россия</p>
              <p className="sub">Цены обновляются автоматически</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for closing menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>
    </>
  );
}
