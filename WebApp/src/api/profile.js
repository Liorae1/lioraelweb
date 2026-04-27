import api from "./axios";
import { normalizeAuctionEntity, normalizeMediaUrl } from "../utils/domain";
import { clearAuthToken, hasAuthToken } from "../utils/authStorage";

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
  if (!hasAuthToken()) {
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
  if (!hasAuthToken()) {
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

export async function cancelSubscription() {
  const attempts = [
    () => api.post("/api/profile/me/subscription/cancel"),
    () => api.post("/api/profile/me/subscription/unsubscribe"),
    () => api.delete("/api/profile/me/subscription"),
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data;
    } catch (error) {
      lastError = error;

      if (![404, 405].includes(error?.response?.status)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function logout() {
  clearAuthToken();
  window.dispatchEvent(new Event("authChanged"));
}
