import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import styles from "./Header.module.css";
import api from "../api/axios";

const mockNotifications = [];

function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

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

      const res = await api.get("/api/profile/me", getAuthConfig());
      const me = res.data;

      setUser(me);
      setAvatarVersion(Date.now());
    } catch (error) {
      console.error("Failed to load header user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      loadUser();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    setNotificationsOpen(false);
    setUser(null);
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

  const nickname = user?.userName ? `@${user.userName}` : displayName;
  const balanceLabel = `${(user?.balance ?? 0).toLocaleString("uk-UA")} ₴`;
  const firstLetter = displayName.charAt(0).toUpperCase();
  const isAuth = !!user;

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
            Про нас
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
              </button>

              {notificationsOpen && (
                <div className={styles.notificationsPopover}>
                  <div className={styles.notificationsHeader}>
                    <span className={styles.notificationsTitle}>
                      Сповіщення
                    </span>
                    <span className={styles.notificationsCount}>
                      {mockNotifications.length}
                    </span>
                  </div>

                  {mockNotifications.length > 0 ? (
                    <ul className={styles.notificationsList}>
                      {mockNotifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={styles.notificationItem}
                        >
                          <span className={styles.notificationText}>
                            {notification.text}
                          </span>
                          <span className={styles.notificationTime}>
                            {notification.time}
                          </span>
                        </li>
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
                  <div className={styles.avatar}>
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
                    <span className={styles.profileBalance}>{balanceLabel}</span>
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