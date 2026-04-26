import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Toast from "../components/Toast";
import { getAuctionBids, getAuctionById } from "../api/auctions";
import {
  addAuctionToFavorites,
  removeAuctionFromFavorites,
  requestWinningDelivery,
} from "../api/profile";
import { getMyWallet, getMyWalletTransactions } from "../api/wallet";
import {
  formatMoneyWithCurrency,
  getAuctionAccessLevelMeta,
  getAuctionLeaderProfile,
  getDeliveryStatusLabel,
  getWalletAmounts,
  normalizeMediaUrl,
} from "../utils/domain";
import { getAuthToken } from "../utils/authStorage";
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
    },
  };
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

  if (diff <= 0) return "Аукціон розпочато";

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

function isAuctionAvailableForBids(auction, now) {
  const normalizedStatus = String(auction?.status || "").toLowerCase();
  const startTime = auction?.startTime ? new Date(auction.startTime).getTime() : null;
  const endTime = auction?.endTime ? new Date(auction.endTime).getTime() : null;

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

  return true;
}

function getShortDescription(description) {
  if (!description?.trim()) {
    return "Коротка картка для клієнта: головне фото, поточна ставка та дедлайн. Детальна історія торгів уже нижче.";
  }

  return description.length > 180 ? `${description.slice(0, 180)}...` : description;
}

function getAccessMessage(auction) {
  const levelMeta = getAuctionAccessLevelMeta(auction?.minimumRequiredStatus);

  return (
    auction?.accessDeniedMessage ||
    (levelMeta.tone === "private"
      ? "Цей аукціон доступний лише для користувачів рівня Private."
      : levelMeta.tone === "elite"
        ? "Ця функція доступна для статусу Elite або Private."
        : "")
  );
}

function getDeliveryDisplayLabel(status, canRequestDelivery) {
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
}

async function requestAuction(auctionId) {
  const auction = await getAuctionById(auctionId);

  if (!auction) {
    return null;
  }

  return auction;
}

async function requestBids(auctionId) {
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
        <div className={styles.breadcrumbs}>
          <span className={`${styles.loadingBadge} ${styles.loadingPulse}`}></span>
          <span>/</span>
          <span className={`${styles.loadingBadgeWide} ${styles.loadingPulse}`}></span>
          <span>/</span>
          <span className={`${styles.loadingLineMedium} ${styles.loadingPulse}`}></span>
        </div>

        <section className={styles.hero}>
          <div className={styles.visualStage}>
            <div className={styles.visualTopline}>
              <span className={`${styles.loadingBadge} ${styles.loadingPulse}`}></span>
              <span className={`${styles.loadingBadge} ${styles.loadingPulse}`}></span>
              <span className={`${styles.loadingBadgeWide} ${styles.loadingPulse}`}></span>
            </div>

            <div className={`${styles.mainImagePlaceholder} ${styles.loadingPulse}`}>
              <div className={styles.loadingImageGlow}></div>
            </div>

            <div className={styles.thumbnailRail}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`${styles.loadingThumbnail} ${styles.loadingPulse}`}
                ></div>
              ))}
            </div>
          </div>

          <div className={styles.commandPanel}>
            <div className={styles.headingBlock}>
              <div className={`${styles.loadingBrand} ${styles.loadingPulse}`}></div>
              <div className={`${styles.loadingTitle} ${styles.loadingPulse}`}></div>
              <div className={`${styles.loadingTitleShort} ${styles.loadingPulse}`}></div>
              <div className={`${styles.loadingTextLine} ${styles.loadingPulse}`}></div>
              <div className={`${styles.loadingTextLineWide} ${styles.loadingPulse}`}></div>
              <div className={styles.headingActions}>
                <div className={`${styles.loadingButton} ${styles.loadingPulse}`}></div>
              </div>
            </div>

            <div className={styles.heroCards}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.heroCard}>
                  <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                </div>
              ))}
            </div>

            <div className={styles.userDock}>
              <div className={styles.userIdentity}>
                <div className={`${styles.loadingAvatar} ${styles.loadingPulse}`}></div>
                <div className={styles.loadingIdentity}>
                  <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingLineSmall} ${styles.loadingPulse}`}></div>
                </div>
              </div>

              <div className={styles.userMeta}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                    <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.bidPanel}>
              <div className={styles.bidPanelTop}>
                <div>
                  <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingValueLarge} ${styles.loadingPulse}`}></div>
                </div>
                <div className={`${styles.loadingBadgeWide} ${styles.loadingPulse}`}></div>
              </div>

              <div className={styles.field}>
                <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                <div className={`${styles.loadingInput} ${styles.loadingPulse}`}></div>
              </div>

              <div className={styles.quickBidRow}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.loadingQuickBid} ${styles.loadingPulse}`}
                  ></div>
                ))}
              </div>

              <div className={styles.actionButtons}>
                <div className={`${styles.loadingButton} ${styles.loadingPulse}`}></div>
                <div className={`${styles.loadingButtonSecondary} ${styles.loadingPulse}`}></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.infoGrid}>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className={styles.infoCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.loadingSectionHead}>
                  <div className={`${styles.loadingSectionTitle} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingTextLineWide} ${styles.loadingPulse}`}></div>
                </div>
                {index === 1 ? (
                  <div className={`${styles.loadingPercent} ${styles.loadingPulse}`}></div>
                ) : null}
              </div>

              {index === 1 ? (
                <>
                  <div className={`${styles.loadingProgress} ${styles.loadingPulse}`}></div>
                  <div className={styles.progressLabels}>
                    <div className={`${styles.loadingLineMedium} ${styles.loadingPulse}`}></div>
                    <div className={`${styles.loadingLineMedium} ${styles.loadingPulse}`}></div>
                  </div>
                </>
              ) : null}

              <div className={styles.summaryTiles}>
                {Array.from({ length: 4 }).map((__, tileIndex) => (
                  <div key={tileIndex} className={styles.summaryTile}>
                    <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                    <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                  </div>
                ))}
              </div>

              {index === 0 ? (
                <div className={styles.descriptionCard}>
                  <div className={`${styles.loadingLabel} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingTextLineWide} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingTextLine} ${styles.loadingPulse}`}></div>
                  <div className={`${styles.loadingLineSmall} ${styles.loadingPulse}`}></div>
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.loadingSectionHead}>
              <div className={`${styles.loadingSectionTitle} ${styles.loadingPulse}`}></div>
              <div className={`${styles.loadingLineMedium} ${styles.loadingPulse}`}></div>
            </div>
            <div className={`${styles.loadingBadgeWide} ${styles.loadingPulse}`}></div>
          </div>

          <div className={styles.timeline}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineAccent} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineIdentity}>
                    <div className={`${styles.loadingAvatarSmall} ${styles.loadingPulse}`}></div>
                    <div className={styles.loadingIdentity}>
                      <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                      <div className={`${styles.loadingLineSmall} ${styles.loadingPulse}`}></div>
                    </div>
                  </div>

                  <div className={styles.timelineValues}>
                    <div className={`${styles.loadingValue} ${styles.loadingPulse}`}></div>
                    <div className={`${styles.loadingLineSmall} ${styles.loadingPulse}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
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
    if (!error && !successMessage) return;

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
    return isAuctionAvailableForBids(auction, now);
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

  const { availableBalance, lockedBalance, balance, currency } = getWalletAmounts(
    wallet,
    currentUser
  );
  const isAuthenticated = !!currentUser;
  const parsedBidAmount = Number(bidAmount);
  const enteredBidAmount = Number.isFinite(parsedBidAmount) ? parsedBidAmount : 0;
  const requestedBidAmount = enteredBidAmount > 0 ? enteredBidAmount : minimumBid;
  const hasEnoughBalance = availableBalance >= requestedBidAmount;

  const countdown = formatTimeLeft(auction?.startTime, now);
  const enrichedBids = useMemo(() => {
    return bids.map((bid) => enrichBidderWithCurrentUser(bid, currentUser));
  }, [bids, currentUser]);
  const userDisplayName =
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") ||
    currentUser?.userName ||
    "Гість";
  const userAvatarLetter = userDisplayName.charAt(0).toUpperCase();
  const currentUserAvatarUrl = normalizeMediaUrl(currentUser?.avatarUrl);
  const leader = getAuctionLeaderProfile(auction);
  const accessMeta = getAuctionAccessLevelMeta(auction?.minimumRequiredStatus);
  const accessMessage = getAccessMessage(auction);

  const quickBidValues = useMemo(() => {
    if (!minimumBid) return [];
    return [minimumBid, minimumBid + Number(auction?.minBidStep || 0), minimumBid + Number(auction?.minBidStep || 0) * 2];
  }, [auction?.minBidStep, minimumBid]);

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

  const bidGuardMessage = useMemo(() => {
    if (!isAuthenticated) {
      return "Щоб зробити ставку, потрібно увійти в акаунт.";
    }

    if (auction?.canCurrentUserBid === false) {
      return accessMessage;
    }

    if (!isAuctionActive) {
      return "Ставки для цього аукціону зараз недоступні.";
    }

    if (availableBalance < minimumBid) {
      return `На балансі недостатньо коштів для мінімальної ставки ${formatMoneyWithCurrency(minimumBid, auction?.currency || currency)}.`;
    }

    if (bidAmount && !hasEnoughBalance) {
      return `Недостатньо коштів для ставки ${formatMoneyWithCurrency(requestedBidAmount, auction?.currency || currency)}.`;
    }

    return "";
  }, [
    availableBalance,
    auction?.currency,
    bidAmount,
    currency,
    accessMessage,
    hasEnoughBalance,
    isAuctionActive,
    isAuthenticated,
    minimumBid,
    requestedBidAmount,
    auction?.canCurrentUserBid,
  ]);

  const refreshAuctionState = async () => {
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
  };

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
      setSuccessMessage("Доставку оформлено. Ваш товар буде доставлено найближчим часом.");
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
      setError(accessMessage);
      return;
    }

    if (!Number.isFinite(nextAmount) || nextAmount < minimumBid) {
      setSuccessMessage("");
      setError(`Мінімальна ставка зараз ${formatMoneyWithCurrency(minimumBid, auction?.currency || currency)}.`);
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
        {error ? (
          <Toast message={error} type="error" onClose={() => setError("")} />
        ) : null}
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
      {error ? (
        <Toast message={error} type="error" onClose={() => setError("")} />
      ) : null}
      {successMessage ? (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage("")}
        />
      ) : null}
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <Link to="/">Головна</Link>
          <span>/</span>
          <Link to="/auction">Аукціони</Link>
          <span>/</span>
          <span>{auction.title}</span>
        </div>

        <section className={styles.hero}>
          <div className={styles.visualStage}>
            <div className={styles.visualTopline}>
              <span className={styles.statusBadge}>{getStatusLabel(auction.status)}</span>
              <span className={styles.statusBadge}>{accessMeta.shortLabel}</span>
              {auction?.earlyAccessStartTime ? (
                <span className={styles.statusBadge}>Ранній доступ</span>
              ) : null}
              <span className={styles.liveBadge}>До старту: {countdown}</span>
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
              <p className={styles.brand}>{auction.brand || "Добірний лот"}</p>
              <h1>{auction.title}</h1>
              <p className={styles.lead}>{getShortDescription(auction.description)}</p>
              <div className={styles.headingActions}>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${
                    auction.isFavorite ? styles.favoriteActionActive : ""
                  }`}
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                >
                  {favoriteLoading
                    ? "Оновлення..."
                    : auction.isFavorite
                      ? "Прибрати з обраного"
                      : "Додати в обране"}
                </button>
              </div>
            </div>

            <div className={styles.heroCards}>
              <div className={styles.heroCard}>
                <span>Поточна ставка</span>
                <strong>{formatMoneyWithCurrency(auction.currentPrice, auction.currency || "UAH")}</strong>
              </div>
              <div className={styles.heroCard}>
                <span>Лідер</span>
                <strong>{leader.userName ? `@${leader.userName}` : leader.displayName}</strong>
              </div>
              <div className={styles.heroCard}>
                <span>Ставок</span>
                <strong>{auction.bidCount ?? enrichedBids.length}</strong>
              </div>
              <div className={styles.heroCard}>
                <span>Рівень доступу</span>
                <strong>{accessMeta.label}</strong>
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
                  <strong>{isAuthenticated ? formatMoneyWithCurrency(availableBalance, currency) : "—"}</strong>
                </div>
                <div>
                  <span>В резерві</span>
                  <strong>{isAuthenticated ? formatMoneyWithCurrency(lockedBalance, currency) : "—"}</strong>
                </div>
                <div>
                  <span>Всього</span>
                  <strong>{isAuthenticated ? formatMoneyWithCurrency(balance, currency) : "—"}</strong>
                </div>
              </div>
            </div>

            {auction.isWonByCurrentUser && (
              <div className={styles.deliveryPanel}>
                <div className={styles.deliveryHeader}>
                  <div>
                    <span className={styles.mutedLabel}>Доставка переможця</span>
                    <strong>{getDeliveryDisplayLabel(auction.deliveryStatus, auction.canRequestDelivery)}</strong>
                  </div>
                  <div className={styles.deliveryActions}>
                    {auction.canRequestDelivery && (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleDeliveryAction}
                        disabled={deliveryLoading}
                      >
                        {deliveryLoading ? "Оновлення..." : "Оформити доставку"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form className={styles.bidPanel} onSubmit={handleBidSubmit}>
              <div className={styles.bidPanelTop}>
                <div>
                  <span className={styles.mutedLabel}>Твоя ставка</span>
                  <strong className={styles.bidPanelValue}>
                    {formatMoneyWithCurrency(requestedBidAmount, auction.currency || currency)}
                  </strong>
                </div>
                <div className={styles.liveLine}>
                  <span className={styles.liveDot} />
                  До старту: {countdown}
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
                  placeholder={`Мінімум ${formatMoneyWithCurrency(minimumBid, auction.currency || currency)}`}
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
                    {formatMoneyWithCurrency(value, auction.currency || currency)}
                </button>
              ))}
              </div>

              <div className={styles.actionButtons}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={bidLoading || auction?.canCurrentUserBid === false}
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
                    {formatMoneyWithCurrency(walletTransactions[0].amount, walletTransactions[0].currency || currency)}
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
                <strong>{formatMoneyWithCurrency(auction.minBidStep, auction.currency || "UAH")}</strong>
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
                <strong>{formatMoneyWithCurrency(auction.startPrice, auction.currency || "UAH")}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Поточний лідер</span>
                <strong>{leader.userName ? `@${leader.userName}` : leader.displayName}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>До старту</span>
                <strong>{countdown}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Статус доставки</span>
                <strong>{getDeliveryDisplayLabel(auction.deliveryStatus, auction.canRequestDelivery)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Жива стрічка ставок</h2>
              <p>Останні ставки учасників аукціону.</p>
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
                    <Link
                      to={bid.bidder.userId ? `/profile/${bid.bidder.userId}` : "#"}
                      className={styles.timelineIdentity}
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
                        <div className={styles.bidderName}>{bid.bidder.displayName}</div>
                        <div className={styles.bidderUserName}>
                          {bid.bidder.userName
                            ? `@${bid.bidder.userName}`
                            : "Учасник аукціону"}
                        </div>
                      </div>
                    </Link>

                    <div className={styles.timelineValues}>
                      <div className={styles.bidAmount}>
                        {formatMoneyWithCurrency(bid.amount, bid.currency || auction.currency || "UAH")}
                      </div>
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
