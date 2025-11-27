import type { Metadata } from "next";
import { Cinzel, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DynamicGaiaWrapper } from "@/components/DynamicGaiaWrapper";
import CosmicBackground from "@/components/ui/CosmicBackground";

// 神圣字体：用于标题，赋予"古老智慧"和"铭文"的感觉
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// 现代正文字体：保持清晰可读性
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

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
    <html lang="zh-CN" className={`${cinzel.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased text-white min-h-screen relative">
        {/* 活着的深空背景 */}
        <CosmicBackground />

        <ErrorBoundary>
          <div className="relative z-10">
            {children}
          </div>
          {/* PF-12: 动态加载 GlobalGaia，减少初始包体积 */}
          <DynamicGaiaWrapper />
        </ErrorBoundary>
      </body>
    </html>
  );
}
