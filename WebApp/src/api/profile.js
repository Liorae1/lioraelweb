import api from "./axios";
import { normalizeAuctionEntity, normalizeMediaUrl } from "../utils/domain";

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return profile;
  }

  return {
    ...profile,
    avatarUrl: normalizeMediaUrl(profile.avatarUrl),
    wonAuctions: Array.isArray(profile.wonAuctions)
      ? profile.wonAuctions.map(normalizeAuctionEntity).filter(Boolean)
      : [],
    favoriteAuctions: Array.isArray(profile.favoriteAuctions)
      ? profile.favoriteAuctions.map(normalizeAuctionEntity).filter(Boolean)
      : [],
  };
}

export async function getMe() {
  if (!localStorage.getItem("token")) {
    return null;
  }

  const res = await api.get("/api/profile/me");

  return normalizeProfile(res.data);
}

export async function getProfileByUserId(userId) {
  const res = await api.get(`/api/profile/${userId}`);
  return normalizeProfile(res.data);
}

export async function getMyFavorites() {
  if (!localStorage.getItem("token")) {
    return [];
  }

  const res = await api.get("/api/profile/me/favorites");
  const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
  return items.map(normalizeAuctionEntity).filter(Boolean);
}

export async function addAuctionToFavorites(auctionId) {
  const res = await api.post(`/api/auctions/${auctionId}/favorite`);
  return res.data;
}

export async function removeAuctionFromFavorites(auctionId) {
  const res = await api.delete(`/api/auctions/${auctionId}/favorite`);
  return res.data;
}

export async function requestWinningDelivery(auctionId) {
  const res = await api.post(`/api/profile/me/winnings/${auctionId}/delivery/request`);
  return res.data;
}

export async function progressWinningDelivery(auctionId) {
  const res = await api.post(`/api/profile/me/winnings/${auctionId}/delivery/progress`);
  return res.data;
}

export async function purchaseSubscription(payload) {
  const res = await api.post("/api/profile/me/subscription/purchase", payload);
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("authChanged"));
}
