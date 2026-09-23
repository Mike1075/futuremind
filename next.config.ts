import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 浏览器端 Supabase 请求走同源转发 /sb/*（见 lib/supabase/config.ts）：国内部分网络连不上
  // *.supabase.co（TLS 握手被掐，登录报 "Load failed"），能打开本站就能登录。
  // 服务端到 Supabase 的调用（Vercel 出网）不受影响，仍直连。
  async rewrites() {
    // 没配 NEXT_PUBLIC_SUPABASE_URL 时不注册这条（否则 destination 成 "undefined/…"，
    // Next 直接报 Invalid rewrite 起不来）——与 lib/supabase/client.ts "构建期允许缺失"的口径一致。
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return {
      beforeFiles: supabaseUrl
        ? [{ source: '/sb/:path*', destination: `${supabaseUrl}/:path*` }]
        : [],
    }
  },
  async headers() {
    return [
      {
        // 认证/数据响应绝不能被 CDN 缓存（Vercel 新项目默认会遵循上游 cache-control 缓存外部转发）
        source: '/sb/:path*',
        headers: [{ key: 'x-vercel-enable-rewrite-caching', value: '0' }],
      },
    ]
  },
  images: {
    // SEC-08: 限制图片来源，只允许信任的域名
    remotePatterns: [
      // Supabase Storage - 用户上传的媒体文件
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // 同源转发后 getPublicUrl 生成的 Storage 地址落在本站 /sb/storage/ 下
      {
        protocol: 'https',
        hostname: '*.futuremind2075.com',
        pathname: '/sb/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'futuremind2075.com',
        pathname: '/sb/storage/**',
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
