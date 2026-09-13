import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // SEC-08: 限制图片来源，只允许信任的域名
    remotePatterns: [
      // Supabase Storage - 用户上传的媒体文件
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Google 用户头像（OAuth登录）
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub 用户头像（OAuth登录）
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Gravatar 头像
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
      },
    ],
  },
};

export default nextConfig;
