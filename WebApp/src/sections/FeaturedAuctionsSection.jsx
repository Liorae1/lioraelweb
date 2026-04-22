import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./FeaturedAuctionsSection.module.css";
import { useReveal } from "../hooks/useReveal";
import {
  formatMoneyWithCurrency,
  getAuctionImage,
  getLocalizedCategory,
  getLocalizedCondition,
  getLocalizedSize,
} from "../utils/domain";
import {
  formatAuctionTimeLeft,
  getAuctionStatusLabel,
  getAuctionTimeLabel,
} from "../utils/auctionPresentation";

function FeaturedAuctionsSection({ auctions, loading, error }) {
  const { ref, isVisible } = useReveal();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section 
      ref={ref}
      className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
      >
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <div className={styles.label}>Актуальні лоти</div>
            <h2 className={styles.title}>Заплановані аукціони</h2>
          </div>

          <Link to="/auction" className={styles.allButton}>
            Усі аукціони
          </Link>
        </div>

        <div className={styles.grid}>
          {loading ? (
            <article className={styles.card}>
              <div className={styles.image}></div>
                <div className={styles.content}>
                  <div className={styles.brandRow}>
                    <div className={styles.brand}>Завантаження</div>
                    <span className={styles.statusChip}>...</span>
                  </div>
                <h3 className={styles.cardTitle}>Підтягуємо заплановані аукціони</h3>
                <p className={styles.metaText}>
                  На головній сторінці тут показуються тільки майбутні торги.
                </p>
              </div>
            </article>
          ) : auctions.length ? (
            auctions.map((item) => {
              const imageUrl = getAuctionImage(item);

              return (
                <article key={item.id} className={styles.card}>
                  <div className={styles.imageFrame}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.imageFallback}>Фото лота</div>
                    )}
                  </div>

                  <div className={styles.content}>
                    <div className={styles.brandRow}>
                      <div className={styles.brand}>{item.brand}</div>
                      <span className={styles.statusChip}>{getAuctionStatusLabel(item, now)}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.metaText}>
                      {item.seller} • {getLocalizedCondition(item.condition)} • {getLocalizedSize(item.size)}
                    </p>

                    <div className={styles.infoRow}>
                      <div>
                        <div className={styles.infoLabel}>Поточна ставка</div>
                        <div className={styles.price}>
                          {formatMoneyWithCurrency(
                            item.currentPrice || item.currentBid || item.startPrice || 0,
                            item.currency || "UAH"
                          )}
                        </div>
                      </div>

                      <div>
                        <div className={styles.infoLabel}>{getAuctionTimeLabel(item, now)}</div>
                        <div className={styles.time}>{formatAuctionTimeLeft(item, now)}</div>
                      </div>
                    </div>

                    <div className={styles.metaRow}>
                      <span>{item.bidCount ?? item.bidsCount ?? 0} ставок</span>
                      <span>{getLocalizedCategory(item.category)}</span>
                      <span>
                        Крок {formatMoneyWithCurrency(item.minBidStep || item.minStep || 0, item.currency || "UAH")}
                      </span>
                    </div>

                    <Link to={`/auction/${item.id}`} className={styles.bidButton}>
                      Переглянути лот
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <article className={styles.card}>
              <div className={styles.content}>
                <div className={styles.brandRow}>
                  <div className={styles.brand}>Поки порожньо</div>
                  <span className={styles.statusChip}>0 лотів</span>
                </div>
                <h3 className={styles.cardTitle}>У каталозі ще немає аукціонів для показу</h3>
                <p className={styles.metaText}>
                  {error || "Щойно на бекенді з'являться заплановані аукціони, вони будуть тут."}
                </p>
                <Link to="/auction" className={styles.bidButton}>
                  Перейти в каталог
                </Link>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturedAuctionsSection;
