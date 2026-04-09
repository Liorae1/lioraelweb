import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockLots } from "../data/mockLots";
import styles from "./AuctionDetailsPage.module.css";

function AuctionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lot = useMemo(
    () => mockLots.find((item) => item.id === Number(id)),
    [id],
  );

  if (!lot) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <h1>Лот не знайдено</h1>
          <p>Схоже, що такого аукціону зараз немає або він уже недоступний.</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate("/auction")}
          >
            Повернутися до аукціонів
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <button type="button" onClick={() => navigate("/")}>
            Головна
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate("/auction")}>
            Аукціони
          </button>
          <span>/</span>
          <strong>{lot.title}</strong>
        </div>

        <section className={styles.mainSection}>
          <div className={styles.galleryCard}>
            <div className={styles.imageBadge}>{lot.status}</div>
            <img src={lot.image} alt={lot.title} className={styles.mainImage} />

            <div className={styles.thumbnailRow}>
              <div className={styles.thumbnailActive}>
                <img src={lot.image} alt={lot.title} />
              </div>
              <div className={styles.thumbnailMuted}>
                <img src={lot.image} alt={lot.title} />
              </div>
              <div className={styles.thumbnailMuted}>
                <img src={lot.image} alt={lot.title} />
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.headerBlock}>
              <p className={styles.brand}>{lot.brand}</p>
              <h1>{lot.title}</h1>
              <p className={styles.subtitle}>
                Перевірений лот із преміальної добірки Liorael.
              </p>
            </div>

            <div className={styles.tags}>
              <span>Стан: {lot.condition}</span>
              <span>Розмір: {lot.size}</span>
              <span>Категорія: {lot.category}</span>
              <span>Автентичність: {lot.authenticity}</span>
            </div>

            <div className={styles.bidPanel}>
              <div>
                <span className={styles.panelLabel}>Поточна ставка</span>
                <strong className={styles.price}>
                  {lot.currentBid.toLocaleString("uk-UA")} ₴
                </strong>
              </div>

              <div className={styles.panelMeta}>
                <div>
                  <span className={styles.panelLabel}>Мінімальний крок</span>
                  <b>{lot.minStep.toLocaleString("uk-UA")} ₴</b>
                </div>

                <div>
                  <span className={styles.panelLabel}>До завершення</span>
                  <b>{lot.timeLeft}</b>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button type="button" className={styles.primaryButton}>
                  Зробити ставку
                </button>
                <button type="button" className={styles.secondaryButton}>
                  Додати в обране
                </button>
              </div>
            </div>

            <div className={styles.quickInfo}>
              <div className={styles.quickInfoItem}>
                <span>Ставок</span>
                <strong>{lot.bidsCount}</strong>
              </div>

              <div className={styles.quickInfoItem}>
                <span>Продавець</span>
                <strong>{lot.seller}</strong>
              </div>

              <div className={styles.quickInfoItem}>
                <span>Матеріал</span>
                <strong>{lot.material}</strong>
              </div>

              <div className={styles.quickInfoItem}>
                <span>Колір</span>
                <strong>{lot.color}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.contentCard}>
            <h2>Опис лота</h2>
            <p>{lot.description}</p>
          </article>

          <article className={styles.contentCard}>
            <h2>Деталі</h2>
            <ul className={styles.detailsList}>
              <li>
                <span>Бренд</span>
                <strong>{lot.brand}</strong>
              </li>
              <li>
                <span>Категорія</span>
                <strong>{lot.category}</strong>
              </li>
              <li>
                <span>Розмір</span>
                <strong>{lot.size}</strong>
              </li>
              <li>
                <span>Стан</span>
                <strong>{lot.condition}</strong>
              </li>
              <li>
                <span>Колір</span>
                <strong>{lot.color}</strong>
              </li>
              <li>
                <span>Матеріал</span>
                <strong>{lot.material}</strong>
              </li>
              <li>
                <span>Автентичність</span>
                <strong>{lot.authenticity}</strong>
              </li>
            </ul>
          </article>

          <article
            className={`${styles.contentCard} ${styles.auctionFlowCard}`}
          >
            <div className={styles.auctionFlowHeader}>
              <div>
                <h2>Хід аукціону</h2>
                <p className={styles.auctionFlowSubtitle}>
                  Динаміка ставок у реальному стилі аукціонної платформи
                </p>
              </div>

              <div className={styles.auctionStatus}>
                <span className={styles.statusDot}></span>
                Аукціон активний
              </div>
            </div>

            <div className={styles.auctionStatsGrid}>
              <div className={styles.auctionStatItem}>
                <span>Стартова ставка</span>
                <strong>{lot.startingBid.toLocaleString("uk-UA")} ₴</strong>
              </div>

              <div className={styles.auctionStatItem}>
                <span>Поточна ставка</span>
                <strong>{lot.currentBid.toLocaleString("uk-UA")} ₴</strong>
              </div>

              <div className={styles.auctionStatItem}>
                <span>Наступна ставка</span>
                <strong>{lot.nextBid.toLocaleString("uk-UA")} ₴</strong>
              </div>

              <div className={styles.auctionStatItem}>
                <span>Активних учасників</span>
                <strong>{lot.activeBidders}</strong>
              </div>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressTop}>
                <span>Зростання ціни</span>
                <strong>+{lot.bidProgress}%</strong>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${lot.bidProgress}%` }}
                />
              </div>

              <div className={styles.progressLabels}>
                <span>{lot.startingBid.toLocaleString("uk-UA")} ₴</span>
                <span>{lot.currentBid.toLocaleString("uk-UA")} ₴</span>
              </div>
            </div>

            <div className={styles.nextBidPanel}>
              <div>
                <span className={styles.nextBidLabel}>
                  Рекомендована наступна ставка
                </span>
                <strong>{lot.nextBid.toLocaleString("uk-UA")} ₴</strong>
              </div>

              <div className={styles.quickBidButtons}>
                <button type="button">+ {lot.minStep} ₴</button>
                <button type="button">+ {lot.minStep * 2} ₴</button>
                <button type="button">+ {lot.minStep * 3} ₴</button>
              </div>
            </div>

            <div className={styles.timelineBlock}>
              <div className={styles.timelineHeader}>
                <h3>Останні ставки</h3>
                <span>Остання активність: {lot.lastBidTime}</span>
              </div>

              <div className={styles.timeline}>
                {lot.bidsHistory.map((bid, index) => (
                  <div
                    key={`${bid.user}-${index}`}
                    className={`${styles.timelineItem} ${
                      index === 0 ? styles.timelineItemActive : ""
                    }`}
                  >
                    <div className={styles.timelineMarker}></div>

                    <div className={styles.timelineContent}>
                      <div className={styles.timelineMain}>
                        <div className={styles.timelineUser}>
                          <strong>{bid.user}</strong>
                          <span>{bid.time}</span>
                        </div>

                        <b>{bid.amount.toLocaleString("uk-UA")} ₴</b>
                      </div>

                      {index === 0 && (
                        <span className={styles.leadingBidBadge}>
                          Лідируюча ставка
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className={styles.contentCard}>
            <h2>Доставка та оплата</h2>
            <p>
              Після завершення аукціону переможець отримає підтвердження та
              подальші інструкції щодо оплати. Відправлення здійснюється після
              підтвердження платежу.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

export default AuctionDetailsPage;
