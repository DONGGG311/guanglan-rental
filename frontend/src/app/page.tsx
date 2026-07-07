"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Eye,
  Clock,
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { FeaturedSpaces } from "@/components/FeaturedSpaces";

export default function HomePage() {
  const router = useRouter();
  return (
    <div>
      {/* ========== Hero ========== */}
      <section className="bg-gradient-to-br from-teal-700 to-teal-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              印刷人的厂房，就该懂你。
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-teal-100 sm:text-lg">
              找到适合印刷包装生产的专业厂房空间 &mdash;
              真实参数、清晰定价、专业配套
            </p>

            {/* 搜索框 */}
            <div className="mx-auto mt-8 max-w-[640px]">
              <SearchBar
                placeholder="搜索厂房名称、地址、面积..."
                size="lg"
                className="shadow-lg"
                onSearch={(keyword) =>
                  router.push(`/spaces?keyword=${encodeURIComponent(keyword)}`)
                }
                buttonClassName="bg-amber-600 hover:bg-amber-700"
              />
            </div>

            {/* 分类快捷入口 */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/spaces?area_category=small"
                className="rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
              >
                小型厂房 &lt;100㎡
              </Link>
              <Link
                href="/spaces?area_category=medium"
                className="rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
              >
                中型厂房 100-500㎡
              </Link>
              <Link
                href="/spaces?area_category=large"
                className="rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
              >
                大型厂房 &gt;500㎡
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 推荐厂房 ========== */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800">
              推荐厂房
            </h2>
            <p className="mt-2 text-slate-500">
              精选优质厂房空间，满足不同规模需求
            </p>
          </div>

          <FeaturedSpaces />

          <div className="mt-8 text-center">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              查看全部厂房
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 为什么选择广澜 ========== */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            为什么选择广澜
          </h2>
          <p className="mt-2 text-center text-slate-500">
            深耕印刷行业，更懂您的厂房需求
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* 专业配套 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                <ShieldCheck className="h-7 w-7 text-teal-700" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                专业配套
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                层高、承重、供电、消防 — 每项参数都经实地勘测，
                确保满足印刷包装生产所需
              </p>
            </div>

            {/* 透明定价 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                <Eye className="h-7 w-7 text-teal-700" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                透明定价
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                月租、年租一目了然，无隐藏费用，让您安心做预算
              </p>
            </div>

            {/* 灵活租期 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                <Clock className="h-7 w-7 text-teal-700" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                灵活租期
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                支持月租/年租灵活选择，租期随需而变，不捆绑不强制
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA 咨询区 ========== */}
      <section className="bg-teal-700">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                需要帮助？立即咨询
              </h2>
              <p className="mt-1 text-teal-100">
                我们的团队随时为您解答厂房租赁相关问题
              </p>
            </div>
            <Link
              href="/spaces"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
            >
              浏览厂房
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
