import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "厂房列表",
  description:
    "浏览广澜租赁平台上的印刷包装专业厂房，按面积、状态筛选，找到适合您生产需求的理想空间。月租/年租灵活选择，参数透明。",
};

export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
