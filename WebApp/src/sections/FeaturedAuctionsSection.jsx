import { Link } from "react-router-dom";
import styles from "./FeaturedAuctionsSection.module.css";
import { useReveal } from "../hooks/useReveal";
import { mockLots } from "../data/mockLots";

function formatTimeLeft(timeLeft) {
  return timeLeft.replace(/\b0+(\d+)г/, "$1г").replace(/\b0+(\d+)хв/, "$1хв");
}

function FeaturedAuctionsSection() {
  const { ref, isVisible } = useReveal();
  const featuredLots = mockLots.slice(0, 3);
  
  return (
    <section 
      ref={ref}
      className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
      >
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <div className={styles.label}>Актуальні лоти</div>
            <h2 className={styles.title}>Популярні аукціони</h2>
          </div>

          <Link to="/auction" className={styles.allButton}>
            Усі аукціони
          </Link>
        </div>

        <div className={styles.grid}>
          {featuredLots.map((item) => (
            <article key={item.id} className={styles.card}>
              <div
                className={styles.image}
                style={{ backgroundImage: `url(${item.image})` }}
              ></div>

              <div className={styles.content}>
                <div className={styles.brand}>{item.brand}</div>
                <h3 className={styles.cardTitle}>{item.title}</h3>

                <div className={styles.infoRow}>
                  <div>
                    <div className={styles.infoLabel}>Поточна ставка</div>
                    <div className={styles.price}>{item.currentBid.toLocaleString("uk-UA")} ₴</div>
                  </div>

                  <div>
                    <div className={styles.infoLabel}>Завершиться через</div>
                    <div className={styles.time}>{formatTimeLeft(item.timeLeft)}</div>
                  </div>
                </div>

                <Link to={`/auction/${item.id}`} className={styles.bidButton}>
                  Переглянути лот
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedAuctionsSection;