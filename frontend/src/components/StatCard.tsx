import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    up: boolean;
  };
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
          <Icon className="h-5 w-5 text-teal-700" />
        </div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.up ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
