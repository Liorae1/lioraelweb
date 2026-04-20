import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { getMyWallet, getMyWalletTransactions } from "../api/wallet";
import styles from "./AuctionDetailsPage.module.css";

function normalizeAuctionResponse(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return null;
}

function normalizeBidsResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;

  return [];
}

function getBidUserProfile(bid) {
  const nestedUser =
    bid?.user ||
    bid?.bidder ||
    bid?.participant ||
    bid?.profile ||
    bid?.author ||
    null;

  const firstName =
    nestedUser?.firstName ||
    bid?.firstName ||
    bid?.bidderFirstName ||
    bid?.userFirstName ||
    "";
  const lastName =
    nestedUser?.lastName ||
    bid?.lastName ||
    bid?.bidderLastName ||
    bid?.userLastName ||
    "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const userName =
    nestedUser?.userName ||
    nestedUser?.username ||
    bid?.userName ||
    bid?.username ||
    bid?.bidderUserName ||
    bid?.bidderUsername ||
    "";
  const avatarUrl =
    nestedUser?.avatarUrl ||
    bid?.avatarUrl ||
    bid?.bidderAvatarUrl ||
    bid?.userAvatarUrl ||
    "";

  return {
    displayName: fullName || userName || "Користувач",
    userName: userName || "",
    avatarUrl: avatarUrl || "",
  };
}

function normalizeMediaUrl(rawUrl) {
  const value = rawUrl?.trim();

  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  const baseUrl = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;

  return `${baseUrl}${path}`;
}

function buildUserMatchKeys(user) {
  return new Set(
    [
      user?.id,
      user?.userId,
      user?.profileId,
      user?.sub,
      user?.email,
      user?.userName,
      user?.username,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  );
}

function enrichBidderWithCurrentUser(bid, currentUser) {
  if (!currentUser) {
    return {
      ...bid,
      bidder: {
        ...bid.bidder,
        avatarUrl: normalizeMediaUrl(bid.bidder?.avatarUrl),
      },
    };
  }

  const currentUserKeys = buildUserMatchKeys(currentUser);
  const bidKeys = buildUserMatchKeys({
    id: bid?.userId || bid?.bidderId || bid?.participantId,
    userId: bid?.user?.id || bid?.bidder?.id || bid?.profile?.id,
    profileId: bid?.profileId,
    sub: bid?.sub,
    email: bid?.email || bid?.user?.email || bid?.bidder?.email,
    userName:
      bid?.userName ||
      bid?.username ||
      bid?.bidderUserName ||
      bid?.bidderUsername ||
      bid?.user?.userName ||
      bid?.bidder?.userName,
    username: bid?.user?.username || bid?.bidder?.username,
  });

  const isCurrentUserBid = [...bidKeys].some((key) => currentUserKeys.has(key));

  if (!isCurrentUserBid) {
    return {
      ...bid,
      bidder: {
        ...bid.bidder,
        avatarUrl: normalizeMediaUrl(bid.bidder?.avatarUrl),
      },
    };
  }

  const currentDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim() ||
    currentUser?.userName ||
    currentUser?.username ||
    bid.bidder?.displayName ||
    "Користувач";

  return {
    ...bid,
    bidder: {
      displayName:
        bid.bidder?.displayName && bid.bidder.displayName !== "Користувач"
          ? bid.bidder.displayName
          : currentDisplayName,
      userName: bid.bidder?.userName || currentUser?.userName || currentUser?.username || "",
      avatarUrl: normalizeMediaUrl(bid.bidder?.avatarUrl || currentUser?.avatarUrl),
    },
  };
}

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return date.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeLeft(value, now) {
  if (!value) return "Дата уточнюється";

  const target = new Date(value).getTime();

  if (Number.isNaN(target)) return "Дата уточнюється";

  const diff = target - now;

  if (diff <= 0) return "Аукціон завершено";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} д ${hours} год`;
  if (hours > 0) return `${hours} год ${minutes} хв`;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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

function getShortDescription(description) {
  if (!description?.trim()) {
    return "Коротка картка для клієнта: головне фото, поточна ставка та дедлайн. Детальна історія торгів уже нижче.";
  }

  return description.length > 180 ? `${description.slice(0, 180)}...` : description;
}

async function requestAuction(auctionId) {
  const response = await api.get(`/api/auctions/${auctionId}`);
  return normalizeAuctionResponse(response.data);
}

async function requestBids(auctionId) {
  const response = await api.get(`/api/auctions/${auctionId}/bids`);
  return normalizeBidsResponse(response.data)
    .map((bid) => ({
      ...bid,
      bidder: getBidUserProfile(bid),
    }))
    .sort((first, second) => {
      const firstTime = first?.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second?.createdAt ? new Date(second.createdAt).getTime() : 0;

      return secondTime - firstTime;
    });
}

async function requestCurrentUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const response = await api.get("/api/profile/me");
  return response.data;
}

function AuctionDetailsPage() {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const applyAuctionData = (auctionData) => {
    setAuction(auctionData);

    if (auctionData?.images?.length) {
      setSelectedImage((currentImage) => {
        const hasCurrentImage = auctionData.images.some(
          (image) => image.imageUrl === currentImage
        );

        return hasCurrentImage ? currentImage : auctionData.images[0].imageUrl;
      });
    } else {
      setSelectedImage("");
    }
  };

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
        setSuccessMessage("");

        const [auctionData, bidsData, currentUserData, walletData, walletTransactionsData] = await Promise.all([
          requestAuction(id),
          requestBids(id),
          requestCurrentUser().catch(() => null),
          getMyWallet().catch(() => null),
          getMyWalletTransactions().catch(() => []),
        ]);

        applyAuctionData(auctionData);
        setBids(bidsData);
        setCurrentUser(currentUserData);
        setWallet(walletData);
        setWalletTransactions(walletTransactionsData);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message || "Не вдалося завантажити аукціон."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id]);

  useEffect(() => {
    const syncCurrentUser = async () => {
      try {
        const currentUserData = await requestCurrentUser();
        const walletData = await getMyWallet().catch(() => null);
        const walletTransactionsData = await getMyWalletTransactions().catch(() => []);
        setCurrentUser(currentUserData);
        setWallet(walletData);
        setWalletTransactions(walletTransactionsData);
      } catch {
        setCurrentUser(null);
        setWallet(null);
        setWalletTransactions([]);
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

  const minimumBid = useMemo(() => {
    if (!auction) return 0;

    return Number(auction.currentPrice || 0) + Number(auction.minBidStep || 0);
  }, [auction]);

  const isAuctionActive = useMemo(() => {
    const status = String(auction?.status || "").toLowerCase();
    const endTime = auction?.endTime ? new Date(auction.endTime).getTime() : null;

    if (status && !["active", "live", "running"].includes(status)) {
      return false;
    }

    if (endTime && !Number.isNaN(endTime) && endTime <= now) {
      return false;
    }

    return true;
  }, [auction, now]);

  const auctionProgress = useMemo(() => {
    if (!auction?.startTime || !auction?.endTime) return 0;

    const startTime = new Date(auction.startTime).getTime();
    const endTime = new Date(auction.endTime).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
      return 0;
    }

    if (now <= startTime) return 0;
    if (now >= endTime) return 100;

    return ((now - startTime) / (endTime - startTime)) * 100;
  }, [auction, now]);

  const availableBalance = Number(
    wallet?.availableBalance ?? wallet?.balance ?? currentUser?.balance ?? 0
  );
  const lockedBalance = Number(wallet?.lockedBalance ?? 0);
  const isAuthenticated = !!currentUser;
  const parsedBidAmount = Number(bidAmount);
  const enteredBidAmount = Number.isFinite(parsedBidAmount) ? parsedBidAmount : 0;
  const requestedBidAmount = enteredBidAmount > 0 ? enteredBidAmount : minimumBid;
  const hasEnoughBalance = availableBalance >= requestedBidAmount;

  const countdown = formatTimeLeft(auction?.endTime, now);
  const enrichedBids = useMemo(() => {
    return bids.map((bid) => enrichBidderWithCurrentUser(bid, currentUser));
  }, [bids, currentUser]);
  const userDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.userName ||
    "Гість";
  const userAvatarLetter = userDisplayName.charAt(0).toUpperCase();
  const currentUserAvatarUrl = normalizeMediaUrl(currentUser?.avatarUrl);

  const quickBidValues = useMemo(() => {
    if (!minimumBid) return [];
    return [minimumBid, minimumBid + Number(auction?.minBidStep || 0), minimumBid + Number(auction?.minBidStep || 0) * 2];
  }, [auction?.minBidStep, minimumBid]);

  const bidGuardMessage = useMemo(() => {
    if (!isAuthenticated) {
      return "Щоб зробити ставку, потрібно увійти в акаунт.";
    }

    if (!isAuctionActive) {
      return "Ставки для цього аукціону зараз недоступні.";
    }

    if (availableBalance < minimumBid) {
      return `На балансі недостатньо коштів для мінімальної ставки ${formatPrice(minimumBid)} ₴.`;
    }

    if (bidAmount && !hasEnoughBalance) {
      return `Недостатньо коштів для ставки ${formatPrice(requestedBidAmount)} ₴.`;
    }

    return "";
  }, [
    availableBalance,
    bidAmount,
    hasEnoughBalance,
    isAuctionActive,
    isAuthenticated,
    minimumBid,
    requestedBidAmount,
  ]);

  const isBidDisabled = bidLoading || Boolean(bidGuardMessage);

  const handleBidSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const nextAmount = Number(bidAmount);

    if (!token) {
      setSuccessMessage("");
      setError("Щоб зробити ставку, потрібно увійти в акаунт.");
      return;
    }

    if (!Number.isFinite(nextAmount) || nextAmount < minimumBid) {
      setSuccessMessage("");
      setError(`Мінімальна ставка зараз ${formatPrice(minimumBid)} ₴.`);
      return;
    }

    if (!isAuctionActive) {
      setSuccessMessage("");
      setError("Ставки для цього аукціону зараз недоступні.");
      return;
    }

    if (availableBalance < nextAmount) {
      setSuccessMessage("");
      setError(
        `Недостатньо коштів на балансі. Доступно ${formatPrice(availableBalance)} ₴.`
      );
      return;
    }

    try {
      setBidLoading(true);
      setError("");
      setSuccessMessage("");

      await api.post(`/api/auctions/${id}/bids`, {
        amount: nextAmount,
      });

      setSuccessMessage("Ставку успішно зроблено.");
      setBidAmount("");

      const [
        auctionData,
        bidsData,
        currentUserData,
        walletData,
        walletTransactionsData,
      ] = await Promise.all([
        requestAuction(id),
        requestBids(id),
        requestCurrentUser().catch(() => currentUser),
        getMyWallet().catch(() => wallet),
        getMyWalletTransactions().catch(() => walletTransactions),
      ]);

      applyAuctionData(auctionData);
      setBids(bidsData);
      setCurrentUser(currentUserData);
      setWallet(walletData);
      setWalletTransactions(walletTransactionsData);
      window.dispatchEvent(new Event("authChanged"));
    } catch (err) {
      console.error(err);

      if (err?.response?.status === 401) {
        setError("Сесію завершено. Увійди в акаунт ще раз, щоб продовжити.");
      } else {
        setError(err?.response?.data?.message || "Не вдалося зробити ставку.");
      }
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <p>Завантаження аукціону...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>Аукціон не знайдено</h1>
            <p>Можливо, лот уже завершився або посилання стало неактуальним.</p>
            {error && <div className={styles.alertError}>{error}</div>}
            <Link to="/auction" className={styles.primaryButton}>
              Повернутися до аукціонів
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Link to="/">Головна</Link>
          <span>/</span>
          <Link to="/auction">Аукціони</Link>
          <span>/</span>
          <span>{auction.title}</span>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {successMessage && <div className={styles.alertSuccess}>{successMessage}</div>}

        <section className={styles.hero}>
          <div className={styles.visualStage}>
            <div className={styles.visualTopline}>
              <span className={styles.statusBadge}>{getStatusLabel(auction.status)}</span>
              <span className={styles.liveBadge}>Live timer: {countdown}</span>
            </div>

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={auction.title}
                className={styles.mainImage}
              />
            ) : (
              <div className={styles.mainImagePlaceholder}>Немає зображення</div>
            )}

            {auction.images?.length > 0 && (
              <div className={styles.thumbnailRail}>
                {auction.images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className={
                      selectedImage === image.imageUrl
                        ? styles.thumbnailActive
                        : styles.thumbnailMuted
                    }
                    onClick={() => setSelectedImage(image.imageUrl)}
                  >
                    <img src={image.imageUrl} alt={auction.title} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.commandPanel}>
            <div className={styles.headingBlock}>
              <p className={styles.brand}>{auction.brand || "Curated lot"}</p>
              <h1>{auction.title}</h1>
              <p className={styles.lead}>{getShortDescription(auction.description)}</p>
            </div>

            <div className={styles.heroCards}>
              <div className={styles.heroCard}>
                <span>Поточна ставка</span>
                <strong>{formatPrice(auction.currentPrice)} ₴</strong>
              </div>
              <div className={styles.heroCard}>
                <span>Наступна ставка</span>
                <strong>{formatPrice(minimumBid)} ₴</strong>
              </div>
              <div className={styles.heroCard}>
                <span>До завершення</span>
                <strong>{countdown}</strong>
              </div>
            </div>

            <div className={styles.userDock}>
              <div className={styles.userIdentity}>
                <div className={styles.userAvatar}>
                  {currentUserAvatarUrl ? (
                    <img
                      src={currentUserAvatarUrl}
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
                    {currentUser?.userName ? `@${currentUser.userName}` : "Увійди для участі"}
                  </div>
                </div>
              </div>

              <div className={styles.userMeta}>
                <div>
                  <span>Доступно</span>
                  <strong>
                    {isAuthenticated ? `${formatPrice(availableBalance)} ₴` : "—"}
                  </strong>
                </div>
                <div>
                  <span>В резерві</span>
                  <strong>{isAuthenticated ? `${formatPrice(lockedBalance)} ₴` : "—"}</strong>
                </div>
                <div>
                  <span>Можеш ставити</span>
                  <strong>{!isAuthenticated || bidGuardMessage ? "Ні" : "Так"}</strong>
                </div>
              </div>
            </div>

            <form className={styles.bidPanel} onSubmit={handleBidSubmit}>
              <div className={styles.bidPanelTop}>
                <div>
                  <span className={styles.mutedLabel}>Твоя ставка</span>
                  <strong className={styles.bidPanelValue}>{formatPrice(requestedBidAmount)} ₴</strong>
                </div>
                <div className={styles.liveLine}>
                  <span className={styles.liveDot} />
                  Час оновлюється автоматично
                </div>
              </div>

              <label className={styles.field} htmlFor="bid-amount">
                <span>Введи суму</span>
                <input
                  id="bid-amount"
                  type="number"
                  step="0.01"
                  min={minimumBid || 0}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder={`Мінімум ${formatPrice(minimumBid)} ₴`}
                />
              </label>

              <div className={styles.quickBidRow}>
                {quickBidValues.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.quickBidButton}
                    onClick={() => setBidAmount(String(value))}
                  >
                    {formatPrice(value)} ₴
                  </button>
                ))}
              </div>

              <div className={styles.actionButtons}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isBidDisabled}
                >
                  {bidLoading ? "Відправка..." : "Поставити ставку"}
                </button>

                <Link
                  to={isAuthenticated ? "/profile" : "/auth"}
                  className={styles.secondaryButton}
                >
                  {isAuthenticated ? "Профіль" : "Увійти"}
                </Link>
              </div>

              {bidGuardMessage && <p className={styles.bidHint}>{bidGuardMessage}</p>}

              {isAuthenticated && walletTransactions.length > 0 && (
                <div className={styles.walletFeed}>
                  <span className={styles.mutedLabel}>Останній рух по гаманцю</span>
                  <strong>
                    {walletTransactions[0].type || "Транзакція"}:{" "}
                    {formatPrice(walletTransactions[0].amount)} ₴
                  </strong>
                </div>
              )}
            </form>
          </div>
        </section>

        <section className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Коротко для клієнта</h2>
                <p>Без перевантаження: тільки те, що важливо для швидкого перегляду лота.</p>
              </div>
            </div>

            <div className={styles.summaryTiles}>
              <div className={styles.summaryTile}>
                <span>Категорія</span>
                <strong>{auction.category || "—"}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Стан</span>
                <strong>{auction.condition || "—"}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Розмір</span>
                <strong>{auction.size || "—"}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Крок ставки</span>
                <strong>{formatPrice(auction.minBidStep)} ₴</strong>
              </div>
            </div>

            <div className={styles.descriptionCard}>
              <span className={styles.mutedLabel}>Опис</span>
              <p>
                {auction.description ||
                  "Опис ще не додано. Тут може бути коротка презентація речі, її стану та того, чому лот вартий уваги."}
              </p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Прогрес аукціону</h2>
                <p>Тут видно дедлайн, динаміку та ключові числа по лоту.</p>
              </div>
              <div className={styles.progressPercent}>{Math.round(auctionProgress)}%</div>
            </div>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.max(0, Math.min(100, auctionProgress))}%` }}
              />
            </div>

            <div className={styles.progressLabels}>
              <span>{formatDate(auction.startTime)}</span>
              <span>{formatDate(auction.endTime)}</span>
            </div>

            <div className={styles.summaryTiles}>
              <div className={styles.summaryTile}>
                <span>Старт</span>
                <strong>{formatPrice(auction.startPrice)} ₴</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Ставок</span>
                <strong>{enrichedBids.length}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Початок</span>
                <strong>{formatDate(auction.startTime)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Фініш</span>
                <strong>{formatDate(auction.endTime)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Жива стрічка ставок</h2>
              <p>Кожна нова ставка показує нік і аватарку учасника, як ти й хотів.</p>
            </div>
            <div className={styles.timelineCount}>
              {enrichedBids.length ? `${enrichedBids.length} записів` : "Поки без ставок"}
            </div>
          </div>

          {!enrichedBids.length ? (
            <div className={styles.emptyTimeline}>
              Поки ніхто не зробив ставку. Ти можеш відкрити торги першим.
            </div>
          ) : (
            <div className={styles.timeline}>
              {enrichedBids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`${styles.timelineItem} ${
                    index === 0 ? styles.timelineItemActive : ""
                  }`}
                >
                  <div className={styles.timelineAccent} />
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineIdentity}>
                      <div className={styles.bidderAvatar}>
                        {bid.bidder.avatarUrl ? (
                          <img
                            src={bid.bidder.avatarUrl}
                            alt={bid.bidder.displayName}
                            className={styles.bidderAvatarImage}
                          />
                        ) : (
                          bid.bidder.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className={styles.bidderName}>{bid.bidder.displayName}</div>
                        <div className={styles.bidderUserName}>
                          {bid.bidder.userName
                            ? `@${bid.bidder.userName}`
                            : "Учасник аукціону"}
                        </div>
                      </div>
                    </div>

                    <div className={styles.timelineValues}>
                      <div className={styles.bidAmount}>{formatPrice(bid.amount)} ₴</div>
                      <div className={styles.bidDate}>{formatDate(bid.createdAt)}</div>
                    </div>

                    {index === 0 && (
                      <span className={styles.leadingBadge}>Найвища поточна ставка</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AuctionDetailsPage;
