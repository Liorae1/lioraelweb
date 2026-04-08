import { useState } from "react";
import Header from "../components/Header";
import styles from "./AuthPage.module.css";

import { useNavigate } from "react-router-dom";
import { loginFakeUser } from "../utils/fakeAuth";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const navigate = useNavigate();

const handleLogin = (e) => {
  e.preventDefault();

  loginFakeUser({
    name: "Yuliia",
    username: "@yuliia",
    email: "yuliia@email.com",
    balance: 12450,
  });

  navigate("/profile");
};

const handleRegister = (e) => {
  e.preventDefault();

  loginFakeUser({
    name: "Yuliia",
    username: "@new_user",
    email: "newuser@email.com",
    balance: 8000,
  });

  navigate("/profile");
};

  const content = isLogin
    ? {
        badge: "Повернення до стилю",
        title: "З поверненням",
        text: "Увійдіть до свого акаунта, щоб переглядати преміальні лоти, зберігати обрані речі та брати участь в аукціонах.",
        formLabel: "Вхід до акаунта",
        formTitle: "Раді бачити вас знову",
        formSubtitle:
          "Увійдіть, щоб продовжити покупки та участь в аукціонах.",
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
            <div className={styles.switcherWrapper}>
              <p className={styles.switcherHint}>Оберіть режим</p>

              <div className={styles.modeSwitcher}>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`${styles.modeButton} ${
                    isLogin ? styles.modeButtonActive : ""
                  }`}
                  aria-label="Переключити на вхід"
                >
                  <span className={styles.modeIcon}>↪</span>
                  <span className={styles.modeText}>Вхід</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`${styles.modeButton} ${
                    !isLogin ? styles.modeButtonActive : ""
                  }`}
                  aria-label="Переключити на реєстрацію"
                >
                  <span className={styles.modeIcon}>✦</span>
                  <span className={styles.modeText}>Реєстрація</span>
                </button>
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
                <form className={styles.form}>
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
                    {content.buttonText}
                  </button>
                </form>

                <form className={styles.form}>
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
                    {content.buttonText}
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