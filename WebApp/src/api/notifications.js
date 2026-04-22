import api from "./axios";

function normalizeNotifications(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function normalizeNotification(item) {
  return {
    ...item,
    id: item?.id || item?.notificationId,
    title: item?.title || item?.subject || "Сповіщення",
    message: item?.message || item?.text || item?.body || "",
    targetUrl: item?.targetUrl || item?.url || item?.link || "",
    isRead: Boolean(item?.isRead ?? item?.readAt),
    createdAt: item?.createdAt || item?.sentAt || item?.date || null,
  };
}

export async function getMyNotifications() {
  if (!localStorage.getItem("token")) {
    return [];
  }

  const res = await api.get("/api/notifications");
  return normalizeNotifications(res.data).map(normalizeNotification);
}

export async function getMyUnreadNotificationsCount() {
  if (!localStorage.getItem("token")) {
    return 0;
  }

  const res = await api.get("/api/notifications/unread-count");
  return Number(res.data?.count ?? res.data ?? 0);
}

export async function markNotificationAsRead(id) {
  const res = await api.post(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsAsRead() {
  const res = await api.post("/api/notifications/read-all");
  return res.data;
}
