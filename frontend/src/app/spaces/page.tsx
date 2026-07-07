"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, RotateCcw } from "lucide-react";
import type { Space, PaginatedResponse } from "@/types";
import { api } from "@/lib/api";
import { AREA_LABELS, STATUS_LABELS } from "@/types";
import { SpaceCard } from "@/components/SpaceCard";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function SpacesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <SpacesContent />
    </Suspense>
  );
}

function SpacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Space> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [keyword, setKeyword] = useState(
    searchParams.get("keyword") || ""
  );
  const [areaCategory, setAreaCategory] = useState(
    searchParams.get("area_category") || ""
  );
  const [status, setStatus] = useState(
    searchParams.get("status") || ""
  );
  const [page, setPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(PAGE_SIZE),
      };
      if (keyword) params.keyword = keyword;
      if (areaCategory) params.area_category = areaCategory;
      if (status) params.status = status;

      const result = await api.getSpaces(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, areaCategory, status]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // 同步 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (areaCategory) params.set("area_category", areaCategory);
    if (status) params.set("status", status);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`/spaces${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [keyword, areaCategory, status, page, router]);

  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setPage(1);
  };

  const handleReset = () => {
    setKeyword("");
    setAreaCategory("");
    setStatus("");
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const hasActiveFilters = keyword || areaCategory || status;

  /* ========== 筛选面板（共用） ========== */
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* 面积分类 */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-800">
          面积分类
        </h4>
        <div className="space-y-1.5">
          {Object.entries(AREA_LABELS).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600"
            >
              <input
                type="radio"
                name="areaCategory"
                checked={areaCategory === key}
                onChange={() => {
                  setAreaCategory(key);
                  setPage(1);
                  setMobileFilterOpen(false);
                }}
                className="accent-teal-700"
              />
              {label}
            </label>
          ))}
          {areaCategory && (
            <button
              onClick={() => {
                setAreaCategory("");
                setPage(1);
              }}
              className="pl-6 text-xs text-slate-400 hover:text-slate-600"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 状态 */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-800">
          租赁状态
        </h4>
        <div className="space-y-1.5">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-600"
            >
              <input
                type="radio"
                name="status"
                checked={status === key}
                onChange={() => {
                  setStatus(key);
                  setPage(1);
                  setMobileFilterOpen(false);
                }}
                className="accent-teal-700"
              />
              {label}
            </label>
          ))}
          {status && (
            <button
              onClick={() => {
                setStatus("");
                setPage(1);
              }}
              className="pl-6 text-xs text-slate-400 hover:text-slate-600"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 重置 */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            handleReset();
            setMobileFilterOpen(false);
          }}
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置筛选
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ========== 页面标题 + 搜索栏 ========== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">厂房列表</h1>
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="搜索厂房..."
            defaultValue={keyword}
            onSearch={handleSearch}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* ========== 桌面筛选侧边栏 ========== */}
        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5">
            <FilterPanel />
          </div>
        </aside>

        {/* ========== 主内容区 ========== */}
        <div className="flex-1 min-w-0">
          {/* 移动端筛选栏 */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              筛选
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-700 text-[10px] text-white">
                  !
                </span>
              )}
            </button>
            <p className="text-sm text-slate-500">
              共 {data?.total ?? 0} 套厂房
            </p>
          </div>

          {/* 桌面端结果计数 */}
          <div className="mb-4 hidden lg:flex lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              共 {data?.total ?? 0} 套厂房
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                清除筛选
              </button>
            )}
          </div>

          {/* 加载中 */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
          )}

          {/* 错误 */}
          {!loading && error && (
            <EmptyState
              title="加载失败"
              description={error}
              action={
                <button
                  onClick={fetchSpaces}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
                >
                  重试
                </button>
              }
            />
          )}

          {/* 厂房卡片网格 */}
          {!loading && !error && data && data.items.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>

              {/* 分页 */}
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}

          {/* 空结果 */}
          {!loading && !error && data && data.items.length === 0 && (
            <EmptyState
              title="未找到匹配的厂房"
              description="尝试调整筛选条件或搜索关键词"
              action={
                <button
                  onClick={handleReset}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
                >
                  清除筛选
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* ========== 移动端筛选抽屉 ========== */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* 抽屉 */}
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">
                筛选条件
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <FilterPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
