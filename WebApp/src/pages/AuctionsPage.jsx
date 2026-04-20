import { useEffect, useState } from "react";
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

function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/auctions");
        const nextAuctions = normalizeAuctionsResponse(response.data)
          .filter((auction) => auction?.id)
          .sort((first, second) => {
            const firstEndTime = first?.endTime ? new Date(first.endTime).getTime() : Number.MAX_SAFE_INTEGER;
            const secondEndTime = second?.endTime ? new Date(second.endTime).getTime() : Number.MAX_SAFE_INTEGER;

            return firstEndTime - secondEndTime;
          });

        setAuctions(nextAuctions);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message || "Не вдалося завантажити аукціони."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  const formatPrice = (value) => {
    return new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMainImage = (auction) => {
    if (!auction?.images?.length) return "";
    return auction.images[0].imageUrl;
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
    if (normalizedStatus === "finished" || normalizedStatus === "closed") return "Завершено";

    return status || "Лот";
  };

  const activeAuctionsCount = auctions.filter(
    (auction) => String(auction.status || "").toLowerCase() === "active"
  ).length;
  const categoriesCount = new Set(
    auctions.map((auction) => auction.category).filter(Boolean)
  ).size;
  const highestCurrentPrice = auctions.reduce((highest, auction) => {
    return Math.max(highest, Number(auction.currentPrice || 0));
  }, 0);
  const endingSoonAuction = auctions.find((auction) => auction.endTime);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <span className={styles.kicker}>Curated Drop</span>
              <h1 className={styles.title}>Аукціони</h1>
              <p className={styles.subtitle}>
                Підтягуємо актуальні лоти та готуємо вітрину до показу.
              </p>
            </div>
            <div className={styles.heroPanel}>
              <div className={styles.loadingPulse} />
              <p className={styles.muted}>Завантаження...</p>
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
          <div className={styles.heroContent}>
            <span className={styles.kicker}>Curated Drop</span>
            <h1 className={styles.title}>Аукціони</h1>
            <p className={styles.subtitle}>
              Вітрина преміальних лотів з актуальними ставками, дедлайнами та
              швидким переходом до деталей.
            </p>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.heroPanelTop}>
              <div>
                <span className={styles.panelLabel}>Завершується найближче</span>
                <strong className={styles.panelValue}>
                  {endingSoonAuction ? formatTimeLeft(endingSoonAuction.endTime) : "Немає активних лотів"}
                </strong>
              </div>
              <div className={styles.statusPill}>
                {activeAuctionsCount} active
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Активні лоти</span>
                <strong>{activeAuctionsCount}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Категорії</span>
                <strong>{categoriesCount}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Макс. ставка</span>
                <strong>{formatPrice(highestCurrentPrice)} ₴</strong>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>Доступні лоти</h2>
          <p className={styles.subtitle}>
            Актуальні лоти брендового одягу, взуття та аксесуарів
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!auctions.length ? (
          <div className={styles.empty}>
            <span className={styles.emptyLabel}>Пауза між дропами</span>
            <h3>Зараз немає активних аукціонів</h3>
            <p>
              Сам запит до API спрацьовує коректно, але сервер зараз повертає
              порожній список лотів.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                to={`/auction/${auction.id}`}
                className={styles.card}
              >
                <div className={styles.imageWrap}>
                  <div className={styles.imageOverlay} />
                  <div className={styles.imageMeta}>
                    <span>{getStatusLabel(auction.status)}</span>
                    <strong>{formatTimeLeft(auction.endTime)}</strong>
                  </div>

                  {getMainImage(auction) ? (
                    <img
                      src={getMainImage(auction)}
                      alt={auction.title}
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.noImage}>Немає фото</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.badges}>
                    <span className={styles.badge}>{getStatusLabel(auction.status)}</span>
                    <span className={styles.badge}>{auction.category || "Категорія"}</span>
                  </div>

                  <h2 className={styles.cardTitle}>{auction.title}</h2>

                  {auction.description && (
                    <p className={styles.description}>
                      {auction.description}
                    </p>
                  )}

                  <div className={styles.meta}>
                    <div>
                      <span className={styles.label}>Бренд:</span> {auction.brand || "—"}
                    </div>
                    <div>
                      <span className={styles.label}>Стан:</span> {auction.condition || "—"}
                    </div>
                    <div>
                      <span className={styles.label}>Розмір:</span> {auction.size || "—"}
                    </div>
                  </div>

                  <div className={styles.prices}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>Стартова ціна</span>
                      <strong>{formatPrice(auction.startPrice)} ₴</strong>
                    </div>

                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>Поточна ціна</span>
                      <strong>{formatPrice(auction.currentPrice)} ₴</strong>
                    </div>
                  </div>

                  <div className={styles.footer}>
                    <div>
                      <span className={styles.label}>Кінець:</span>
                      <div className={styles.footerValue}>{formatDate(auction.endTime)}</div>
                    </div>

                    <div className={styles.openLink}>Переглянути лот</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuctionsPage;
