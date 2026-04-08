import styles from "./PromoSection.module.css";
import { useReveal } from "../hooks/useReveal";

function PromoSection() {
  const { ref, isVisible } = useReveal();
  return (
    <section 
    ref={ref}
    className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.content}>
            <div className={styles.label}>Про платформу</div>
            <h2 className={styles.title}>Дізнайтесь більше про Liorael та принцип роботи платформи</h2>
            <p className={styles.text}>
              На окремій сторінці можна буде красиво розмістити інформацію про
              сайт, відповіді на часті питання, правила аукціонів та основні
              переваги користування платформою.
            </p>
          </div>

          <div className={styles.actions}>
            <button className={styles.button}>Перейти до сторінки “Про сайт”</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromoSection;