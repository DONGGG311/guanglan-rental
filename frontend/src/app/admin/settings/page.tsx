"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { KeyRound, Loader2, CheckCircle2, User } from "lucide-react";

/** FastAPI returns errors as {"detail": "..."}. Surface that string, not raw JSON. */
function parseErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.detail === "string") return parsed.detail;
  } catch {
    // not JSON — fall through to the raw text
  }
  return raw || "修改失败，请稍后重试";
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<{
    username: string;
    email: string;
  } | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.adminMe().then(setAdminInfo).catch(() => {
      // The layout already redirects to /admin/login if the token is invalid.
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("请填写所有字段");
      return;
    }
    if (newPassword.length < 8) {
      setError("新密码至少8位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    if (newPassword === oldPassword) {
      setError("新密码不能与原密码相同");
      return;
    }

    setLoading(true);
    try {
      await api.adminChangePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // 旧 token 仍然有效（JWT 不含密码），主动登出以强制用新密码验证一次
      setTimeout(() => {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      }, 2000);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-slate-800">账号设置</h1>

      {/* 当前账号信息 */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-800">
            {adminInfo?.username || "—"}
          </span>
          {adminInfo?.email && (
            <span className="text-slate-400">· {adminInfo.email}</span>
          )}
        </div>
      </div>

      {/* 修改密码 */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-800">修改密码</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            密码修改成功，正在跳转到登录页，请用新密码登录…
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="oldPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              原密码
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputClass}
              placeholder="请输入当前密码"
              autoComplete="current-password"
              disabled={success}
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              新密码
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="至少8位"
              autoComplete="new-password"
              disabled={success}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              确认新密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="再次输入新密码"
              autoComplete="new-password"
              disabled={success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="mr-1.5 inline-block h-4 w-4 animate-spin" />
            )}
            确认修改
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          修改成功后会自动登出，需要用新密码重新登录。
        </p>
      </form>
    </div>
  );
}
