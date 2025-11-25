import { z } from 'zod'

/**
 * 环境变量验证Schema
 * 确保所有必需的环境变量都已正确配置
 */
const envSchema = z.object({
  // Supabase配置
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Supabase URL必须是有效的URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase匿名密钥不能为空'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase服务角色密钥不能为空').optional(),

  // Google Gemini AI配置
  GEMINI_API_KEY: z.string().min(1, 'Gemini API密钥不能为空').optional(),

  // N8N Webhook配置 (SEC-03: 所有N8N URL必须通过环境变量配置，不允许硬编码)
  N8N_CHAT_WEBHOOK_URL: z.string().url('N8N聊天Webhook URL必须是有效的URL').optional(),
  N8N_UPLOAD_WEBHOOK_URL: z.string().url('N8N上传Webhook URL必须是有效的URL').optional(),
  N8N_GAIA_KB_WEBHOOK_URL: z.string().url('N8N盖亚知识库Webhook URL必须是有效的URL').optional(),
  N8N_AIP_UPLOAD_WEBHOOK_URL: z.string().url('N8N AIP上传Webhook URL必须是有效的URL').optional(),
  N8N_AIP_CHAT_WEBHOOK_URL: z.string().url('N8N AIP聊天Webhook URL必须是有效的URL').optional(),

  // Next.js配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/**
 * 验证并导出环境变量
 * 如果验证失败，会在启动时抛出错误
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:')
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error('环境变量配置错误，请检查 .env 文件')
    }
    throw error
  }
}

/**
 * 类型安全的环境变量对象
 * 只在服务端使用
 */
export type Env = z.infer<typeof envSchema>

/**
 * 获取环境变量（带类型提示）
 * 仅在服务端使用
 */
export function getEnv(): Env {
  return validateEnv()
}

/**
 * 客户端安全的环境变量
 * 只包含 NEXT_PUBLIC_ 开头的变量
 */
export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const
