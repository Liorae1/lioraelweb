import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";
import api from "../api/axios";
import { getMyWallet } from "../api/wallet";
import {
  getMyNotifications,
  getMyUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notifications";
import {
  formatMoneyWithCurrency,
  getAccountStatusMeta,
  getWalletAmounts,
  normalizeAccountStatus,
} from "../utils/domain";

function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const userControlsRef = useRef(null);
  const menuRef = useRef(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const [profileResponse, walletData] = await Promise.all([
        api.get("/api/profile/me", getAuthConfig()),
        getMyWallet().catch(() => null),
      ]);
      const me = profileResponse.data;

      setUser(me);
      setWallet(walletData);
      setAvatarVersion(Date.now());
    } catch (error) {
      console.error("Failed to load header user:", error);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!localStorage.getItem("token")) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      if (!silent) {
        setNotificationsLoading(true);
      }

      const [items, count] = await Promise.all([
        getMyNotifications(),
        getMyUnreadNotificationsCount().catch(() => 0),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      loadUser();
      loadNotifications({ silent: true });
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (
        userControlsRef.current &&
        !userControlsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    loadUser();
    loadNotifications({ silent: true });

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    setNotificationsOpen(false);
    setUser(null);
    setWallet(null);
    setNotifications([]);
    setUnreadCount(0);
    window.dispatchEvent(new Event("authChanged"));
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.userName ||
    user?.email ||
    "Користувач";

  const nickname = user?.userName ? `${user.userName}` : displayName;
  const { availableBalance, currency } = getWalletAmounts(wallet, user);
  const balanceLabel = formatMoneyWithCurrency(availableBalance, currency);
  const firstLetter = displayName.charAt(0).toUpperCase();
  const isAuth = !!user;
  const normalizedStatus = normalizeAccountStatus(user?.status);
  const statusMeta = getAccountStatusMeta(user?.status);
  const isPremium = normalizedStatus === "Elite";
  const isVip = normalizedStatus === "Private";

  const avatarSrc = (() => {
    const rawUrl = user?.avatarUrl?.trim();

    if (!rawUrl) {
      return null;
    }

    if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
      return rawUrl;
    }

    return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}v=${avatarVersion}`;
  })();

  const formatNotificationTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const resolveNotificationTarget = (notification) => {
    if (notification?.targetUrl) {
      return notification.targetUrl;
    }

    if (notification?.auctionId) {
      return `/auction/${notification.auctionId}`;
    }

    return "/profile";
  };

  const openNotificationTarget = (target) => {
    if (!target) {
      navigate("/profile");
      return;
    }

    const isExternalTarget = /^https?:\/\//i.test(target);

    if (isExternalTarget) {
      window.location.assign(target);
      return;
    }

    navigate(target);
  };

  const handleNotificationClick = async (notification) => {
    const target = resolveNotificationTarget(notification);

    try {
      if (!notification?.isRead && notification?.id) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - (notification?.isRead ? 0 : 1)));
      setNotificationsOpen(false);
      openNotificationTarget(target);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.logo}>Liorael</div>
          <div className={styles.subtitle}>Аукціони брендового одягу</div>
        </Link>

        <nav className={styles.nav}>
          <Link
            to="/"
            className={`${styles.link} ${isActive("/") ? styles.active : ""}`}
          >
            Головна
          </Link>

          <Link
            to="/auction"
            className={`${styles.link} ${isActive("/auction") ? styles.active : ""}`}
          >
            Аукціони
          </Link>

          <Link
            to="/about"
            className={`${styles.link} ${isActive("/about") ? styles.active : ""}`}
          >
            Про платформу
          </Link>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />

          {!loading && isAuth ? (
            <div className={styles.userControls} ref={userControlsRef}>
              <button
                type="button"
                className={styles.notificationButton}
                aria-label="Сповіщення"
                title="Сповіщення"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setMenuOpen(false);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={styles.notificationIcon}
                >
                  <path
                    d="M12 3.75a4.5 4.5 0 0 0-4.5 4.5v1.18c0 .82-.24 1.62-.7 2.3l-1.03 1.55a1.75 1.75 0 0 0 1.46 2.72h9.54a1.75 1.75 0 0 0 1.46-2.72l-1.03-1.55a4.1 4.1 0 0 1-.7-2.3V8.25a4.5 4.5 0 0 0-4.5-4.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.75 18a2.25 2.25 0 0 0 4.5 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className={styles.notificationsPopover}>
                  <div className={styles.notificationsHeader}>
                    <span className={styles.notificationsTitle}>
                      Сповіщення
                    </span>
                    <span className={styles.notificationsCount}>
                      {unreadCount}
                    </span>
                  </div>

                  {!!notifications.length && (
                    <button
                      type="button"
                      className={styles.readAllButton}
                      onClick={handleReadAllNotifications}
                    >
                      Позначити все як прочитане
                    </button>
                  )}

                  {notificationsLoading ? (
                    <div className={styles.notificationsEmpty}>
                      Завантаження сповіщень...
                    </div>
                  ) : notifications.length > 0 ? (
                    <ul className={styles.notificationsList}>
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`${styles.notificationItem} ${
                            notification.isRead ? "" : styles.notificationItemUnread
                          }`}
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
                    </ul>
                  ) : (
                    <div className={styles.notificationsEmpty}>
                      Список сповіщень порожній
                    </div>
                  )}
                </div>
              )}

              <div className={styles.profileMenuWrapper} ref={menuRef}>
                <button
                  type="button"
                  className={styles.profileButton}
                  onClick={() => {
                    setMenuOpen((prev) => !prev);
                    setNotificationsOpen(false);
                  }}
                >
                  <div
                    className={`${styles.avatar} ${
                      isVip ? styles.avatarVip : isPremium ? styles.avatarPremium : ""
                    }`}
                  >
                    {isVip && (
                      <span className={styles.crownBadge} aria-hidden="true">
                        <svg viewBox="0 0 24 24" className={styles.crownIcon}>
                          <path d="M4 18 2.5 7.5l5.2 3.7L12 4l4.3 7.2 5.2-3.7L20 18H4Z" />
                          <path d="M5 20h14" />
                        </svg>
                      </span>
                    )}
                    {avatarSrc ? (
                      <img
                        key={avatarSrc}
                        src={avatarSrc}
                        alt={displayName}
                        className={styles.avatarImage}
                      />
                    ) : (
                      firstLetter
                    )}
                  </div>

                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{nickname}</span>
                    <span className={styles.profileBalance}>{statusMeta.label} • {balanceLabel}</span>
                  </div>

                  <span
                    className={`${styles.arrow} ${
                      menuOpen ? styles.arrowOpen : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {menuOpen && (
                  <div className={styles.dropdown}>
                    <Link
                      to="/profile"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      Профіль
                    </Link>

                    <Link
                      to="/wallet"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      Гаманець
                    </Link>

                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      Вийти
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            !loading &&
            location.pathname !== "/auth" && (
              <Link to="/auth" className={styles.authButton}>
                Увійти / Зареєструватися
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
