import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 格式化面积，如 "150㎡" */
export function formatArea(area: number): string {
  return `${area}㎡`;
}

/** 格式化租金，如 "¥8,000" */
export function formatRent(rent: number): string {
  return `¥${rent.toLocaleString("zh-CN")}`;
}

/** 格式化月租显示，如 "¥8,000/月" */
export function formatMonthlyRent(rent: number): string {
  return `${formatRent(rent)}/月`;
}

/** 格式化年租显示，如 "¥80,000/年" */
export function formatYearlyRent(rent: number): string {
  return `${formatRent(rent)}/年`;
}

/** 格式化日期，如 "2026-07-07" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 解析 images 字段（后端返回 JSON 字符串） */
export function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
