import axios from "axios";

export async function getMe() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  const res = await axios.get("/api/profile/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("authChanged"));
}