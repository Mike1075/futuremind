// @ts-nocheck
import { cookies } from 'next/headers'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// CQ-02: 导出Database类型供其他模块使用
export type { Database }
export type { Json } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

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
