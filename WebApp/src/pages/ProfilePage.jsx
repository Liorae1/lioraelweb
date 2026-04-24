import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Toast from "../components/Toast";
import styles from "./ProfilePage.module.css";
import AvatarUpload from "../components/AvatarUpload";
import {
  getMyFavorites,
  purchaseSubscription,
  progressWinningDelivery,
  requestWinningDelivery,
} from "../api/profile";
import { getMyWallet } from "../api/wallet";
import {
  getAccountStatusMeta,
  getUserPrivileges,
  normalizeAccountStatus,
  formatMoney,
  formatMoneyWithCurrency,
  getAuctionLeaderProfile,
  getAuctionImage,
  getDeliveryStatusLabel,
  getWalletAmounts,
  normalizeAuctionEntity,
} from "../utils/domain";
import { clearAuthToken, getAuthToken } from "../utils/authStorage";

const getAuthConfig = () => {
  const token = getAuthToken();

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

const normalizeAuctionCollection = (items) =>
  Array.isArray(items)
    ? items.map(normalizeAuctionEntity).filter(Boolean)
    : [];

const isUnauthorizedError = (error) => error?.response?.status === 401;

const getAuctionCardKey = (auction, index) =>
  auction?.id ||
  auction?.auctionId ||
  `${auction?.title || "auction"}-${auction?.brand || "item"}-${index}`;

const formatBirthDateShort = (value) => {
  if (!value) return "Не вказано";

  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;

  return `${Number(day)}-${Number(month)}-${year}`;
};

const formatSubscriptionDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getDeliveryDisplayLabel = (status, canRequestDelivery) => {
  if (canRequestDelivery) {
    return "Очікує на оформлення";
  }

  switch (String(status || "")) {
    case "Requested":
    case "InTransit":
      return "Ваш товар буде доставлено";
    case "Delivered":
      return "Товар доставлено";
    default:
      return getDeliveryStatusLabel(status);
  }
};

const statuses = [
  {
    name: "Member",
    label: "Member",
    kicker: "Старт",
    price: 0,
    accent: "member",
    description: "Базовий доступ до аукціонів та участь у торгах.",
    advantages: [
      "Стандартні аукціони та участь у торгах",
      "Базовий рівень доступу без доплат",
      "Звичайна підтримка користувача",
    ],
  },
  {
    name: "Elite",
    label: "Elite",
    kicker: "Найпопулярніший вибір",
    price: 299,
    accent: "elite",
    description: "Більше можливостей, ранній доступ і розширені переваги.",
    advantages: [
      "Ранній доступ до вибраних аукціонів",
      "Підвищені ліміти для активних ставок",
      "Розширені можливості акаунта",
      "Більше переваг для активних користувачів",
    ],
  },
  {
    name: "Private",
    label: "Private",
    kicker: "Закритий доступ",
    price: 999,
    accent: "private",
    description: "Закритий рівень з доступом до ексклюзивних аукціонів і максимальними привілеями.",
    advantages: [
      "Закриті аукціони та ексклюзивні лоти",
      "Максимальні привілеї всередині платформи",
      "Преміальний закритий рівень доступу",
      "Найвиразніший статус у системі",
    ],
  },
];

const profileSections = [
  { id: "overview", label: "Огляд" },
  { id: "personal", label: "Інфо" },
  { id: "privileges", label: "Привілеї" },
  { id: "favorites", label: "Улюблені" },
  { id: "winnings", label: "Виграні лоти" },
  { id: "profileSettings", label: "Профіль" },
  { id: "accountSettings", label: "Акаунт" },
  { id: "upgrade", label: "Статуси" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [deliveryLoadingId, setDeliveryLoadingId] = useState("");
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("overview");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
  });

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

  const fetchUser = useCallback(async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        setAuth(false);
        setLoading(false);
        return;
      }

      const [res, walletData] = await Promise.all([
        api.get("/api/profile/me", getAuthConfig()),
        getMyWallet().catch(() => null),
      ]);
      const userData = res.data;

      setUser({
        ...userData,
        wonAuctions: normalizeAuctionCollection(userData.wonAuctions),
        favoriteAuctions: normalizeAuctionCollection(userData.favoriteAuctions),
      });
      setWallet(walletData);
      setProfileForm(mapUserToProfileForm(userData));
      setAuth(true);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearAuthToken();
      } else {
        console.error("Auth error:", err);
      }

      setAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!auth) {
        setFavorites([]);
        return;
      }

      try {
        setFavoritesLoading(true);
        const data = await getMyFavorites();
        setFavorites(normalizeAuctionCollection(data));
      } catch (err) {
        if (isUnauthorizedError(err)) {
          clearAuthToken();
          setAuth(false);
          setFavorites([]);
          return;
        }

        setFavorites(normalizeAuctionCollection(user?.favoriteAuctions));
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadFavorites();
  }, [auth, user?.favoriteAuctions]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const refreshUser = async () => {
    const [res, walletData] = await Promise.all([
      api.get("/api/profile/me", getAuthConfig()),
      getMyWallet().catch(() => null),
    ]);
    const userData = res.data;

    setUser({
      ...userData,
      wonAuctions: normalizeAuctionCollection(userData.wonAuctions),
      favoriteAuctions: normalizeAuctionCollection(userData.favoriteAuctions),
    });
    setWallet(walletData);
    setProfileForm(mapUserToProfileForm(userData));

    window.dispatchEvent(new Event("authChanged"));
  };

  const handleDeliveryAction = async (auction) => {
    try {
      setDeliveryLoadingId(auction.id);

      await requestWinningDelivery(auction.id);

      await refreshUser();
      showToast("Доставку оформлено. Ваш товар буде доставлено найближчим часом.", "success");
    } catch (err) {
      console.error("Delivery action error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося оновити доставку",
        "error"
      );
    } finally {
      setDeliveryLoadingId("");
    }
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
        getAuthConfig()
      );

      await refreshUser();
      showToast("Профіль оновлено", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося оновити профіль",
        "error"
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
        getAuthConfig()
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      showToast("Пароль успішно змінено", "success");
      setView("accountSettings");
    } catch (err) {
      console.error("Change password error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося змінити пароль",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentFieldChange = (field, value) => {
    let nextValue = value;

    if (field === "cardNumber") {
      nextValue = value.replace(/[^\d]/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    }

    if (field === "expiryDate") {
      const digits = value.replace(/[^\d]/g, "").slice(0, 4);
      nextValue = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    }

    if (field === "cvv") {
      nextValue = value.replace(/[^\d]/g, "").slice(0, 3);
    }

    setPaymentForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const resetCheckout = () => {
    setCheckoutPlan(null);
    setPaymentForm({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolderName: "",
    });
  };

  const handleSubscriptionCheckout = async (event) => {
    event.preventDefault();

    if (!checkoutPlan) {
      return;
    }

    const sanitizedCardNumber = paymentForm.cardNumber.replace(/\s/g, "");

    if (
      sanitizedCardNumber.length < 16 ||
      paymentForm.expiryDate.length < 5 ||
      paymentForm.cvv.length < 3 ||
      !paymentForm.cardHolderName.trim()
    ) {
      showToast("Заповніть усі поля картки для демо-оплати", "error");
      return;
    }

    try {
      setCheckoutLoading(true);

      await purchaseSubscription({
        tier: checkoutPlan.name,
        cardNumber: sanitizedCardNumber,
        expiryDate: paymentForm.expiryDate,
        cvv: paymentForm.cvv,
        cardHolderName: paymentForm.cardHolderName.trim(),
      });

      await refreshUser();
      showToast(`Підписку ${checkoutPlan.label} оформлено успішно`, "success");
      resetCheckout();
    } catch (err) {
      console.error("Subscription purchase error:", err);
      showToast(
        err?.response?.data?.message || "Не вдалося оформити підписку",
        "error"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    [user?.firstName, user?.lastName]
  );

  const previewName = useMemo(
    () => [profileForm.firstName, profileForm.lastName].filter(Boolean).join(" "),
    [profileForm.firstName, profileForm.lastName]
  );

  const firstLetter = (fullName?.charAt(0) || user?.userName?.charAt(0) || "U").toUpperCase();
  const normalizedStatus = normalizeAccountStatus(user?.status);
  const isPremium = normalizedStatus === "Elite";
  const isVip = normalizedStatus === "Private";
  const { availableBalance, lockedBalance, balance, currency } = getWalletAmounts(wallet, user);
  const wonAuctions = normalizeAuctionCollection(user?.wonAuctions);
  const favoriteAuctions = favorites.length
    ? favorites
    : normalizeAuctionCollection(user?.favoriteAuctions);
  const totalWonValue = wonAuctions.reduce(
    (sum, auction) => sum + Number(auction.currentPrice || auction.finalPrice || 0),
    0
  );
  const statusMeta = getAccountStatusMeta(user?.status);
  const privileges = getUserPrivileges(user);
  const activeStatus = statuses.find((status) => status.name === normalizedStatus) || statuses[0];
  const activeSubscription = user?.subscription || null;

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
        <section className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div
              className={`${styles.bigAvatar} ${
                isVip ? styles.bigAvatarVip : isPremium ? styles.bigAvatarPremium : ""
              }`}
            >
              {isVip && (
                <span className={styles.avatarCrown} aria-hidden="true">
                  <svg viewBox="0 0 24 24" className={styles.avatarCrownIcon}>
                    <path d="M4 18 2.5 7.5l5.2 3.7L12 4l4.3 7.2 5.2-3.7L20 18H4Z" />
                    <path d="M5 20h14" />
                  </svg>
                </span>
              )}
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
              <h1 className={styles.userName}>@{user.userName || "—"}</h1>
              <div className={styles.statusRow}>
                <span
                  className={`${styles.accountStatusChip} ${
                    statusMeta.tone === "private"
                      ? styles.accountStatusChipVip
                      : statusMeta.tone === "elite"
                        ? styles.accountStatusChipPremium
                        : ""
                  }`}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Доступно зараз</span>
              <strong className={styles.balanceValue}>
                {formatMoneyWithCurrency(availableBalance, currency)}
              </strong>
              <p className={styles.balanceText}>
                Всього: {formatMoney(balance)} {currency}
              </p>
              <p className={styles.balanceText}>
                В резерві: {formatMoney(lockedBalance)} {currency}
              </p>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setView("profileSettings")}
              >
                Редагувати профіль
              </button>
            </div>
          </div>
        </section>

        <nav className={styles.sectionTabs} aria-label="Навігація профілю">
          {profileSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`${styles.sectionTab} ${
                view === section.id ? styles.sectionTabActive : ""
              }`}
              onClick={() => setView(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {view === "overview" && (
          <div className={styles.viewScreen}>
            <section className={styles.profileOverviewGrid}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Статистика аукціонів</h2>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Вибране</span>
                    <strong className={styles.statValue}>{favoriteAuctions.length}</strong>
                    <p className={styles.statText}>Збережені лоти</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Виграні лоти</span>
                    <strong className={styles.statValue}>{wonAuctions.length}</strong>
                    <p className={styles.statText}>Успішні покупки</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Загальна сума</span>
                    <strong className={styles.statValue}>
                      {formatMoneyWithCurrency(totalWonValue, currency)}
                    </strong>
                    <p className={styles.statText}>Сума виграних лотів</p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>У резерві</span>
                    <strong className={styles.statValue}>
                      {formatMoneyWithCurrency(lockedBalance, currency)}
                    </strong>
                    <p className={styles.statText}>Кошти для активних ставок</p>
                  </div>
                </div>
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <h2>Швидкі дії</h2>
                </div>

                <div className={styles.quickAccessGrid}>
                  <button
                    type="button"
                    className={styles.quickAccessCard}
                    onClick={() => setView("profileSettings")}
                  >
                    <span>Профіль</span>
                    <strong>Аватар, нік та опис</strong>
                    <p>Оновіть публічний вигляд, який бачать інші користувачі.</p>
                  </button>
                  <button
                    type="button"
                    className={styles.quickAccessCard}
                    onClick={() => setView("accountSettings")}
                  >
                    <span>Акаунт</span>
                    <strong>Контакти та пароль</strong>
                    <p>Зберігайте контактні дані окремо від налаштувань профілю.</p>
                  </button>
                  <button
                    type="button"
                    className={styles.quickAccessCard}
                    onClick={() => setView("upgrade")}
                  >
                    <span>Підписка</span>
                    <strong>{activeStatus.label}</strong>
                    <p>{activeStatus.description}</p>
                  </button>
                  <button
                    type="button"
                    className={styles.quickAccessCard}
                    onClick={() => navigate("/wallet")}
                  >
                    <span>Баланс</span>
                    <strong>{formatMoneyWithCurrency(availableBalance, currency)}</strong>
                    <p>Відкрийте гаманець, щоб швидко переглянути транзакції та резерв.</p>
                  </button>
                </div>
              </article>

            </section>
          </div>
        )}

        {view === "privileges" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Мої привілеї</h2>
                  <p className={styles.sectionDescription}>
                    Окремий розділ з усіма можливостями поточного рівня доступу.
                  </p>
                </div>
              </div>

              <div className={styles.accountSnapshot}>
                {privileges.map((item) => {
                  const isBooleanValue = typeof item.value === "boolean";
                  const resolvedValue = isBooleanValue ? (item.value ? "Так" : "Ні") : item.value;

                  return (
                    <article key={item.key} className={styles.privilegeCard}>
                      <div className={styles.privilegeIcon} aria-hidden="true">
                        {isBooleanValue ? (item.value ? "✓" : "•") : "#"}
                      </div>
                      <div className={styles.privilegeContent}>
                        <span className={styles.privilegeLabel}>{item.label}</span>
                        <strong
                          className={`${styles.privilegeValue} ${
                            isBooleanValue
                              ? item.value
                                ? styles.privilegeValuePositive
                                : styles.privilegeValueMuted
                              : styles.privilegeValueNumeric
                          }`}
                        >
                          {resolvedValue}
                        </strong>
                        <p className={styles.privilegeHint}>
                          {isBooleanValue
                            ? item.value
                              ? "Функція вже входить у ваш поточний рівень доступу."
                              : "Ця перевага поки недоступна на вашому рівні."
                            : "Поточне обмеження для одночасно активних ставок."}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {view === "personal" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Особиста інформація</h2>
                  <p className={styles.sectionDescription}>
                    Окремий компонент з персональними даними, винесений із шапки профілю.
                  </p>
                </div>
              </div>

              <div className={styles.accountSnapshot}>
                <div className={styles.snapshotItem}>
                  <span>Нік</span>
                  <strong>@{user.userName || "—"}</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Статус акаунта</span>
                  <strong>{statusMeta.label}</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Пошта</span>
                  <strong>{user.email || "Не вказано"}</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Повне ім'я</span>
                  <strong>{fullName || "Не вказано"}</strong>
                </div>
                <div className={styles.snapshotItem}>
                  <span>Дата народження</span>
                  <strong>{formatBirthDateShort(profileForm.birthDate)}</strong>
                </div>
                <div className={`${styles.snapshotItem} ${styles.snapshotItemWide}`}>
                  <span>Про себе</span>
                  <strong>{user.bio || "Додайте короткий опис профілю"}</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "favorites" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Улюблені лоти</h2>
                  <p className={styles.sectionDescription}>Збережені аукціони в одному місці.</p>
                </div>
              </div>

              {favoritesLoading ? (
                <div className={styles.emptyStateCard}>Завантаження обраного...</div>
              ) : !favoriteAuctions.length ? (
                <div className={styles.emptyStateCard}>У вибраному поки немає лотів.</div>
              ) : (
                <div className={styles.auctionCollection}>
                  {favoriteAuctions.map((auction, index) => (
                    <article key={getAuctionCardKey(auction, index)} className={styles.auctionCard}>
                      <div className={styles.auctionCardMedia}>
                        {getAuctionImage(auction) ? (
                          <img
                            src={getAuctionImage(auction)}
                            alt={auction.title}
                            className={styles.auctionCardImage}
                          />
                        ) : (
                          <div className={styles.auctionCardPlaceholder}>Немає фото</div>
                        )}
                      </div>
                      <div className={styles.auctionCardBody}>
                        <h3>{auction.title}</h3>
                        <p>{auction.brand || auction.category || "Аукціон"}</p>
                        <strong>
                          {formatMoneyWithCurrency(
                            auction.currentPrice || auction.startPrice,
                            auction.currency || currency
                          )}
                        </strong>
                        <div className={styles.cardActionsRow}>
                          <Link to={`/auction/${auction.id}`} className={styles.secondaryButton}>
                            Відкрити лот
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {view === "winnings" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Виграні лоти</h2>
                  <p className={styles.sectionDescription}>
                    Керування доставкою для виграних лотів.
                  </p>
                </div>
              </div>

              {!wonAuctions.length ? (
                <div className={styles.emptyStateCard}>Поки що немає виграних лотів.</div>
              ) : (
                <div className={styles.auctionCollection}>
                  {wonAuctions.map((auction, index) => {
                    const leader = getAuctionLeaderProfile(auction);

                    return (
                      <article key={getAuctionCardKey(auction, index)} className={styles.auctionCard}>
                        <div className={styles.auctionCardMedia}>
                          {getAuctionImage(auction) ? (
                            <img
                              src={getAuctionImage(auction)}
                              alt={auction.title}
                              className={styles.auctionCardImage}
                            />
                          ) : (
                            <div className={styles.auctionCardPlaceholder}>Немає фото</div>
                          )}
                        </div>
                        <div className={styles.auctionCardBody}>
                          <h3>{auction.title}</h3>
                          <p>
                            Лідер: {leader.userName ? `@${leader.userName}` : leader.displayName}
                          </p>
                          <strong>
                            {formatMoneyWithCurrency(
                              auction.currentPrice || auction.startPrice,
                              auction.currency || currency
                            )}
                          </strong>
                          <span className={styles.deliveryStatusChip}>
                            {getDeliveryDisplayLabel(auction.deliveryStatus, auction.canRequestDelivery)}
                          </span>
                          <div className={styles.cardActionsRow}>
                            <Link to={`/auction/${auction.id}`} className={styles.secondaryButton}>
                              Відкрити лот
                            </Link>
                            {auction.canRequestDelivery && (
                              <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={() => handleDeliveryAction(auction)}
                                disabled={deliveryLoadingId === auction.id}
                              >
                                {deliveryLoadingId === auction.id
                                  ? "Оновлення..."
                                  : "Оформити доставку"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {view === "profileSettings" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.fullscreenCard}>
              <div className={styles.fullscreenHeader}>
                <p className={styles.sectionEyebrow}>Налаштування профілю</p>
                <h2>Публічний вигляд профілю</h2>
                <p className={styles.sectionDescription}>
                  Тут зібрано все, що формує ваш профіль: аватар, нік та опис.
                </p>
              </div>

              <div className={styles.settingsLayout}>
                <div className={styles.avatarEditorCard}>
                  <div className={styles.cardHeading}>
                    <h3>Аватар</h3>
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

                <div className={styles.settingsStack}>
                  <form className={styles.settingsCard} onSubmit={handleSaveProfile}>
                    <div className={styles.cardHeading}>
                      <h3>Основні дані профілю</h3>
                    </div>

                    <div className={styles.settingsForm}>
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
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={saving}
                      >
                        {saving ? "Зберігаємо..." : "Зберегти зміни"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "accountSettings" && (
          <section className={styles.fullscreenSection}>
            <div className={styles.fullscreenCard}>
              <div className={styles.fullscreenHeader}>
                <p className={styles.sectionEyebrow}>Налаштування акаунта</p>
                <h2>Контакти та безпека</h2>
                <p className={styles.sectionDescription}>
                  Контактні дані та зміна пароля винесені в окремий блок від профілю.
                </p>
              </div>

              <div className={styles.settingsStack}>
                <form className={styles.settingsCard} onSubmit={handleSaveProfile}>
                  <div className={styles.cardHeading}>
                    <h3>Контактні дані</h3>
                  </div>

                  <div className={styles.formGrid}>
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
                  </div>

                  <div className={styles.formGrid}>
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
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.secondaryButton}
                      disabled={saving}
                    >
                      {saving ? "Зберігаємо..." : "Оновити дані акаунта"}
                    </button>
                  </div>
                </form>

                <form className={styles.settingsCard} onSubmit={handleChangePassword}>
                  <div className={styles.cardHeading}>
                    <h3>Змінити пароль</h3>
                  </div>

                  <div className={styles.settingsForm}>
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
            <div className={styles.upgradeContainer}>
              <div className={styles.fullscreenHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Статуси</p>
                  <h2>Підвищуйте рівень акаунта</h2>
                  <p className={styles.sectionDescription}>
                    Порівняйте всі підписки та оберіть ту, що відкриє більше можливостей для ставок.
                  </p>
                </div>
              </div>

              <div className={styles.upgradeFlow}>
                <div className={styles.statusPromoCard}>
                  <div className={styles.statusPromoContent}>
                    <span className={styles.statusPromoKicker}>Ваш поточний рівень</span>
                    <strong>{activeStatus.label}</strong>
                    <p>
                      {statusMeta.description}. Нижче зібрані всі підписки з перевагами, щоб
                      користувача було легко заохотити перейти на вищий статус.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate("/auction")}
                  >
                    Перейти до аукціонів
                  </button>
                </div>

                {activeSubscription ? (
                  <div className={styles.subscriptionSummaryCard}>
                    <div className={styles.subscriptionSummaryHeader}>
                      <div>
                        <span className={styles.statusPromoKicker}>Поточний план</span>
                        <strong>{activeStatus.label}</strong>
                      </div>
                    </div>

                    <div className={styles.subscriptionSummaryGrid}>
                      <div className={styles.snapshotItem}>
                        <span>Статус підписки</span>
                        <strong>{activeSubscription.status || activeSubscription.subscriptionStatus || "Активна"}</strong>
                      </div>
                      <div className={styles.snapshotItem}>
                        <span>Діє до</span>
                        <strong>{formatSubscriptionDate(activeSubscription.endsAt || activeSubscription.expiresAt)}</strong>
                      </div>
                      <div className={styles.snapshotItem}>
                        <span>Скасовано</span>
                        <strong>{formatSubscriptionDate(activeSubscription.cancelledAt)}</strong>
                      </div>
                      <div className={styles.snapshotItem}>
                        <span>Картка</span>
                        <strong>•••• {activeSubscription.last4 || activeSubscription.cardLast4 || "0000"}</strong>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className={styles.upgradeGrid}>
                  {statuses.map((status) => (
                    <article
                      key={status.name}
                      className={`${styles.upgradeCard} ${
                        normalizedStatus === status.name ? styles.currentSubscription : ""
                      } ${status.accent === "elite" ? styles.upgradeCardPremium : ""} ${
                        status.accent === "private" ? styles.upgradeCardVip : ""
                      }`}
                    >
                      {normalizedStatus === status.name && (
                        <div className={styles.statusRibbon}>АКТИВНА ПІДПИСКА</div>
                      )}

                      <span className={styles.planKicker}>{status.kicker}</span>

                      <div className={styles.upgradeHeader}>
                        <div>
                          <h3>{status.label}</h3>
                          <p className={styles.upgradeDescription}>{status.description}</p>
                        </div>
                      </div>

                      <div className={styles.upgradePriceBlock}>
                        <span className={styles.upgradePrice}>
                          {status.price === 0 ? "Безкоштовно" : `${status.price} ₴`}
                        </span>
                        <span className={styles.upgradePeriod}>
                          {status.price === 0 ? "для старту" : "на місяць"}
                        </span>
                      </div>

                      <div className={styles.upgradeBenefitsBlock}>
                        <ul className={styles.advantagesList}>
                          {status.advantages.map((advantage, index) => (
                            <li key={index}>{advantage}</li>
                          ))}
                        </ul>
                      </div>

                      <div className={styles.upgradeCardFooter}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => setCheckoutPlan(status)}
                          disabled={normalizedStatus === status.name || saving || status.name === "Member"}
                        >
                          {normalizedStatus === status.name
                            ? "Поточний статус"
                            : status.name === "Member"
                              ? "Базовий план"
                              : "Оформити підписку"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {checkoutPlan ? (
        <div className={styles.modalOverlay} onClick={resetCheckout}>
          <div
            className={styles.modalDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-checkout-title"
          >
            <div className={styles.checkoutCard}>
              <div className={styles.checkoutHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Демо-оплата</p>
                  <h3 id="subscription-checkout-title">Оформлення {checkoutPlan.label}</h3>
                  <p className={styles.sectionDescription}>
                    Красиве модальне вікно для тестового checkout flow без банку, 3DS і реального списання.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseButton}
                  onClick={resetCheckout}
                  aria-label="Закрити оформлення підписки"
                >
                  ×
                </button>
              </div>

              <form className={styles.checkoutForm} onSubmit={handleSubscriptionCheckout}>
                <div className={styles.checkoutSummary}>
                  <div className={styles.snapshotItem}>
                    <span>План</span>
                    <strong>{checkoutPlan.label}</strong>
                  </div>
                  <div className={styles.snapshotItem}>
                    <span>Сума</span>
                    <strong>{checkoutPlan.price === 0 ? "0 ₴" : `${checkoutPlan.price} ₴ / місяць`}</strong>
                  </div>
                  <div className={styles.snapshotItem}>
                    <span>Доступ</span>
                    <strong>{checkoutPlan.kicker}</strong>
                  </div>
                  <div className={styles.snapshotItem}>
                    <span>Формат</span>
                    <strong>Тестова оплата</strong>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cardNumber">Номер картки</label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(event) => handlePaymentFieldChange("cardNumber", event.target.value)}
                      className={styles.input}
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cardHolderName">Ім'я власника</label>
                    <input
                      id="cardHolderName"
                      type="text"
                      value={paymentForm.cardHolderName}
                      onChange={(event) => handlePaymentFieldChange("cardHolderName", event.target.value)}
                      className={styles.input}
                      placeholder="LIORAEL USER"
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="expiryDate">Термін дії</label>
                    <input
                      id="expiryDate"
                      type="text"
                      value={paymentForm.expiryDate}
                      onChange={(event) => handlePaymentFieldChange("expiryDate", event.target.value)}
                      className={styles.input}
                      placeholder="12/28"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      type="password"
                      value={paymentForm.cvv}
                      onChange={(event) => handlePaymentFieldChange("cvv", event.target.value)}
                      className={styles.input}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className={styles.checkoutFooter}>
                  <p className={styles.checkoutHint}>
                    Повідомлення про успіх або помилку з’являться поверх сторінки й не залежать від прокрутки.
                  </p>
                  <div className={styles.checkoutActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={resetCheckout}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? "Опрацьовуємо..." : "Оплатити демо-підписку"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfilePage;
