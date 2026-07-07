"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { Order, Space } from "@/types";
import { api } from "@/lib/api";
import { formatDate, formatRent, formatArea } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = Number(id);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const orderData = await api.getOrder(orderId);
        if (!cancelled) {
          setOrder(orderData);
          // 获取关联的厂房信息
          try {
            const spaceData = await api.getSpace(orderData.space_id);
            if (!cancelled) setSpace(spaceData);
          } catch {
            // 空间加载失败不阻断整体
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "加载订单详情失败"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!isNaN(orderId)) load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const renewed = await api.renewOrder(orderId);
      setOrder(renewed);
      toast.success("续租申请已提交");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "续租申请失败"
      );
    } finally {
      setRenewing(false);
    }
  };

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Skeleton className="mb-4 h-7 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-5 w-60" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <Skeleton className="mb-4 h-7 w-48" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
      </div>
    );
  }

  /* ========== 错误/空态 ========== */
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <FileText className="mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-600">
          订单不存在
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          请检查链接是否正确
        </p>
        <Link
          href="/user/orders"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          返回订单列表
        </Link>
      </div>
    );
  }

  const rentTypeLabel = order.rent_type === "monthly" ? "月租" : "年租";
  const durationUnit = order.rent_type === "monthly" ? "个月" : "年";

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回订单列表
      </button>

      {/* ========== 订单信息 ========== */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          订单信息
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="订单编号" value={order.order_no} mono />
          <InfoRow
            label="订单状态"
            value={<OrderStatusBadge status={order.status} />}
          />
          <InfoRow
            label="创建时间"
            value={formatDate(order.created_at)}
          />
          <InfoRow
            label="联系人"
            value={`${order.contact_name} | ${order.contact_phone}`}
          />
        </div>
      </section>

      {/* ========== 厂房信息 ========== */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Building2 className="h-5 w-5 text-teal-700" />
          厂房信息
        </h2>
        {space ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-slate-800">
                {space.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {space.address}
            </div>
            <div className="text-sm text-slate-500">
              面积：{formatArea(space.area)}
            </div>
            <Link
              href={`/spaces/${space.id}`}
              className="inline-flex items-center gap-1 text-sm text-teal-700 transition-colors hover:text-teal-800"
            >
              查看厂房详情 &rarr;
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            厂房 ID：{order.space_id}
          </p>
        )}
      </section>

      {/* ========== 租赁信息 ========== */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          租赁信息
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="租赁类型" value={rentTypeLabel} />
          <InfoRow
            label="起租日期"
            value={formatDate(order.start_date)}
          />
          <InfoRow
            label="租赁时长"
            value={`${order.duration} ${durationUnit}`}
          />
          <InfoRow
            label="总金额"
            value={formatRent(order.total_amount)}
            highlight
          />
        </div>
      </section>

      {/* ========== 管理员备注 ========== */}
      {order.admin_remark && (
        <section className="rounded-xl border border-slate-200 bg-amber-50/50 p-6">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            管理员备注
          </h2>
          <p className="text-sm text-amber-700">{order.admin_remark}</p>
        </section>
      )}

      {/* ========== 续租按钮 ========== */}
      {order.status === "active" && (
        <div className="flex justify-end">
          <Button
            onClick={handleRenew}
            disabled={renewing}
            className="bg-teal-700 hover:bg-teal-800"
          >
            {renewing ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            续租申请
          </Button>
        </div>
      )}
    </div>
  );
}

/* ========== 信息行辅助组件 ========== */
function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="flex-shrink-0 text-sm text-slate-400">{label}</span>
      <span
        className={cn(
          "text-sm",
          highlight
            ? "text-lg font-bold text-slate-800"
            : mono
              ? "font-mono text-slate-600"
              : "text-slate-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}
