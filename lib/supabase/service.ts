// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

// Service Role Client - 绕过RLS，拥有完整权限
// ⚠️ 仅在服务器端API使用，绝不要在客户端使用！

// 创建具有Service Role权限的客户端
// ⚠️ 环境变量检查延迟到调用时（而非模块加载时），避免 next build 阶段因缺少
//    运行时密钥而中断（collect page data 会加载此模块）
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
