"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { NotificationItem } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

/** 格式化日期时间为可读字符串 */
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `今天 ${time}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日 ${time}`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getNotifications();
        if (!cancelled) setNotifications(data.items || []);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "加载通知失败";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkRead = async (id: number) => {
    if (markingIds.has(id)) return;
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "操作失败";
      toast.error(msg);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 border-b border-slate-100 py-4 last:border-b-0 last:pb-0"
            >
              <Skeleton className="h-3 w-3 flex-shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========== 错误态 ========== */
  if (error && notifications.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16">
        <EmptyState
          icon={<Bell className="h-12 w-12 text-slate-300" />}
          title="加载失败"
          description={error}
          action={
            <button
              onClick={() => window.location.reload()}
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
  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16">
        <EmptyState
          icon={<Bell className="h-12 w-12 text-slate-300" />}
          title="暂无通知"
          description="当有订单状态更新或其他消息时，会在这里显示"
        />
      </div>
    );
  }

  /* ========== 通知列表 ========== */
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="divide-y divide-slate-100">
        {notifications.map((n) => {
          const isMarking = markingIds.has(n.id);
          return (
            <button
              key={n.id}
              onClick={() => {
                if (!n.is_read) handleMarkRead(n.id);
              }}
              className={cn(
                "flex w-full gap-3 px-5 py-4 text-left transition-colors",
                n.is_read
                  ? "cursor-default"
                  : "cursor-pointer hover:bg-slate-50"
              )}
            >
              {/* 未读蓝点 */}
              <div className="mt-1.5 flex-shrink-0">
                {isMarking ? (
                  <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                ) : !n.is_read ? (
                  <span className="block h-3 w-3 rounded-full bg-blue-500" />
                ) : (
                  <span className="block h-3 w-3" />
                )}
              </div>

              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <h4
                  className={cn(
                    "text-sm",
                    n.is_read
                      ? "font-normal text-slate-500"
                      : "font-semibold text-slate-800"
                  )}
                >
                  {n.title}
                </h4>
                {n.content && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                    {n.content}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">
                  {formatDateTime(n.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
