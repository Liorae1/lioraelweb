import { Link } from "react-router-dom";
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
              Дізнайтесь, як працює Liorael: правила участі в аукціонах, вигоди для
              продавців та покупців, відповіді на популярні питання та ключові
              переваги платформи.
            </p>
          </div>

          <div className={styles.actions}>
            <Link to="/about" className={styles.button}>
              Перейти до сторінки “Про нас”
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromoSection;