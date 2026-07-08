"use client";

import { useEffect, useState } from "react";
import { User, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    created_at: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getProfile();
        if (!cancelled) {
          setProfile({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            company: data.company || "",
            created_at: data.created_at || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "加载个人信息失败";
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

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error("姓名不能为空");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim() || undefined,
        company: profile.company.trim() || undefined,
      });
      setProfile({
        name: updated.name || "",
        phone: updated.phone || "",
        email: updated.email || "",
        company: updated.company || "",
        created_at: updated.created_at || "",
      });
      toast.success("个人信息已保存");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存失败";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ========== 加载态 ========== */
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ========== 错误态 ========== */
  if (error && !profile.phone) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <User className="mb-4 h-12 w-12 text-slate-300" />
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

  /* ========== 编辑表单 ========== */
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">个人信息</h2>
        <p className="mt-1 text-sm text-slate-500">
          编辑你的基本资料，保存后即时生效
        </p>
      </div>

      <div className="max-w-md space-y-5">
        {/* 手机号（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            手机号
          </label>
          <input
            type="text"
            value={profile.phone}
            disabled
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">手机号不可修改</p>
        </div>

        {/* 姓名 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="请输入姓名"
            className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* 邮箱 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            邮箱
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) =>
              setProfile((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="请输入邮箱"
            className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* 公司 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            公司
          </label>
          <input
            type="text"
            value={profile.company}
            onChange={(e) =>
              setProfile((p) => ({ ...p, company: e.target.value }))
            }
            placeholder="请输入公司名称"
            className="block w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
