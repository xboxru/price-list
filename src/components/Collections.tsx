import { motion } from "framer-motion";
import { Plus, ShoppingCart, Sparkles } from "lucide-react";
import { COLLECTION_CARDS } from "../lib/collections";

const ease = [0.2, 0.7, 0.2, 1] as const;

interface CollectionsProps {
  cartIds: Set<string>;
  addToCart: (id: string, name: string, price: string) => void;
  openCart: () => void;
}

export default function Collections({ cartIds, addToCart, openCart }: CollectionsProps) {
  return (
    <section className="collections-section">
      <div className="section-head">
        <div>
          <div className="section-kicker">03 · подборка от магазина</div>
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
            Игровые <em>карточки</em>
          </h2>
        </div>
      </div>

      <p className="collections-intro">
        Подборка от магазина: готовые предложения, которые часто выбирают наши
        покупатели. Добавляйте игры в корзину и отправляйте список одним
        сообщением.
      </p>

      <div className="store-cards-grid">
        {COLLECTION_CARDS.map((item, index) => {
          const key = `collection-${item.id}`;
          const inCart = cartIds.has(key);

          return (
            <motion.article
              key={key}
              className={`store-card ${inCart ? "in-cart-row" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.04, ease }}
            >
              <div className="store-thumb-wrap">
                <img className="store-thumb" src={item.cover} alt={item.title} loading="lazy" />
                <span className="store-discount">{item.discount}</span>
              </div>

              <div className="store-body">
                <div className="store-meta">{item.collection}</div>
                <h3 className="store-title">{item.title}</h3>
                {item.note && <p className="store-note">{item.note}</p>}

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
                    <button
                      className="order-mini"
                      onClick={() => openCart()}
                      title="Открыть корзину"
                    >
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
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
