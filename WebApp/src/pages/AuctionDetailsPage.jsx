import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { getAuctionBids, getAuctionById } from "../api/auctions";
import {
  addAuctionToFavorites,
  removeAuctionFromFavorites,
  requestWinningDelivery,
} from "../api/profile";
import { getMyWallet } from "../api/wallet";
import Toast from "../components/Toast";
import { getAuthToken } from "../utils/authStorage";
import {
  formatMoney,
  formatMoneyWithCurrency,
  getAuctionAccessLevelMeta,
  getAuctionLeaderProfile,
  getLocalizedCategory,
  getLocalizedCondition,
  getLocalizedSize,
  getWalletAmounts,
  normalizeMediaUrl,
} from "../utils/domain";
import { getAuctionPhase } from "../utils/auctionPresentation";
import styles from "./AuctionDetailsPage.module.css";

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
      userId: bid.bidder?.userId || currentUser?.id || currentUser?.userId || "",
    },
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatClock(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortCountdown(targetValue, now) {
  if (!targetValue) return "Дата уточнюється";

  const target = new Date(targetValue).getTime();

  if (Number.isNaN(target)) return "Дата уточнюється";

  const diff = target - now;

  if (diff <= 0) return "00:00";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} д ${hours} год`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStatusMeta(auction, now) {
  const phase = getAuctionPhase(auction, now);

  if (phase === "planned") {
    return {
      label: "Ще не почався",
      tone: "planned",
      dot: "🟡",
    };
  }

  if (phase === "closed") {
    return {
      label: "Аукціон завершено",
      tone: "closed",
      dot: "🔴",
    };
  }

  return {
    label: "Активний аукціон",
    tone: "active",
    dot: "🟢",
  };
}

function getConditionScore(condition) {
  switch (String(condition || "").trim().toLowerCase()) {
    case "new":
      return "10/10";
    case "like new":
      return "9/10";
    case "excellent":
      return "8/10";
    case "very good":
      return "7/10";
    case "good":
      return "6/10";
    case "fair":
      return "5/10";
    default:
      return condition ? "Оцінюється" : "Оцінюється";
  }
}

function getDynamicStep(currentPrice, minBidStep) {
  const price = Number(currentPrice || 0);
  const backendStep = Number(minBidStep || 0);

  if (price >= 50000) {
    return Math.max(backendStep, 1000);
  }

  if (price >= 20000) {
    return Math.max(backendStep, 500);
  }

  if (price >= 5000) {
    return Math.max(backendStep, 200);
  }

  return Math.max(backendStep, 100);
}

function requestAuction(auctionId) {
  return getAuctionById(auctionId);
}

function requestBids(auctionId) {
  return getAuctionBids(auctionId);
}

async function requestCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const response = await api.get("/api/profile/me");
  return response.data;
}

function AuctionDetailsSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingHero}></div>
          <div className={styles.loadingBody}></div>
          <div className={styles.loadingBodyShort}></div>
        </div>
      </div>
    </div>
  );
}

function AuctionDetailsPage() {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const [bidFlash, setBidFlash] = useState("");
  const [latestBidId, setLatestBidId] = useState("");
  const [isTopbarScrolled, setIsTopbarScrolled] = useState(false);

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
    const handleScroll = () => {
      setIsTopbarScrolled(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!error && !successMessage) return undefined;

    const timer = window.setTimeout(() => {
      setError("");
      setSuccessMessage("");
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [error, successMessage]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const [
          auctionData,
          bidsData,
          currentUserData,
          walletData,
        ] = await Promise.all([
          requestAuction(id),
          requestBids(id),
          requestCurrentUser().catch(() => null),
          getMyWallet().catch(() => null),
        ]);

        applyAuctionData(auctionData);
        setBids(bidsData);
        setCurrentUser(currentUserData);
        setWallet(walletData);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Не вдалося завантажити аукціон.");
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
        setCurrentUser(currentUserData);
        setWallet(walletData);
      } catch {
        setCurrentUser(null);
        setWallet(null);
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

  const enrichedBids = useMemo(() => {
    return bids.map((bid) => enrichBidderWithCurrentUser(bid, currentUser));
  }, [bids, currentUser]);

  useEffect(() => {
    const topBidId = enrichedBids[0]?.id || "";

    if (!topBidId) {
      setLatestBidId("");
      return;
    }

    if (!latestBidId) {
      setLatestBidId(topBidId);
      return;
    }

    if (topBidId !== latestBidId) {
      const userKeys = buildUserMatchKeys(currentUser);
      const leaderKeys = buildUserMatchKeys({
        id: enrichedBids[0]?.bidder?.userId,
        userName: enrichedBids[0]?.bidder?.userName,
      });
      const isMyTopBid = [...leaderKeys].some((key) => userKeys.has(key));

      setBidFlash(isMyTopBid ? "raise" : "outbid");
      setLatestBidId(topBidId);

      const timer = window.setTimeout(() => setBidFlash(""), 1800);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [currentUser, enrichedBids, latestBidId]);

  const refreshAuctionState = async () => {
    const [
      auctionData,
      bidsData,
      currentUserData,
      walletData,
    ] = await Promise.all([
      requestAuction(id),
      requestBids(id),
      requestCurrentUser().catch(() => currentUser),
      getMyWallet().catch(() => wallet),
    ]);

    applyAuctionData(auctionData);
    setBids(bidsData);
    setCurrentUser(currentUserData);
    setWallet(walletData);
  };

  const phase = getAuctionPhase(auction, now);
  const statusMeta = getStatusMeta(auction, now);
  const isAuctionActive = phase === "active";
  const isAuctionClosed = phase === "closed";
  const isAuctionPlanned = phase === "planned";

  const minimumBid = useMemo(() => {
    if (!auction) return 0;

    return Number(auction.currentPrice || 0) + Number(auction.minBidStep || 0);
  }, [auction]);

  const dynamicStep = useMemo(() => {
    return getDynamicStep(auction?.currentPrice, auction?.minBidStep);
  }, [auction?.currentPrice, auction?.minBidStep]);

  const quickBidOptions = useMemo(() => {
    if (!auction) return [];

    return [1, 2, 3].map((multiplier) => ({
      increase: dynamicStep * multiplier,
      total: Number(auction.currentPrice || 0) + dynamicStep * multiplier,
    }));
  }, [auction, dynamicStep]);

  useEffect(() => {
    if (!minimumBid) return;

    setBidAmount((currentValue) => {
      if (!currentValue) {
        return String(minimumBid);
      }

      const numericValue = Number(currentValue);

      if (!Number.isFinite(numericValue) || numericValue < minimumBid) {
        return String(minimumBid);
      }

      return currentValue;
    });
  }, [minimumBid]);

  const { availableBalance, lockedBalance, currency } = getWalletAmounts(wallet, currentUser);
  const isAuthenticated = !!currentUser;
  const parsedBidAmount = Number(bidAmount);
  const enteredBidAmount = Number.isFinite(parsedBidAmount) ? parsedBidAmount : 0;
  const requestedBidAmount = enteredBidAmount > 0 ? enteredBidAmount : minimumBid;
  const hasEnoughBalance = availableBalance >= requestedBidAmount;
  const leader = getAuctionLeaderProfile(auction);
  const accessMeta = getAuctionAccessLevelMeta(auction?.minimumRequiredStatus);

  const userKeys = useMemo(() => buildUserMatchKeys(currentUser), [currentUser]);
  const leaderKeys = useMemo(
    () =>
      buildUserMatchKeys({
        id: leader.userId,
        userName: leader.userName,
      }),
    [leader.userId, leader.userName]
  );
  const isCurrentUserLeader = [...leaderKeys].some((key) => userKeys.has(key));

  const myBids = useMemo(() => {
    return enrichedBids.filter((bid) => {
      const bidKeys = buildUserMatchKeys({
        id: bid?.bidder?.userId || bid?.userId,
        userName: bid?.bidder?.userName,
      });

      return [...bidKeys].some((key) => userKeys.has(key));
    });
  }, [enrichedBids, userKeys]);

  const myHighestBid = useMemo(() => {
    return myBids.reduce((max, bid) => Math.max(max, Number(bid.amount || 0)), 0);
  }, [myBids]);

  const leaderGap = Math.max(0, Number(auction?.currentPrice || 0) - myHighestBid);
  const targetTime = isAuctionPlanned ? auction?.startTime : auction?.endTime;
  const countdownLabel = isAuctionPlanned ? "До старту" : "До завершення";
  const countdown = formatShortCountdown(targetTime, now);
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
  }, [auction?.endTime, auction?.startTime, now]);

  const userState = useMemo(() => {
    if (auction?.isWonByCurrentUser) {
      return {
        label: "Ти виграв",
        tone: "won",
        text: "Вітаємо, лот закріплено за тобою.",
      };
    }

    if (isAuctionClosed) {
      return {
        label: "Аукціон завершено",
        tone: "closed",
        text: "Прийом ставок закрито.",
      };
    }

    if (!myBids.length) {
      return {
        label: "Ти ще не робив ставок",
        tone: "idle",
        text: "Зроби першу ставку, щоб увійти в гру.",
      };
    }

    if (isCurrentUserLeader) {
      return {
        label: "Ти лідер",
        tone: "leader",
        text: "Ставка попереду. Слідкуй за фінальними хвилинами.",
      };
    }

    return {
      label: "Тебе перебили",
      tone: "outbid",
      text:
        leaderGap > 0
          ? `Потрібно ще +${formatMoney(leaderGap)} ${auction?.currency === "UAH" ? "₴" : auction?.currency || ""} до лідера.`
          : "Лідер змінився, пора відповісти новою ставкою.",
    };
  }, [auction?.currency, auction?.isWonByCurrentUser, isAuctionClosed, isCurrentUserLeader, leaderGap, myBids.length]);

  const bidGuardMessage = useMemo(() => {
    if (!isAuthenticated) {
      return "Щоб зробити ставку, потрібно увійти в акаунт.";
    }

    if (auction?.canCurrentUserBid === false) {
      return auction?.accessDeniedMessage || accessMeta.description;
    }

    if (isAuctionPlanned) {
      return "Аукціон ще не розпочався. Ставки відкриються зі стартом торгів.";
    }

    if (isAuctionClosed) {
      return "Аукціон завершено. Нові ставки більше не приймаються.";
    }

    if (availableBalance < minimumBid) {
      return `На балансі недостатньо коштів для мінімальної ставки ${formatMoneyWithCurrency(minimumBid, auction?.currency || currency)}.`;
    }

    if (bidAmount && !hasEnoughBalance) {
      return `Недостатньо коштів для ставки ${formatMoneyWithCurrency(requestedBidAmount, auction?.currency || currency)}.`;
    }

    return "";
  }, [
    accessMeta.description,
    auction?.accessDeniedMessage,
    auction?.canCurrentUserBid,
    auction?.currency,
    availableBalance,
    bidAmount,
    currency,
    hasEnoughBalance,
    isAuthenticated,
    isAuctionClosed,
    isAuctionPlanned,
    minimumBid,
    requestedBidAmount,
  ]);

  const isBidUnavailable = !isAuthenticated || auction?.canCurrentUserBid === false || !isAuctionActive;
  const bidActionLabel = !isAuthenticated
    ? "Увійди, щоб ставити"
    : isAuctionClosed
      ? "Торги завершено"
      : isAuctionPlanned
        ? "Очікує старту"
        : auction?.canCurrentUserBid === false
          ? "Ставка недоступна"
          : bidLoading
            ? "Відправка..."
            : "Зробити ставку";

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !auction) {
      setError("Щоб додати лот в обране, потрібно увійти в акаунт.");
      return;
    }

    try {
      setFavoriteLoading(true);
      setError("");
      setSuccessMessage("");

      if (auction.isFavorite) {
        await removeAuctionFromFavorites(auction.id);
      } else {
        await addAuctionToFavorites(auction.id);
      }

      setAuction((currentAuction) =>
        currentAuction
          ? { ...currentAuction, isFavorite: !currentAuction.isFavorite }
          : currentAuction
      );
      setSuccessMessage(
        auction.isFavorite ? "Лот прибрано з обраного." : "Лот додано в обране."
      );
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Не вдалося оновити обране.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDeliveryAction = async () => {
    if (!auction?.id) {
      return;
    }

    try {
      setDeliveryLoading(true);
      setError("");
      setSuccessMessage("");

      await requestWinningDelivery(auction.id);
      await refreshAuctionState();
      window.dispatchEvent(new Event("authChanged"));
      setSuccessMessage("Запит на оформлення доставки відправлено.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Не вдалося оновити доставку.");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleBidSubmit = async (event) => {
    event.preventDefault();

    const token = getAuthToken();
    const nextAmount = Number(bidAmount);

    if (!token) {
      setSuccessMessage("");
      setError("Щоб зробити ставку, потрібно увійти в акаунт.");
      return;
    }

    if (auction?.canCurrentUserBid === false) {
      setSuccessMessage("");
      setError(auction?.accessDeniedMessage || accessMeta.description);
      return;
    }

    if (!Number.isFinite(nextAmount) || nextAmount < minimumBid) {
      setSuccessMessage("");
      setError(`Мінімальна ставка зараз ${formatMoneyWithCurrency(minimumBid, auction?.currency || currency)}.`);
      return;
    }

    if (!isAuctionActive) {
      setSuccessMessage("");
      setError(
        isAuctionPlanned
          ? "Аукціон ще не розпочався."
          : "Аукціон завершено. Нові ставки більше не приймаються."
      );
      return;
    }

    if (availableBalance < nextAmount) {
      setSuccessMessage("");
      setError(
        `Недостатньо коштів на балансі. Доступно ${formatMoneyWithCurrency(availableBalance, currency)}.`
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

      await refreshAuctionState();
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
    return <AuctionDetailsSkeleton />;
  }

  if (!auction) {
    return (
      <div className={styles.page}>
        {error ? <Toast message={error} type="error" onClose={() => setError("")} /> : null}
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>Аукціон не знайдено</h1>
            <p>Можливо, лот уже завершився або посилання стало неактуальним.</p>
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
      {error ? <Toast message={error} type="error" onClose={() => setError("")} /> : null}
      {successMessage ? (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage("")}
        />
      ) : null}

      <div className={styles.container}>
        <div
          className={`${styles.topbar} ${isTopbarScrolled ? styles.topbarScrolled : ""}`}
        >
          <div className={styles.topbarPrimary}>
            <Link to="/auction" className={styles.backLink}>
              ← До аукціонів
            </Link>
            <div className={styles.breadcrumbs}>
              <Link to="/">Головна</Link>
              <span>/</span>
              <Link to="/auction">Аукціони</Link>
              <span>/</span>
              <span>{auction.title}</span>
            </div>
          </div>

          <div
            className={`${styles.topbarSummary} ${
              isTopbarScrolled ? styles.topbarSummaryVisible : ""
            }`}
            aria-hidden={!isTopbarScrolled}
          >
            <span>{auction.brand || getLocalizedCategory(auction.category)}</span>
            <strong>{auction.title}</strong>
            <small>
              {formatMoneyWithCurrency(auction.currentPrice, auction.currency || "UAH")}
            </small>
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.galleryCard}>
            <button
              type="button"
              className={`${styles.favoriteButton} ${
                auction.isFavorite ? styles.favoriteButtonActive : ""
              }`}
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              aria-label={auction.isFavorite ? "Прибрати з обраного" : "Додати в обране"}
            >
              ❤
            </button>

            {selectedImage ? (
              <div className={styles.imageFrame}>
                <img src={selectedImage} alt={auction.title} className={styles.mainImage} />
              </div>
            ) : (
              <div className={styles.mainImagePlaceholder}>Немає зображення</div>
            )}

            {auction.images?.length > 1 ? (
              <div className={styles.thumbnailRail}>
                {auction.images.map((image) => (
                  <button
                    key={image.id || image.imageUrl}
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
            ) : null}
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <span className={`${styles.statusBadge} ${styles[`statusBadge${statusMeta.tone}`]}`}>
                {statusMeta.dot} {statusMeta.label}
              </span>
              <span className={styles.accessBadge}>{accessMeta.shortLabel}</span>
            </div>

            <h1>{auction.title}</h1>

            <div className={styles.metaRow}>
              <span>{getLocalizedCategory(auction.category)}</span>
              <span>{getLocalizedSize(auction.size)}</span>
              <span>{getLocalizedCondition(auction.condition)}</span>
            </div>

            <div className={styles.quickFacts}>
              <div className={styles.factItem}>
                <span>Бренд</span>
                <strong>{auction.brand || "Не вказано"}</strong>
              </div>
              <div className={styles.factItem}>
                <span>Розмір</span>
                <strong>{getLocalizedSize(auction.size)}</strong>
              </div>
              <div className={styles.factItem}>
                <span>Стан</span>
                <strong>{getConditionScore(auction.condition)}</strong>
              </div>
              <div className={styles.factItem}>
                <span>Старт</span>
                <strong>{formatMoneyWithCurrency(auction.startPrice, auction.currency || "UAH")}</strong>
              </div>
            </div>

            <div className={styles.leaderRow}>
              <Link
                to={leader.userId ? `/profile/${leader.userId}` : "#"}
                className={styles.leaderIdentity}
                onClick={(event) => {
                  if (!leader.userId) {
                    event.preventDefault();
                  }
                }}
              >
                <div className={styles.userAvatar}>
                  {leader.avatarUrl ? (
                    <img
                      src={leader.avatarUrl}
                      alt={leader.displayName}
                      className={styles.userAvatarImage}
                    />
                  ) : (
                    leader.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <span className={styles.cardLabel}>Лідирує зараз</span>
                  <strong>{leader.displayName}</strong>
                  <small>{leader.userName ? `@${leader.userName}` : "Поточний лідер"}</small>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div
            className={`${styles.bidCard} ${
              bidFlash === "raise"
                ? styles.bidCardRaise
                : bidFlash === "outbid"
                  ? styles.bidCardOutbid
                  : ""
            } ${isBidUnavailable ? styles.bidCardDisabled : ""}`}
          >
            <div className={styles.sectionHeader}>
              <div>
                <h2>Ставки</h2>
                <p>{userState.text}</p>
              </div>
              <span className={`${styles.statePill} ${styles[`statePill${userState.tone}`]}`}>
                {userState.label}
              </span>
            </div>

            <div className={styles.priceGrid}>
              <div className={styles.priceTile}>
                <span>Поточна ставка</span>
                <strong>{formatMoneyWithCurrency(auction.currentPrice, auction.currency || "UAH")}</strong>
              </div>
              <div className={styles.priceTile}>
                <span>Твоя ставка</span>
                <strong>
                  {myHighestBid
                    ? formatMoneyWithCurrency(myHighestBid, auction.currency || "UAH")
                    : "Ще не зроблена"}
                </strong>
              </div>
              <div className={styles.priceTile}>
                <span>До лідера</span>
                <strong>
                  {isCurrentUserLeader
                    ? "Ти попереду"
                    : leaderGap > 0
                      ? `+${formatMoneyWithCurrency(leaderGap, auction.currency || "UAH")}`
                      : "—"}
                </strong>
              </div>
              <div className={styles.priceTile}>
                <span>{countdownLabel}</span>
                <strong>{isAuctionClosed ? "Завершено" : countdown}</strong>
              </div>
            </div>

            <form id="auction-bid-form" className={styles.bidForm} onSubmit={handleBidSubmit}>
              <label className={styles.field} htmlFor="bid-amount">
                <span>Введи суму ставки</span>
                <input
                  id="bid-amount"
                  type="number"
                  step="0.01"
                  min={minimumBid || 0}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder={`Мінімум ${formatMoneyWithCurrency(minimumBid, auction.currency || currency)}`}
                  disabled={isBidUnavailable}
                />
              </label>

              <div className={styles.quickBidGrid}>
                {quickBidOptions.map((option) => (
                  <button
                    key={option.increase}
                    type="button"
                    className={styles.quickBidButton}
                    onClick={() => setBidAmount(String(option.total))}
                    disabled={isBidUnavailable}
                  >
                    <strong>+{formatMoney(option.increase)}</strong>
                    <span>{formatMoneyWithCurrency(option.total, auction.currency || currency)}</span>
                  </button>
                ))}
              </div>

              <div className={styles.actionRow}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    bidLoading ||
                    !isAuthenticated ||
                    auction?.canCurrentUserBid === false ||
                    isAuctionClosed ||
                    isAuctionPlanned
                  }
                >
                  {bidActionLabel}
                </button>
                <Link to={isAuthenticated ? "/profile" : "/auth"} className={styles.secondaryButton}>
                  {isAuthenticated ? "Мій профіль" : "Увійти"}
                </Link>
              </div>

              {bidGuardMessage ? <p className={styles.bidHint}>{bidGuardMessage}</p> : null}
            </form>

            {auction.isWonByCurrentUser ? (
              <div className={styles.winnerPanel}>
                <div>
                  <span className={styles.cardLabel}>Перемога підтверджена</span>
                  <strong>Лот закрито на твою користь</strong>
                </div>
                {auction.canRequestDelivery ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleDeliveryAction}
                    disabled={deliveryLoading}
                  >
                    {deliveryLoading ? "Оновлення..." : "Оформити доставку"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className={styles.feedCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Жива стрічка ставок</h2>
                <p>Останні оновлення по лоту.</p>
              </div>
              <span className={styles.feedCount}>
                {auction.bidCount ?? enrichedBids.length}
              </span>
            </div>

            {!enrichedBids.length ? (
              <div className={styles.emptyFeed}>
                Поки що ставок немає. Перший крок може бути за тобою.
              </div>
            ) : (
              <div className={styles.liveFeedList}>
                {enrichedBids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`${styles.feedItem} ${index === 0 ? styles.feedItemLatest : ""}`}
                  >
                    <Link
                      to={bid.bidder.userId ? `/profile/${bid.bidder.userId}` : "#"}
                      className={styles.feedIdentity}
                      onClick={(event) => {
                        if (!bid.bidder.userId) {
                          event.preventDefault();
                        }
                      }}
                    >
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
                        <strong>{bid.bidder.displayName}</strong>
                        <small>{bid.bidder.userName ? `@${bid.bidder.userName}` : "Учасник аукціону"}</small>
                      </div>
                    </Link>

                    <div className={styles.feedMeta}>
                      <strong>{formatMoneyWithCurrency(bid.amount, bid.currency || auction.currency || "UAH")}</strong>
                      <small>{formatClock(bid.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section className={styles.bottomGrid}>
          <div className={styles.infoCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Інформація про товар</h2>
                <p>Опис і додаткові деталі без повторення основних характеристик.</p>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <span className={styles.cardLabel}>Опис</span>
              <p>
                {auction.description ||
                  "Опис ще не додано. Тут з’явиться коротка інформація про річ, її особливості та стан."}
              </p>
            </div>

            <div className={styles.specList}>
              <div className={styles.specRow}>
                <span>Рівень доступу</span>
                <strong>{accessMeta.label}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Поточний лідер</span>
                <strong>{leader.displayName}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Кількість ставок</span>
                <strong>{auction.bidCount ?? enrichedBids.length}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Фаза</span>
                <strong>{statusMeta.label}</strong>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Динаміка аукціону</h2>
                <p>Час, прогрес і активність.</p>
              </div>
              <span className={styles.progressValue}>{Math.round(auctionProgress)}%</span>
            </div>

            <div className={styles.progressCard}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.max(0, Math.min(100, auctionProgress))}%` }}
                />
              </div>
            </div>

            <div className={styles.specList}>
              <div className={styles.specRow}>
                <span>Дата початку</span>
                <strong>{formatDate(auction.startTime)}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Дата завершення</span>
                <strong>{formatDate(auction.endTime)}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Крок ставки</span>
                <strong>{formatMoneyWithCurrency(auction.minBidStep, auction.currency || "UAH")}</strong>
              </div>
              <div className={styles.specRow}>
                <span>Доступно на балансі</span>
                <strong>{formatMoneyWithCurrency(availableBalance, currency)}</strong>
              </div>
              <div className={styles.specRow}>
                <span>У резерві</span>
                <strong>{formatMoneyWithCurrency(lockedBalance, currency)}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.mobileBidBar}>
        <div>
          <span>Ставка зараз</span>
          <strong>{formatMoneyWithCurrency(requestedBidAmount, auction.currency || currency)}</strong>
        </div>
        <button
          type="submit"
          form="auction-bid-form"
          className={styles.primaryButton}
          disabled={bidLoading || !isAuthenticated || auction?.canCurrentUserBid === false || !isAuctionActive}
        >
          {bidActionLabel}
        </button>
      </div>
    </div>
  );
}

export default AuctionDetailsPage;
