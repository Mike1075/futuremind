import type { Metadata } from "next";
import "./globals.css";
import { GlobalGaiaWrapperV3 } from "@/components/GlobalGaiaWrapperV3";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
          <GlobalGaiaWrapperV3 />
        </ErrorBoundary>
      </body>
    </html>
  );
}
