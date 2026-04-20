import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import styles from "./ProfilePage.module.css";
import AvatarUpload from "../components/AvatarUpload";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const mapUserToProfileForm = (userData) => ({
  firstName: userData.firstName || "",
  lastName: userData.lastName || "",
  userName: userData.userName || "",
  bio: userData.bio || "",
  birthDate: userData.birthDate
    ? new Date(userData.birthDate).toISOString().split("T")[0]
    : "",
});

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [view, setView] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    bio: "",
    birthDate: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const statuses = [
    {
      name: "Basic",
      price: 0,
      description: "Базовий статус для початківців",
      advantages: [
        "Доступ до базових аукціонів",
        "Обмежена кількість ставок",
        "Стандартна підтримка",
      ],
    },
    {
      name: "Premium",
      price: 299,
      description: "Покращений статус для активних користувачів",
      advantages: [
        "Необмежена кількість ставок",
        "Пріоритетна підтримка",
        "Доступ до ексклюзивних лотів",
        "Знижки на комісію",
      ],
    },
    {
      name: "VIP",
      price: 999,
      description: "Максимальний статус для професіоналів",
      advantages: [
        "VIP підтримка 24/7",
        "Персональний менеджер",
        "Безкоштовна доставка",
        "Ексклюзивні події та лоти",
        "Максимальні знижки",
      ],
    },
  ];

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuth(false);
        setLoading(false);
        return;
      }

      const res = await api.get("/api/profile/me", getAuthConfig());
      const userData = res.data;

      setUser(userData);
      setProfileForm(mapUserToProfileForm(userData));
      setAuth(true);
    } catch (err) {
      console.error("Auth error:", err);
      setAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const refreshUser = async () => {
    const res = await api.get("/api/profile/me", getAuthConfig());
    const userData = res.data;

    setUser(userData);
    setProfileForm(mapUserToProfileForm(userData));

    window.dispatchEvent(new Event("authChanged"));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(
        "/api/profile/me",
        {
          userName: profileForm.userName.trim(),
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          bio: profileForm.bio.trim(),
          birthDate: profileForm.birthDate
            ? new Date(profileForm.birthDate).toISOString()
            : null,
        },
        getAuthConfig(),
      );

      await refreshUser();
      setView("profile");
      showToast("Профіль оновлено", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося оновити профіль",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploaded = (avatarUrl) => {
    setUser((prev) => ({
      ...prev,
      avatarUrl,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      showToast("Заповніть усі поля для пароля", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast("Новий пароль і підтвердження не збігаються", "error");
      return;
    }

    try {
      setSaving(true);

      await api.put(
        "/api/profile/me/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmNewPassword,
        },
        getAuthConfig(),
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      showToast("Пароль успішно змінено", "success");
      setView("profile");
    } catch (err) {
      console.error("Change password error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося змінити пароль",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = useMemo(() => {
    switch (user?.status) {
      case "VIP":
        return "VIP";
      case "Premium":
        return "Premium";
      case "Basic":
      default:
        return "Basic";
    }
  }, [user?.status]);

  const fullName = useMemo(() => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  }, [user?.firstName, user?.lastName]);

  const previewName = useMemo(() => {
    return [profileForm.firstName, profileForm.lastName]
      .filter(Boolean)
      .join(" ");
  }, [profileForm.firstName, profileForm.lastName]);

  const firstLetter = (
    fullName?.charAt(0) ||
    user?.userName?.charAt(0) ||
    "U"
  ).toUpperCase();

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.profilePage}>
          <div className={styles.loadingShell}>
            <section className={styles.loadingHero}>
              <div className={styles.loadingHeroMain}>
                <div className={styles.loadingAvatar} />

                <div className={styles.loadingIdentity}>
                  <span className={styles.loadingBadge} />
                  <span className={styles.loadingTitle} />
                  <span className={styles.loadingSubtitle} />
                </div>
              </div>

              <div className={styles.loadingActions}>
                <div className={styles.loadingBalance} />
                <div className={styles.loadingButtons}>
                  <span className={styles.loadingButton} />
                  <span className={styles.loadingButton} />
                </div>
              </div>
            </section>

            <section className={styles.loadingGrid}>
              <article className={styles.loadingPanel}>
                <span className={styles.loadingPanelTitle} />
                <div className={styles.loadingStats}>
                  <span className={styles.loadingStatCard} />
                  <span className={styles.loadingStatCard} />
                  <span className={styles.loadingStatCard} />
                  <span className={styles.loadingStatCard} />
                </div>
              </article>

              <article className={styles.loadingPanel}>
                <span className={styles.loadingPanelTitle} />
                <div className={styles.loadingLinks}>
                  <span className={styles.loadingLink} />
                  <span className={styles.loadingLink} />
                  <span className={styles.loadingLink} />
                  <span className={styles.loadingLink} />
                </div>
              </article>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!auth || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={styles.page}>
      <Header />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className={styles.profilePage}>
        {view === "profile" && (
          <div className={styles.viewScreen}>
            <section className={styles.heroCard}>
              <div className={styles.heroLeft}>
                <div className={styles.bigAvatar}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={fullName || user.userName || "Користувач"}
                      className={styles.bigAvatarImage}
                    />
                  ) : (
                    firstLetter
                  )}
                </div>

                <div className={styles.userMeta}>
                  <span className={styles.userBadge}>{statusLabel}</span>
                  <h1 className={styles.userName}>@{user.userName || "—"}</h1>
                  <p className={styles.userUsername}>
                    {fullName || "користувач"}
                  </p>
                </div>
              </div>

              <div className={styles.heroRight}>
                <div className={styles.balanceCard}>
                  <span className={styles.balanceLabel}>Баланс</span>
                  <strong className={styles.balanceValue}>
                    {user.balance != null ? user.balance : 0} ₴
                  </strong>
                </div>

                <div className={styles.heroButtons}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() =>
                      showToast("Обране скоро буде доступне", "success")
                    }
                  >
                    <span className={styles.heartIcon}>♥</span>
                    Обране
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setView("edit-profile")}
                  >
                    Редагувати профіль
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.profileOverviewGrid}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Статистика аукціонів</h2>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Участь в аукціонах</span>
                    <strong className={styles.statValue}>12</strong>
                    <p className={styles.statText}>Активних участей</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Виграні лоти</span>
                    <strong className={styles.statValue}>5</strong>
                    <p className={styles.statText}>Успішних покупок</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Загальна сума</span>
                    <strong className={styles.statValue}>2,450 ₴</strong>
                    <p className={styles.statText}>Витрачено на лоти</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Статус акаунту</span>
                    <strong className={styles.statValue}>{statusLabel}</strong>
                    <p className={styles.statText}>Натисніть для підвищення</p>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => setView("upgrade")}
                    >
                      Підвищити статус
                    </button>
                  </div>
                </div>
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Керування</h2>
                </div>

                <div className={styles.actionStack}>
                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() => setView("account-settings")}
                  >
                    Налаштування акаунту
                  </button>

                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() =>
                      showToast("Функція буде доступна пізніше", "success")
                    }
                  >
                    Історія транзакцій
                  </button>

                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() =>
                      showToast("Поповнення балансу скоро з'явиться", "success")
                    }
                  >
                    Поповнення балансу
                  </button>

                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() =>
                      showToast("Функція буде доступна пізніше", "success")
                    }
                  >
                    Мої ставки
                  </button>
                </div>
              </article>
            </section>
          </div>
        )}
        
        {view === "edit-profile" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.sectionTopbar}>
              <button
                type="button"
                className={styles.backArrowButton}
                onClick={() => setView("profile")}
              >
                ← Назад
              </button>
            </div>

            <div className={styles.fullscreenCard}>
              <div className={styles.fullscreenHeader}>
                <p className={styles.sectionEyebrow}>Профіль</p>
                <h2>Редагування профілю</h2>
                <p className={styles.sectionDescription}>
                  Тут можна змінити тільки нік, аватар та опис.
                </p>
              </div>

              <div className={styles.editGrid}>
                <div className={styles.leftColumn}>
                  <div className={styles.avatarEditorCard}>
                    <div className={styles.cardHeading}>
                      <h3>Аватарка</h3>
                    </div>

                    <AvatarUpload
                      currentAvatarUrl={user.avatarUrl}
                      userName={profileForm.userName || user.userName}
                      fullName={previewName}
                      getAuthConfig={getAuthConfig}
                      onUploaded={handleAvatarUploaded}
                      showToast={showToast}
                    />
                  </div>
                </div>

                <div className={styles.rightColumn}>
                  <form
                    className={styles.formColumn}
                    onSubmit={handleSaveProfile}
                  >
                    <div className={styles.cardHeading}>
                      <h3>Основна інформація</h3>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="userName">Нік</label>
                      <input
                        id="userName"
                        name="userName"
                        value={profileForm.userName}
                        onChange={handleProfileChange}
                        className={styles.input}
                        placeholder="Вкажіть нік"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bio">Про себе</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleProfileChange}
                        className={styles.textarea}
                        placeholder="Коротко розкажіть про себе"
                      />
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setView("profile")}
                      >
                        Назад
                      </button>

                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={saving}
                      >
                        {saving ? "Зберігаємо..." : "Зберегти"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "account-settings" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.sectionTopbar}>
              <button
                type="button"
                className={styles.backArrowButton}
                onClick={() => setView("profile")}
              >
                <span className={styles.backArrow}>←</span>
                <span>Назад до профілю</span>
              </button>
            </div>

            <div className={styles.accountSettingsGrid}>
              <div className={styles.settingsCard}>
                <div className={styles.fullscreenHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Обліковий запис</p>
                    <h2>Налаштування облікового запису</h2>
                    <p className={styles.sectionDescription}>
                      Тут можна змінити ім'я, прізвище та дату народження.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className={styles.settingsForm}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName">Ім'я</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className={styles.input}
                      placeholder="Ваше ім'я"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="lastName">Прізвище</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className={styles.input}
                      placeholder="Ваше прізвище"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="birthDate">Дата народження</label>
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={profileForm.birthDate}
                      onChange={handleProfileChange}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Електронна пошта</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={user.email || ""}
                      className={styles.input}
                      disabled
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setView("profile")}
                    >
                      Назад
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={saving}
                    >
                      {saving ? "Зберігаємо..." : "Зберегти"}
                    </button>
                  </div>
                </form>
              </div>

              <div className={styles.settingsCard}>
                <div className={styles.fullscreenHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Безпека</p>
                    <h2>Змінити пароль</h2>
                    <p className={styles.sectionDescription}>
                      Оновіть пароль, щоб підвищити безпеку акаунту.
                    </p>
                  </div>
                </div>

                <form
                  className={styles.settingsForm}
                  onSubmit={handleChangePassword}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="currentPassword">Поточний пароль</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={styles.input}
                      placeholder="Поточний пароль"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="newPassword">Новий пароль</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={styles.input}
                      placeholder="Новий пароль"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmNewPassword">Повторіть пароль</label>
                    <input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className={styles.input}
                      placeholder="Повторіть пароль"
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={saving}
                    >
                      {saving ? "Зберігаємо..." : "Змінити пароль"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
        {view === "upgrade" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.sectionTopbar}>
              <button
                type="button"
                className={styles.backArrowButton}
                onClick={() => setView("profile")}
              >
                <span className={styles.backArrow}>←</span>
                <span>Назад до профілю</span>
              </button>
            </div>

            <div className={styles.upgradeContainer}>
              <div className={styles.fullscreenHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Статус</p>
                  <h2>Підвищити статус акаунту</h2>
                  <p className={styles.sectionDescription}>
                    Оберіть підписку, щоб отримати більше можливостей на
                    платформі.
                  </p>
                </div>
              </div>

              <div className={styles.upgradeGrid}>
                {statuses.map((status) => (
                  <div
                    key={status.name}
                    className={`${styles.upgradeCard} ${
                      user.status === status.name
                        ? styles.currentSubscription
                        : ""
                    }`}
                  >
                    {user.status === status.name && (
                      <div className={styles.statusRibbon}>
                        АКТИВНА ПІДПИСКА
                      </div>
                    )}

                    <div className={styles.upgradeHeader}>
                      <h3>{status.name}</h3>
                      <span className={styles.upgradePrice}>
                        {status.price} ₴/міс
                      </span>
                    </div>

                    <p className={styles.upgradeDescription}>
                      {status.description}
                    </p>

                    <ul className={styles.advantagesList}>
                      {status.advantages.map((advantage, index) => (
                        <li key={index}>{advantage}</li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() =>
                        showToast(
                          "Функція підвищення статусу скоро буде доступна",
                          "success",
                        )
                      }
                      disabled={user.status === status.name || saving}
                    >
                      {user.status === status.name
                        ? "Поточний статус"
                        : saving
                          ? "Оформлюємо..."
                          : "Оформити підписку"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
