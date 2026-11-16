import { init } from "@waline/client";
import "@waline/client/style";
import { useEffect, useRef } from "react";
import { WALINE_PATH, WALINE_SERVER_URL } from "../lib/reviews";

/** Форма «Оставить отзыв» и список отзывов посетителей (Waline) */
export default function WalineReviews() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!WALINE_SERVER_URL || !ref.current) return;
    // Настройки те же, что на вашей странице с отзывами (язык, без реакций)
    const waline = init({
      el: ref.current,
      serverURL: WALINE_SERVER_URL,
      path: WALINE_PATH,
      lang: "ru",
      reaction: false,
      // у закреплённого отзыва вместо текста «Липкий» — только иконка (рисуется в index.css)
      locale: { sticky: "" },
      meta: ["nick"], // в форме только поле «Псевдоним» (без эл. адреса и веб-сайта)
      pageSize: 3, // не более трёх отзывов за раз, остальные по кнопке «Загрузить ещё»
      dark: false, // тёмную тему рисуем своими стилями (.waline-wrap в index.css)
      placeholder: "Поделитесь отзывом о покупке…",
    });
    return () => waline?.destroy();
  }, []);

  if (!WALINE_SERVER_URL) return null;

  return (
    <div className="reviews-waline">
      <h3 className="reviews-waline-title">Оставить отзыв</h3>
      <p className="reviews-waline-lead">Расскажите, как всё прошло: ваш отзыв поможет другим покупателям.</p>
      <div ref={ref} className="waline-wrap" />
    </div>
  );
}
