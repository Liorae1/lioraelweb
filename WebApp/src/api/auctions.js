import api from "./axios";
import { normalizeAuctionEntity, normalizeBidEntity } from "../utils/domain";

/**
 * @typedef {Object} AuctionResponse
 * @property {string} id
 * @property {string} status
 * @property {boolean} isFavorite
 * @property {number} bidCount
 * @property {Array<{id?: string, imageUrl?: string, url?: string}>} images
 * @property {{userName?: string, avatarUrl?: string}} [leader]
 */

/**
 * @typedef {Object} AuctionBidResponse
 * @property {string} id
 * @property {number} amount
 * @property {string} createdAt
 * @property {{userId?: string, userName?: string, avatarUrl?: string}} [bidder]
 */

const AUCTIONS_RESPONSE_KEYS = ["items", "data", "results", "content", "auctions"];

function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const key of AUCTIONS_RESPONSE_KEYS) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
}

function normalizeSingleAuction(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return normalizeAuctionEntity(payload);
  }

  return null;
}

export async function getAllAuctions() {
  const response = await api.get("/api/auctions/all");
  return normalizeCollection(response.data)
    .filter((auction) => auction?.id)
    .map(normalizeAuctionEntity);
}

export async function getAuctionHistory() {
  const response = await api.get("/api/auctions/history");
  return normalizeCollection(response.data)
    .filter((auction) => auction?.id)
    .map(normalizeAuctionEntity);
}

export async function getAuctionById(auctionId) {
  try {
    const response = await api.get(`/api/auctions/${auctionId}`);
    return normalizeSingleAuction(response.data);
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const historyAuctions = await getAuctionHistory();
    return historyAuctions.find((auction) => String(auction?.id) === String(auctionId)) || null;
  }
}

export async function getAuctionBids(auctionId) {
  const response = await api.get(`/api/auctions/${auctionId}/bids`);

  return normalizeCollection(response.data)
    .map(normalizeBidEntity)
    .sort((first, second) => {
      const firstTime = first?.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second?.createdAt ? new Date(second.createdAt).getTime() : 0;

      return secondTime - firstTime;
    });
}
