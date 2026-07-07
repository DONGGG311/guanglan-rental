"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { Order, Space } from "@/types";
import { api } from "@/lib/api";
import { formatDate, formatRent } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [spaceNames, setSpaceNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getMyOrders();
        const items = data.items || [];
        if (!cancelled) {
          setOrders(items);

          // 获取所有涉及的空间 ID，批量查询名称
          const spaceIds = [
            ...new Set(items.map((o: Order) => o.space_id)),
          ];
          if (spaceIds.length > 0) {
            try {
              const names: Record<number, string> = {};
              await Promise.all(
                spaceIds.map(async (sid) => {
                  try {
                    const space: Space = await api.getSpace(sid);
                    names[sid] = space.name;
                  } catch {
                    names[sid] = `厂房 #${sid}`;
                  }
                })
              );
              if (!cancelled) setSpaceNames(names);
            } catch {
              // 静默处理
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "加载订单失败";
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

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
              <div className="flex-1" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========== 错误态 ========== */
  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <ClipboardList className="mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-600">加载失败</h3>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          重新加载
        </button>
      </div>
    );
  }

  /* ========== 空状态 ========== */
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <ClipboardList className="mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-600">暂无订单</h3>
        <p className="mt-1 text-sm text-slate-400">
          去厂房列表看看，找到合适的厂房立即下单吧
        </p>
        <Link
          href="/spaces"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          浏览厂房
        </Link>
      </div>
    );
  }

  /* ========== 订单列表 ========== */
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                订单编号
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                厂房
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                金额
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                状态
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                日期
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm text-slate-600">
                  {order.order_no}
                </TableCell>
                <TableCell className="text-sm text-slate-800">
                  {spaceNames[order.space_id] || `厂房 #${order.space_id}`}
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-800">
                  {formatRent(order.total_amount)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatDate(order.created_at)}
                </TableCell>
                <TableCell>
                  <Link href={`/user/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      查看
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片列表 */}
      <div className="divide-y divide-slate-100 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/user/orders/${order.id}`}
            className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-600">
                  {order.order_no}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {spaceNames[order.space_id] || `厂房 #${order.space_id}`}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span>{formatRent(order.total_amount)}</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
            <Eye className="ml-2 h-4 w-4 flex-shrink-0 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
