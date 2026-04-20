import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import styles from "./AuctionsPage.module.css";

const AUCTIONS_RESPONSE_KEYS = ["items", "data", "results", "content", "auctions"];

function normalizeAuctionsResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const key of AUCTIONS_RESPONSE_KEYS) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
}

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeLeftParts(value, now) {
  if (!value) {
    return { label: "Дата уточнюється", tone: "muted" };
  }

  const target = new Date(value).getTime();

  if (Number.isNaN(target)) {
    return { label: "Дата уточнюється", tone: "muted" };
  }

  const diff = target - now;

  if (diff <= 0) {
    return { label: "Завершено", tone: "finished" };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return { label: `${days} д ${hours} год`, tone: "normal" };
  }

  if (hours > 0) {
    return { label: `${hours} год ${minutes} хв`, tone: "normal" };
  }

  return {
    label: `${Math.max(minutes, 0)}:${String(Math.max(seconds, 0)).padStart(2, "0")}`,
    tone: totalSeconds < 900 ? "danger" : "normal",
  };
}

function getStatusLabel(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "active") return "Активний";
  if (normalizedStatus === "draft") return "Чернетка";
  if (normalizedStatus === "finished" || normalizedStatus === "closed") {
    return "Завершено";
  }

  return status || "Лот";
}

function isAuctionActive(auction, now) {
  const normalizedStatus = String(auction?.status || "").toLowerCase();
  const endTime = auction?.endTime ? new Date(auction.endTime).getTime() : null;
  const startTime = auction?.startTime ? new Date(auction.startTime).getTime() : null;

  if (["finished", "closed"].includes(normalizedStatus)) {
    return false;
  }

  if (normalizedStatus === "draft") {
    return false;
  }

  if (startTime && !Number.isNaN(startTime) && startTime > now) {
    return false;
  }

  if (endTime && !Number.isNaN(endTime) && endTime <= now) {
    return false;
  }

  if (!normalizedStatus) {
    return Boolean(endTime ? endTime > now : true);
  }

  return true;
}

function getStatusTone(auction, now) {
  const normalizedStatus = String(auction?.status || "").toLowerCase();

  if (isAuctionActive(auction, now)) return "active";
  if (normalizedStatus === "draft") return "draft";
  if (normalizedStatus === "finished" || normalizedStatus === "closed") {
    return "closed";
  }

  return "default";
}

function getMainImage(auction) {
  if (!auction?.images?.length) return "";
  return auction.images[0].imageUrl;
}

function getShortDescription(auction) {
  const description = auction?.description?.trim();

  if (!description) {
    return "Коротка презентація лота для клієнта: фото, бренд, ставка та дедлайн без перевантаження деталями.";
  }

  return description.length > 140 ? `${description.slice(0, 140)}...` : description;
}

async function requestCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const response = await api.get("/api/profile/me");
  return response.data;
}

function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortMode, setSortMode] = useState("ending");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        const [auctionsResponse, currentUserData] = await Promise.all([
          api.get("/api/auctions"),
          requestCurrentUser().catch(() => null),
        ]);

        const nextAuctions = normalizeAuctionsResponse(auctionsResponse.data)
          .filter((auction) => auction?.id);

        setAuctions(nextAuctions);
        setCurrentUser(currentUserData);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message || "Не вдалося завантажити аукціони."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  useEffect(() => {
    const syncCurrentUser = async () => {
      try {
        const currentUserData = await requestCurrentUser();
        setCurrentUser(currentUserData);
      } catch {
        setCurrentUser(null);
      }
    };

    const handleAuthChange = () => {
      syncCurrentUser();
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const categories = useMemo(() => {
    return [...new Set(auctions.map((auction) => auction.category).filter(Boolean))];
  }, [auctions]);

  const filteredAuctions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const nextAuctions = auctions.filter((auction) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          auction.title,
          auction.brand,
          auction.category,
          auction.condition,
          auction.size,
          auction.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const normalizedStatus = String(auction.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isAuctionActive(auction, now)) ||
        (statusFilter === "closed" &&
          !isAuctionActive(auction, now) &&
          ["finished", "closed"].includes(normalizedStatus)) ||
        (statusFilter === "draft" && normalizedStatus === "draft");

      const matchesCategory =
        categoryFilter === "all" || auction.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    nextAuctions.sort((first, second) => {
      if (sortMode === "priceDesc") {
        return Number(second.currentPrice || 0) - Number(first.currentPrice || 0);
      }

      if (sortMode === "priceAsc") {
        return Number(first.currentPrice || 0) - Number(second.currentPrice || 0);
      }

      if (sortMode === "newest") {
        return new Date(second.startTime || 0).getTime() - new Date(first.startTime || 0).getTime();
      }

      const firstEndTime = first?.endTime
        ? new Date(first.endTime).getTime()
        : Number.MAX_SAFE_INTEGER;
      const secondEndTime = second?.endTime
        ? new Date(second.endTime).getTime()
        : Number.MAX_SAFE_INTEGER;

      return firstEndTime - secondEndTime;
    });

    return nextAuctions;
  }, [auctions, categoryFilter, now, search, sortMode, statusFilter]);

  const activeAuctionsCount = auctions.filter(
    (auction) => isAuctionActive(auction, now)
  ).length;

  const endingSoonAuction = useMemo(() => {
    return [...auctions]
      .filter((auction) => {
        const endTime = auction?.endTime ? new Date(auction.endTime).getTime() : 0;
        return endTime > now;
      })
      .sort((first, second) => {
        return new Date(first.endTime).getTime() - new Date(second.endTime).getTime();
      })[0] || null;
  }, [auctions, now]);

  const topPriceAuction = useMemo(() => {
    return [...auctions].sort(
      (first, second) => Number(second.currentPrice || 0) - Number(first.currentPrice || 0)
    )[0] || null;
  }, [auctions]);

  const userDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.userName ||
    "Гість";
  const userAvatarLetter = userDisplayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <span className={styles.kicker}>Live showroom</span>
              <h1 className={styles.title}>Готуємо аукціони до показу</h1>
              <p className={styles.subtitle}>
                Завантажуємо лоти, поточні ставки та таймери в реальному часі.
              </p>
            </div>
            <div className={styles.heroAside}>
              <div className={styles.loadingPulse} />
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <span className={styles.kicker}>Live showroom</span>
            <h1 className={styles.title}>Аукціони у форматі швидкої вітрини</h1>
            <p className={styles.subtitle}>
              Клієнт одразу бачить лот, картинку, поточну ціну та час до завершення.
              Далі вже відкриває красивий екран торгів.
            </p>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span>Активні</span>
                <strong>{activeAuctionsCount}</strong>
              </div>
              <div className={styles.heroStat}>
                <span>Категорії</span>
                <strong>{categories.length}</strong>
              </div>
              <div className={styles.heroStat}>
                <span>Топ ставка</span>
                <strong>
                  {topPriceAuction ? `${formatPrice(topPriceAuction.currentPrice)} ₴` : "—"}
                </strong>
              </div>
            </div>
          </div>

          <aside className={styles.heroAside}>
            <div className={styles.userCard}>
              <div className={styles.userHeader}>
                <div className={styles.userAvatar}>
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
                    {currentUser?.userName ? `@${currentUser.userName}` : "Не авторизований"}
                  </div>
                </div>
              </div>

              <div className={styles.userBalanceCard}>
                <span>Баланс</span>
                <strong>
                  {currentUser ? `${formatPrice(currentUser.balance)} ₴` : "Увійди в акаунт"}
                </strong>
              </div>

              <div className={styles.heroMiniPanel}>
                <span>Завершується першим</span>
                <strong>
                  {endingSoonAuction
                    ? getTimeLeftParts(endingSoonAuction.endTime, now).label
                    : "Немає активних лотів"}
                </strong>
                <b>{endingSoonAuction?.title || "Очікуємо нові лоти"}</b>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.filtersPanel}>
          <div className={styles.filtersTop}>
            <div>
              <h2 className={styles.sectionTitle}>Знайти потрібний лот</h2>
              <p className={styles.sectionText}>
                Фільтри без переходів по вкладках: швидкий пошук, категорії та сортування.
              </p>
            </div>
            <div className={styles.resultsPill}>
              {filteredAuctions.length} {filteredAuctions.length === 1 ? "лот" : "лотів"}
            </div>
          </div>

          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span>Пошук</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Наприклад, Prada, сумка, S, black"
              />
            </label>

            <label className={styles.field}>
              <span>Категорія</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Усі категорії</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Статус</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="active">Активні</option>
                <option value="all">Усі</option>
                <option value="closed">Завершені</option>
                <option value="draft">Чернетки</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Сортування</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                <option value="ending">Швидко завершуються</option>
                <option value="priceDesc">Дорожчі першими</option>
                <option value="priceAsc">Дешевші першими</option>
                <option value="newest">Найновіші</option>
              </select>
            </label>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        {!filteredAuctions.length ? (
          <div className={styles.empty}>
            <span className={styles.emptyLabel}>Нічого не знайдено</span>
            <h3>Під фільтри зараз немає лотів</h3>
            <p>Спробуй змінити пошук, статус або категорію, щоб побачити більше результатів.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredAuctions.map((auction) => {
              const timeLeft = getTimeLeftParts(auction.endTime, now);

              return (
                <Link
                  key={auction.id}
                  to={`/auction/${auction.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardMedia}>
                    <div className={styles.cardOverlay} />
                    <div className={styles.cardTopline}>
                      <span
                        className={`${styles.statusBadge} ${styles[`status${getStatusTone(auction, now)[0].toUpperCase()}${getStatusTone(auction, now).slice(1)}`]}`}
                      >
                        {getStatusLabel(auction.status)}
                      </span>
                      <span
                        className={`${styles.timerBadge} ${
                          timeLeft.tone === "danger" ? styles.timerDanger : ""
                        }`}
                      >
                        {timeLeft.label}
                      </span>
                    </div>

                    {getMainImage(auction) ? (
                      <img
                        src={getMainImage(auction)}
                        alt={auction.title}
                        className={styles.cardImage}
                      />
                    ) : (
                      <div className={styles.noImage}>Немає фото</div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeading}>
                      <div>
                        <div className={styles.brandLine}>{auction.brand || "Curated lot"}</div>
                        <h3 className={styles.cardTitle}>{auction.title}</h3>
                      </div>
                      <div className={styles.endDate}>
                        <span>До</span>
                        <strong>{formatDate(auction.endTime)}</strong>
                      </div>
                    </div>

                    <p className={styles.cardDescription}>{getShortDescription(auction)}</p>

                    <div className={styles.cardTags}>
                      <span>{auction.category || "Категорія"}</span>
                      <span>{auction.condition || "Стан не вказано"}</span>
                      <span>{auction.size || "Розмір —"}</span>
                    </div>

                    <div className={styles.cardStats}>
                      <div className={styles.priceTile}>
                        <span>Поточна ставка</span>
                        <strong>{formatPrice(auction.currentPrice)} ₴</strong>
                      </div>
                      <div className={styles.priceTile}>
                        <span>Старт</span>
                        <strong>{formatPrice(auction.startPrice)} ₴</strong>
                      </div>
                      <div className={styles.priceTile}>
                        <span>Крок</span>
                        <strong>{formatPrice(auction.minBidStep)} ₴</strong>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.liveLine}>
                        <span className={styles.liveDot} />
                        Таймер оновлюється автоматично
                      </div>
                      <div className={styles.openLink}>Відкрити аукціон</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionsPage;
