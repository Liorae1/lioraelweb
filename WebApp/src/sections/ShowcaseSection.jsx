import styles from "./ShowcaseSection.module.css";
import { useReveal } from "../hooks/useReveal";

function ShowcaseSection() {
  const { ref, isVisible } = useReveal();
  const imageSrc = "https://i.pinimg.com/1200x/2a/4e/c7/2a4ec7527fe2276166208c997a2d6f1f.jpg";

  return (
    <section
      ref={ref}
      className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>Реальна картка лота</span>
          <h2 className={styles.title}>Уся важлива інформація перед ставкою</h2>
          <p className={styles.description}>
            Користувач одразу бачить фото, стан речі, ціну, розмір, дедлайн і
            динаміку торгів. Без зайвих декоративних блоків і без пошуку ключових деталей.
          </p>

          <ul className={styles.benefits}>
            <li>Поточна ставка, крок і кількість ставок в одному екрані</li>
            <li>Прозорі характеристики лота: стан, розмір, матеріали</li>
            <li>Швидкий перехід до торгів і перегляду історії ставок</li>
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.imageFrame}>
            <img
              src={imageSrc}
              alt="Лот брендового одягу"
              className={styles.image}
            />
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>12</span>
              <span className={styles.statLabel}>хвилин між ставками</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>3</span>
              <span className={styles.statLabel}>ключові дії до участі</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShowcaseSection;
