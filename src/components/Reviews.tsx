import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReviews } from "../lib/adminSheet";
import { REVIEWS_FALLBACK, WALINE_SERVER_URL, type Review } from "../lib/reviews";
import WalineReviews from "./WalineReviews";

const LONG_TEXT = 300; // длиннее — показываем «Читать полностью»

function ReviewCard({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const long = review.text.length > LONG_TEXT;
  const initial = review.name.trim().charAt(0).toUpperCase() || "•";

  return (
    <article className="review-card" role="listitem">
      <Quote size={22} className="review-quote" aria-hidden="true" />
      <p className={`review-text ${open ? "open" : ""}`}>{review.text}</p>
      {long && (
        <button className="review-more" onClick={() => setOpen((v) => !v)}>
          {open ? "Свернуть" : "Читать полностью"}
        </button>
      )}
      <div className="review-author">
        <span className="review-avatar" aria-hidden="true">{initial}</span>
        <div>
          <b>{review.name}</b>
          {review.date && <small>{review.date}</small>}
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  // Отзывы из листа «Отзывы» Google Таблицы; если листа нет — запасной список из кода
  const [reviews, setReviews] = useState<Review[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchReviews().then((r) => {
      if (!cancelled) setReviews(r ?? REVIEWS_FALLBACK);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [reviews, updateArrows]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".review-card");
    const step = card ? card.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const hasSlider = !!reviews && reviews.length > 0;
  // блок показываем, если есть отзывы из таблицы или подключён Waline
  if (!hasSlider && !WALINE_SERVER_URL) return null;

  return (
    <section className="reviews" id="reviews">
      <div className="section-head">
        <div>
          <div className="section-kicker">отзывы</div>
          <h2 className="section-title">
            <span
              className="ticon"
              style={{
                background: "var(--accent-soft)",
                borderColor: "rgba(0,255,157,.3)",
                color: "var(--accent)",
              }}
            >
              <Quote size={22} />
            </span>
            Отзывы <em>покупателей</em>
          </h2>
        </div>
        {hasSlider && reviews!.length > 1 && (
          <div className="reviews-nav">
            <button onClick={() => scrollByCard(-1)} disabled={!canPrev} aria-label="Предыдущие отзывы">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => scrollByCard(1)} disabled={!canNext} aria-label="Следующие отзывы">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {hasSlider && (
        <div
          className="reviews-track"
          ref={trackRef}
          role="list"
          aria-label="Отзывы покупателей"
          onScroll={updateArrows}
        >
          {reviews!.map((r, i) => (
            <ReviewCard key={`${i}-${r.name}`} review={r} />
          ))}
        </div>
      )}

      <WalineReviews />
    </section>
  );
}
