import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../supabase'

// 客户端环境变量验证（仅在运行时）
function validateClientEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 在构建时允许缺失，但在运行时必须存在
  if (typeof window !== 'undefined') {
    if (!supabaseUrl) {
      throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required for client');
    }

    if (!supabaseAnonKey) {
      throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required for client');
    }
  }

  return {
    supabaseUrl: supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey: supabaseAnonKey || 'placeholder-key'
  };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = validateClientEnv();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
