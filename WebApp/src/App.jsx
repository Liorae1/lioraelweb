import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AuctionsPage from "./pages/AuctionsPage";
import AuctionDetailsPage from "./pages/AuctionDetailsPage";
import FloatingMenu from "./components/FloatingMenu";

function App() {
  return (
    <>
      <FloatingMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auction" element={<AuctionsPage />} />
        <Route path="/auction/:id" element={<AuctionDetailsPage />} />
      </Routes>
    </>
  );
}

export default App;