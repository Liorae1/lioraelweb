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
      setStatus("error");
      setMessage("Заповніть обидва поля пароля.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Паролі не збігаються.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("idle");
      setMessage("");

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
          <span className={styles.badge}>Reset Password</span>
          <h1 className={styles.title}>Створіть новий пароль</h1>
          <p className={styles.message}>
            Введіть новий пароль для акаунта. Після успішної зміни ми повернемо вас на сторінку входу.
          </p>

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
            </label>

            <label className={styles.field}>
              <span>Повторіть пароль</span>
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
            </label>

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
              {submitting ? "Оновлюємо..." : "Змінити пароль"}
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
