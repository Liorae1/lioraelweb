import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

function Toast({ message, type = "success", onClose }) {
  const isError = type === "error";
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const viewportHeight = window.innerHeight || 0;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const bottomOffset = window.innerWidth <= 640 ? 88 : 104;

      setOffsetTop(Math.max(16, scrollTop + viewportHeight - bottomOffset));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  return (
    <div
      className={`${styles.toast} ${isError ? styles.error : styles.success}`}
      role="status"
      aria-live="polite"
      style={{ top: `${offsetTop}px` }}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        {isError ? "!" : "✓"}
      </div>
      <div className={styles.content}>
        <span className={styles.label}>
          {isError ? "Помилка" : "Успішно"}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрити повідомлення"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Toast;
