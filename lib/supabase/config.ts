// Supabase 连接参数的唯一来源（浏览器/服务端共用）。
//
// 浏览器端不直连 *.supabase.co，改走本站同源转发 /sb/*（next.config.ts rewrites）：
// 国内部分网络到 supabase.co 的 TLS 握手会被掐断（登录报 "Load failed"），同源则能开站就能登录。
// 服务端（Vercel 出网）不受影响，继续直连。
//
// 局限：Vercel 外部转发不代理 WebSocket，Realtime 经此路径连不上——订阅处统一用
// subscribeWithPolling 兜底；Supabase 发出的邮件链接仍指向 supabase.co，需另改邮件模板。

// 构建期允许缺失（与 client.ts 原先的占位逻辑一致），运行时由各工厂自行校验。
export const SUPABASE_DIRECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'

export function supabaseUrlForBrowser(): string {
  return typeof window !== 'undefined' ? `${window.location.origin}/sb` : SUPABASE_DIRECT_URL
}

// supabase-js / @supabase/ssr 默认把会话存在 `sb-<URL 主机名第一段>-auth-token`；URL 换成本站后
// 这一段会变成 "www"/"futuremind2075"，老用户的 cookie 就对不上、全被登出。显式钉在原 project ref
// 上，浏览器写、服务端读的 cookie 名保持不变，切换无感。**所有** createBrowserClient /
// createServerClient 都必须带上它，少一处读写就不一致。
export const SUPABASE_COOKIE_NAME = `sb-${new URL(SUPABASE_DIRECT_URL).hostname.split('.')[0]}-auth-token`
export const SUPABASE_COOKIE_OPTIONS = { name: SUPABASE_COOKIE_NAME }
