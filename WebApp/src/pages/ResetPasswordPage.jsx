import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import api from "../api/axios";
import styles from "./ResetPasswordPage.module.css";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  const userId = useMemo(() => searchParams.get("userId") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    if (!userId || !token) {
      setStatus("error");
      setMessage("Посилання для скидання пароля некоректне або неповне.");
    }
  }, [token, userId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId || !token) {
      setStatus("error");
      setMessage("Посилання для скидання пароля некоректне.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setFieldError("Заповніть обидва поля пароля.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError("Паролі не збігаються. Перевірте введення ще раз.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("idle");
      setMessage("");
      setFieldError("");

      const response = await api.post("/api/Auth/reset-password", {
        userId,
        token,
        newPassword,
      });

      setStatus("success");
      setMessage(response?.data?.message || "Пароль успішно змінено.");

      window.setTimeout(() => {
        navigate("/auth");
      }, 1800);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        error?.response?.data?.message ||
          "Не вдалося змінити пароль. Можливо, посилання прострочене або недійсне."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.badge}>Відновлення доступу</span>
          <h1 className={styles.title}>Оновіть пароль до акаунта</h1>
          <p className={styles.message}>
            Створіть новий пароль для входу в Liorael. Після успішної зміни ви зможете одразу повернутися до сторінки авторизації.
          </p>

          <div className={styles.infoCard}>
            <strong>Що важливо</strong>
            <p>Використайте пароль, який легко запам'ятати вам і складно підібрати іншим.</p>
            <div className={styles.tipList}>
              <span>Мінімум 8 символів</span>
              <span>Бажано велика літера та цифра</span>
              <span>Не використовуйте старі прості комбінації</span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Новий пароль</span>
              <div className={styles.passwordField}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Введіть новий пароль"
                  autoComplete="new-password"
                  disabled={submitting || status === "success"}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={showNewPassword ? "Приховати пароль" : "Показати пароль"}
                >
                  {showNewPassword ? "🙈" : "👁"}
                </button>
              </div>
              <small className={styles.fieldHint}>Придумайте новий пароль для входу в акаунт.</small>
            </label>

            <label className={styles.field}>
              <span>Підтвердження пароля</span>
              <div className={styles.passwordField}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Повторіть новий пароль"
                  autoComplete="new-password"
                  disabled={submitting || status === "success"}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Приховати пароль" : "Показати пароль"}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
              <small className={styles.fieldHint}>Введіть той самий пароль ще раз для перевірки.</small>
            </label>

            {fieldError ? <div className={`${styles.notice} ${styles.noticeError}`}>{fieldError}</div> : null}

            {message ? (
              <div
                className={`${styles.notice} ${
                  status === "success" ? styles.noticeSuccess : styles.noticeError
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              className={styles.button}
              disabled={submitting || status === "success" || !userId || !token}
            >
              {submitting ? "Оновлюємо пароль..." : "Зберегти новий пароль"}
            </button>
          </form>

          <Link to="/auth" className={styles.secondaryButton}>
            Повернутися до входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
