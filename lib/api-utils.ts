// @ts-nocheck
/**
 * API工具函数 - 统一错误处理、响应格式、权限验证
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from './logger'

/**
 * DB-04: 统一的API响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: string[] | string
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

/**
 * 安全的错误响应（生产环境不泄露敏感信息）
 */
export function errorResponse(
  message: string,
  error?: Error | unknown,
  statusCode: number = 500
): NextResponse<ApiResponse> {
  const isDev = process.env.NODE_ENV === 'development'

  // 记录完整错误
  logger.error(message, error)

  // 生产环境返回通用错误
  const response: ApiResponse = {
    success: false,
    error: {
      code: `ERROR_${statusCode}`,
      message: isDev && error instanceof Error
        ? error.message
        : message,
      ...(isDev && error instanceof Error ? { details: error.stack } : {})
    }
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(pagination ? { pagination } : {})
  }

  return NextResponse.json(response)
}

/**
 * 用户类型
 */
interface AuthUser {
  id: string
  email?: string
  [key: string]: unknown
}

/**
 * 权限验证中间件返回类型
 */
type AuthResult =
  | { authorized: false; response: NextResponse }
  | { authorized: true; user: AuthUser; supabase: Awaited<ReturnType<typeof createClient>> }

/**
 * 权限验证中间件
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      )
    }
  }

  // DB-04: 将Supabase User转换为AuthUser（先展开再覆盖确保必需属性）
  const authUser: AuthUser = {
    ...user,
    id: user.id,
    email: user.email
  }

  return { authorized: true, user: authUser, supabase }
}

/**
 * 用户Profile类型
 */
interface UserProfile {
  role: string | null
  [key: string]: unknown
}

/**
 * 角色验证中间件返回类型
 */
type RoleAuthResult =
  | { authorized: false; response: NextResponse }
  | { authorized: true; user: AuthUser; profile: UserProfile; supabase: Awaited<ReturnType<typeof createClient>> }

/**
 * 角色验证中间件
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<RoleAuthResult> {
  const authResult = await requireAuth(req)

  if (!authResult.authorized) {
    return authResult
  }

  const { user, supabase } = authResult

  // 查询用户角色
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    logger.error('Failed to fetch user profile', error)
    return {
      authorized: false,
      response: errorResponse('Failed to verify user role', error, 500)
    }
  }

  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    logger.warn('Unauthorized access attempt', {
      userId: user.id,
      userRole: profile?.role,
      requiredRoles: allowedRoles
    })

    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        },
        { status: 403 }
      )
    }
  }

  return {
    authorized: true,
    user,
    profile,
    supabase
  }
}

/**
 * DB-04: 参数验证Schema类型
 */
interface ParamSchema {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  maxLength?: number
  minLength?: number
  pattern?: RegExp
}

/**
 * 请求参数验证
 */
export function validateParams(
  params: Record<string, unknown>,
  schema: Record<string, ParamSchema>
): { valid: boolean; errors?: string[]; response?: NextResponse } {
  const errors: string[] = []

  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key]

    // 检查必填
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`)
      continue
    }

    // 如果不是必填且值为空，跳过其他检查
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // 检查类型
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value

      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`)
      }
    }

    // 检查字符串长度
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} exceeds maximum length of ${rules.maxLength}`)
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`)
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`)
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors
          }
        },
        { status: 400 }
      )
    }
  }

  return { valid: true }
}

/**
 * API路由包装器 - 统一错误处理
 * DB-04: 使用泛型参数约束替代any
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      logger.error('Unhandled API error', error)
      return errorResponse('Internal server error', error, 500)
    }
  }) as T
}

/**
 * DB-04: 列表响应辅助函数
 */
export function listResponse<T>(
  items: T[],
  pagination: {
    page: number
    pageSize: number
    total: number
  }
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize)
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * 白名单验证（防止SQL注入）
 */
export function validateSortField(
  field: string,
  allowedFields: string[]
): { valid: boolean; response?: NextResponse } {
  if (!allowedFields.includes(field)) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SORT_FIELD',
            message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
          }
        },
        { status: 400 }
      )
    }
  }

  return { valid: true }
}

/**
 * CSRF 保护 - 验证请求来源
 * 检查 Origin/Referer 头是否来自允许的域名
 */
export function validateCsrf(req: NextRequest): { valid: boolean; response?: NextResponse } {
  // 只在生产环境强制验证
  const isDev = process.env.NODE_ENV === 'development'

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')

  // 允许的域名列表（从环境变量或硬编码）
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    `https://${host}`,
    `http://${host}`, // 开发环境
  ].filter(Boolean)

  // 开发环境允许 localhost
  if (isDev) {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000')
  }

  // 检查 Origin 或 Referer
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)

  if (!requestOrigin) {
    // 某些合法请求可能没有 Origin（如服务端调用），在开发环境允许
    if (isDev) {
      return { valid: true }
    }
    logger.warn('CSRF validation failed: no origin', { host })
    return {
      valid: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'Request origin could not be verified'
          }
        },
        { status: 403 }
      )
    }
  }

  if (!allowedOrigins.includes(requestOrigin)) {
    logger.warn('CSRF validation failed: invalid origin', {
      requestOrigin,
      allowedOrigins: allowedOrigins.filter(o => !o?.includes('localhost'))
    })
    return {
      valid: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'Request origin not allowed'
          }
        },
        { status: 403 }
      )
    }
  }

  return { valid: true }
}
