"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/spaces", label: "厂房列表" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800">
            广澜租赁
          </span>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-teal-700"
                  : "text-slate-600 hover:text-teal-700 hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 桌面右侧操作 */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              登录
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">注册</Button>
          </Link>
        </div>

        {/* 移动端汉堡菜单 */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="切换菜单"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-base font-medium transition-colors",
                  pathname === link.href
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-slate-200" />
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                <Button variant="outline" className="w-full" size="sm">
                  登录
                </Button>
              </Link>
              <Link
                href="/register"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                <Button className="w-full" size="sm">
                  注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
