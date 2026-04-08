import styles from "./ShowcaseSection.module.css";
import { useReveal } from "../hooks/useReveal";

function ShowcaseSection() {
  const { ref, isVisible } = useReveal();
  return (
    <section 
    ref={ref}
    className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
    >
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.label}>Luxury showcase</div>
          <h2 className={styles.title}>
            Рідкісні бренди, відбірні колекції та сучасний формат подачі
          </h2>
          <p className={styles.text}>
            Liorael створює не просто список товарів, а візуальний досвід, де
            кожна деталь підкреслює статус речі. Тут важливі атмосфера, естетика
            й зручність взаємодії.
          </p>

          <div className={styles.tags}>
            <span className={styles.tag}>Premium brands</span>
            <span className={styles.tag}>Curated lots</span>
            <span className={styles.tag}>Modern design</span>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.mainCard}>
            <div className={styles.mainCardInner}>
              <span className={styles.cardLabel}>Selected collection</span>
              <h3 className={styles.cardTitle}>Timeless silhouettes with modern luxury</h3>
            </div>
          </div>

          <div className={styles.smallCards}>
            <div className={styles.smallCard}>
              <span className={styles.smallCardTitle}>Лімітовані лоти</span>
              <span className={styles.smallCardText}>Унікальні речі з акцентом на статус</span>
            </div>

            <div className={styles.smallCard}>
              <span className={styles.smallCardTitle}>Актуальний стиль</span>
              <span className={styles.smallCardText}>Естетика premium UI для живої платформи</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShowcaseSection;