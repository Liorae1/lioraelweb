import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./AboutPage.module.css";

function AboutPage() {
  return (
    <>
      <Header />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={`${styles.content} fade-in-up`}>
              <div className={styles.label}>Про платформу</div>
              <h1 className={styles.title}>Liorael — простір сучасних luxury-аукціонів</h1>
              <p className={styles.text}>
                Ми створюємо платформу, де брендований одяг подається не просто
                як товар, а як частина стилю, статусу та естетики. Liorael
                поєднує в собі сучасний дизайн, зручну взаємодію та атмосферу
                преміального цифрового простору.
              </p>
            </div>

            <div className={`${styles.imageBlock} fade-in`}>
              {/* <img src={aboutImage} alt="Liorael" className={styles.image} /> */}
            </div>
          </div>
        </section>

        <section className={styles.infoSection}>
          <div className={styles.infoContainer}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Що таке Liorael?</h2>
              <p className={styles.cardText}>
                Це платформа аукціонів брендового одягу, створена для
                користувачів, які цінують унікальні речі, premium-подачу та
                сучасний інтерфейс.
              </p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Як це працює?</h2>
              <p className={styles.cardText}>
                Користувач переглядає доступні лоти, стежить за поточними
                ставками, часом завершення та взаємодіє з платформою у зручному
                і візуально приємному форматі.
              </p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Чому це зручно?</h2>
              <p className={styles.cardText}>
                Інтерфейс побудований так, щоб користувач не губився серед
                елементів, а швидко знаходив потрібну інформацію і при цьому
                відчував атмосферу luxury.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqContainer}>
            <div className={styles.label}>FAQ</div>
            <h2 className={styles.faqTitle}>Часті запитання</h2>

            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Чи всі речі перевіряються?</h3>
                <p className={styles.faqAnswer}>
                  У майбутньому платформа може підтримувати механізми перевірки
                  автентичності та прозорого опису лотів.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Чи можна відстежувати аукціони?</h3>
                <p className={styles.faqAnswer}>
                  Так, логіка платформи передбачає зручний перегляд активних
                  лотів, ставок та часу завершення.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Для кого створений Liorael?</h3>
                <p className={styles.faqAnswer}>
                  Для людей, які хочуть бачити не просто каталог речей, а
                  сучасний luxury-сервіс із виразною візуальною подачею.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutPage;