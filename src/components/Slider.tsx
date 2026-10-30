import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSliderDefs } from "../lib/adminSheet";
import type { Game } from "../lib/games";
import { SLIDES_FALLBACK, labelTone, resolveSlides, type Slide, type SlideDef } from "../lib/slider";
import { useGameCover } from "../hooks/useGameCover";
import { CoverView } from "./CoverImage";

const AUTOPLAY_MS = 6500;

interface SliderProps {
  games: Game[];
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

function SlideView({
  slide,
  eager,
  inCart,
  addToCart,
  openCart,
}: {
  slide: Slide;
  eager: boolean;
  inCart: boolean;
  addToCart: SliderProps["addToCart"];
  openCart: () => void;
}) {
  const { src, loading, genres } = useGameCover(slide.coverTitle);
  const card = slide.card;
  const tone = slide.label ? labelTone(slide.label, slide.color) : null;

  return (
    <>
      <div className="slide-bg">
        <CoverView
          title={slide.coverTitle}
          src={src}
          pending={loading}
          loading={eager ? "eager" : "lazy"}
        />
      </div>
      <div className="slide-shade" />
      <div className="slide-body">
        {slide.label && tone && (
          <span
            className="slide-label"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
          >
            {slide.label}
          </span>
        )}
        <h2 className="slide-title">{slide.title}</h2>
        {slide.text && <p className="slide-text">{slide.text}</p>}
        {genres.length > 0 && <div className="slide-genres">{genres.join(" · ")}</div>}

        {card && (
          <div className="slide-buy">
            <span className="slide-price">{card.price}</span>
            {inCart ? (
              <button className="btn btn-ghost" onClick={openCart}>
                <ShoppingCart size={16} />
                <span>Открыть корзину</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => addToCart(`collection-${card.id}`, card.title, card.price)}
              >
                <Plus size={16} />
                <span>В корзину</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function Slider({ games, cartIds, addToCart, openCart }: SliderProps) {
  // Слайды из листа «Слайдер» Google Таблицы; если листа нет — запасной список из кода
  const [defs, setDefs] = useState<SlideDef[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchSliderDefs().then((d) => {
      if (!cancelled) setDefs(d ?? SLIDES_FALLBACK);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => (defs ? resolveSlides(games, defs) : []), [games, defs]);

  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = count ? ((index % count) + count) % count : 0;

  const go = useCallback((dir: number) => setPage(([i]) => [i + dir, dir]), []);
  const jump = useCallback(
    (target: number) => setPage(([i]) => [target, target > i ? 1 : -1]),
    []
  );

  // Автопрокрутка: стоит на паузе при наведении/фокусе, не работает при «уменьшить анимацию»
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) go(1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, count, paused, go]);

  if (count === 0) return null;
  const slide = slides[current];

  return (
    <section
      className="slider"
      aria-roledescription="carousel"
      aria-label="Топовые игры и новинки"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          className="slide"
          aria-roledescription="slide"
          aria-label={`${current + 1} из ${count}`}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d >= 0 ? 60 : -60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d >= 0 ? -60 : 60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1);
            else if (info.offset.x > 60) go(-1);
          }}
        >
          <SlideView
            slide={slide}
            eager={current === 0}
            inCart={!!slide.card && cartIds.has(`collection-${slide.card.id}`)}
            addToCart={addToCart}
            openCart={openCart}
          />
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button className="slider-arrow prev" onClick={() => go(-1)} aria-label="Предыдущий слайд">
            <ChevronLeft size={22} />
          </button>
          <button className="slider-arrow next" onClick={() => go(1)} aria-label="Следующий слайд">
            <ChevronRight size={22} />
          </button>
          <div className="slider-dots" role="tablist" aria-label="Выбор слайда">
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === current}
                aria-label={`Слайд ${i + 1}`}
                className={`slider-dot ${i === current ? "active" : ""}`}
                onClick={() => jump(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
