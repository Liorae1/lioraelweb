import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Toast from "../components/Toast";
import styles from "./AuthPage.module.css";
import api from "../api/axios";
import {
  getAuthToken,
  getRememberMePreference,
  setAuthToken,
} from "../utils/authStorage";

function extractServerMessage(error) {
  const payload = error?.response?.data;

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload?.message === "string") {
    return payload.message;
  }

  if (typeof payload?.title === "string") {
    return payload.title;
  }

  if (Array.isArray(payload?.errors)) {
    return payload.errors[0];
  }

  if (payload?.errors && typeof payload.errors === "object") {
    const firstGroup = Object.values(payload.errors).find((value) => Array.isArray(value) && value.length);
    if (firstGroup) {
      return firstGroup[0];
    }
  }

  return "";
}

function translateAuthError(error, fallbackMessage) {
  const status = error?.response?.status;
  const rawMessage = String(extractServerMessage(error) || error?.message || "").trim();
  const normalized = rawMessage.toLowerCase();

  if (!navigator.onLine) {
    return "Немає з'єднання з інтернетом. Перевірте мережу та спробуйте ще раз.";
  }

  if (status === 429 || normalized.includes("too many")) {
    return "Забагато спроб. Зачекайте трохи й спробуйте ще раз.";
  }

  if (status >= 500 || normalized.includes("server error")) {
    return "На сервері сталася помилка. Спробуйте ще раз трохи пізніше.";
  }

  if (
    normalized.includes("confirm your email") ||
    normalized.includes("email not confirmed") ||
    normalized.includes("verify your email")
  ) {
    return "Підтвердіть електронну пошту, щоб увійти в акаунт.";
  }

  if (
    status === 401 ||
    normalized.includes("invalid credentials") ||
    normalized.includes("invalid login") ||
    normalized.includes("wrong password") ||
    normalized.includes("invalid password") ||
    normalized.includes("incorrect password") ||
    normalized.includes("invalid email or password")
  ) {
    return "Неправильний email або пароль. Перевірте дані й спробуйте ще раз.";
  }

  if (
    status === 409 ||
    normalized.includes("email already exists") ||
    normalized.includes("email is already taken") ||
    normalized.includes("user with this email") ||
    normalized.includes("duplicate email")
  ) {
    return "Цей email уже використовується.";
  }

  if (
    normalized.includes("username already exists") ||
    normalized.includes("username is already taken") ||
    normalized.includes("duplicate user") ||
    normalized.includes("user name") && normalized.includes("taken")
  ) {
    return "Це ім'я користувача вже зайняте.";
  }

  if (
    normalized.includes("password requires") ||
    normalized.includes("password must") ||
    normalized.includes("weak password")
  ) {
    return "Пароль не відповідає вимогам безпеки. Використайте щонайменше 8 символів, велику літеру та цифру.";
  }

  if (
    status === 404 ||
    normalized.includes("user not found") ||
    normalized.includes("email not found")
  ) {
    return "Користувача з таким email не знайдено.";
  }

  if (
    normalized.includes("invalid token") ||
    normalized.includes("token expired") ||
    normalized.includes("expired token")
  ) {
    return "Посилання або код більше не дійсні. Запросіть новий лист.";
  }

  return fallbackMessage;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "", rememberMe: false });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
    agreeTerms: false,
  });

  const [verificationNotice, setVerificationNotice] = useState({
  open: false,
  email: "",
  message: "",
});
const [resendLoading, setResendLoading] = useState(false);
const [resendMessage, setResendMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordRepeat, setShowRegisterPasswordRepeat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const rememberMe = getRememberMePreference();

    if (savedEmail) {
      setLoginData((prev) => ({ ...prev, email: savedEmail, rememberMe }));
    }

    if (!savedEmail && rememberMe) {
      setLoginData((prev) => ({ ...prev, rememberMe: true }));
    }
  }, []);

  useEffect(() => {
    if (getAuthToken()) {
      navigate("/profile");
    }
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[^\s]{3,}$/;
  const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const getFieldKey = (section, field) => `${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  const shouldShowError = (section, field) => (touched[getFieldKey(section, field)] || isSubmitting) && !!errors[getFieldKey(section, field)];
  const getFieldError = (section, field) => errors[getFieldKey(section, field)];
  const getFieldHint = (section, field) => {
    if (section !== "register") return "";

    const hints = {
      username: "Мінімум 3 символи, без пробілів.",
      email: "Дійсний email, який ще не використовувався.",
      password: "8+ символів, одна велика літера та цифра.",
      passwordRepeat: "Повторіть пароль точно так само.",
    };

    return hints[field] || "";
  };

  const handleFieldChange = (section, field, value) => {
    if (section === "login") {
      setLoginData((prev) => ({ ...prev, [field]: value }));
    } else {
      setRegisterData((prev) => ({ ...prev, [field]: value }));
    }

    setErrors((prev) => ({ ...prev, [getFieldKey(section, field)]: undefined }));
    if (toast) setToast(null);
  };

  const handleFieldBlur = (section, field) => {
    setTouched((prev) => ({ ...prev, [getFieldKey(section, field)]: true }));
  };

  const validateLogin = () => {
    const nextErrors = {};
    if (!loginData.email.trim()) {
      nextErrors.loginEmail = "Введіть email";
    } else if (!emailPattern.test(loginData.email.trim())) {
      nextErrors.loginEmail = "Введіть коректний email";
    }

    if (!loginData.password) {
      nextErrors.loginPassword = "Введіть пароль";
    }

    return nextErrors;
  };

  const validateRegister = () => {
    const nextErrors = {};
    if (!registerData.username.trim()) {
      nextErrors.registerUsername = "Введіть ім'я користувача";
    } else if (!usernamePattern.test(registerData.username.trim())) {
      nextErrors.registerUsername = "Ім'я користувача має містити щонайменше 3 символи й не містити пробілів";
    }

    if (!registerData.email.trim()) {
      nextErrors.registerEmail = "Введіть email";
    } else if (!emailPattern.test(registerData.email.trim())) {
      nextErrors.registerEmail = "Введіть коректний email";
    }

    if (!registerData.password) {
      nextErrors.registerPassword = "Введіть пароль";
    } else if (!passwordPattern.test(registerData.password)) {
      nextErrors.registerPassword = "Пароль має містити 8+ символів, велику літеру та цифру";
    }

    if (!registerData.passwordRepeat) {
      nextErrors.registerPasswordRepeat = "Повторіть пароль";
    } else if (registerData.passwordRepeat !== registerData.password) {
      nextErrors.registerPasswordRepeat = "Паролі не збігаються";
    }

    if (!registerData.agreeTerms) {
      nextErrors.registerAgreeTerms = "Потрібна згода з умовами";
    }

    return nextErrors;
  };

 const handleLogin = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setToast(null);

  const validation = validateLogin();
  setErrors(validation);
  setTouched((prev) => ({
    ...prev,
    loginEmail: true,
    loginPassword: true,
  }));

  if (Object.keys(validation).length) {
    setIsSubmitting(false);
    return;
  }

  try {
    const res = await api.post("/api/Auth/login", {
      Email: loginData.email.trim(),
      Password: loginData.password,
    });

    const authToken = res?.data?.token || res?.data?.accessToken || res?.data?.jwt;

    if (!authToken) {
      throw new Error("Сервер не повернув токен авторизації.");
    }

    setAuthToken(authToken, loginData.rememberMe);
    window.dispatchEvent(new Event("authChanged"));
    
    // Handle "Remember Me"
    if (loginData.rememberMe) {
      localStorage.setItem("rememberedEmail", loginData.email.trim());
    } else {
      localStorage.removeItem("rememberedEmail");
    }
    
    navigate("/profile");
  } catch (err) {
    console.error(err);

    const serverMessage = translateAuthError(
      err,
      "Не вдалося увійти. Перевірте дані та спробуйте ще раз."
    );

    const rawServerMessage = String(extractServerMessage(err) || "").toLowerCase();

    if (
      rawServerMessage.includes("confirm your email") ||
      rawServerMessage.includes("email not confirmed") ||
      rawServerMessage.includes("verify your email")
    ) {
      setVerificationNotice({
        open: true,
        email: loginData.email.trim(),
        message: "Спочатку підтвердіть email. Ми вже надіслали або можемо надіслати лист повторно.",
      });
    }

    setToast({ message: serverMessage, type: "error" });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleRegister = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setToast(null);
  setResendMessage("");

  const validation = validateRegister();
  setErrors(validation);
  setTouched((prev) => ({
    ...prev,
    registerUsername: true,
    registerEmail: true,
    registerPassword: true,
    registerPasswordRepeat: true,
    registerAgreeTerms: true,
  }));

  if (Object.keys(validation).length) {
    setIsSubmitting(false);
    return;
  }

  try {
    const res = await api.post("/api/Auth/register", {
      UserName: registerData.username.trim(),
      Email: registerData.email.trim(),
      Password: registerData.password,
    });

    setVerificationNotice({
      open: true,
      email: registerData.email.trim(),
      message: res?.data?.message || "Ми надіслали лист для підтвердження пошти.",
    });

    setRegisterData({
      username: "",
      email: "",
      password: "",
      passwordRepeat: "",
      agreeTerms: false,
    });

    setIsLogin(true);
  } catch (err) {
    console.error(err);

    const serverMessage = translateAuthError(
      err,
      "Не вдалося завершити реєстрацію. Перевірте дані та спробуйте ще раз."
    );
    const rawServerMessage = String(extractServerMessage(err) || "").toLowerCase();

    const conflictEmail =
      err?.response?.status === 409 ||
      rawServerMessage.includes("email already exists") ||
      rawServerMessage.includes("email is already taken") ||
      rawServerMessage.includes("user with this email");

    const conflictUsername =
      rawServerMessage.includes("username already exists") ||
      rawServerMessage.includes("username is already taken") ||
      rawServerMessage.includes("duplicate user");

    if (conflictEmail) {
      setErrors((prev) => ({
        ...prev,
        registerEmail: "Цей email уже використовується",
      }));
      setTouched((prev) => ({ ...prev, registerEmail: true }));
    }

    if (conflictUsername) {
      setErrors((prev) => ({
        ...prev,
        registerUsername: "Це ім'я користувача вже зайняте",
      }));
      setTouched((prev) => ({ ...prev, registerUsername: true }));
    }

    setToast({ message: serverMessage, type: "error" });
  } finally {
    setIsSubmitting(false);
  }
};

const handleResendVerification = async () => {
  if (!verificationNotice.email) return;

  try {
    setResendLoading(true);
    setResendMessage("");

    const res = await api.post("/api/Auth/resend-verification", {
      email: verificationNotice.email,
    });

    setResendMessage(
      res?.data?.message || "Лист для підтвердження відправлено повторно."
    );
  } catch (err) {
    console.error(err);
    setResendMessage(
      translateAuthError(
        err,
        "Не вдалося повторно надіслати лист. Спробуйте ще раз трохи пізніше."
      )
    );
  } finally {
    setResendLoading(false);
  }
};

const handleForgotPassword = async (e) => {
  e.preventDefault();
  
  if (!forgotPasswordEmail.trim()) {
    setForgotPasswordMessage("Введіть email");
    return;
  }

  if (!emailPattern.test(forgotPasswordEmail.trim())) {
    setForgotPasswordMessage("Введіть коректний email");
    return;
  }

  try {
    setForgotPasswordLoading(true);
    setForgotPasswordMessage("");

    const res = await api.post("/api/Auth/forgot-password", {
      email: forgotPasswordEmail.trim(),
    });

    setForgotPasswordMessage(
      res?.data?.message || "Лист для скидання пароля відправлено на вашу пошту."
    );
    setToast({
      message: res?.data?.message || "Лист для скидання пароля відправлено на вашу пошту.",
      type: "success",
    });
    setForgotPasswordEmail("");
    
    setTimeout(() => {
      setForgotPasswordOpen(false);
      setForgotPasswordMessage("");
    }, 2500);
  } catch (err) {
    console.error(err);
    const translatedMessage = translateAuthError(
      err,
      "Не вдалося надіслати лист для відновлення пароля. Перевірте email і спробуйте знову."
    );
    setForgotPasswordMessage(translatedMessage);
    setToast({
      message: translatedMessage,
      type: "error",
    });
  } finally {
    setForgotPasswordLoading(false);
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
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

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
                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("login", "email") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="loginEmail">Електронна пошта</label>
                    <input
                      id="loginEmail"
                      type="email"
                      placeholder="Введіть вашу пошту"
                      value={loginData.email}
                      onChange={(e) => handleFieldChange("login", "email", e.target.value)}
                      onBlur={() => handleFieldBlur("login", "email")}
                      aria-invalid={!!getFieldError("login", "email")}
                      aria-describedby="loginEmailError"
                    />
                    {shouldShowError("login", "email") && (
                      <p id="loginEmailError" className={styles.errorMessage}>
                        {getFieldError("login", "email")}
                      </p>
                    )}
                  </div>

                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("login", "password") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="loginPassword">Пароль</label>
                    <div className={styles.passwordField}>
                      <input
                        id="loginPassword"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Введіть пароль"
                        value={loginData.password}
                        onChange={(e) => handleFieldChange("login", "password", e.target.value)}
                        onBlur={() => handleFieldBlur("login", "password")}
                        aria-invalid={!!getFieldError("login", "password")}
                        aria-describedby="loginPasswordError"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowLoginPassword((current) => !current)}
                        aria-label={showLoginPassword ? "Приховати пароль" : "Показати пароль"}
                        aria-pressed={showLoginPassword}
                      >
                        {showLoginPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                    {shouldShowError("login", "password") && (
                      <p id="loginPasswordError" className={styles.errorMessage}>
                        {getFieldError("login", "password")}
                      </p>
                    )}
                  </div>

                  <div className={styles.rowBetween}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={loginData.rememberMe}
                        onChange={(e) => handleFieldChange("login", "rememberMe", e.target.checked)}
                      />
                      <span>Запам’ятати мене</span>
                    </label>

                    <button type="button" className={styles.linkButton} onClick={() => setForgotPasswordOpen(true)}>
                      Забули пароль?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className={styles.loader}>
                        <div className={styles.progress}>
                          <div className={styles.bar}></div>
                        </div>
                      </div>
                    ) : (
                      content.buttonText
                    )}
                  </button>
                </form>

                <form className={styles.form} onSubmit={handleRegister}>
                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("register", "username") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="registerUsername">Ім'я користувача</label>
                    <input
                      id="registerUsername"
                      type="text"
                      placeholder="Введіть ім'я користувача"
                      value={registerData.username}
                      onChange={(e) => handleFieldChange("register", "username", e.target.value)}
                      onBlur={() => handleFieldBlur("register", "username")}
                      aria-invalid={!!getFieldError("register", "username")}
                      aria-describedby="registerUsernameError"
                    />
                    {shouldShowError("register", "username") ? (
                      <p id="registerUsernameError" className={styles.errorMessage}>
                        {getFieldError("register", "username")}
                      </p>
                    ) : (
                      <p className={styles.hintText}>{getFieldHint("register", "username")}</p>
                    )}
                  </div>

                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("register", "email") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="registerEmail">Електронна пошта</label>
                    <input
                      id="registerEmail"
                      type="email"
                      placeholder="Введіть вашу пошту"
                      value={registerData.email}
                      onChange={(e) => handleFieldChange("register", "email", e.target.value)}
                      onBlur={() => handleFieldBlur("register", "email")}
                      aria-invalid={!!getFieldError("register", "email")}
                      aria-describedby="registerEmailError"
                    />
                    {shouldShowError("register", "email") ? (
                      <p id="registerEmailError" className={styles.errorMessage}>
                        {getFieldError("register", "email")}
                      </p>
                    ) : (
                      <p className={styles.hintText}>{getFieldHint("register", "email")}</p>
                    )}
                  </div>

                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("register", "password") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="registerPassword">Пароль</label>
                    <div className={styles.passwordField}>
                      <input
                        id="registerPassword"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Створіть пароль"
                        value={registerData.password}
                        onChange={(e) => handleFieldChange("register", "password", e.target.value)}
                        onBlur={() => handleFieldBlur("register", "password")}
                        aria-invalid={!!getFieldError("register", "password")}
                        aria-describedby="registerPasswordError"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowRegisterPassword((current) => !current)}
                        aria-label={showRegisterPassword ? "Приховати пароль" : "Показати пароль"}
                        aria-pressed={showRegisterPassword}
                      >
                        {showRegisterPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                    {shouldShowError("register", "password") ? (
                      <p id="registerPasswordError" className={styles.errorMessage}>
                        {getFieldError("register", "password")}
                      </p>
                    ) : (
                      <p className={styles.hintText}>{getFieldHint("register", "password")}</p>
                    )}
                  </div>

                  <div
                    className={`${styles.inputGroup} ${
                      shouldShowError("register", "passwordRepeat") ? styles.inputInvalid : ""
                    }`}
                  >
                    <label htmlFor="registerPasswordRepeat">
                      Підтвердження пароля
                    </label>
                    <div className={styles.passwordField}>
                      <input
                        id="registerPasswordRepeat"
                        type={showRegisterPasswordRepeat ? "text" : "password"}
                        placeholder="Повторіть пароль"
                        value={registerData.passwordRepeat}
                        onChange={(e) => handleFieldChange("register", "passwordRepeat", e.target.value)}
                        onBlur={() => handleFieldBlur("register", "passwordRepeat")}
                        aria-invalid={!!getFieldError("register", "passwordRepeat")}
                        aria-describedby="registerPasswordRepeatError"
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowRegisterPasswordRepeat((current) => !current)}
                        aria-label={showRegisterPasswordRepeat ? "Приховати пароль" : "Показати пароль"}
                        aria-pressed={showRegisterPasswordRepeat}
                      >
                        {showRegisterPasswordRepeat ? "🙈" : "👁"}
                      </button>
                    </div>
                    {shouldShowError("register", "passwordRepeat") ? (
                      <p id="registerPasswordRepeatError" className={styles.errorMessage}>
                        {getFieldError("register", "passwordRepeat")}
                      </p>
                    ) : (
                      <p className={styles.hintText}>{getFieldHint("register", "passwordRepeat")}</p>
                    )}
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label
                      className={`${styles.checkbox} ${
                        shouldShowError("register", "agreeTerms") ? styles.checkboxInvalid : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={registerData.agreeTerms}
                        onChange={(e) => handleFieldChange("register", "agreeTerms", e.target.checked)}
                        onBlur={() => handleFieldBlur("register", "agreeTerms")}
                      />
                      <span>Я погоджуюсь з умовами користування</span>
                    </label>
                    {shouldShowError("register", "agreeTerms") && (
                      <p className={styles.errorMessage}>
                        {getFieldError("register", "agreeTerms")}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className={styles.loader}>
                        <div className={styles.progress}>
                          <div className={styles.bar}></div>
                        </div>
                      </div>
                    ) : (
                      content.buttonText
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      {verificationNotice.open && (
  <div className={styles.verifyOverlay}>
    <div className={styles.verifyModal}>
      <h3 className={styles.verifyTitle}>Підтвердження пошти</h3>

      <p className={styles.verifyText}>
        {verificationNotice.message}
      </p>

      <p className={styles.verifyEmail}>
        <strong>{verificationNotice.email}</strong>
      </p>

      <p className={styles.verifyHint}>
        Перейдіть за посиланням у листі, щоб активувати акаунт.
      </p>

      {resendMessage && (
        <div className={styles.verifyInfo}>{resendMessage}</div>
      )}

      <div className={styles.verifyActions}>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleResendVerification}
          disabled={resendLoading}
        >
          {resendLoading ? "Надсилаємо..." : "Надіслати ще раз"}
        </button>

        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setVerificationNotice({ open: false, email: "", message: "" })}
        >
          Закрити
        </button>
      </div>
    </div>
  </div>
)}

      {forgotPasswordOpen && (
  <div className={styles.verifyOverlay}>
    <div className={styles.verifyModal}>
      <h3 className={styles.verifyTitle}>Скидання пароля</h3>

      <p className={styles.verifyText}>
        Введіть вашу електронну пошту, і ми надішлемо вам посилання для скидання пароля.
      </p>

      <form onSubmit={handleForgotPassword}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Ваша пошта"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            style={{ marginBottom: "16px" }}
          />
        </div>

        {forgotPasswordMessage && (
          <div className={styles.verifyInfo} style={{ marginBottom: "16px" }}>
            {forgotPasswordMessage}
          </div>
        )}

        <div className={styles.verifyActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? "Надсилаємо..." : "Надіслати посилання"}
          </button>

          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setForgotPasswordOpen(false);
              setForgotPasswordEmail("");
              setForgotPasswordMessage("");
            }}
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

export default AuthPage;
