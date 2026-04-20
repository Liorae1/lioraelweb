import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./FloatingMenu.module.css";
import ThemeToggle from "./ThemeToggle";

function FloatingMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  
  const showMenu = !["/", "/about", "/profile", "/auth"].includes(
    location.pathname
  );

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const menuItems = [
    { label: "Головна", action: () => handleNavigate("/") },
    { label: "Про нас", action: () => handleNavigate("/about") },
    { label: "Профіль", action: () => handleNavigate("/profile") },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (!showMenu) return null;

  return (
    <div className={styles.floatingMenuContainer} ref={menuRef}>
      <button
        className={`${styles.menuButton} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Меню навигации"
        aria-expanded={isOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        className={`${styles.menuPanel} ${
          isOpen ? styles.open : styles.closed
        }`}
      >
        <div className={styles.menuContent}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={styles.menuItem}
              onClick={item.action}
            >
              {item.label}
            </button>
          ))}

          <div className={styles.themeToggleWrapper}>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </div>
  );
}

export default FloatingMenu;