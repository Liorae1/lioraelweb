import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import WalletPage from "./pages/WalletPage";
import AuctionsPage from "./pages/AuctionsPage";
import AuctionDetailsPage from "./pages/AuctionDetailsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const wakeUp = async () => {
      try {
        await fetch("https://liorael-b9hugjgvbygshzgy.swedencentral-01.azurewebsites.net/health");
      } catch (e) {
        console.log("Server wake error:", e);
      }
    };

    wakeUp();
  }, []);

  return (
    <>
      <div key={location.key} className="routeTransitionOverlay" aria-hidden="true" />
      <div key={location.pathname} className="routeScene">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/auction" element={<AuctionsPage />} />
          <Route path="/auction/history" element={<AuctionsPage />} />
          <Route path="/auction/:id" element={<AuctionDetailsPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
