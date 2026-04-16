import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    bio: "",
    avatarUrl: "",
    birthDate: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

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
    avatarUrl: userData.avatarUrl || "",
    birthDate: userData.birthDate
      ? new Date(userData.birthDate).toISOString().split("T")[0]
      : "",
  });

  const fetchUser = async () => {
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
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
          avatarUrl: profileForm.avatarUrl.trim(),
          bio: profileForm.bio.trim(),
          birthDate: profileForm.birthDate || null,
        },
        getAuthConfig(),
      );

      await refreshUser();
      setView("profile");
      alert("Профиль обновлён");
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err?.response?.data?.message || "Не удалось обновить профиль");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmNewPassword
    ) {
      alert("Заполните все поля пароля");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      alert("Новый пароль и подтверждение не совпадают");
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

      alert("Пароль успешно изменён");
      setView("profile");
    } catch (err) {
      console.error("Change password error:", err);
      alert(err?.response?.data?.message || "Не удалось изменить пароль");
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

  const isNewUser =
    !user?.firstName &&
    !user?.lastName &&
    !user?.userName &&
    !user?.bio &&
    !user?.avatarUrl;

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.loading}>Загрузка профиля...</p>
      </div>
    );
  }

  if (!auth || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.profilePage}>
        {view === "profile" && (
          <div className={styles.viewScreen}>
            <section className={styles.heroCard}>
              <div className={styles.heroLeft}>
                <div className={styles.bigAvatar}>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={fullName || user.userName || "User"}
                      className={styles.bigAvatarImage}
                    />
                  ) : (
                    firstLetter
                  )}
                </div>

                <div className={styles.userMeta}>
                  <span className={styles.userBadge}>{statusLabel}</span>
                  <h1 className={styles.userName}>{fullName || "Без имени"}</h1>
                  <p className={styles.userUsername}>@{user.userName || "—"}</p>
                  <p className={styles.userEmail}>{user.email || "—"}</p>
                </div>
              </div>

              <div className={styles.heroRight}>
                <div className={styles.heroButtons}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setView("edit-profile")}
                  >
                    Редактировать профиль
                  </button>

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setView("account-settings")}
                  >
                    Безопасность
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.profileOverviewGrid}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Информация профиля</h2>
                </div>

                <div className={styles.infoCardWrap}>
                  <div
                    className={`${styles.infoList} ${
                      isNewUser ? styles.infoListBlurred : ""
                    }`}
                  >
                    <div className={styles.infoRow}>
                      <span>Имя</span>
                      <strong>{user.firstName || "—"}</strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>Фамилия</span>
                      <strong>{user.lastName || "—"}</strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>Username</span>
                      <strong>@{user.userName || "—"}</strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>Email</span>
                      <strong>{user.email || "—"}</strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>Статус</span>
                      <strong>{statusLabel}</strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>Верификация</span>
                      <strong>
                        {user.isVerified ? "Подтверждено" : "Не подтверждено"}
                      </strong>
                    </div>

                    <div className={styles.infoRow}>
                      <span>О себе</span>
                      <strong>{user.bio || "Не заполнено"}</strong>
                    </div>
                  </div>

                  {isNewUser && (
                    <div className={styles.overlayCard}>
                      <div className={styles.overlayContent}>
                        <h3 className={styles.overlayTitle}>
                          Профиль ещё пустой
                        </h3>
                        <p className={styles.overlayText}>
                          Добавь имя, username и описание, чтобы профиль
                          выглядел полноценно.
                        </p>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => setView("edit-profile")}
                        >
                          Заполнить профиль
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Управление</h2>
                </div>

                <div className={styles.actionStack}>
                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() => setView("edit-profile")}
                  >
                    Редактировать профиль
                  </button>

                  <button
                    type="button"
                    className={styles.quickActionButton}
                    onClick={() => setView("account-settings")}
                  >
                    Сменить пароль
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
                <span className={styles.backArrow}>←</span>
                <span>Назад к профилю</span>
              </button>
            </div>

            <div className={styles.fullscreenCard}>
              <div className={styles.fullscreenHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Профиль</p>
                  <h2>Редактирование профиля</h2>
                  <p className={styles.sectionDescription}>
                    Здесь меняются username, имя, фамилия, аватар, дата рождения
                    и описание.
                  </p>
                </div>
              </div>

              <div className={styles.editProfileLayout}>
                <div className={styles.avatarEditorCard}>
                  <div className={styles.avatarPreviewLarge}>
                    {profileForm.avatarUrl ? (
                      <img
                        src={profileForm.avatarUrl}
                        alt={previewName || profileForm.userName || "User"}
                        className={styles.bigAvatarImage}
                      />
                    ) : (
                      (
                        previewName?.charAt(0) ||
                        profileForm.userName?.charAt(0) ||
                        "U"
                      ).toUpperCase()
                    )}
                  </div>

                  <div className={styles.avatarEditorText}>
                    <h3>Аватар профиля</h3>
                    <p>
                      Укажи ссылку на изображение или оставь стандартный аватар.
                    </p>
                  </div>
                </div>

                <form
                  className={styles.fullscreenForm}
                  onSubmit={handleSaveProfile}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="firstName">Имя</label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={profileForm.firstName}
                        onChange={handleProfileChange}
                        className={styles.input}
                        placeholder="Введите имя"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="lastName">Фамилия</label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={profileForm.lastName}
                        onChange={handleProfileChange}
                        className={styles.input}
                        placeholder="Введите фамилию"
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="userName">Username</label>
                      <input
                        id="userName"
                        name="userName"
                        type="text"
                        value={profileForm.userName}
                        onChange={handleProfileChange}
                        className={styles.input}
                        placeholder="Введите username"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="birthDate">Дата рождения</label>
                      <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={profileForm.birthDate}
                        onChange={handleProfileChange}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="avatarUrl">Ссылка на аватар</label>
                    <input
                      id="avatarUrl"
                      name="avatarUrl"
                      type="text"
                      value={profileForm.avatarUrl}
                      onChange={handleProfileChange}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bio">О себе</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows="5"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      className={styles.textarea}
                      placeholder="Кратко расскажите о себе"
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setView("profile")}
                    >
                      Отмена
                    </button>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={saving}
                    >
                      {saving ? "Сохранение..." : "Сохранить изменения"}
                    </button>
                  </div>
                </form>
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
                <span>Назад к профилю</span>
              </button>
            </div>

            <div className={styles.fullscreenCard}>
              <div className={styles.fullscreenHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Безопасность</p>
                  <h2>Смена пароля</h2>
                  <p className={styles.sectionDescription}>
                    Email сейчас только отображается. Пароль меняется отдельно.
                  </p>
                </div>
              </div>

              <form
                className={styles.fullscreenForm}
                onSubmit={handleChangePassword}
              >
                <div className={styles.settingsSection}>
                  <h3 className={styles.settingsTitle}>Информация аккаунта</h3>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={user.email || ""}
                      className={styles.input}
                      disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="verified">Верификация</label>
                    <input
                      id="verified"
                      type="text"
                      value={
                        user.isVerified ? "Подтверждено" : "Не подтверждено"
                      }
                      className={styles.input}
                      disabled
                    />
                  </div>
                </div>

                <div className={styles.settingsSection}>
                  <h3 className={styles.settingsTitle}>Новый пароль</h3>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="currentPassword">Текущий пароль</label>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Введите текущий пароль"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="newPassword">Новый пароль</label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className={styles.input}
                        placeholder="Введите новый пароль"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmNewPassword">
                      Подтвердите новый пароль
                    </label>
                    <input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className={styles.input}
                      placeholder="Повторите новый пароль"
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setView("profile")}
                  >
                    Отмена
                  </button>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving}
                  >
                    {saving ? "Сохранение..." : "Изменить пароль"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
