import type {
  Order,
  PaginatedResponse,
  Space,
  FavoriteItem,
  NotificationItem,
  Contract,
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

/** Request helper that uses admin_token from localStorage. */
async function adminRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: HeadersInit = {};

  // Do NOT set Content-Type for FormData (multipart)
  if (!(options?.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
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

export interface DashboardStats {
  total_spaces: number;
  available_spaces: number;
  rented_spaces: number;
  pending_orders: number;
  total_orders: number;
  vacancy_rate: number;
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

  /* ========== 合同 ========== */
  getContractInfo: (orderId: number) =>
    request<Contract>(`/api/orders/${orderId}/contract/info`),

  getAdminContractInfo: (orderId: number) =>
    request<Contract>(`/admin/orders/${orderId}/contract/info`),

  /* ========== 管理员 ========== */

  /** Admin login */
  adminLogin: (data: { username: string; password: string }) =>
    request<{ access_token: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Get admin profile */
  adminMe: () =>
    adminRequest<{ id: number; username: string; email: string }>(
      "/admin/auth/me"
    ),

  /** Get dashboard stats */
  getDashboard: () => adminRequest<DashboardStats>("/admin/dashboard"),

  /* -- Spaces CRUD -- */

  /** List all spaces (admin, includes unpublished) */
  adminGetSpaces: (params?: Record<string, string>) =>
    adminRequest<PaginatedResponse<Space>>(
      `/admin/spaces?${new URLSearchParams(params || {})}`
    ),

  /** Create a space */
  createSpace: (data: Partial<Space>) =>
    adminRequest<Space>("/admin/spaces", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Update a space */
  updateSpace: (id: number, data: Partial<Space>) =>
    adminRequest<Space>(`/admin/spaces/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /** Delete a space */
  deleteSpace: (id: number) =>
    adminRequest<{ message: string }>(`/admin/spaces/${id}`, {
      method: "DELETE",
    }),

  /** Toggle space publish status */
  togglePublishSpace: (id: number) =>
    adminRequest<Space>(`/admin/spaces/${id}/publish`, {
      method: "PUT",
    }),

  /** Upload images for a space */
  uploadSpaceImages: (spaceId: number, files: FileList | File[]) => {
    const formData = new FormData();
    const fileArray = Array.from(files);
    fileArray.forEach((file) => formData.append("files", file));
    return adminRequest<{ images: string[]; uploaded: string[] }>(
      `/admin/spaces/${spaceId}/images`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  /** Remove an image from a space */
  removeSpaceImage: (spaceId: number, imageUrl: string) =>
    adminRequest<{ images: string[] }>(`/admin/spaces/${spaceId}/images`, {
      method: "DELETE",
      body: JSON.stringify({ image_url: imageUrl }),
    }),

  /* -- Orders management -- */

  /** List all orders (admin) */
  adminGetOrders: (params?: Record<string, string>) =>
    adminRequest<{ items: Order[]; total: number; page: number; page_size: number }>(
      `/admin/orders?${new URLSearchParams(params || {})}`
    ),

  /** Get order detail (admin) */
  adminGetOrder: (id: number) =>
    adminRequest<Order & { space_name?: string }>(`/admin/orders/${id}`),

  /** Update order status */
  updateOrderStatus: (id: number, status: string) =>
    adminRequest<{ message: string; status: string }>(
      `/admin/orders/${id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    ),

  /** Get contract info (admin) */
  getContractInfoAdmin: (orderId: number) =>
    adminRequest<Contract>(`/admin/orders/${orderId}/contract/info`),

  /** Send manual notification */
  sendNotification: (data: {
    user_id: number;
    title: string;
    content: string;
    notif_type?: string;
  }) =>
    adminRequest("/admin/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
