import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 处理 Supabase 外部包
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 配置 webpack 以处理 Node.js APIs 在 Edge Runtime 中的警告
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 忽略客户端构建中的 Node.js 特定模块警告
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  }
};

export default nextConfig;
