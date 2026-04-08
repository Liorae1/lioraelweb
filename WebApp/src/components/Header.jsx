import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>Liorael</div>
          <div className={styles.subtitle}>Аукціони брендового одягу</div>
        </div>

        <nav className={styles.nav}>
          <Link to="/" className={styles.link}>
            Головна
          </Link>
          <Link to="#" className={styles.link}>
            Аукціони
          </Link>
          <Link to="/about" className={styles.link}>
            Про нас
          </Link>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <button className={styles.authButton}>Увійти / Зареєструватися</button>
        </div>
      </div>
    </header>
  );
}

export default Header;