import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getAllAuctions, getAuctionHistory } from "../api/auctions";
import { getMyNotifications, markNotificationAsRead } from "../api/notifications";
import Toast from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import { addAuctionToFavorites, removeAuctionFromFavorites } from "../api/profile";
import { getMyWallet } from "../api/wallet";
import {
  formatMoney,
  formatMoneyWithCurrency,
  getAccountStatusMeta,
  getAuctionAccessLevelMeta,
  getAuctionImage,
  getLocalizedCondition,
  getLocalizedSize,
  getWalletAmounts,
  normalizeAccountStatus,
} from "../utils/domain";
import { getAuctionMetaDateLabel, getAuctionPhase as resolveAuctionPhase } from "../utils/auctionPresentation";
import useDeferredVisibility from "../hooks/useDeferredVisibility";
import { getAuthToken, hasAuthToken } from "../utils/authStorage";
import styles from "./AuctionsPage.module.css";
const CATEGORY_OPTIONS = [
  { value: "clothing", label: "Одяг" },
  { value: "shoes", label: "Взуття" },
  { value: "bags", label: "Сумки" },
  { value: "accessories", label: "Аксесуари" },
];

function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  if (["bags", "сумки", "сумка"].includes(value)) return "bags";
  if (["shoes", "взуття", "кросівки", "черевики"].includes(value)) return "shoes";
  if (["accessories", "аксесуари", "аксесуар"].includes(value)) return "accessories";

  return "clothing";
}

function getCategoryLabel(category) {
  const normalizedCategory = normalizeCategory(category);
  return (
    CATEGORY_OPTIONS.find((item) => item.value === normalizedCategory)?.label || "Одяг"
  );
}

function formatDate(value) {
  if (!value) return "Дата уточнюється";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточнюється";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAuctionPhase(auction, now) {
  return resolveAuctionPhase(auction, now);
}

function getTimeBadge(auction, now) {
  const phase = getAuctionPhase(auction, now);
  const targetValue =
    phase === "planned"
      ? auction?.startTime
      : phase === "active"
        ? auction?.endTime
        : null;

  if (phase === "closed") {
    return { label: "Торги завершено", tone: "closed" };
  }

  if (!targetValue) {
    return { label: "Дата уточнюється", tone: "muted" };
  }

  const target = new Date(targetValue).getTime();
  if (Number.isNaN(target)) {
    return { label: "Дата уточнюється", tone: "muted" };
  }

  const diff = target - now;
  if (diff <= 0) {
    return phase === "planned"
      ? { label: "Стартує зараз", tone: "active" }
      : { label: "Завершується зараз", tone: "danger" };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return {
      label: phase === "planned" ? `Старт через ${days} д` : `${days} д до завершення`,
      tone: phase,
    };
  }

  if (hours > 0) {
    return {
      label:
        phase === "planned"
          ? `Старт через ${hours} год ${minutes} хв`
          : `${hours} год ${minutes} хв`,
      tone: phase === "active" && totalSeconds < 7200 ? "danger" : phase,
    };
  }

  return {
    label:
      phase === "planned"
        ? `Старт через ${minutes} хв`
        : `${minutes} хв до завершення`,
    tone: phase === "active" && totalSeconds < 1800 ? "danger" : phase,
  };
}

function getShortDescription(auction) {
  const description = auction?.description?.trim();

  if (!description) return "";

  return description.length > 72 ? `${description.slice(0, 72)}...` : description;
}

function getAccessBadge(auction) {
  return getAuctionAccessLevelMeta(auction?.minimumRequiredStatus);
}

function isAuctionEarlyAccess(auction, now) {
  const earlyAccessStart = auction?.earlyAccessStartTime
    ? new Date(auction.earlyAccessStartTime).getTime()
    : null;

  return Boolean(earlyAccessStart && !Number.isNaN(earlyAccessStart) && earlyAccessStart <= now);
}

async function requestCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const response = await api.get("/api/profile/me");
  return response.data;
}

function AuctionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHistoryView = location.pathname.startsWith("/auction/history");
  const [auctions, setAuctions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sortMode, setSortMode] = useState("closest");
  const [now, setNow] = useState(Date.now());
  const showTransitionOverlay = useDeferredVisibility(loading && auctions.length > 0, 120, 260);
  const showInitialLoading = loading && auctions.length === 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!hasAuthToken()) {
      setNotifications([]);
      return;
    }

    try {
      if (!silent) {
        setNotificationsLoading(true);
      }

      const items = await getMyNotifications();
      setNotifications(items.filter((item) => !item?.isRead));
    } catch (err) {
      console.error("Failed to load auction notifications:", err);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), 3200);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [auctionsResponse, currentUserData, walletData] = await Promise.all([
          isHistoryView ? getAuctionHistory() : getAllAuctions(),
          requestCurrentUser().catch(() => null),
          getMyWallet().catch(() => null),
        ]);

        setAuctions(auctionsResponse);
        setCurrentUser(currentUserData);
        setWallet(walletData);
        if (currentUserData) {
          loadNotifications({ silent: true });
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Не вдалося завантажити аукціони.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [isHistoryView]);

  useEffect(() => {
    const syncCurrentUser = async () => {
      try {
        const [currentUserData, walletData] = await Promise.all([
          requestCurrentUser(),
          getMyWallet().catch(() => null),
        ]);
        setCurrentUser(currentUserData);
        setWallet(walletData);
      } catch {
        setCurrentUser(null);
        setWallet(null);
      }
    };

    const handleAuthChange = () => {
      syncCurrentUser();
      loadNotifications({ silent: true });
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (notification?.id) {
        await markNotificationAsRead(notification.id);
      }
    } catch (err) {
      console.error("Failed to mark auction notification as read:", err);
    } finally {
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    }
  };

  const categories = useMemo(() => {
    return CATEGORY_OPTIONS;
  }, []);

  const auctionCounts = useMemo(() => {
    const base = { active: 0, planned: 0, closed: 0, totalBids: 0 };

    for (const auction of auctions) {
      const phase = getAuctionPhase(auction, now);
      base[phase] += 1;
      base.totalBids += Number(auction?.bidCount ?? auction?.bidsCount ?? 0);
    }

    return base;
  }, [auctions, now]);

  const filteredAuctions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const nextAuctions = auctions.filter((auction) => {
      const phase = getAuctionPhase(auction, now);
      const matchesSearch =
        !normalizedSearch ||
        [
          auction.title,
          auction.brand,
          auction.category,
          auction.condition,
          auction.size,
          auction.description,
          auction.seller,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === "all" || statusFilter === phase;
      const matchesCategory =
        categoryFilter === "all" || normalizeCategory(auction.category) === categoryFilter;
      const accessLevel = getAccessBadge(auction).tone;
      const matchesAccess =
        accessFilter === "all" ||
        (accessFilter === "accessible" ? auction?.canCurrentUserAccess !== false : accessLevel === accessFilter) ||
        (accessFilter === "early" ? Boolean(auction?.earlyAccessStartTime) : false);

      return matchesSearch && matchesStatus && matchesCategory && matchesAccess;
    });

    nextAuctions.sort((first, second) => {
      if (sortMode === "priceDesc") {
        return Number(second.currentPrice || second.currentBid || 0) - Number(first.currentPrice || first.currentBid || 0);
      }

      if (sortMode === "priceAsc") {
        return Number(first.currentPrice || first.currentBid || 0) - Number(second.currentPrice || second.currentBid || 0);
      }

      if (sortMode === "newest") {
        return new Date(second.createdAt || second.startTime || 0).getTime() - new Date(first.createdAt || first.startTime || 0).getTime();
      }

      const firstPhase = getAuctionPhase(first, now);
      const secondPhase = getAuctionPhase(second, now);
      const firstAnchor =
        firstPhase === "planned"
          ? new Date(first.startTime || 0).getTime()
          : firstPhase === "active"
            ? new Date(first.endTime || 0).getTime()
            : new Date(first.endTime || first.startTime || 0).getTime();
      const secondAnchor =
        secondPhase === "planned"
          ? new Date(second.startTime || 0).getTime()
          : secondPhase === "active"
            ? new Date(second.endTime || 0).getTime()
            : new Date(second.endTime || second.startTime || 0).getTime();

      return firstAnchor - secondAnchor;
    });

    return nextAuctions;
  }, [accessFilter, auctions, categoryFilter, now, search, sortMode, statusFilter]);

  const userDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.userName ||
    "Гість";
  const userAvatarLetter = userDisplayName.charAt(0).toUpperCase();
  const { availableBalance, lockedBalance, balance, currency } = getWalletAmounts(wallet, currentUser);
  const normalizedStatus = normalizeAccountStatus(currentUser?.status);
  const statusMeta = getAccountStatusMeta(currentUser?.status);
  const isPremiumUser = normalizedStatus === "Elite";
  const isVipUser = normalizedStatus === "Private";
  const shouldShowLoginAction = !currentUser && /увійти/i.test(error);

  const navItems = [
    { label: "Головна", path: "/" },
    { label: "Аукціони", path: "/auction" },
    { label: "Профіль", path: "/profile" },
    { label: "Гаманець", path: "/wallet" },
    { label: "Про платформу", path: "/about" },
  ];

  const handleFavoriteToggle = async (event, auctionId, isFavorite) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      setError("Щоб додати лот в обране, потрібно увійти в акаунт.");
      return;
    }

    setError("");
    setAuctions((currentAuctions) =>
      currentAuctions.map((auction) =>
        auction.id === auctionId ? { ...auction, isFavorite: !isFavorite } : auction
      )
    );

    try {
      if (isFavorite) {
        await removeAuctionFromFavorites(auctionId);
      } else {
        await addAuctionToFavorites(auctionId);
      }
    } catch (err) {
      console.error(err);
      setAuctions((currentAuctions) =>
        currentAuctions.map((auction) =>
          auction.id === auctionId ? { ...auction, isFavorite } : auction
        )
      );
      setError(err?.response?.data?.message || "Не вдалося оновити обране.");
    }
  };

  if (showInitialLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarShell}>
              <div className={styles.sidebarSkeletonLarge} />
              <div className={styles.sidebarSkeletonCard} />
              <div className={styles.sidebarSkeletonCard} />
            </div>
          </aside>

          <main className={styles.content}>
            <section className={styles.loadingHero}>
              <div className={styles.loadingMain} />
              <div className={styles.loadingSide} />
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {error ? (
        <Toast message={error} type="error" onClose={() => setError("")} />
      ) : null}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarShell}>
            <button type="button" className={styles.brandBlock} onClick={() => navigate("/")}>
              <span className={styles.brandLabel}>Liorael</span>
              <strong>Аукціони</strong>
            </button>

            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div
                  className={`${styles.userAvatar} ${
                    isVipUser ? styles.userAvatarVip : isPremiumUser ? styles.userAvatarPremium : ""
                  }`}
                >
                  {isVipUser && (
                    <span className={styles.userAvatarCrown} aria-hidden="true">
                      <svg viewBox="0 0 24 24" className={styles.userAvatarCrownIcon}>
                        <path d="M4 18 2.5 7.5l5.2 3.7L12 4l4.3 7.2 5.2-3.7L20 18H4Z" />
                        <path d="M5 20h14" />
                      </svg>
                    </span>
                  )}
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={userDisplayName}
                      className={styles.userAvatarImage}
                    />
                  ) : (
                    userAvatarLetter
                  )}
                </div>
                <div>
                  <div className={styles.userName}>{userDisplayName}</div>
                  <div className={styles.userNick}>
                    {currentUser?.userName ? `@${currentUser.userName} • ${statusMeta.label}` : "Увійдіть для участі в торгах"}
                  </div>
                  {!currentUser ? (
                    <Link to="/auth" className={styles.sidebarLoginLink}>
                      Увійти
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className={styles.balanceBox}>
                <span>Доступно зараз</span>
                <strong>
                  {currentUser ? formatMoneyWithCurrency(availableBalance, currency) : "Авторизація потрібна"}
                </strong>
                {currentUser && (
                  <b>
                    Всього: {formatMoney(balance)} {currency} • У резерві: {formatMoney(lockedBalance)} {currency}
                  </b>
                )}
              </div>
            </div>

            <div className={styles.sidebarPanel}>
              <div className={styles.sidebarPanelTop}>
                <span>Тема інтерфейсу</span>
                <ThemeToggle />
              </div>
            </div>

            <section className={styles.notificationsPanel} aria-labelledby="auction-notifications-title">
              <button
                type="button"
                className={styles.notificationsToggle}
                aria-expanded={notificationsOpen}
                aria-controls="auction-sidebar-notifications"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <span id="auction-notifications-title" className={styles.notificationsTitle}>
                  Сповіщення
                </span>
                <span className={styles.notificationsToggleMeta}>
                  <span className={styles.notificationsCount}>
                    {notifications.length}
                  </span>
                  <span
                    className={`${styles.notificationsChevron} ${
                      notificationsOpen ? styles.notificationsChevronOpen : ""
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20">
                      <path d="m5 7.5 5 5 5-5" />
                    </svg>
                  </span>
                </span>
              </button>

              {notificationsOpen ? (
                <div id="auction-sidebar-notifications">
                  {currentUser ? (
                    notificationsLoading ? (
                      <div className={styles.notificationsEmpty}>Завантаження сповіщень...</div>
                    ) : notifications.length > 0 ? (
                      <div className={styles.notificationsList}>
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`${styles.notificationItem} ${styles.notificationItemUnread}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <span className={styles.notificationTitle}>
                              {notification.title || "Сповіщення"}
                            </span>
                            <span className={styles.notificationText}>
                              {notification.message || "Нове оновлення для вашого акаунта."}
                            </span>
                            <span className={styles.notificationTime}>
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.notificationsEmpty}>
                        Непрочитаних сповіщень немає
                      </div>
                    )
                  ) : (
                    <div className={styles.notificationsEmpty}>
                      Увійдіть в акаунт, щоб бачити сповіщення
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            <nav className={styles.sidebarNav} aria-label="Навігація сторінкою">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className={styles.content}>
          <section className={styles.hero}>
            <div className={`${styles.heroMain} ${showTransitionOverlay ? styles.contentSwitching : ""}`}>
              <span className={styles.kicker}>Каталог аукціонів</span>
              <h1 className={styles.title}>
                {isHistoryView ? "Історія аукціонів" : "Аукціони"}
              </h1>
            </div>
          </section>

          <section className={`${styles.statsStrip} ${showTransitionOverlay ? styles.contentSwitching : ""}`}>
            <div className={styles.heroStat}>
              <span>Усього аукціонів</span>
              <strong>{auctions.length}</strong>
            </div>
            <div className={styles.heroStat}>
              <span>Активні зараз</span>
              <strong>{auctionCounts.active}</strong>
            </div>
            <div className={styles.heroStat}>
              <span>Заплановані</span>
              <strong>{auctionCounts.planned}</strong>
            </div>
            <div className={styles.heroStat}>
              <span>Усього ставок</span>
              <strong>{auctionCounts.totalBids}</strong>
            </div>
          </section>

          <section className={`${styles.filtersPanel} ${showTransitionOverlay ? styles.contentSwitching : ""}`}>
            <div className={styles.filtersTop}>
              <div>
                <h2 className={styles.sectionTitle}>
                  {isHistoryView ? "Завершені аукціони" : "Усі аукціони"}
                </h2>
              </div>
              <div className={styles.resultsPill}>
                {filteredAuctions.length} {filteredAuctions.length === 1 ? "лот" : "лотів"}
              </div>
            </div>

            <div className={styles.filterChips}>
              <button
                type="button"
                className={`${styles.filterChip} ${!isHistoryView ? styles.filterChipActive : ""}`}
                onClick={() => navigate("/auction")}
              >
                Видимі аукціони
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${isHistoryView ? styles.filterChipActive : ""}`}
                onClick={() => navigate("/auction/history")}
              >
                Завершені
              </button>
            </div>

            <div className={styles.filterChips}>
              {[
                { id: "all", label: "Усі" },
                { id: "active", label: "Актуальні" },
                { id: "planned", label: "У планах" },
                { id: "closed", label: "Завершені" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.filterChip} ${
                    statusFilter === item.id ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setStatusFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.filterChips}>
              {[
                { id: "all", label: "Усі рівні" },
                { id: "accessible", label: "Доступні мені" },
                { id: "member", label: "Member" },
                { id: "elite", label: "Elite" },
                { id: "private", label: "Private" },
                { id: "early", label: "Ранній доступ" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.filterChip} ${
                    accessFilter === item.id ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setAccessFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.filterChips}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  categoryFilter === "all" ? styles.filterChipActive : ""
                }`}
                onClick={() => setCategoryFilter("all")}
              >
                Усі категорії
              </button>
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`${styles.filterChip} ${
                    categoryFilter === category.value ? styles.filterChipActive : ""
                  }`}
                  onClick={() => setCategoryFilter(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className={styles.filtersGrid}>
              <label className={styles.field}>
                <span>Пошук</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Наприклад, Prada, сумка, seller, black"
                />
              </label>

              <label className={styles.field}>
                <span>Сортування</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                >
                  <option value="closest">Найближчі першими</option>
                  <option value="newest">Найновіші</option>
                  <option value="priceDesc">Дорожчі першими</option>
                  <option value="priceAsc">Дешевші першими</option>
                </select>
              </label>
            </div>
          </section>

          {error && shouldShowLoginAction ? (
            <div className={styles.errorBox}>
              <Link to="/auth" className={styles.loginLink}>
                Увійти
              </Link>
            </div>
          ) : null}

          <section className={styles.catalogStage}>
            {showTransitionOverlay ? (
              <div className={styles.catalogOverlay} aria-hidden="true">
                <div className={styles.catalogOverlayBadge}>
                  {isHistoryView ? "Показуємо завершені торги" : "Показуємо актуальні торги"}
                </div>
              </div>
            ) : null}

            <div className={showTransitionOverlay ? styles.catalogContentMuted : styles.catalogContent}>
              {!filteredAuctions.length ? (
                <div className={styles.empty}>
                  <span className={styles.emptyLabel}>Нічого не знайдено</span>
                  <h3>Під поточні параметри немає лотів</h3>
                  <p>Спробуйте інший статус, категорію або пошуковий запит, щоб побачити більше результатів.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {filteredAuctions.map((auction) => {
                    const badge = getTimeBadge(auction, now);
                    const mainImage = getAuctionImage(auction);
                    const shortDescription = getShortDescription(auction);
                    const accessBadge = getAccessBadge(auction);
                    const isEarlyAccess = isAuctionEarlyAccess(auction, now);
                    const accessMessage =
                      auction?.accessDeniedMessage ||
                      (accessBadge.tone === "private"
                        ? "Цей аукціон доступний лише для користувачів рівня Private."
                        : accessBadge.tone === "elite"
                          ? "Ця функція доступна для статусу Elite або Private."
                          : "");

                    return (
                      <article key={auction.id} className={styles.card}>
                        <div className={styles.cardMedia}>
                          <div className={styles.cardMediaInner}>
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={auction.title}
                              className={styles.cardImage}
                            />
                          ) : (
                            <div className={styles.noImage}>Немає фото</div>
                          )}
                          </div>

                          <div className={styles.cardTopline}>
                            <span
                              className={`${styles.statusBadge} ${
                                accessBadge.tone === "private"
                                  ? styles.statusBadgePrivate
                                  : accessBadge.tone === "elite"
                                    ? styles.statusBadgeElite
                                    : ""
                              }`}
                            >
                              {accessBadge.shortLabel}
                            </span>
                            <span
                              className={`${styles.timerBadge} ${
                                badge.tone === "danger" ? styles.timerDanger : ""
                              }`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`${styles.favoriteButton} ${
                              auction.isFavorite ? styles.favoriteButtonActive : ""
                            }`}
                            onClick={(event) =>
                              handleFavoriteToggle(event, auction.id, auction.isFavorite)
                            }
                            aria-label={
                              auction.isFavorite ? "Прибрати з обраного" : "Додати в обране"
                            }
                          >
                            {auction.isFavorite ? "♥" : "♡"}
                          </button>
                        </div>

                        <div className={styles.cardBody}>
                          <div className={styles.cardCopy}>
                            <div className={styles.brandLine}>{auction.brand || "Добірний лот"}</div>
                            <h3 className={styles.cardTitle}>{auction.title}</h3>
                            {shortDescription ? (
                              <p className={styles.cardDescription}>{shortDescription}</p>
                            ) : null}
                          </div>

                          <div className={styles.cardStats}>
                            <div className={styles.priceTile}>
                              <span>{getAuctionMetaDateLabel(auction, now)}</span>
                              <strong>{formatDate(auction.startTime)}</strong>
                            </div>
                            <div className={styles.priceTile}>
                              <span>Ціна</span>
                              <strong>
                                {formatMoneyWithCurrency(
                                  auction.currentPrice || auction.currentBid || 0,
                                  auction.currency || "UAH"
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className={styles.cardMeta}>
                            <span>{getCategoryLabel(auction.category)}</span>
                            <span>{getLocalizedCondition(auction.condition)}</span>
                            <span>{getLocalizedSize(auction.size)}</span>
                            {isEarlyAccess ? <span>Ранній доступ</span> : null}
                          </div>

                          {accessMessage && !auction?.canCurrentUserAccess ? (
                            <p className={styles.cardAccessNote}>{accessMessage}</p>
                          ) : null}

                          <div className={styles.cardFooter}>
                            <Link to={`/auction/${auction.id}`} className={styles.openLink}>
                              Переглянути лот
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AuctionsPage;
