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
          <span className={styles.badge}>Нова добірка</span>
          <h2 className={styles.title}>Fashion-лот із відтінком аукціонної розкоші</h2>
          <p className={styles.description}>
            Обирайте ексклюзивні речі, які створюють атмосферу колекційної моди.
            Кожен лот оцінений за стилем, якістю та статусом бренду.
          </p>

          <ul className={styles.benefits}>
            <li>Найактуальніші лоти від fashion-брендів</li>
            <li>Повна інформація про стан, розмір та терміни</li>
            <li>Швидкий доступ до найцінніших пропозицій</li>
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.imageFrame}>
            <img
              src={imageSrc}
              alt="Luxury fashion auction item"
              className={styles.image}
            />
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>24</span>
              <span className={styles.statLabel}>години до старту</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>120+</span>
              <span className={styles.statLabel}>нових лотів щотижня</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShowcaseSection;
