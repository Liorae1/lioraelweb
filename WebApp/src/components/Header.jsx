import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getCurrentUser, logoutFakeUser } from "../utils/fakeAuth";
import styles from "./Header.module.css";

function Header() {
  const [user, setUser] = useState(getCurrentUser());
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutFakeUser();
    setMenuOpen(false);
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logo}>Liorael</div>
          <div className={styles.subtitle}>Аукціони брендового одягу</div>
        </Link>

        <nav className={styles.nav}>
          <Link
            to="/"
            className={`${styles.link} ${isActive("/") ? styles.active : ""}`}
          >
            Головна
          </Link>

          <Link
            to="/auction"
            className={`${styles.link} ${isActive("/auction") ? styles.active : ""}`}
          >
            Аукціони
          </Link>

          <Link
            to="/about"
            className={`${styles.link} ${isActive("/about") ? styles.active : ""}`}
          >
            Про нас
          </Link>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />

          {user?.isAuth ? (
            <div className={styles.profileMenuWrapper} ref={menuRef}>
              <button
                type="button"
                className={styles.profileButton}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <div className={styles.avatar}>{firstLetter}</div>

                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{user.name}</span>
                  <span className={styles.profileBalance}>
                    {user.balance.toLocaleString("uk-UA")} ₴
                  </span>
                </div>

                <span
                  className={`${styles.arrow} ${
                    menuOpen ? styles.arrowOpen : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <Link
                    to="/profile"
                    className={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    Профіль
                  </Link>

                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    Баланс
                  </button>

                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    Вийти
                  </button>
                </div>
              )}
            </div>
          ) : (
            location.pathname !== "/auth" && (
              <Link to="/auth" className={styles.authButton}>
                Увійти / Зареєструватися
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;