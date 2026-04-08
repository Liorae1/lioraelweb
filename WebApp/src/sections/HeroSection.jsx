import styles from "./HeroSection.module.css";
import { useParallax } from "../hooks/useParallax";

function HeroSection() {
  const slowOffset = useParallax(0.12);
  const cardOffset = useParallax(0.08);

  return (
    <section className={styles.section}>
      <div
        className={`${styles.backgroundGlowOne} float-soft`}
        style={{ transform: `translateY(${slowOffset}px)` }}
      ></div>

      <div
        className={`${styles.backgroundGlowTwo} pulse-soft`}
        style={{ transform: `translateY(${-slowOffset * 0.6}px)` }}
      ></div>

      <div className={styles.container}>
        <div className={`${styles.content} fade-in-up`}>
          <div className={styles.badge}>Ексклюзивні лоти та преміальна естетика</div>

          <h1 className={styles.title}>
            Сучасна розкіш
            <span className={styles.gradientText}> для поціновувачів стилю</span>
          </h1>

          <p className={styles.description}>
            Liorael — це простір аукціонів брендового одягу, де поєднуються
            статус, елегантність і сучасний інтерфейс. Платформа створена для
            тих, хто цінує унікальні речі та преміальний досвід.
          </p>

          <div className={styles.actions}>
            <button className={styles.primaryButton}>Переглянути аукціони</button>
            <button className={styles.secondaryButton}>Дізнатись більше</button>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>120+</span>
              <span className={styles.statLabel}>Актуальних лотів</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>35</span>
              <span className={styles.statLabel}>Преміум брендів</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>24/7</span>
              <span className={styles.statLabel}>Оновлення аукціонів</span>
            </div>
          </div>
        </div>

        <div
          className={`${styles.visual} fade-in-up`}
          style={{ transform: `translateY(${cardOffset}px)` }}
        >
          <div className={styles.visualCard}>
            <div className={styles.visualTop}>
              <span className={styles.visualLabel}>Поточний аукціон</span>
              <h2 className={styles.visualTitle}>Prada Limited Edition Wool Coat</h2>
            </div>

            <div className={styles.visualBottom}>
              <div>
                <div className={styles.infoLabel}>Поточна ставка</div>
                <div className={styles.price}>€2,480</div>
              </div>

              <div className={styles.infoRow}>
                <div>
                  <div className={styles.infoLabel}>Завершиться через</div>
                  <div className={styles.time}>03г 14хв</div>
                </div>

                <button className={styles.viewButton}>Переглянути</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;