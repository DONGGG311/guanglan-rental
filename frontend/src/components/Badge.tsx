import { cn } from "@/lib/utils";
import {
  AREA_LABELS,
  STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/types";

/* ========== 面积标签 ========== */
const areaVariantStyles: Record<string, string> = {
  small: "bg-slate-100 text-slate-700",
  medium: "bg-teal-100 text-teal-800",
  large: "bg-teal-700 text-white",
};

export function AreaBadge({
  category,
  className,
}: {
  category: "small" | "medium" | "large";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        areaVariantStyles[category] || areaVariantStyles.small,
        className
      )}
    >
      {AREA_LABELS[category] || category}
    </span>
  );
}

/* ========== 租赁状态标签 ========== */
const statusVariantStyles: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  rented: "bg-slate-100 text-slate-500",
  maintenance: "bg-amber-100 text-amber-700",
};

export function AvailabilityBadge({
  status,
  className,
}: {
  status: "available" | "rented" | "maintenance";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusVariantStyles[status] || statusVariantStyles.available,
        className
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ========== 订单状态标签 ========== */
const orderStatusVariantStyles: Record<string, string> = {
  pending: "bg-blue-50 text-blue-600",
  reviewing: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  signed: "bg-teal-100 text-teal-700",
  active: "bg-teal-700 text-white",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-slate-50 text-slate-400",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        orderStatusVariantStyles[status] || "bg-slate-100 text-slate-600",
        className
      )}
    >
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
