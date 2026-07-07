"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: number;
  spaceName: string;
}

function getUserFromStorage(): {
  name: string;
  phone: string;
  email?: string;
} | null {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      return {
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      };
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function OrderForm({
  open,
  onOpenChange,
  spaceId,
  spaceName,
}: OrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rentType, setRentType] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(12);
  const [notes, setNotes] = useState("");

  // 预填用户信息
  useEffect(() => {
    if (open) {
      const user = getUserFromStorage();
      if (user) {
        setContactName(user.name);
        setContactPhone(user.phone);
        setContactEmail(user.email || "");
      }
      // 设置默认起租日期为明天
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [open]);

  // 重置表单
  const resetForm = () => {
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setRentType("monthly");
    setStartDate("");
    setDuration(12);
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName.trim()) {
      toast.error("请输入联系人姓名");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("请输入联系电话");
      return;
    }
    if (!startDate) {
      toast.error("请选择起租日期");
      return;
    }
    if (duration < 1) {
      toast.error("租赁时长至少为1");
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.createOrder({
        space_id: spaceId,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim() || undefined,
        rent_type: rentType,
        start_date: startDate,
        duration,
        notes: notes.trim() || undefined,
      });

      toast.success(`下单成功！订单编号：${order.order_no}`, {
        description: "我们将在1个工作日内与您联系确认。",
      });

      resetForm();
      onOpenChange(false);

      // 已登录用户跳转到订单列表
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/user/orders");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "提交失败，请稍后重试"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>立即租赁</DialogTitle>
          <DialogDescription>
            厂房：{spaceName}
            {!token && (
              <span className="mt-1 block text-amber-600">
                未登录状态下单，请准确填写联系方式以便我们与您确认
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 联系人姓名 */}
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">
                联系人姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="请输入联系人姓名"
                required
              />
            </div>

            {/* 联系电话 */}
            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">
                联系电话 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="请输入联系电话"
                required
              />
            </div>

            {/* 联系邮箱 */}
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">联系邮箱</Label>
              <Input
                id="contact_email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="选填"
              />
            </div>

            {/* 租赁类型 */}
            <div className="space-y-1.5">
              <Label>
                租赁类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={rentType}
                onValueChange={(value) => {
                  if (value) setRentType(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择租赁类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月租</SelectItem>
                  <SelectItem value="yearly">年租</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 起租日期 */}
            <div className="space-y-1.5">
              <Label htmlFor="start_date">
                起租日期 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {/* 租赁时长 */}
            <div className="space-y-1.5">
              <Label htmlFor="duration">
                租赁时长 <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) =>
                    setDuration(Math.max(1, Number(e.target.value)))
                  }
                  className="w-24"
                  required
                />
                <span className="text-sm text-slate-500">
                  {rentType === "monthly" ? "个月" : "年"}
                </span>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="如有特殊要求请在此说明"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              确认提交
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
