import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandBlock}>
          <div className={styles.logo}>Liorael</div>
          <p className={styles.description}>
            Преміум-платформа для аукціонів брендового одягу, де поєднуються
            сучасна естетика, статус і зручний користувацький досвід.
          </p>
        </div>

        <div className={styles.linksBlock}>
          <div className={styles.column}>
            <h4 className={styles.title}>Навігація</h4>
            <Link to="/" className={styles.link}>Головна</Link>
            <Link to="#" className={styles.link}>Аукціони</Link>
            <Link to="/about" className={styles.link}>Про сайт</Link>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Інформація</h4>
            <a href="#" className={styles.link}>FAQ</a>
            <a href="#" className={styles.link}>Правила</a>
            <a href="#" className={styles.link}>Контакти</a>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Соцмережі</h4>
            <a href="#" className={styles.link}>Instagram</a>
            <a href="#" className={styles.link}>Telegram</a>
            <a href="#" className={styles.link}>Pinterest</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <span>© 2026 Liorael. Усі права захищені.</span>
          <span>Luxury Fashion Auctions</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;