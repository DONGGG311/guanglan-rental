import type {
  Order,
  PaginatedResponse,
  Space,
  FavoriteItem,
  NotificationItem,
} from "@/types";

const API_BASE = "";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `请求失败 (${res.status})`);
  }

  return res.json();
}

export const api = {
  /* ========== 厂房 ========== */
  getSpaces: (params: Record<string, string>) =>
    request<PaginatedResponse<Space>>(
      `/api/spaces?${new URLSearchParams(params)}`
    ),

  getSpace: (id: number) => request<Space>(`/api/spaces/${id}`),

  /* ========== 认证 ========== */
  login: (data: { phone: string; password: string }) =>
    request<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: {
    name: string;
    phone: string;
    password: string;
    company?: string;
  }) =>
    request<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /* ========== 订单 ========== */
  createOrder: (data: {
    space_id: number;
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
    rent_type: string;
    start_date: string;
    duration: number;
    notes?: string;
  }) =>
    request<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyOrders: (params?: Record<string, string>) =>
    request<PaginatedResponse<Order>>(
      `/api/orders?${new URLSearchParams(params || {})}`
    ),

  getOrder: (id: number) => request<Order>(`/api/orders/${id}`),

  renewOrder: (id: number) =>
    request<Order>(`/api/orders/${id}/renew`, { method: "POST" }),

  /* ========== 收藏 ========== */
  toggleFavorite: (spaceId: number) =>
    request<{ favorited: boolean; message: string }>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ space_id: spaceId }),
    }),

  getFavorites: () =>
    request<{ items: FavoriteItem[]; total: number }>("/api/favorites"),

  /* ========== 个人信息 ========== */
  getProfile: () =>
    request<{
      id: number;
      name: string;
      phone: string;
      email: string | null;
      company: string | null;
      created_at: string | null;
    }>("/api/user/profile"),

  updateProfile: (data: {
    name?: string;
    email?: string;
    company?: string;
  }) =>
    request<{
      id: number;
      name: string;
      phone: string;
      email: string | null;
      company: string | null;
      created_at: string | null;
    }>("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /* ========== 通知 ========== */
  getNotifications: () =>
    request<{ items: NotificationItem[]; total: number }>("/api/notifications"),

  markNotificationRead: (id: number) =>
    request<NotificationItem>(`/api/notifications/${id}/read`, {
      method: "PUT",
    }),
};
