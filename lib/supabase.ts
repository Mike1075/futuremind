// @ts-nocheck
import { cookies } from 'next/headers'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// CQ-02: 导出Database类型供其他模块使用
export type { Database }
export type { Json } from '@/types/database'

// ⚠️ 构建时（next build 的 collect page data 会加载本模块）允许密钥缺失，
//    用占位符兜底避免顶层 throw / createClient 报错导致构建失败；
//    运行时的真实校验由各客户端调用及 getAdminClient() 负责。
//    （与 lib/supabase/client.ts 的占位符策略保持一致）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 基础客户端
export const supabase = createServiceClient<Database>(supabaseUrl, supabaseAnonKey)

// 浏览器客户端
export function getBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
}

// 服务端客户端（使用cookies）
export async function getClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(values) {
        for (const { name, value, options } of values) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

// 管理员客户端（使用service role key）
export function getAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createServiceClient<Database>(supabaseUrl!, supabaseServiceKey)
}
