import api from "./axios";
import { getAuthToken } from "../utils/authStorage";

export async function getMyWallet() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const response = await api.get("/api/wallet/me");
  return response.data;
}

export async function getMyWalletTransactions() {
  const token = getAuthToken();

  if (!token) {
    return [];
  }

  const response = await api.get("/api/wallet/me/transactions");
  return Array.isArray(response.data) ? response.data : response.data?.items || [];
}

export async function demoTopUpWallet(amount) {
  const response = await api.post("/api/wallet/demo-topup", { amount });
  return response.data;
}
