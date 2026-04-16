import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import styles from "./AuthPage.module.css";
import api from "../api/axios";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const email = e.target.loginEmail.value;
      const password = e.target.loginPassword.value;

      const res = await api.post("/api/Auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Ошибка входа");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const name = e.target.registerName.value;
      const email = e.target.registerEmail.value;
      const password = e.target.registerPassword.value;
      const repeatPassword = e.target.registerPasswordRepeat.value;

      if (password !== repeatPassword) {
        alert("Пароли не совпадают");
        return;
      }

      const res = await axios.post("/api/Auth/register", {
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Ошибка регистрации");
    }
  };

  const content = isLogin
    ? {
        badge: "Повернення до стилю",
        title: "З поверненням",
        text: "Увійдіть до свого акаунта, щоб переглядати преміальні лоти, зберігати обрані речі та брати участь в аукціонах.",
        formLabel: "Вхід до акаунта",
        formTitle: "Раді бачити вас знову",
        formSubtitle: "Увійдіть, щоб продовжити покупки та участь в аукціонах.",
        buttonText: "Увійти",
      }
    : {
        badge: "Новий рівень доступу",
        title: "Створіть акаунт",
        text: "Приєднуйтесь до простору брендового одягу, відкривайте ексклюзивні пропозиції та отримуйте доступ до приватних аукціонів.",
        formLabel: "Реєстрація",
        formTitle: "Створіть свій профіль",
        formSubtitle:
          "Заповніть дані та відкрийте для себе преміальний маркетплейс.",
        buttonText: "Зареєструватися",
      };

  return (
    <div className={styles.page}>
      <Header />

      <section className={styles.authSection}>
        <div className={styles.backgroundGlowOne}></div>
        <div className={styles.backgroundGlowTwo}></div>

        <div className={styles.authContainer}>
          <div
            className={`${styles.sidePanel} ${
              isLogin ? styles.loginMode : styles.registerMode
            }`}
          >
            <div className={styles.sideOverlay}></div>

            <div className={styles.sideContent}>
              <span className={styles.badge}>{content.badge}</span>

              <div className={styles.textWrapper}>
                <h1 className={styles.sideTitle}>{content.title}</h1>
                <p className={styles.sideText}>{content.text}</p>
              </div>

              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <p>Ексклюзивні позиції та нові колекції</p>
                </div>

                <div className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <p>Швидкий доступ до ставок та обраного</p>
                </div>

                <div className={styles.featureItem}>
                  <span className={styles.featureDot}></span>
                  <p>Преміальний простір для стильних покупок</p>
                </div>
              </div>
            </div>

            <div className={styles.floatingCircleOne}></div>
            <div className={styles.floatingCircleTwo}></div>
            <div className={styles.floatingCircleThree}></div>
          </div>

          <div className={styles.formPanel}>
            <div className={styles.accountSwitch}>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`${styles.segmentButton} ${
                    isLogin ? styles.segmentActive : ""
                  }`}
                >
                  Увійти
                </button>

                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`${styles.segmentButton} ${
                    !isLogin ? styles.segmentActive : ""
                  }`}
                >
                  Реєстрація
                </button>

                <div
                  className={styles.segmentSlider}
                  style={{
                    transform: isLogin ? "translateX(0%)" : "translateX(100%)",
                  }}
                />
              </div>
            </div>

            <div className={styles.formHeader}>
              <p className={styles.formLabel}>{content.formLabel}</p>
              <h2 className={styles.formTitle}>{content.formTitle}</h2>
              <p className={styles.formSubtitle}>{content.formSubtitle}</p>
            </div>

            <div className={styles.formViewport}>
              <div
                className={`${styles.formsTrack} ${
                  isLogin ? styles.showLogin : styles.showRegister
                }`}
              >
                <form className={styles.form} onSubmit={handleLogin}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="loginEmail">Електронна пошта</label>
                    <input
                      id="loginEmail"
                      type="email"
                      placeholder="Введіть вашу пошту"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="loginPassword">Пароль</label>
                    <input
                      id="loginPassword"
                      type="password"
                      placeholder="Введіть пароль"
                    />
                  </div>

                  <div className={styles.rowBetween}>
                    <label className={styles.checkbox}>
                      <input type="checkbox" />
                      <span>Запам’ятати мене</span>
                    </label>

                    <button type="button" className={styles.linkButton}>
                      Забули пароль?
                    </button>
                  </div>

                  <button type="submit" className={styles.submitButton}>
                    Увійти
                  </button>
                </form>

                <form className={styles.form} onSubmit={handleRegister}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="registerName">Ім’я</label>
                    <input
                      id="registerName"
                      type="text"
                      placeholder="Введіть ваше ім’я"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="registerEmail">Електронна пошта</label>
                    <input
                      id="registerEmail"
                      type="email"
                      placeholder="Введіть вашу пошту"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="registerPassword">Пароль</label>
                    <input
                      id="registerPassword"
                      type="password"
                      placeholder="Створіть пароль"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="registerPasswordRepeat">
                      Підтвердження пароля
                    </label>
                    <input
                      id="registerPasswordRepeat"
                      type="password"
                      placeholder="Повторіть пароль"
                    />
                  </div>

                  <label className={styles.checkbox}>
                    <input type="checkbox" />
                    <span>Я погоджуюсь з умовами користування</span>
                  </label>

                  <button type="submit" className={styles.submitButton}>
                    Зареєструватися
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
