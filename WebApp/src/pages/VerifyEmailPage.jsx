import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import api from "../api/axios";
import styles from "./VerifyEmailPage.module.css";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Підтверджуємо вашу пошту...");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      setStatus("error");
      setMessage("Некоректне посилання для підтвердження.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post("/api/Auth/verify-email", {
          userId,
          token,
        });

        setStatus("success");
        setMessage(res?.data?.message || "Email успішно підтверджено.");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage(
          err?.response?.data?.message ||
            "Не вдалося підтвердити email. Можливо, посилання прострочене або недійсне."
        );
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Підтвердження пошти</h1>
          <p className={styles.message}>{message}</p>

          {status === "loading" && <div className={styles.loader}>Зачекайте...</div>}

          {status === "success" && (
            <Link to="/auth" className={styles.button}>
              Перейти до входу
            </Link>
          )}

          {status === "error" && (
            <Link to="/auth" className={styles.button}>
              Повернутися
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;