import { Link } from "react-router-dom";
import styles from "./HeroSection.module.css";
import { useParallax } from "../hooks/useParallax";
import brandImage from "../app/images/heroImg.jpg";

function HeroSection({ auction, stats, loading, error }) {
  const slowOffset = useParallax(0.12);
  const totalLots = stats?.totalLots ?? 0;
  const totalBids = stats?.totalBids ?? 0;
  const activeAuctions = stats?.activeAuctions ?? 0;
  const plannedTitle = auction?.title?.trim();
  const plannedBrand = auction?.brand?.trim();
  const plannedInfo = [plannedBrand, plannedTitle].filter(Boolean).join(" • ");

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
          <div className={styles.badge}>Живі аукціони брендового одягу</div>

          <h1 className={styles.title}>
            Брендові аукціони
            <span className={styles.gradientText}> у впізнаваному стилі</span>
          </h1>

          <p className={styles.description}>
            Liorael об'єднує заплановані та активні аукціони брендового одягу в
            одному каталозі, щоб покупець одразу бачив важливе і міг спокійно
            підготуватися до торгів.
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
              <span className={`${styles.statValue} ${loading ? styles.statValueLoading : ""}`}>
                {loading ? <span className={styles.skeletonLine}></span> : totalLots}
              </span>
              <span className={styles.statLabel}>Лотів уже в каталозі</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statValue} ${loading ? styles.statValueLoading : ""}`}>
                {loading ? <span className={styles.skeletonLine}></span> : totalBids}
              </span>
              <span className={styles.statLabel}>Ставок у всіх лотах</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statValue} ${loading ? styles.statValueLoading : ""}`}>
                {loading ? <span className={styles.skeletonLine}></span> : activeAuctions}
              </span>
              <span className={styles.statLabel}>Активних або запланованих торгів</span>
            </div>
          </div>
        </div>

        <div className={`${styles.visual} fade-in-up`}>
          <div className={styles.visualImageWrap}>
            <img src={brandImage} alt="Liorael" className={styles.visualImage} />
            {loading && (
              <div className={styles.visualLoadingGlass} aria-hidden="true">
                <span className={styles.visualLoadingBadge}>Оновлюємо каталог</span>
              </div>
            )}
          </div>
          {!loading && !error && plannedInfo && <p className={styles.visualNote}>Найближчий акцент: {plannedInfo}</p>}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
