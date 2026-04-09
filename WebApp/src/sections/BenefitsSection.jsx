import styles from "./BenefitsSection.module.css";
import { useReveal } from "../hooks/useReveal";

const benefits = [
  {
    id: 1,
    title: "Преміальний досвід",
    text: "Сучасний інтерфейс, м’які анімації та візуальна подача, що підкреслює luxury-настрій платформи.",
  },
  {
    id: 2,
    title: "Зручний формат аукціонів",
    text: "Користувач швидко знаходить потрібний лот, бачить актуальну ставку та час завершення без перевантаження.",
  },
  {
    id: 3,
    title: "Живий сучасний стиль",
    text: "Сайт виглядає не статично, а динамічно — за рахунок hover-ефектів, плавних переходів і візуального ритму.",
  },
];

function BenefitsSection() {
  const { ref, isVisible } = useReveal();

  return (
    <section
      ref={ref}
      className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
    >
      <div className={styles.container}>
        <div className={styles.label}>Переваги</div>
        <h2 className={styles.title}>Чому Liorael запам’ятовується з першого погляду</h2>
        <p className={styles.description}>
          Ми створюємо не просто платформу, а атмосферу, де кожний аукціон виглядає витонченою пропозицією і викликає бажання діяти.
        </p>

        <div className={styles.grid}>
          {benefits.map((item) => (
            <article
              key={item.id}
              className={styles.card}
              style={{ "--card-delay": `${item.id * 120}ms` }}
            >
              <div className={styles.cardBadge}>{`0${item.id}`}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;