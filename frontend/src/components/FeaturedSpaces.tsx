"use client";

import { useEffect, useState } from "react";
import type { Space } from "@/types";
import { api } from "@/lib/api";
import { SpaceCard } from "@/components/SpaceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

export function FeaturedSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSpaces({
          page: "1",
          page_size: "4",
          status: "available",
        });
        if (!cancelled) setSpaces(data.items);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60"
          >
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={error}
        className="mt-10"
      />
    );
  }

  if (spaces.length === 0) {
    return (
      <EmptyState
        title="暂无推荐厂房"
        description="敬请期待更多厂房上线"
        className="mt-10"
      />
    );
  }

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </div>
  );
}
