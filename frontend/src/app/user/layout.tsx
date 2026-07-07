"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  Heart,
  User,
  Bell,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/user/orders",
    label: "我的订单",
    icon: ClipboardList,
  },
  {
    href: "/user/favorites",
    label: "我的收藏",
    icon: Heart,
  },
  {
    href: "/user/profile",
    label: "个人信息",
    icon: User,
  },
  {
    href: "/user/notifications",
    label: "消息通知",
    icon: Bell,
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  // 登录检查
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
    setChecking(false);
  }, [router]);

  // 检查中或未授权时不渲染内容
  if (checking || !authorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">用户中心</h1>

      {/* ===== 移动端：顶部 Tab 导航 ===== */}
      <div className="mb-6 overflow-x-auto lg:hidden">
        <nav className="flex gap-1 whitespace-nowrap">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* ===== 桌面端：左侧导航 ===== */}
        <aside className="hidden w-[200px] flex-shrink-0 lg:block">
          <nav className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              功能导航
            </div>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-l-teal-700 bg-teal-50 text-teal-700"
                      : "border-l-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ===== 内容区 ===== */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
