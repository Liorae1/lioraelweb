import styles from "./BenefitsSection.module.css";
import { useReveal } from "../hooks/useReveal";

const benefits = [
  {
    id: 1,
    title: "Прозора участь",
    text: "Користувач бачить актуальну ставку, час завершення та активність торгів без прихованих деталей і перевантаження.",
  },
  {
    id: 2,
    title: "Реальні картки лотів",
    text: "Кожен аукціон подано як робочий інструмент для рішення: стан, розмір, продавець, крок ставки та дедлайн поруч.",
  },
  {
    id: 3,
    title: "Цілісний кабінет",
    text: "Улюблені лоти, виграші, налаштування та гаманець відчуваються частинами одного продукту, а не набором розрізнених сторінок.",
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
        <h2 className={styles.title}>Що робить платформу зручною в реальному використанні</h2>
        <p className={styles.description}>
          Фокус зміщено з декоративної подачі на живу взаємодію з аукціонами, де кожен блок допомагає швидше прийняти рішення.
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
