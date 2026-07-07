import Link from "next/link";
import { MapPin, Building2 } from "lucide-react";
import type { Space } from "@/types";
import { cn, formatArea, formatMonthlyRent } from "@/lib/utils";
import { AreaBadge } from "./Badge";

interface SpaceCardProps {
  space: Space;
  className?: string;
}

export function SpaceCard({ space, className }: SpaceCardProps) {
  const isRented = space.status === "rented";

  return (
    <Link
      href={`/spaces/${space.id}`}
      className={cn(
        "group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
        className
      )}
    >
      {/* 图片区域 */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        {isRented && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-4 py-1 text-sm font-medium text-slate-600">
              已出租
            </span>
          </div>
        )}
        <div className="flex h-full w-full items-center justify-center">
          <Building2 className="h-12 w-12 text-slate-400" />
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        {/* 标签行 */}
        <div className="mb-2 flex items-center gap-2">
          <AreaBadge category={space.area_category} />
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              space.status === "available"
                ? "bg-green-100 text-green-700"
                : space.status === "maintenance"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
            )}
          >
            {space.status === "available"
              ? "可租"
              : space.status === "maintenance"
                ? "维护中"
                : "已出租"}
          </span>
        </div>

        {/* 厂房名称 */}
        <h3 className="mb-1 text-lg font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
          {space.name}
        </h3>

        {/* 地址 */}
        <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{space.address}</span>
        </p>

        {/* 关键参数行 */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-600">
            {formatArea(space.area)}
          </span>
          <span className="text-base font-semibold text-teal-700">
            {formatMonthlyRent(space.monthly_rent)}
          </span>
        </div>
      </div>
    </Link>
  );
}
