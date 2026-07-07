"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building2,
  Ruler,
  Weight,
  Zap,
  Shield,
  Flame,
  Truck,
  Warehouse,
  Droplets,
  Wind,
  Car,
  Package,
  Heart,
} from "lucide-react";
import type { Space } from "@/types";
import { api } from "@/lib/api";
import {
  cn,
  formatArea,
  formatMonthlyRent,
  formatYearlyRent,
  formatRent,
  parseImages,
} from "@/lib/utils";
import { AreaBadge, AvailabilityBadge } from "@/components/Badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const spaceId = Number(id);

  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSpace(spaceId);
        if (!cancelled) setSpace(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!isNaN(spaceId)) load();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑骨架 */}
        <Skeleton className="mb-6 h-4 w-48" />
        <div className="grid gap-8 lg:grid-cols-[55%_45%]">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ========== 错误态 ========== */
  if (error || !space) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
        <Building2 className="mb-4 h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-600">
          {error ? "加载失败" : "厂房不存在"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {error || "请检查链接是否正确"}
        </p>
        <Link
          href="/spaces"
          className="mt-6 inline-flex items-center gap-1 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          返回厂房列表
        </Link>
      </div>
    );
  }

  const imageList = parseImages(space.images);
  const hasRealImages = imageList.length > 0;

  /* ========== 参数列表 ========== */
  const paramsGrid = [
    { label: "层高", value: `${space.floor_height}m`, icon: Ruler },
    { label: "承重", value: `${space.ground_load}kg/㎡`, icon: Weight },
    {
      label: "供电",
      value: `${space.power_capacity}kVA`,
      icon: Zap,
    },
    { label: "地面材质", value: space.floor_material, icon: Shield },
    { label: "消防等级", value: space.fire_rating, icon: Flame },
    {
      label: "行车",
      value: space.has_crane ? "有" : "无",
      icon: Warehouse,
    },
  ];

  const facilities = [
    { label: "排水", value: space.drainage, icon: Droplets },
    { label: "通风", value: space.ventilation, icon: Wind },
    { label: "停车位", value: space.parking, icon: Car },
    {
      label: "装卸平台",
      value: space.loading_platform ? "有" : "无",
      icon: Package,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* ========== 面包屑 ========== */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link
          href="/"
          className="transition-colors hover:text-teal-700"
        >
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link
          href="/spaces"
          className="transition-colors hover:text-teal-700"
        >
          厂房列表
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">{space.name}</span>
      </nav>

      {/* ========== 桌面两栏布局 ========== */}
      <div className="grid gap-8 lg:grid-cols-[55%_45%]">
        {/* 左栏：图片 + 参数 */}
        <div>
          {/* 图片轮播区 */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
            {hasRealImages ? (
              <>
                <img
                  src={imageList[currentImage]}
                  alt={space.name}
                  className="aspect-video w-full object-cover"
                />
                {imageList.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImage(
                          (currentImage - 1 + imageList.length) %
                            imageList.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur transition hover:bg-white"
                      aria-label="上一张"
                    >
                      <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImage(
                          (currentImage + 1) % imageList.length
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow backdrop-blur transition hover:bg-white"
                      aria-label="下一张"
                    >
                      <ChevronRight className="h-5 w-5 text-slate-600" />
                    </button>
                    {/* 指示点 */}
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {imageList.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            i === currentImage
                              ? "bg-white shadow"
                              : "bg-white/50"
                          )}
                          aria-label={`第 ${i + 1} 张图`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center">
                <Building2 className="h-20 w-20 text-slate-400" />
              </div>
            )}
          </div>

          {/* 缩略图 */}
          {imageList.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {imageList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    "h-12 w-16 flex-shrink-0 overflow-hidden rounded-md",
                    i === currentImage
                      ? "ring-2 ring-teal-700"
                      : "ring-1 ring-slate-200"
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ===== 场地参数 ===== */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              场地参数
            </h3>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-slate-200">
              {paramsGrid.map((item) => (
                <div
                  key={item.label}
                  className="bg-white p-4"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== 配套设施 ===== */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              配套设施
            </h3>
            <div className="flex flex-wrap gap-3">
              {space.has_office && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
                  <Building2 className="h-4 w-4" />
                  办公配套
                </span>
              )}
              {space.has_forklift && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
                  <Truck className="h-4 w-4" />
                  叉车
                </span>
              )}
              {space.loading_platform && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
                  <Package className="h-4 w-4" />
                  装卸平台
                </span>
              )}
              {/* 其他设施 */}
              {facilities.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}: {f.value}
                </span>
              ))}
            </div>
          </div>

          {/* ===== 厂房描述 ===== */}
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              厂房描述
            </h3>
            <p className="leading-relaxed text-slate-600">
              {space.description}
            </p>
          </div>
        </div>

        {/* 右栏：价格 + 操作 */}
        <div>
          <div className="sticky top-20 rounded-xl border border-slate-100 bg-white p-6 shadow-md lg:top-24">
            {/* 标签 */}
            <div className="mb-3 flex items-center gap-2">
              <AreaBadge category={space.area_category} />
              <AvailabilityBadge status={space.status} />
            </div>

            {/* 厂房名称 */}
            <h1 className="mb-2 text-xl font-bold text-slate-800">
              {space.name}
            </h1>

            {/* 地址 */}
            <p className="mb-5 flex items-start gap-1.5 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {space.address}
            </p>

            {/* 面积 */}
            <p className="mb-4 text-sm text-slate-500">
              面积：{formatArea(space.area)}
            </p>

            {/* 价格卡片 */}
            <div className="space-y-3 rounded-lg bg-slate-50 p-4">
              {/* 月租 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">月租</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-800">
                    {formatRent(space.monthly_rent)}
                  </span>
                  <span className="ml-1 text-sm text-slate-400">
                    /月
                  </span>
                </div>
              </div>
              <hr className="border-slate-200" />
              {/* 年租 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">年租</span>
                <div className="text-right">
                  <span className="text-lg font-semibold text-slate-700">
                    {formatRent(space.yearly_rent)}
                  </span>
                  <span className="ml-1 text-sm text-slate-400">
                    /年
                  </span>
                </div>
              </div>
              <hr className="border-slate-200" />
              {/* 押金 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">押金</span>
                <span className="text-sm text-slate-600">面议</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-5 space-y-2.5">
              <button
                disabled={space.status !== "available"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                立即租赁
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                <Heart className="h-4 w-4" />
                收藏
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 移动端底部固定栏 ========== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <span className="text-lg font-bold text-slate-800">
            {formatMonthlyRent(space.monthly_rent)}
          </span>
        </div>
        <button
          disabled={space.status !== "available"}
          className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          立即租赁
        </button>
      </div>

      {/* 底部占位（避免被固定栏遮挡） */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
