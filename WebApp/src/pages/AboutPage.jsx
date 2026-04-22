import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./AboutPage.module.css";
import img from "../app/images/lioraelaboutimg.png";

const faqItems = [
  {
    question: "Чи всі речі перевіряються?",
    answer:
      "Ми ретельно обираємо продавців і працюємо над прозорістю опису лотів, щоб кожен покупець отримав впевненість у своїй покупці.",
  },
  {
    question: "Чи можна відстежувати аукціони?",
    answer:
      "Так, на платформі доступний зручний перегляд активних лотів, ставка та таймер завершення кожного аукціону.",
  },
  {
    question: "Як почати робити ставку?",
    answer:
      "Реєструйтесь, вибирайте лот, робіть ставку і слідкуйте за оновленнями. Ми створили платформу, щоб цей процес був швидким і зрозумілим для новачків.",
  },
  {
    question: "Як зв’язатися з підтримкою?",
    answer:
      "Пишіть на адресу support@liorael.ua — наша команда відповідає швидко і готова допомогти з будь-яким питанням.",
  },
];

const stepItems = [
  {
    label: "Огляд лотів",
    description:
      "Переглядайте підбірку брендового одягу, фільтруйте за стилем, розміром та статусом лоту.",
  },
  {
    label: "Вивчення деталей",
    description:
      "Кожен лот містить опис, розміри, стан та деталі про бренд, щоб вам було легко прийняти рішення.",
  },
  {
    label: "Зробити ставку",
    description:
      "Вкажіть бажану суму, підтвердіть дію і будьте готові до наступної ставки конкурента.",
  },
  {
    label: "Стежити за завершенням",
    description:
      "Слідкуйте за таймером, сповіщеннями та статусом свого лоту в особистому кабінеті.",
  },
];

function AboutPage() {
  const location = useLocation();
  const [activeFaq, setActiveFaq] = useState(0);

  useEffect(() => {
    // Обробляє якірні посилання (#work, #faq, #about)
    if (location.hash) {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 0);
      }
    }
  }, [location.hash]);

  const toggleFaq = (index) => {
    setActiveFaq((current) => (current === index ? -1 : index));
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <div className={`${styles.content} fade-in-up`}>
              <div className={styles.label}>Про платформу</div>
              <h1 className={styles.title}>Liorael — простір сучасних люксових аукціонів</h1>
              <p className={styles.text}>
                Ми будуємо платформу для тих, хто цінує стиль, ексклюзивність і
                якісну подачу. Liorael робить покупку брендового одягу простішою,
                прозорою та приємною.
              </p>
              <div className={styles.heroStats}>
                <div className={`${styles.statItem} fade-in-up`} style={{ animationDelay: '0.4s' }}>
                  <span>250+</span>
                  <p>уникальних лотів</p>
                </div>
                <div className={`${styles.statItem} fade-in-up`} style={{ animationDelay: '0.5s' }}>
                  <span>24/7</span>
                  <p>підтримка</p>
                </div>
                <div className={`${styles.statItem} fade-in-up`} style={{ animationDelay: '0.6s' }}>
                  <span>4,9</span>
                  <p>зірки від клієнтів</p>
                </div>
              </div>
            </div>

            <div className={`${styles.imageBlock} fade-in`}>
              <img 
                src={img} 
                alt="Преміальний одяг Liorael" 
                className={styles.heroImage}
              />
            </div>
          </div>
        </section>

        <section id="about" className={styles.aboutSection}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.label} fade-in-up`}>Хто ми</div>
            <h2 className={`${styles.sectionTitle} fade-in-up`}>Liorael — більше ніж маркетплейс</h2>
          </div>

          <div className={styles.aboutGrid}>
            <article className={`${styles.aboutCard} fade-in-up`} style={{ animationDelay: '0.1s' }}>
              <h3>Наша місія</h3>
              <p>
                Ми створюємо екосистему, де кожен лот виглядає як витвір мистецтва,
                а сам процес торгівлі приносить задоволення та відчуття преміальності.
              </p>
            </article>
            <article className={`${styles.aboutCard} fade-in-up`} style={{ animationDelay: '0.2s' }}>
              <h3>Історія</h3>
              <p>
                Liorael стартувала з ідеї зробити люксові аукціони доступними для
                українського ринку. Ми поєднали класичну аукціонну драму з
                сучасним інтерфейсом.
              </p>
            </article>
            <article className={`${styles.aboutCard} fade-in-up`} style={{ animationDelay: '0.3s' }}>
              <h3>Наш підхід</h3>
              <p>
                Ми працюємо з авторитетними продавцями, відбираємо лоти вручну і
                розповідаємо про них чесно — щоб ви купували з упевненістю.
              </p>
            </article>
          </div>
        </section>

        <section id="work" className={styles.stepsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.label}>Як це працює</div>
            <h2 className={styles.sectionTitle}>Покроковий шлях для новачків</h2>
            <p className={styles.sectionIntro}>
              Простий і зрозумілий формат допомагає швидко орієнтуватися на
              платформі та робити ставки без зайвого стресу.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {stepItems.map((step, index) => (
              <div key={step.label} className={`${styles.stepCard} fade-in-up`}>
                <div className={styles.stepIndex}>{index + 1}</div>
                <h3>{step.label}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className={styles.faqSection}>
          <div className={styles.faqContainer}>
            <div className={styles.label}>Часті запитання</div>
            <h2 className={styles.faqTitle}>Часті запитання</h2>
            <p className={styles.faqIntro}>
              Якщо не знайшли потрібну відповідь, ви завжди можете написати нам
              на <a href="mailto:support@liorael.ua">support@liorael.ua</a>.
            </p>

            <div className={styles.faqList}>
              {faqItems.map((item, index) => (
                <div
                  key={item.question}
                  className={`${styles.faqItem} ${activeFaq === index ? styles.active : ""}`}
                >
                  <button
                    type="button"
                    className={styles.faqButton}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={activeFaq === index}
                  >
                    <span>{item.question}</span>
                    <span className={styles.arrow}>{activeFaq === index ? "−" : "+"}</span>
                  </button>
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutPage;
