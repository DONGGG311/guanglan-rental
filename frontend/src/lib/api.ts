import type { Order, PaginatedResponse, Space } from "@/types";

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
};
