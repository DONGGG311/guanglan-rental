"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loader2, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim() || !password.trim()) {
      setError("请输入手机号和密码");
      return;
    }

    setLoading(true);
    try {
      const result = await api.login({ phone: phone.trim(), password });
      localStorage.setItem("token", result.access_token);
      // 获取用户信息
      try {
        const user = await api.getProfile();
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // profile fetch is best-effort
      }
      router.replace("/user/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请检查手机号和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-700">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800">登录广澜租赁</h1>
          <p className="mt-1 text-sm text-slate-500">欢迎回来</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                手机号
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="请输入手机号"
                autoComplete="tel"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
            >
              {loading && (
                <Loader2 className="mr-1.5 inline-block h-4 w-4 animate-spin" />
              )}
              登录
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-slate-400">
            还没有账号？{" "}
            <Link href="/register" className="text-teal-700 hover:text-teal-800">
              立即注册
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-600">
              返回首页
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
