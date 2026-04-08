import styles from "./FeaturedAuctionsSection.module.css";
import { useReveal } from "../hooks/useReveal";

const auctions = [
  {
    id: 1,
    brand: "Prada",
    title: "Limited Wool Coat",
    price: "€2,480",
    time: "03г 14хв",
  },
  {
    id: 2,
    brand: "Balenciaga",
    title: "Archive Leather Bag",
    price: "€3,180",
    time: "05г 22хв",
  },
  {
    id: 3,
    brand: "Gucci",
    title: "Vintage Silk Jacket",
    price: "€1,920",
    time: "01г 47хв",
  },
];

function FeaturedAuctionsSection() {
  const { ref, isVisible } = useReveal();
  
  return (
    <section 
      ref={ref}
      className={`${styles.section} reveal ${isVisible ? "revealVisible" : ""}`}
      >
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <div className={styles.label}>Актуальні лоти</div>
            <h2 className={styles.title}>Популярні аукціони</h2>
          </div>

          <button className={styles.allButton}>Усі аукціони</button>
        </div>

        <div className={styles.grid}>
          {auctions.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.image}></div>

              <div className={styles.content}>
                <div className={styles.brand}>{item.brand}</div>
                <h3 className={styles.cardTitle}>{item.title}</h3>

                <div className={styles.infoRow}>
                  <div>
                    <div className={styles.infoLabel}>Поточна ставка</div>
                    <div className={styles.price}>{item.price}</div>
                  </div>

                  <div>
                    <div className={styles.infoLabel}>Завершиться через</div>
                    <div className={styles.time}>{item.time}</div>
                  </div>
                </div>

                <button className={styles.bidButton}>Переглянути лот</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedAuctionsSection;