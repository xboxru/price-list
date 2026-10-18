import { Sparkles } from "lucide-react";

const ITEMS: { text: string; outline?: boolean }[] = [
  { text: "Скидки недели" },
  { text: "до −45%", outline: true },
  { text: "быстрая выдача" },
  { text: "Xbox Россия", outline: true },
  { text: "автообновление цен" },
  { text: "с 11:00 до 23:00", outline: true },
];

function MarqueeItems() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span className="m-item" key={i}>
          {item.outline ? <span className="outline">{item.text}</span> : item.text}
          <Sparkles size={16} />
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <MarqueeItems />
        <MarqueeItems />
      </div>
    </div>
  );
}
