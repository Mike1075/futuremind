import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "未来心灵学院 - Future Mind Institute",
  description: "一个面向后AGI时代的全球意识觉醒生态系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
