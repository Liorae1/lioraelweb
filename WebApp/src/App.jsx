import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "./components/Loader.jsx";
import FloatingMenu from "./components/FloatingMenu";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import AuctionsPage from "./pages/AuctionsPage";
import AuctionDetailsPage from "./pages/AuctionDetailsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const wakeUp = async () => {
      try {
        await fetch("https://liorael-b9hugjgvbygshzgy.swedencentral-01.azurewebsites.net/health");
      } catch (e) {
        console.log("Server wake error:", e);
      } finally {
        setLoading(false);
      }
    };

    wakeUp();
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <FloatingMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/auction" element={<AuctionsPage />} />
        <Route path="/auction/:id" element={<AuctionDetailsPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </>
  );
}

export default App;
