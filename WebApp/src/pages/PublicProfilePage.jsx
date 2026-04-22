import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProfileByUserId } from "../api/profile";
import {
  getAccountStatusMeta,
  getAuctionImage,
  getWalletAmounts,
  formatMoney,
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
  const { availableBalance, lockedBalance, balance, currency } = getWalletAmounts(null, profile);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {loading ? (
          <section className={styles.card}>Завантаження профілю...</section>
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
                  {profile.bio && <b>{profile.bio}</b>}
                </div>
              </div>

              <div className={styles.walletCard}>
                <span>Доступно</span>
                <strong>{formatMoneyWithCurrency(availableBalance, currency)}</strong>
                <p>Всього: {formatMoney(balance)} {currency}</p>
                <p>В резерві: {formatMoney(lockedBalance)} {currency}</p>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Улюблені лоти</h2>
                  <p>Добірка збережених аукціонів.</p>
                </div>
              </div>

              {!profile.favoriteAuctions?.length ? (
                <div className={styles.empty}>У цього користувача поки немає улюблених лотів.</div>
              ) : (
                <div className={styles.grid}>
                  {profile.favoriteAuctions.map((auction) => (
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
                            auction.currency || currency
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
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default PublicProfilePage;
