"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, Building2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FavoriteItem } from "@/types";
import { AREA_LABELS, STATUS_LABELS } from "@/types";
import { api } from "@/lib/api";
import { cn, formatArea, formatMonthlyRent } from "@/lib/utils";
import { AreaBadge, AvailabilityBadge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFavorites();
      setFavorites(data.items || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载收藏失败";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (spaceId: number) => {
    if (togglingIds.has(spaceId)) return;
    setTogglingIds((prev) => new Set(prev).add(spaceId));
    try {
      const result = await api.toggleFavorite(spaceId);
      toast.success(result.message);
      // Remove from list
      setFavorites((prev) => prev.filter((f) => f.space_id !== spaceId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "操作失败";
      toast.error(msg);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(spaceId);
        return next;
      });
    }
  };

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-0">
            <Skeleton className="aspect-video w-full rounded-t-xl" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ========== 错误态 ========== */
  if (error && favorites.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16">
        <EmptyState
          icon={<Building2 className="h-12 w-12 text-slate-300" />}
          title="加载失败"
          description={error}
          action={
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              重新加载
            </button>
          }
        />
      </div>
    );
  }

  /* ========== 空状态 ========== */
  if (favorites.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16">
        <EmptyState
          icon={<Heart className="h-12 w-12 text-slate-300" />}
          title="还没有收藏厂房"
          description="浏览厂房列表，点击心形图标收藏你感兴趣的厂房"
          action={
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              浏览厂房
            </Link>
          }
        />
      </div>
    );
  }

  /* ========== 收藏列表 ========== */
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((fav) => {
        const isToggling = togglingIds.has(fav.space_id);
        return (
          <div
            key={fav.id}
            className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            {/* 图片区域 */}
            <Link href={`/spaces/${fav.space_id}`}>
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                {fav.status === "rented" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                    <span className="rounded-full bg-white/90 px-4 py-1 text-sm font-medium text-slate-600">
                      {STATUS_LABELS.rented || "已出租"}
                    </span>
                  </div>
                )}
                <div className="flex h-full w-full items-center justify-center">
                  <Building2 className="h-12 w-12 text-slate-400" />
                </div>
              </div>
            </Link>

            {/* 信息区域 */}
            <Link href={`/spaces/${fav.space_id}`} className="block p-4">
              <div className="mb-2 flex items-center gap-2">
                <AreaBadge category={fav.area_category as "small" | "medium" | "large"} />
                <AvailabilityBadge status={fav.status as "available" | "rented" | "maintenance"} />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                {fav.space_name}
              </h3>
              <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{fav.address}</span>
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-600">
                  {formatArea(fav.area)}
                </span>
                <span className="text-base font-semibold text-teal-700">
                  {formatMonthlyRent(fav.monthly_rent)}
                </span>
              </div>
            </Link>

            {/* 取消收藏按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleToggle(fav.space_id);
              }}
              disabled={isToggling}
              className="absolute right-3 top-3 z-20 rounded-full bg-white/80 p-2 shadow backdrop-blur transition hover:bg-white disabled:opacity-50"
              aria-label="取消收藏"
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              ) : (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
