import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import { getCurrentUser, isAuthenticated } from "../utils/fakeAuth";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const user = getCurrentUser();

  if (!isAuthenticated() || !user) {
    return <Navigate to="/auth" replace />;
  }

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.profilePage}>
        <section className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.bigAvatar}>{firstLetter}</div>

            <div className={styles.userMeta}>
              <span className={styles.userBadge}>Premium account</span>
              <h1 className={styles.userName}>{user.name}</h1>
              <p className={styles.userUsername}>{user.username}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.balanceCard}>
              <span className={styles.balanceLabel}>Баланс</span>
              <strong className={styles.balanceValue}>
                {user.balance.toLocaleString("uk-UA")} ₴
              </strong>
            </div>

            <div className={styles.heroButtons}>
              <button type="button" className={styles.primaryButton}>
                Поповнити
              </button>
              <button type="button" className={styles.secondaryButton}>
                Редагувати профіль
              </button>
            </div>
          </div>
        </section>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Мої ставки</span>
            <strong className={styles.statValue}>{user.stats.bids}</strong>
            <p className={styles.statText}>Активні участі в аукціонах</p>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Обрані лоти</span>
            <strong className={styles.statValue}>{user.stats.favorites}</strong>
            <p className={styles.statText}>Збережені речі для перегляду</p>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Покупки</span>
            <strong className={styles.statValue}>{user.stats.purchases}</strong>
            <p className={styles.statText}>Завершені замовлення</p>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Статус</span>
            <strong className={styles.statValue}>VIP</strong>
            <p className={styles.statText}>Розширений доступ до платформи</p>
          </article>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Остання активність</h2>
              <span>Оновлено щойно</span>
            </div>

            <div className={styles.activityList}>
              {user.activity.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityDot}></div>
                  <div>
                    <p className={styles.activityTitle}>{item.title}</p>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Швидкі дії</h2>
            </div>

            <div className={styles.quickActions}>
              <button type="button" className={styles.quickActionButton}>
                Переглянути мої ставки
              </button>
              <button type="button" className={styles.quickActionButton}>
                Відкрити обране
              </button>
              <button type="button" className={styles.quickActionButton}>
                Історія покупок
              </button>
              <button type="button" className={styles.quickActionButton}>
                Налаштування акаунта
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;