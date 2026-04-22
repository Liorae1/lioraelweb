import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSection from "../sections/HeroSection";
import FeaturedAuctionsSection from "../sections/FeaturedAuctionsSection";
import ShowcaseSection from "../sections/ShowcaseSection";
import BenefitsSection from "../sections/BenefitsSection";
import PromoSection from "../sections/PromoSection";
import { getAllAuctions } from "../api/auctions";
import {
  getAuctionPhase,
  sortAuctionsForHomepage,
} from "../utils/auctionPresentation";

function HomePage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomeAuctions = async () => {
      try {
        setLoading(true);
        setError("");
        const items = await getAllAuctions();
        setAuctions(items);
      } catch (err) {
        console.error("Failed to load homepage auctions:", err);
        setError(err?.response?.data?.message || "Не вдалося завантажити актуальні лоти.");
      } finally {
        setLoading(false);
      }
    };

    loadHomeAuctions();
  }, []);

  const homeData = useMemo(() => {
    const sortedAuctions = sortAuctionsForHomepage(auctions);
    const plannedAuctions = sortedAuctions.filter(
      (auction) => getAuctionPhase(auction) === "planned"
    );
    const heroAuction = plannedAuctions[0] || sortedAuctions[0] || null;
    const featuredAuctions = plannedAuctions.slice(0, 3);
    const totalBids = auctions.reduce(
      (sum, auction) => sum + Number(auction?.bidCount ?? auction?.bidsCount ?? 0),
      0
    );
    const activeAuctions = sortedAuctions.filter(
      (auction) => getAuctionPhase(auction) !== "closed"
    ).length;

    return {
      heroAuction,
      featuredAuctions,
      stats: {
        totalLots: auctions.length,
        totalBids,
        activeAuctions,
      },
    };
  }, [auctions]);

  return (
    <>
      <Header />
      <main>
        <HeroSection
          auction={homeData.heroAuction}
          stats={homeData.stats}
          loading={loading}
          error={error}
        />
        <FeaturedAuctionsSection
          auctions={homeData.featuredAuctions}
          loading={loading}
          error={error}
        />
        <ShowcaseSection />
        <BenefitsSection />
        <PromoSection />
      </main>
      <Footer />
    </>
  );
}

export default HomePage;
