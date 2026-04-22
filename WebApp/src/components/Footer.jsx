import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brandLink}>
            <div className={styles.logo}>Liorael</div>
          </Link>
          <p className={styles.description}>
            Платформа для аукціонів брендового одягу з рівнями доступу Member, Elite та Private, де поєднуються
            сучасна естетика, статус і зручний користувацький досвід.
          </p>
        </div>

        <div className={styles.linksBlock}>
          <div className={styles.column}>
            <h4 className={styles.title}>Навігація</h4>
            <Link to="/" className={styles.link}>Головна</Link>
            <Link to="/auction" className={styles.link}>Аукціони</Link>
            <Link to="/about" className={styles.link}>Про сайт</Link>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Інформація</h4>
            <Link to="/about#work" className={styles.link}>Як це працює</Link>
            <Link to="/about#faq" className={styles.link}>Часті запитання</Link>
            <Link to="/auth" className={styles.link}>Вхід та реєстрація</Link>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.title}>Соцмережі</h4>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Instagram</a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className={styles.link}>Telegram</a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Pinterest</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <span>© 2026 Liorael. Усі права захищені.</span>
          <span>Аукціони брендового одягу</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
