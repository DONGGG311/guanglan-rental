"use client";

import type { User } from "@/types";

/** 当前登录用户信息（localStorage 中存的 user） */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** 是否已登录（有 token 即视为已登录） */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
}

/** 退出登录：清除用户端 token 和 user 信息 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // 通知 Navbar 等组件刷新登录状态
  window.dispatchEvent(new Event("guanglan-auth-changed"));
}
