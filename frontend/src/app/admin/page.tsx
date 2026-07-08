"use client";

import { useEffect, useState } from "react";
import { api, type DashboardStats } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import {
  Building2,
  ClipboardCheck,
  TrendingUp,
  Percent,
  ArrowRight,
} from "lucide-react";
import type { Order } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [dashData, ordersData] = await Promise.all([
          api.getDashboard(),
          api.adminGetOrders({ page: "1", page_size: "5" }),
        ]);
        setStats(dashData);
        setRecentOrders(ordersData.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const formatRent = (val: number) =>
    new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-800">仪表盘</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="在租厂房"
          value={`${stats?.rented_spaces ?? 0} 套`}
        />
        <StatCard
          icon={ClipboardCheck}
          label="待审核订单"
          value={`${stats?.pending_orders ?? 0} 单`}
        />
        <StatCard
          icon={TrendingUp}
          label="厂房总数"
          value={`${stats?.total_spaces ?? 0} 套`}
        />
        <StatCard
          icon={Percent}
          label="空置率"
          value={`${stats?.vacancy_rate ?? 0}%`}
        />
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">最近订单</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800"
          >
            查看全部 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  订单号
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  联系人
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  厂房
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  金额
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  状态
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  日期
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    暂无订单
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {order.order_no}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.contact_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.space_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatRent(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "rejected" || order.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("zh-CN")
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
