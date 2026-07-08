"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import {
  Eye,
  Loader2,
  Check,
  X,
  FileText,
  Play,
  Flag,
} from "lucide-react";

const formatRent = (v: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(v);

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "reviewing", label: "审核中" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "signed", label: "已签约" },
  { value: "active", label: "租赁中" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const pageSize = 20;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (statusFilter) params.status = statusFilter;
      if (keyword.trim()) params.keyword = keyword.trim();
      const data = await api.adminGetOrders(params);
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, keyword]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      await api.updateOrderStatus(id, newStatus);
      loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateContract = (orderId: number) => {
    router.push(`/admin/orders/${orderId}?openContract=true`);
  };

  const totalPages = Math.ceil(total / pageSize);

  const renderActions = (order: Order) => {
    const isLoading = actionLoading === order.id;

    return (
      <div className="flex items-center gap-1">
        {/* Pending -> 通过 / 拒绝 */}
        {order.status === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange(order.id, "approved")}
              disabled={isLoading}
              className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              通过
            </button>
            <button
              onClick={() => handleStatusChange(order.id, "rejected")}
              disabled={isLoading}
              className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              拒绝
            </button>
          </>
        )}

        {/* Approved -> 生成合同 */}
        {order.status === "approved" && (
          <button
            onClick={() => handleGenerateContract(order.id)}
            disabled={isLoading}
            className="flex items-center gap-1 rounded bg-teal-100 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-200 disabled:opacity-50"
          >
            <FileText className="h-3 w-3" />
            生成合同
          </button>
        )}

        {/* Signed -> 开始租赁 */}
        {order.status === "signed" && (
          <button
            onClick={() => handleStatusChange(order.id, "active")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            开始租赁
          </button>
        )}

        {/* Active -> 完成 */}
        {order.status === "active" && (
          <button
            onClick={() => handleStatusChange(order.id, "completed")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
            完成
          </button>
        )}

        {/* View detail - always */}
        <button
          onClick={() => router.push(`/admin/orders/${order.id}`)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="查看详情"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-teal-100 text-teal-700";
      case "signed":
        return "bg-purple-100 text-purple-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-800">订单管理</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              loadOrders();
            }
          }}
          placeholder="搜索订单号、联系人、电话..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <button
          onClick={() => {
            setPage(1);
            loadOrders();
          }}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
        >
          搜索
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">订单号</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">联系人</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">电话</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">厂房</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">租期</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">金额</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">日期</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      暂无订单
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800">
                        {order.order_no}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.contact_name}</td>
                      <td className="px-4 py-3 text-slate-600">{order.contact_phone}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.space_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.rent_type === "monthly" ? "月租" : "年租"}
                        {" × "}
                        {order.duration}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRent(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("zh-CN")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{renderActions(order)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
