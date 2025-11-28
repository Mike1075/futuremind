// @ts-nocheck
import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DynamicGaiaWrapper } from "@/components/DynamicGaiaWrapper";

export const metadata: Metadata = {
  title: "未来心灵学院 | Future Mind Institute",
  description: "一个面向后AGI时代的全球意识觉醒生态系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-black min-h-screen font-sans">
        <ErrorBoundary>
          {children}
          {/* PF-12: 动态加载 GlobalGaia，减少初始包体积 */}
          <DynamicGaiaWrapper />
        </ErrorBoundary>
      </body>
    </html>
  );
}
