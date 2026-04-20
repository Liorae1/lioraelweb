import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import api from "../api/axios";
import {
  demoTopUpWallet,
  getMyWallet,
  getMyWalletTransactions,
} from "../api/wallet";
import styles from "./WalletPage.module.css";

function formatPrice(value, currency = "UAH") {
  const symbol = currency === "UAH" ? "₴" : currency;

  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))} ${symbol}`;
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

function getTransactionLabel(type) {
  switch (String(type || "")) {
    case "Deposit":
      return "Поповнення";
    case "BidLock":
      return "Резерв ставки";
    case "BidRefund":
      return "Повернення резерву";
    case "Purchase":
      return "Оплата покупки";
    default:
      return type || "Операція";
  }
}

function getTransactionTone(type) {
  switch (String(type || "")) {
    case "Deposit":
    case "BidRefund":
      return "positive";
    case "BidLock":
    case "Purchase":
      return "negative";
    default:
      return "neutral";
  }
}

function getSignedAmount(type, amount, currency) {
  const formattedAmount = formatPrice(amount, currency);

  if (["Deposit", "BidRefund"].includes(String(type || ""))) {
    return `+${formattedAmount}`;
  }

  if (["BidLock", "Purchase"].includes(String(type || ""))) {
    return `-${formattedAmount}`;
  }

  return formattedAmount;
}

function getSectionFromHash(hash) {
  switch (hash) {
    case "#topup":
      return "topup";
    case "#locks":
      return "locks";
    case "#transactions":
      return "transactions";
    case "#bids":
      return "bids";
    case "#overview":
    default:
      return "overview";
  }
}

function WalletPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState("1000");
  const [toast, setToast] = useState(null);

  const activeSection = useMemo(() => {
    return getSectionFromHash(location.hash);
  }, [location.hash]);

  const loadWalletData = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuth(false);
      setLoading(false);
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [profileResponse, walletData, transactionsData] = await Promise.all([
        api.get("/api/profile/me"),
        getMyWallet(),
        getMyWalletTransactions(),
      ]);

      setProfile(profileResponse.data);
      setWallet(walletData);
      setTransactions(transactionsData);
      setAuth(true);
    } catch (error) {
      console.error("Wallet load error:", error);
      if (error?.response?.status === 401) {
        setAuth(false);
      } else {
        setToast({
          message:
            error?.response?.data?.message || "Не вдалося завантажити дані гаманця.",
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  useEffect(() => {
    const handleAuthChange = () => {
      loadWalletData({ silent: true });
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [loadWalletData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeLocks = useMemo(() => {
    return Array.isArray(wallet?.activeLocks) ? wallet.activeLocks : [];
  }, [wallet?.activeLocks]);

  const sortedTransactions = useMemo(() => {
    const nextTransactions = [...transactions].sort((first, second) => {
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });

    if (activeSection !== "bids") {
      return nextTransactions;
    }

    return nextTransactions.filter((transaction) =>
      ["BidLock", "BidRefund", "Purchase"].includes(String(transaction.type || ""))
    );
  }, [activeSection, transactions]);

  const userDisplayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.userName ||
    profile?.email ||
    "Користувач";

  const openSection = (section) => {
    navigate(`/wallet#${section}`);
  };

  const handleTopUp = async (amount) => {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setToast({ message: "Введи коректну суму поповнення.", type: "error" });
      return;
    }

    try {
      setTopUpLoading(true);
      const walletResponse = await demoTopUpWallet(parsedAmount);

      setWallet(walletResponse.wallet || walletResponse);
      const nextTransactions = await getMyWalletTransactions();
      setTransactions(nextTransactions);
      window.dispatchEvent(new Event("authChanged"));
      setToast({ message: "Гаманець успішно поповнено.", type: "success" });
    } catch (error) {
      console.error("Top up error:", error);
      setToast({
        message: error?.response?.data?.message || "Не вдалося поповнити гаманець.",
        type: "error",
      });
    } finally {
      setTopUpLoading(false);
    }
  };

  if (!auth) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <span className={styles.kicker}>Wallet</span>
              <h1>Гаманець у розділеному форматі</h1>
              <p>
                Кожна задача в окремій секції: огляд, поповнення, резерви та транзакції.
                Без змішування всього в один довгий екран.
              </p>
            </div>

            <aside className={styles.heroAside}>
              <div className={styles.profileCard}>
                <span className={styles.cardLabel}>Користувач</span>
                <strong>{userDisplayName}</strong>
                <b>{profile?.userName ? `@${profile.userName}` : "Профіль"}</b>
              </div>

              <button
                type="button"
                className={styles.refreshButton}
                onClick={() => loadWalletData({ silent: true })}
                disabled={refreshing}
              >
                {refreshing ? "Оновлення..." : "Оновити дані"}
              </button>
            </aside>
          </section>

          {loading ? (
            <section className={styles.loadingCard}>Завантаження гаманця...</section>
          ) : (
            <>
              <section className={styles.metricsGrid}>
                <article className={styles.metricCard}>
                  <span>Balance</span>
                  <strong>{formatPrice(wallet?.balance, wallet?.currency)}</strong>
                </article>
                <article className={styles.metricCard}>
                  <span>Locked</span>
                  <strong>{formatPrice(wallet?.lockedBalance, wallet?.currency)}</strong>
                </article>
                <article className={styles.metricCard}>
                  <span>Available</span>
                  <strong>{formatPrice(wallet?.availableBalance, wallet?.currency)}</strong>
                </article>
              </section>

              <section className={styles.workspace}>
                <aside className={styles.sidebar}>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeSection === "overview" ? styles.navButtonActive : ""
                    }`}
                    onClick={() => openSection("overview")}
                  >
                    Огляд
                  </button>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeSection === "topup" ? styles.navButtonActive : ""
                    }`}
                    onClick={() => openSection("topup")}
                  >
                    Поповнення
                  </button>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeSection === "locks" ? styles.navButtonActive : ""
                    }`}
                    onClick={() => openSection("locks")}
                  >
                    Резерви
                  </button>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeSection === "transactions" ? styles.navButtonActive : ""
                    }`}
                    onClick={() => openSection("transactions")}
                  >
                    Транзакції
                  </button>
                  <button
                    type="button"
                    className={`${styles.navButton} ${
                      activeSection === "bids" ? styles.navButtonActive : ""
                    }`}
                    onClick={() => openSection("bids")}
                  >
                    Мої ставки
                  </button>
                </aside>

                <div className={styles.stage}>
                  {activeSection === "overview" && (
                    <section className={styles.overviewGrid}>
                      <article className={styles.panel}>
                        <div className={styles.panelHeader}>
                          <div>
                            <h2>Швидкий стан гаманця</h2>
                            <p>Головні цифри та поточна ситуація без зайвих переходів.</p>
                          </div>
                        </div>

                        <div className={styles.featureGrid}>
                          <div className={styles.featureCard}>
                            <span className={styles.cardLabel}>Доступно</span>
                            <strong>{formatPrice(wallet?.availableBalance, wallet?.currency)}</strong>
                            <b>Це сума, яку можна використовувати для нових ставок.</b>
                          </div>
                          <div className={styles.featureCard}>
                            <span className={styles.cardLabel}>У резерві</span>
                            <strong>{formatPrice(wallet?.lockedBalance, wallet?.currency)}</strong>
                            <b>Гроші тимчасово заблоковані лідерськими ставками.</b>
                          </div>
                          <div className={styles.featureCard}>
                            <span className={styles.cardLabel}>Остання операція</span>
                            <strong>
                              {sortedTransactions[0]
                                ? getTransactionLabel(sortedTransactions[0].type)
                                : "Немає"}
                            </strong>
                            <b>
                              {sortedTransactions[0]
                                ? getSignedAmount(
                                    sortedTransactions[0].type,
                                    sortedTransactions[0].amount,
                                    wallet?.currency
                                  )
                                : "Історія ще порожня"}
                            </b>
                          </div>
                        </div>
                      </article>

                      <article className={styles.panel}>
                        <div className={styles.panelHeader}>
                          <div>
                            <h2>Швидкі дії</h2>
                            <p>Кожна велика дія окремо, без переповненого екрану.</p>
                          </div>
                        </div>

                        <div className={styles.shortcutGrid}>
                          <button
                            type="button"
                            className={styles.shortcutCard}
                            onClick={() => openSection("topup")}
                          >
                            <strong>Поповнити баланс</strong>
                            <span>Окрема форма поповнення та швидкі суми.</span>
                          </button>
                          <button
                            type="button"
                            className={styles.shortcutCard}
                            onClick={() => openSection("locks")}
                          >
                            <strong>Переглянути резерви</strong>
                            <span>Активні блокування по лідерських ставках.</span>
                          </button>
                          <button
                            type="button"
                            className={styles.shortcutCard}
                            onClick={() => openSection("transactions")}
                          >
                            <strong>Відкрити історію</strong>
                            <span>Усі операції гаманця в окремому розділі.</span>
                          </button>
                          <button
                            type="button"
                            className={styles.shortcutCard}
                            onClick={() => openSection("bids")}
                          >
                            <strong>Операції по ставках</strong>
                            <span>Тільки резерви, повернення резерву та покупки.</span>
                          </button>
                        </div>
                      </article>
                    </section>
                  )}

                  {activeSection === "topup" && (
                    <section className={styles.topUpSection}>
                      <div>
                        <h2>Тестове поповнення</h2>
                        <p>Окрема секція тільки для поповнення, без змішування з історією та резервами.</p>
                      </div>

                      <form
                        className={styles.topUpControls}
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleTopUp(topUpAmount);
                        }}
                      >
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={topUpAmount}
                          onChange={(event) => setTopUpAmount(event.target.value)}
                          placeholder="Сума поповнення"
                        />
                        <button
                          type="submit"
                          className={styles.primaryButton}
                          disabled={topUpLoading}
                        >
                          {topUpLoading ? "Поповнення..." : "Поповнити баланс"}
                        </button>
                      </form>

                      <div className={styles.quickButtons}>
                        {[500, 1000, 5000].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={styles.quickButton}
                            onClick={() => handleTopUp(amount)}
                            disabled={topUpLoading}
                          >
                            +{amount} ₴
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeSection === "locks" && (
                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h2>Активні резерви</h2>
                          <p>Суми, які зараз заблоковані лідерськими ставками.</p>
                        </div>
                        <Link to="/auction" className={styles.secondaryLink}>
                          До аукціонів
                        </Link>
                      </div>

                      {!activeLocks.length ? (
                        <div className={styles.emptyState}>Зараз немає активних резервів.</div>
                      ) : (
                        <div className={styles.lockList}>
                          {activeLocks.map((lock, index) => (
                            <article key={lock.id || `${lock.auctionId || "lock"}-${index}`} className={styles.lockCard}>
                              <div>
                                <span className={styles.cardLabel}>Auction</span>
                                <strong>{lock.auctionTitle || `Аукціон #${lock.auctionId || "—"}`}</strong>
                                {lock.auctionId ? (
                                  <Link to={`/auction/${lock.auctionId}`} className={styles.inlineLink}>
                                    Відкрити аукціон #{lock.auctionId}
                                  </Link>
                                ) : (
                                  <b>Резерв ставки</b>
                                )}
                              </div>
                              <div className={styles.lockMeta}>
                                <strong>{formatPrice(lock.amount, wallet?.currency)}</strong>
                                <span>{formatDate(lock.createdAt || lock.lockedAt)}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {(activeSection === "transactions" || activeSection === "bids") && (
                    <section className={styles.panel}>
                      <div className={styles.panelHeader}>
                        <div>
                          <h2>{activeSection === "bids" ? "Мої ставки та рух коштів" : "Транзакції"}</h2>
                          <p>
                            {activeSection === "bids"
                              ? "Показані тільки операції, пов’язані зі ставками: резерв, повернення резерву та покупка."
                              : "Deposit, BidLock, BidRefund та Purchase з уже готового бекенду."}
                          </p>
                        </div>
                      </div>

                      {!sortedTransactions.length ? (
                        <div className={styles.emptyState}>
                          {activeSection === "bids"
                            ? "Операцій по ставках поки немає."
                            : "Транзакцій поки немає."}
                        </div>
                      ) : (
                        <div className={styles.transactions}>
                          {sortedTransactions.map((transaction, index) => (
                            <article
                              key={transaction.id || `${transaction.type}-${transaction.createdAt || index}`}
                              className={styles.transactionItem}
                            >
                              <div className={styles.transactionMain}>
                                <div className={styles.transactionTop}>
                                  <span
                                    className={`${styles.transactionBadge} ${
                                      styles[`transaction${getTransactionTone(transaction.type)[0].toUpperCase()}${getTransactionTone(transaction.type).slice(1)}`]
                                    }`}
                                  >
                                    {getTransactionLabel(transaction.type)}
                                  </span>
                                  {transaction.auctionId && (
                                    <Link to={`/auction/${transaction.auctionId}`} className={styles.inlineLink}>
                                      Аукціон #{transaction.auctionId}
                                    </Link>
                                  )}
                                </div>
                                <span>{formatDate(transaction.createdAt)}</span>
                              </div>
                              <div className={styles.transactionMeta}>
                                <strong
                                  className={`${styles.transactionAmount} ${
                                    styles[`amount${getTransactionTone(transaction.type)[0].toUpperCase()}${getTransactionTone(transaction.type).slice(1)}`]
                                  }`}
                                >
                                  {getSignedAmount(transaction.type, transaction.amount, wallet?.currency)}
                                </strong>
                                <span>{transaction.description || transaction.reference || "Без додаткового опису"}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

export default WalletPage;
