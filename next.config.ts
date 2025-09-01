import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移动端性能优化配置
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react']
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 压缩优化
  compress: true,
};

export default nextConfig;
