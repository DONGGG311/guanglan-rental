"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Order, Contract } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import { ContractForm } from "@/components/ContractForm";
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  FileText,
  Play,
  Flag,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
} from "lucide-react";

const formatRent = (v: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(v);

const formatDate = (d: string | null | undefined) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("zh-CN");
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Contract form dialog
  const [contractOpen, setContractOpen] = useState(
    searchParams.get("openContract") === "true"
  );

  const orderId = Number(id);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderData, contractData] = await Promise.all([
        api.adminGetOrder(orderId),
        api.getContractInfoAdmin(orderId).catch(() => null),
      ]);
      setOrder(orderData);
      setContract(contractData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error || "订单不存在"}
      </div>
    );
  }

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
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/orders")}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回订单列表
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            订单详情 — {order.order_no}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            创建时间：{formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(
            order.status
          )}`}
        >
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Order info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">订单信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">订单编号</span>
              <span className="font-mono text-slate-800">{order.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">联系人</span>
              <span className="text-slate-800">{order.contact_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">联系电话</span>
              <span className="text-slate-800">{order.contact_phone}</span>
            </div>
            {order.contact_email && (
              <div className="flex justify-between">
                <span className="text-slate-500">联系邮箱</span>
                <span className="text-slate-800">{order.contact_email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">租用类型</span>
              <span className="text-slate-800">
                {order.rent_type === "monthly" ? "月租" : "年租"}
                {" × "}
                {order.duration}
                {order.rent_type === "monthly" ? "个月" : "年"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">开始日期</span>
              <span className="text-slate-800">{formatDate(order.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">总金额</span>
              <span className="font-semibold text-slate-800">
                {formatRent(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Space info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">厂房信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">厂房名称</span>
              <span className="text-slate-800">{order.space_name || "-"}</span>
            </div>
            {order.admin_remark && (
              <div className="flex justify-between">
                <span className="text-slate-500">管理备注</span>
                <span className="max-w-[60%] text-right text-slate-800">
                  {order.admin_remark}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contract info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">合同信息</h2>
          {contract ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">合同编号</span>
                <span className="font-mono text-slate-800">{contract.contract_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">甲方</span>
                <span className="text-slate-800">{contract.party_a}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">乙方</span>
                <span className="text-slate-800">{contract.party_b}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">合同期限</span>
                <span className="text-slate-800">
                  {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">租金</span>
                <span className="text-slate-800">{formatRent(contract.rent_amount)}</span>
              </div>
              {contract.deposit && (
                <div className="flex justify-between">
                  <span className="text-slate-500">押金</span>
                  <span className="text-slate-800">{contract.deposit}</span>
                </div>
              )}
              <div className="mt-3">
                <button
                  onClick={() =>
                    window.open(`/admin/orders/${orderId}/contract`, "_blank")
                  }
                  className="flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                >
                  <FileText className="h-3.5 w-3.5" />
                  查看合同
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              尚未生成合同
              {order.status === "approved" && (
                <button
                  onClick={() => setContractOpen(true)}
                  className="ml-2 text-teal-700 hover:text-teal-800"
                >
                  立即生成
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        {order.status === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange("approved")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              通过审核
            </button>
            <button
              onClick={() => handleStatusChange("rejected")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              拒绝
            </button>
          </>
        )}

        {order.status === "approved" && (
          <button
            onClick={() => setContractOpen(true)}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            生成合同
          </button>
        )}

        {order.status === "signed" && (
          <button
            onClick={() => handleStatusChange("active")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            开始租赁
          </button>
        )}

        {order.status === "active" && (
          <button
            onClick={() => handleStatusChange("completed")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flag className="h-4 w-4" />
            )}
            完成租赁
          </button>
        )}
      </div>

      {/* Contract form dialog */}
      {order.status === "approved" && (
        <ContractForm
          open={contractOpen}
          onOpenChange={setContractOpen}
          orderId={orderId}
          orderNo={order.order_no}
          contactName={order.contact_name}
          spaceName={order.space_name || ""}
          onSuccess={loadOrder}
        />
      )}
    </div>
  );
}
