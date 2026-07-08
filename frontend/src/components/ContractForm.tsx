"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderNo: string;
  contactName: string;
  spaceName: string;
  onSuccess?: () => void;
}

export function ContractForm({
  open,
  onOpenChange,
  orderId,
  orderNo,
  contactName,
  spaceName,
  onSuccess,
}: ContractFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [partyB, setPartyB] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deposit, setDeposit] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partyB.trim()) {
      setError("请填写乙方（承租方）名称");
      return;
    }
    if (!startDate) {
      setError("请选择合同开始日期");
      return;
    }
    if (!endDate) {
      setError("请选择合同结束日期");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("合同结束日期必须晚于开始日期");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("未登录，请先以管理员身份登录");
      }

      const res = await fetch(`/admin/orders/${orderId}/contract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          party_b: partyB.trim(),
          start_date: startDate,
          end_date: endDate,
          deposit: deposit.trim() || null,
          terms: terms.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `请求失败 (${res.status})`);
      }

      // Open the generated contract in a new tab
      window.open(`/admin/orders/${orderId}/contract`, "_blank");

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成合同失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setPartyB("");
    setStartDate("");
    setEndDate("");
    setDeposit("");
    setTerms("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>生成租赁合同</DialogTitle>
          <DialogDescription>
            订单：{orderNo} | 厂房：{spaceName} | 联系人：{contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 乙方名称 */}
            <div className="space-y-1.5">
              <Label htmlFor="party_b">
                乙方（承租方） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="party_b"
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                placeholder={`如：${contactName} 或公司名称`}
                required
              />
            </div>

            {/* 合同开始日期 */}
            <div className="space-y-1.5">
              <Label htmlFor="contract_start">
                合同开始日期 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contract_start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {/* 合同结束日期 */}
            <div className="space-y-1.5">
              <Label htmlFor="contract_end">
                合同结束日期 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contract_end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            {/* 押金 */}
            <div className="space-y-1.5">
              <Label htmlFor="deposit">押金</Label>
              <Input
                id="deposit"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="如：两个月租金，共计人民币XXXX元"
              />
            </div>

            {/* 合同条款 */}
            <div className="space-y-1.5">
              <Label htmlFor="terms">
                合同条款
                <span className="ml-1 text-xs text-slate-400">
                  （留空则使用默认条款）
                </span>
              </Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="自定义合同条款，留空使用默认模板..."
                rows={6}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              生成合同
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
