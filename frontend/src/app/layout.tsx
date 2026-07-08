import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "广澜租赁 - 印刷人的厂房租赁平台",
    template: "%s | 广澜租赁",
  },
  description:
    "广澜印刷包装有限公司旗下厂房租赁平台，提供配套齐全、参数透明的专业印刷包装生产空间租赁服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors />
      </body>
    </html>
  );
}
