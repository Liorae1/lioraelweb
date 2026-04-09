import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuctionsPage.module.css";
import { mockLots } from "../data/mockLots";

function AuctionsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("ending");

  const brands = ["All", ...new Set(mockLots.map((lot) => lot.brand))];
  const categories = ["All", ...new Set(mockLots.map((lot) => lot.category))];
  const statuses = ["All", ...new Set(mockLots.map((lot) => lot.status))];

  const filteredLots = useMemo(() => {
    const parseTimeLeft = (value) => {
      const hoursMatch = value.match(/(\d+)г/);
      const minutesMatch = value.match(/(\d+)хв/);

      const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;

      return hours * 60 + minutes;
    };

    let result = [...mockLots];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.title.toLowerCase().includes(query) ||
          lot.brand.toLowerCase().includes(query) ||
          lot.category.toLowerCase().includes(query)
      );
    }

    if (brand !== "All") {
      result = result.filter((lot) => lot.brand === brand);
    }

    if (category !== "All") {
      result = result.filter((lot) => lot.category === category);
    }

    if (status !== "All") {
      result = result.filter((lot) => lot.status === status);
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => b.currentBid - a.currentBid);
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.currentBid - b.currentBid);
    } else if (sortBy === "popular") {
      result.sort((a, b) => b.bidsCount - a.bidsCount);
    } else {
      result.sort((a, b) => parseTimeLeft(a.timeLeft) - parseTimeLeft(b.timeLeft));
    }

    return result;
  }, [search, brand, category, status, sortBy]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>Curated luxury auctions</span>
          <h1>Аукціони</h1>
          <p>
            Відкрийте актуальні лоти, стежте за ставками та знаходьте рідкісні
            речі від преміальних брендів.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{mockLots.length}</span>
            <span className={styles.statLabel}>Активних лотів</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statValue}>24ч</span>
            <span className={styles.statLabel}>Середній аукціон</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statValue}>Luxury</span>
            <span className={styles.statLabel}>Curated only</span>
          </div>
        </div>
      </section>

      <section className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Пошук лотів, брендів, категорій..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filtersGrid}>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "Усі бренди" : item}
              </option>
            ))}
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "Усі категорії" : item}
              </option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "Усі статуси" : item}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="ending">Спочатку завершуються</option>
            <option value="price-high">Ставка: від більшої</option>
            <option value="price-low">Ставка: від меншої</option>
            <option value="popular">Найпопулярніші</option>
          </select>
        </div>
      </section>

      <section className={styles.resultsHeader}>
        <p>
          Знайдено <strong>{filteredLots.length}</strong> лотів
        </p>
      </section>

      <section className={styles.lotsList}>
        {filteredLots.map((lot) => (
          <article key={lot.id} className={styles.lotCard}>
            <div className={styles.imageWrap}>
              <img src={lot.image} alt={lot.title} />
              <span
                className={`${styles.badge} ${
                  styles[lot.status.replace(/\s+/g, "")]
                }`}
              >
                {lot.status}
              </span>
            </div>

            <div className={styles.lotInfo}>
              <div className={styles.lotTop}>
                <div>
                  <p className={styles.brand}>{lot.brand}</p>
                  <h2>{lot.title}</h2>
                </div>
              </div>

              <div className={styles.meta}>
                <span>Категорія: {lot.category}</span>
                <span>Розмір: {lot.size}</span>
                <span>Стан: {lot.condition}</span>
              </div>
            </div>

            <div className={styles.lotSide}>
              <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>Поточна ставка</span>
                <strong>{lot.currentBid.toLocaleString("uk-UA")} ₴</strong>
              </div>

              <div className={styles.sideMeta}>
                <span>{lot.bidsCount} ставок</span>
                <span>Залишилось: {lot.timeLeft}</span>
              </div>

              <button
                type="button"
                className={styles.detailsBtn}
                onClick={() => navigate(`/auction/${lot.id}`)}
              >
                Детальніше
              </button>
            </div>
          </article>
        ))}

        {filteredLots.length === 0 && (
          <div className={styles.emptyState}>
            <h3>Нічого не знайдено</h3>
            <p>Спробуйте змінити фільтри або пошуковий запит.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default AuctionsPage;