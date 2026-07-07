import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} 广澜印刷包装有限公司 版权所有
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link
              href="/spaces"
              className="transition-colors hover:text-teal-700"
            >
              厂房列表
            </Link>
            <span>联系电话：400-000-0000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
