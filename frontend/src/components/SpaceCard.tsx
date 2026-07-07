import Link from "next/link";
import { MapPin, Building2 } from "lucide-react";
import { STATUS_LABELS, type Space } from "@/types";
import { cn, formatArea, formatMonthlyRent } from "@/lib/utils";
import { AreaBadge, AvailabilityBadge } from "./Badge";

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
              {STATUS_LABELS.rented}
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
          <AvailabilityBadge status={space.status} />
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
