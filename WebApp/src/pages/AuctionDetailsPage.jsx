import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
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

async function requestAuction(auctionId) {
  const response = await api.get(`/api/auctions/${auctionId}`);
  return normalizeAuctionResponse(response.data);
}

async function requestBids(auctionId) {
  const response = await api.get(`/api/auctions/${auctionId}/bids`);
  return normalizeBidsResponse(response.data).sort((first, second) => {
    const firstTime = first?.createdAt ? new Date(first.createdAt).getTime() : 0;
    const secondTime = second?.createdAt ? new Date(second.createdAt).getTime() : 0;

    return secondTime - firstTime;
  });
}

function AuctionDetailsPage() {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const [auctionData, bidsData] = await Promise.all([
          requestAuction(id),
          requestBids(id),
        ]);

        applyAuctionData(auctionData);
        setBids(bidsData);
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

  const minimumBid = useMemo(() => {
    if (!auction) return 0;

    return Number(auction.currentPrice || 0) + Number(auction.minBidStep || 0);
  }, [auction]);

  const auctionProgress = useMemo(() => {
    if (!auction?.startTime || !auction?.endTime) return 0;

    const startTime = new Date(auction.startTime).getTime();
    const endTime = new Date(auction.endTime).getTime();
    const now = Date.now();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
      return 0;
    }

    if (now <= startTime) return 0;
    if (now >= endTime) return 100;

    return ((now - startTime) / (endTime - startTime)) * 100;
  }, [auction]);

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return date.toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatTimeLeft = (value) => {
    if (!value) return "Дата уточнюється";

    const target = new Date(value).getTime();

    if (Number.isNaN(target)) return "Дата уточнюється";

    const diff = target - Date.now();

    if (diff <= 0) return "Аукціон завершено";

    const minutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;

    if (days > 0) return `${days} д ${hours} год`;
    if (hours > 0) return `${hours} год ${mins} хв`;

    return `${Math.max(mins, 1)} хв`;
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus === "active") return "Активний";
    if (normalizedStatus === "draft") return "Чернетка";
    if (normalizedStatus === "finished" || normalizedStatus === "closed") {
      return "Завершено";
    }

    return status || "Лот";
  };

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

    try {
      setBidLoading(true);
      setError("");
      setSuccessMessage("");

      await api.post(`/api/auctions/${id}/bids`, {
        amount: nextAmount,
      });

      setSuccessMessage("Ставку успішно зроблено.");
      setBidAmount("");

      const [auctionData, bidsData] = await Promise.all([
        requestAuction(id),
        requestBids(id),
      ]);

      applyAuctionData(auctionData);
      setBids(bidsData);
    } catch (err) {
      console.error(err);

      if (err?.response?.status === 401) {
        setError("Сесію завершено. Увійди в акаунт ще раз, щоб продовжити.");
      } else {
        setError(
          err?.response?.data?.message || "Не вдалося зробити ставку."
        );
      }
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.contentCard}>
            <p className={styles.subtitle}>Завантаження аукціону...</p>
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
            <p>
              Можливо, лот уже завершився або посилання більше неактуальне.
            </p>
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

        <section className={styles.mainSection}>
          <div className={styles.galleryCard}>
            <div className={styles.imageBadge}>{getStatusLabel(auction.status)}</div>

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
              <div className={styles.thumbnailRow}>
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

          <div className={styles.infoCard}>
            <div className={styles.headerBlock}>
              <p className={styles.brand}>{auction.brand || "Luxury lot"}</p>
              <h1>{auction.title}</h1>
              <p className={styles.subtitle}>
                {auction.description ||
                  "Преміальний лот з детальною інформацією про стан, дедлайни та історію ставок."}
              </p>
            </div>

            <div className={styles.tags}>
              <span>{auction.category || "Категорія не вказана"}</span>
              <span>Стан: {auction.condition || "—"}</span>
              <span>Розмір: {auction.size || "—"}</span>
            </div>

            <div className={styles.bidPanel}>
              <div>
                <span className={styles.panelLabel}>Поточна ціна</span>
                <strong className={styles.price}>
                  {formatPrice(auction.currentPrice)} ₴
                </strong>
              </div>

              <div className={styles.panelMeta}>
                <div>
                  <span className={styles.panelLabel}>Мінімальний крок</span>
                  <b>{formatPrice(auction.minBidStep)} ₴</b>
                </div>
                <div>
                  <span className={styles.panelLabel}>До завершення</span>
                  <b>{formatTimeLeft(auction.endTime)}</b>
                </div>
              </div>

              <form className={styles.bidForm} onSubmit={handleBidSubmit}>
                <label className={styles.fieldLabel} htmlFor="bid-amount">
                  Ваша ставка
                </label>
                <input
                  id="bid-amount"
                  className={styles.bidInput}
                  type="number"
                  step="0.01"
                  min={minimumBid || 0}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  placeholder={`Мінімум ${formatPrice(minimumBid)} ₴`}
                />

                <div className={styles.actionButtons}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={bidLoading}
                  >
                    {bidLoading ? "Відправка..." : "Поставити ставку"}
                  </button>
                  <Link to="/auth" className={styles.secondaryButton}>
                    Увійти
                  </Link>
                </div>
              </form>
            </div>

            <div className={styles.quickInfo}>
              <div className={styles.quickInfoItem}>
                <span>Стартова ціна</span>
                <strong>{formatPrice(auction.startPrice)} ₴</strong>
              </div>
              <div className={styles.quickInfoItem}>
                <span>Початок аукціону</span>
                <strong>{formatDate(auction.startTime)}</strong>
              </div>
              <div className={styles.quickInfoItem}>
                <span>Завершення</span>
                <strong>{formatDate(auction.endTime)}</strong>
              </div>
              <div className={styles.quickInfoItem}>
                <span>Кількість ставок</span>
                <strong>{bids.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.bottomGrid}>
          <div className={`${styles.contentCard} ${styles.auctionFlowCard}`}>
            <div className={styles.auctionFlowHeader}>
              <div>
                <h2>Хід аукціону</h2>
                <p className={styles.auctionFlowSubtitle}>
                  Відстежуй прогрес лота, дедлайн і ключові параметри участі.
                </p>
              </div>
              <div className={styles.auctionStatus}>
                <span className={styles.statusDot} />
                {getStatusLabel(auction.status)}
              </div>
            </div>

            <div className={styles.auctionStatsGrid}>
              <div className={styles.auctionStatItem}>
                <span>Поточна ціна</span>
                <strong>{formatPrice(auction.currentPrice)} ₴</strong>
              </div>
              <div className={styles.auctionStatItem}>
                <span>Наступна ставка</span>
                <strong>{formatPrice(minimumBid)} ₴</strong>
              </div>
              <div className={styles.auctionStatItem}>
                <span>Ставок</span>
                <strong>{bids.length}</strong>
              </div>
              <div className={styles.auctionStatItem}>
                <span>Бренд</span>
                <strong>{auction.brand || "—"}</strong>
              </div>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressTop}>
                <span>Прогрес аукціону</span>
                <strong>{Math.round(auctionProgress)}%</strong>
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
            </div>

            <ul className={styles.detailsList}>
              <li>
                <span>Категорія</span>
                <strong>{auction.category || "—"}</strong>
              </li>
              <li>
                <span>Стан</span>
                <strong>{auction.condition || "—"}</strong>
              </li>
              <li>
                <span>Розмір</span>
                <strong>{auction.size || "—"}</strong>
              </li>
              <li>
                <span>Мінімальний крок</span>
                <strong>{formatPrice(auction.minBidStep)} ₴</strong>
              </li>
            </ul>
          </div>

          <div className={styles.contentCard}>
            <div className={styles.timelineHeader}>
              <h2>Історія ставок</h2>
              <span>{bids.length ? `${bids.length} записів` : "Поки без ставок"}</span>
            </div>

            {!bids.length ? (
              <p className={styles.subtitle}>
                Ставок поки немає. Ти можеш стати першим учасником цього лота.
              </p>
            ) : (
              <div className={styles.timeline}>
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`${styles.timelineItem} ${
                      index === 0 ? styles.timelineItemActive : ""
                    }`}
                  >
                    <div className={styles.timelineMarker} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineMain}>
                        <div className={styles.timelineUser}>
                          <strong>{formatPrice(bid.amount)} ₴</strong>
                          <span>Користувач: {bid.userId}</span>
                        </div>
                        <b>{formatDate(bid.createdAt)}</b>
                      </div>

                      {index === 0 && (
                        <span className={styles.leadingBidBadge}>
                          Найвища поточна ставка
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuctionDetailsPage;
