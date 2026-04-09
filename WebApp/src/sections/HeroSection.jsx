import { Link } from "react-router-dom";
import styles from "./HeroSection.module.css";
import { useParallax } from "../hooks/useParallax";

function HeroSection() {
  const slowOffset = useParallax(0.12);

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
            <Link to="/auction" className={styles.primaryButton}>
              Переглянути аукціони
            </Link>
            <Link to="/about" className={styles.secondaryButton}>
              Дізнатись більше
            </Link>
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

        <div className={`${styles.visual} fade-in-up`}>
          <div className={styles.visualCard}>
            <div className={styles.visualImage}>
              <img
                src="https://i.pinimg.com/736x/fc/c0/86/fcc086d622ffd9ede8c6e40a1dda0220.jpg"
                alt="Fashion preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;