import styles from "./Toast.module.css";

function Toast({ message, type = "success", onClose }) {
  return (
    <div className={`${styles.toast} ${type === "error" ? styles.error : styles.success}`} role="status" aria-live="polite">
      <span>{message}</span>
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
