import axios from "axios";
import { getAuthToken } from "../utils/authStorage";

const api = axios.create({
  baseURL: "https://liorael-b9hugjgvbygshzgy.swedencentral-01.azurewebsites.net",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
