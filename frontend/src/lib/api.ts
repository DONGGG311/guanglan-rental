import type { PaginatedResponse, Space } from "@/types";

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
  getSpaces: (params: Record<string, string>) =>
    request<PaginatedResponse<Space>>(
      `/api/spaces?${new URLSearchParams(params)}`
    ),

  getSpace: (id: number) => request<Space>(`/api/spaces/${id}`),

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
};
