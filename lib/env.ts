import { z } from 'zod'

/**
 * 环境变量验证Schema
 * 确保所有必需的环境变量都已正确配置
 */
const envSchema = z.object({
  // Supabase配置 - 必需
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Supabase URL必须是有效的URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase匿名密钥不能为空'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase服务角色密钥不能为空').optional(),

  // Google Gemini AI配置
  GEMINI_API_KEY: z.string().min(1, 'Gemini API密钥不能为空').optional(),

  // N8N Webhook配置 (SEC-03: 所有N8N URL必须通过环境变量配置，不允许硬编码)
  N8N_CHAT_WEBHOOK_URL: z.string().url('N8N聊天Webhook URL必须是有效的URL').optional(),
  N8N_UPLOAD_WEBHOOK: z.string().url('N8N上传Webhook URL必须是有效的URL').optional(),
  N8N_AIP_CHAT_WEBHOOK_URL: z.string().url('N8N AIP聊天Webhook URL必须是有效的URL').optional(),
  N8N_GAIA_CHAT_WEBHOOK_URL: z.string().url('N8N盖亚聊天Webhook URL必须是有效的URL').optional(),

  // 盖亚知识库配置
  GAIA_KB_PROJECT_ID: z.string().uuid('盖亚知识库项目ID必须是有效的UUID').optional(),

  // Next.js配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// 环境变量验证状态
let envValidated = false
let cachedEnv: z.infer<typeof envSchema> | null = null

/**
 * 验证并导出环境变量
 * 使用缓存避免重复验证
 */
export function validateEnv(): z.infer<typeof envSchema> {
  if (envValidated && cachedEnv) {
    return cachedEnv
  }

  try {
    cachedEnv = envSchema.parse(process.env)
    envValidated = true
    return cachedEnv
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
 */
export type Env = z.infer<typeof envSchema>

/**
 * 获取环境变量（带类型提示和缓存）
 * 仅在服务端使用
 */
export function getEnv(): Env {
  return validateEnv()
}

/**
 * 检查是否是开发环境
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 检查是否是生产环境
 */
export function isProd(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * 客户端安全的环境变量
 * 只包含 NEXT_PUBLIC_ 开头的变量
 */
export const clientEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const

// ============================================
// 安全工具函数
// ============================================

/**
 * 安全的 parseInt 函数
 * 防止 NaN、溢出和非法输入
 *
 * @param value - 要解析的字符串
 * @param defaultValue - 解析失败时的默认值
 * @param options - 可选的范围限制
 * @returns 解析后的整数
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  options?: { min?: number; max?: number }
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const parsed = parseInt(value, 10)

  // 检查 NaN
  if (isNaN(parsed)) {
    return defaultValue
  }

  // 应用范围限制
  let result = parsed
  if (options?.min !== undefined) {
    result = Math.max(result, options.min)
  }
  if (options?.max !== undefined) {
    result = Math.min(result, options.max)
  }

  return result
}

/**
 * 密码强度验证
 * 符合 OWASP 安全标准
 *
 * @param password - 要验证的密码
 * @returns 验证结果，null 表示通过
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return '密码长度至少为8位'
  }
  if (password.length > 128) {
    return '密码长度不能超过128位'
  }
  if (!/[A-Z]/.test(password)) {
    return '密码必须包含至少一个大写字母'
  }
  if (!/[a-z]/.test(password)) {
    return '密码必须包含至少一个小写字母'
  }
  if (!/[0-9]/.test(password)) {
    return '密码必须包含至少一个数字'
  }
  // 特殊字符是可选的，但建议使用
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   return '密码必须包含至少一个特殊字符'
  // }
  return null
}

/**
 * 验证密码强度并返回详细信息
 */
export function getPasswordStrength(password: string): {
  score: number  // 0-4
  label: string
  suggestions: string[]
} {
  let score = 0
  const suggestions: string[] = []

  if (password.length >= 8) score++
  else suggestions.push('长度至少8位')

  if (password.length >= 12) score++

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  else suggestions.push('同时包含大小写字母')

  if (/[0-9]/.test(password)) score++
  else suggestions.push('包含数字')

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else suggestions.push('包含特殊字符会更安全')

  const labels = ['非常弱', '弱', '一般', '强', '非常强']

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    suggestions
  }
}
