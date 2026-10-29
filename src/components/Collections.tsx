import { Plus, ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resolveCollection, type CollectionCard } from "../lib/collections";
import {
  AUTHOR_COLLECTIONS,
  resolveAuthorCollections,
  type AuthorCollectionDef,
} from "../lib/authorCollections";
import { fetchAuthorDefs } from "../lib/adminSheet";
import { useGameCover } from "../hooks/useGameCover";
import type { Game } from "../lib/games";
import { CoverView } from "./CoverImage";

interface CardProps {
  item: CollectionCard;
  index: number;
  inCart: boolean;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

function CollectionItem({ item, index, inCart, addToCart, openCart }: CardProps) {
  const key = `collection-${item.id}`;
  const { src, loading, genres } = useGameCover(item.title, item.cover);
  const meta = genres.length ? genres.join(" · ") : item.collection;

  return (
    <article
      className={`store-card store-card-fadein ${inCart ? "in-cart-row" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="store-thumb-wrap">
        <CoverView className="store-thumb" title={item.title} src={src} pending={loading} />
        <span className="store-discount">{item.badge}</span>
      </div>

      <div className="store-body">
        <div className="store-meta" title={meta}>
          {meta}
        </div>
        <h3 className="store-title">{item.title}</h3>

        <div className="store-platforms">
          {item.platforms.map((platform) => (
            <span className="store-platform" key={platform}>
              {platform}
            </span>
          ))}
        </div>

        <div className="store-footer">
          <span className="store-price">{item.price}</span>
          {inCart ? (
            <button className="order-mini" onClick={() => openCart()} title="Открыть корзину">
              <ShoppingCart size={14} />
            </button>
          ) : (
            <button
              className="cart-row-btn in-deal"
              onClick={() => addToCart(key, item.title, item.price)}
              title="Добавить в корзину"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

interface CollectionsProps {
  games: Game[];
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

const DAILY = "daily";

export default function Collections({ games, cartIds, addToCart, openCart }: CollectionsProps) {
  const daily = useMemo(() => resolveCollection(games), [games]);
  // Подборки из листа «Подборки» в Google Таблице; если листа нет — список из кода
  const [defs, setDefs] = useState<AuthorCollectionDef[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchAuthorDefs().then((d) => {
      if (!cancelled) setDefs(d ?? AUTHOR_COLLECTIONS);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const authors = useMemo(
    () => (defs ? resolveAuthorCollections(games, defs).filter((c) => c.cards.length > 0) : []),
    [games, defs]
  );
  const [active, setActive] = useState<string>(DAILY);

  const current = authors.find((c) => c.id === active);
  const cards = current ? current.cards : daily;

  return (
    <section className="collections-section">
      <div className="section-head">
        <div>
          <div className="section-kicker">03 · подборки от магазина</div>
          <h2 className="section-title">
            <span
              className="ticon"
              style={{
                background: "var(--accent-soft)",
                borderColor: "rgba(0,255,157,.3)",
                color: "var(--accent)",
              }}
            >
              <Sparkles size={22} />
            </span>
            Игровые <em>подборки</em>
          </h2>
        </div>
      </div>

      {authors.length > 0 && (
        <div className="collection-tabs" role="tablist" aria-label="Подборки">
          <button
            role="tab"
            aria-selected={!current}
            className={`collection-tab ${!current ? "active" : ""}`}
            onClick={() => setActive(DAILY)}
          >
            Подборка дня
          </button>
          {authors.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={current?.id === c.id}
              className={`collection-tab ${current?.id === c.id ? "active" : ""}`}
              onClick={() => setActive(c.id)}
            >
              {c.title}
              <span className="collection-tab-count">{c.cards.length}</span>
            </button>
          ))}
        </div>
      )}

      <p className="collections-intro">
        {current
          ? current.description
          : "Подборка дня: 12 игр по самым низким ценам из нашего прайса. Набор обновляется каждый день."}{" "}
        Добавляйте игры в корзину и отправляйте список одним сообщением.
      </p>

      <div className="store-cards-grid">
        {cards.length === 0 && (
          <p className="collections-intro">Подборка загружается…</p>
        )}
        {cards.map((item, index) => (
          <CollectionItem
            key={`${current?.id ?? DAILY}-${item.id}`}
            item={item}
            index={index}
            inCart={cartIds.has(`collection-${item.id}`)}
            addToCart={addToCart}
            openCart={openCart}
          />
        ))}
      </div>
    </section>
  );
}
