import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProfileByUserId } from "../api/profile";
import {
  getAccountStatusMeta,
  getAuctionImage,
  formatMoneyWithCurrency,
  normalizeAccountStatus,
  normalizeAuctionEntity,
  normalizeMediaUrl,
} from "../utils/domain";
import styles from "./PublicProfilePage.module.css";

function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProfileByUserId(userId);

        setProfile({
          ...data,
          avatarUrl: normalizeMediaUrl(data?.avatarUrl),
          favoriteAuctions: Array.isArray(data?.favoriteAuctions)
            ? data.favoriteAuctions.map(normalizeAuctionEntity).filter(Boolean)
            : [],
        });
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Не вдалося завантажити профіль користувача.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const fullName = useMemo(() => {
    return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  }, [profile?.firstName, profile?.lastName]);

  const firstLetter = (fullName || profile?.userName || "U").charAt(0).toUpperCase();
  const normalizedStatus = normalizeAccountStatus(profile?.status);
  const statusMeta = getAccountStatusMeta(profile?.status);
  const isPremium = normalizedStatus === "Elite";
  const isVip = normalizedStatus === "Private";
  const favoriteAuctions = Array.isArray(profile?.favoriteAuctions) ? profile.favoriteAuctions : [];
  const wonAuctions = Array.isArray(profile?.wonAuctions) ? profile.wonAuctions : [];
  const totalWonValue = wonAuctions.reduce(
    (total, auction) => total + Number(auction?.currentPrice || auction?.finalPrice || 0),
    0
  );
  const publicStats = [
    {
      label: "Середній виграш",
      value: formatMoneyWithCurrency(
        wonAuctions.length ? totalWonValue / wonAuctions.length : 0,
        wonAuctions[0]?.currency || favoriteAuctions[0]?.currency || "UAH"
      ),
    },
    {
      label: "Виграні лоти",
      value: wonAuctions.length,
    },
    {
      label: "Сума виграшів",
      value: formatMoneyWithCurrency(
        totalWonValue,
        wonAuctions[0]?.currency || favoriteAuctions[0]?.currency || "UAH"
      ),
    },
  ];
  const publicInfo = [
    {
      label: "Нікнейм",
      value: profile?.userName ? `@${profile.userName}` : "Не вказано",
    },
    {
      label: "Рівень",
      value: statusMeta.label,
    },
    {
      label: "Про профіль",
      value: profile?.bio || "Користувач ще не додав опис профілю.",
      wide: true,
    },
  ];

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {loading ? (
          <>
            <section className={`${styles.hero} ${styles.loadingShell}`} aria-hidden="true">
              <div className={styles.loadingIdentity}>
                <div className={styles.loadingAvatar}></div>
                <div className={styles.loadingIdentityText}>
                  <span className={styles.loadingTitle}></span>
                  <span className={styles.loadingSubtitle}></span>
                  <span className={styles.loadingSubtitleShort}></span>
                </div>
              </div>
              <div className={styles.loadingStatsGrid}>
                <span className={styles.loadingStatCard}></span>
                <span className={styles.loadingStatCard}></span>
                <span className={styles.loadingStatCard}></span>
              </div>
            </section>

            <section className={styles.infoGrid} aria-hidden="true">
              <section className={`${styles.card} ${styles.loadingShell}`}>
                <div className={styles.loadingSectionHeader}>
                  <span className={styles.loadingTitle}></span>
                  <span className={styles.loadingSubtitle}></span>
                </div>
                <div className={styles.loadingInfoGrid}>
                  <span className={styles.loadingInfoCard}></span>
                  <span className={styles.loadingInfoCard}></span>
                  <span className={`${styles.loadingInfoCard} ${styles.loadingInfoCardWide}`}></span>
                </div>
              </section>

              <section className={`${styles.card} ${styles.loadingShell}`}>
                <div className={styles.loadingSectionHeader}>
                  <span className={styles.loadingTitle}></span>
                  <span className={styles.loadingSubtitle}></span>
                </div>
                <div className={styles.loadingGrid}>
                  <article className={styles.loadingAuctionCard}>
                    <div className={styles.loadingMedia}></div>
                    <div className={styles.loadingBody}>
                      <span className={styles.loadingSubtitle}></span>
                      <span className={styles.loadingTitle}></span>
                      <span className={styles.loadingWalletLineShort}></span>
                    </div>
                  </article>
                  <article className={styles.loadingAuctionCard}>
                    <div className={styles.loadingMedia}></div>
                    <div className={styles.loadingBody}>
                      <span className={styles.loadingSubtitle}></span>
                      <span className={styles.loadingTitle}></span>
                      <span className={styles.loadingWalletLineShort}></span>
                    </div>
                  </article>
                </div>
              </section>
            </section>
          </>
        ) : error ? (
          <section className={styles.card}>{error}</section>
        ) : !profile ? (
          <section className={styles.card}>Профіль не знайдено.</section>
        ) : (
          <>
            <section className={styles.hero}>
              <div className={styles.identity}>
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
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={fullName || profile.userName} className={styles.avatarImage} />
                  ) : (
                    firstLetter
                  )}
                </div>
                <div>
                  <h1>{fullName || profile.userName || "Користувач"}</h1>
                  <p>{profile.userName ? `@${profile.userName}` : "Публічний профіль"}</p>
                  <p>{statusMeta.label}</p>
                </div>
              </div>

              <div className={styles.statsGrid}>
                {publicStats.map((item) => (
                  <article key={item.label} className={styles.statCard}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.infoGrid}>
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Інформація профілю</h2>
                    <p>Коротка публічна інформація про користувача.</p>
                  </div>
                </div>

                <div className={styles.profileInfoGrid}>
                  {publicInfo.map((item) => (
                    <article
                      key={item.label}
                      className={`${styles.infoCard} ${item.wide ? styles.infoCardWide : ""}`}
                    >
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Улюблені лоти</h2>
                    <p>Добірка збережених аукціонів.</p>
                  </div>
                </div>

                {!favoriteAuctions.length ? (
                  <div className={styles.empty}>У цього користувача поки немає улюблених лотів.</div>
                ) : (
                  <div className={styles.grid}>
                    {favoriteAuctions.map((auction) => (
                      <article key={auction.id} className={styles.auctionCard}>
                        <div className={styles.media}>
                          {getAuctionImage(auction) ? (
                            <img
                              src={getAuctionImage(auction)}
                              alt={auction.title}
                              className={styles.mediaImage}
                            />
                          ) : (
                            <div className={styles.mediaPlaceholder}>Немає фото</div>
                          )}
                        </div>
                        <div className={styles.body}>
                          <h3>{auction.title}</h3>
                          <p>{auction.brand || auction.category || "Аукціон"}</p>
                          <strong>
                            {formatMoneyWithCurrency(
                              auction.currentPrice || auction.startPrice,
                              auction.currency || "UAH"
                            )}
                          </strong>
                          <Link to={`/auction/${auction.id}`} className={styles.linkButton}>
                            Перейти до лота
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default PublicProfilePage;
