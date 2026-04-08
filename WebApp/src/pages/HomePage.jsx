import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSection from "../sections/HeroSection";
import FeaturedAuctionsSection from "../sections/FeaturedAuctionsSection";
import ShowcaseSection from "../sections/ShowcaseSection";
import BenefitsSection from "../sections/BenefitsSection";
import PromoSection from "../sections/PromoSection";

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturedAuctionsSection />
        <ShowcaseSection />
        <BenefitsSection />
        <PromoSection />
      </main>
      <Footer />
    </>
  );
}

export default HomePage;