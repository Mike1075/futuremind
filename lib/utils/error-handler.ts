/**
 * ErrorHandler - 统一错误处理工具
 *
 * 提供标准化的错误处理、日志记录和用户友好的错误消息
 */

/**
 * 应用错误类型
 */
export enum ErrorType {
  DATABASE = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public userMessage: string,
    public statusCode: number = 500,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AppError'

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * 转换为API响应格式
   */
  toResponse() {
    return {
      error: {
        type: this.type,
        message: this.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: this.message,
          stack: this.stack
        })
      }
    }
  }
}

/**
 * 数据库错误处理
 */
export function handleDatabaseError(error: any, context: string): AppError {
  // Supabase/PostgreSQL错误代码
  const errorCode = error?.code

  switch (errorCode) {
    case 'PGRST116':
      return new AppError(
        ErrorType.NOT_FOUND,
        `${context}: 记录不存在`,
        '未找到相关数据',
        404,
        error
      )

    case '23505': // unique_violation
      return new AppError(
        ErrorType.DATABASE,
        `${context}: 唯一性约束冲突`,
        '该数据已存在',
        409,
        error
      )

    case '23503': // foreign_key_violation
      return new AppError(
        ErrorType.DATABASE,
        `${context}: 外键约束冲突`,
        '关联的数据不存在',
        400,
        error
      )

    case '23502': // not_null_violation
      return new AppError(
        ErrorType.VALIDATION,
        `${context}: 必填字段缺失`,
        '请填写所有必填字段',
        400,
        error
      )

    case 'PGRST301': // 权限不足
      return new AppError(
        ErrorType.AUTHORIZATION,
        `${context}: 权限不足`,
        '您没有权限执行此操作',
        403,
        error
      )

    default:
      return new AppError(
        ErrorType.DATABASE,
        `${context}: ${error?.message || '数据库操作失败'}`,
        '操作失败，请稍后重试',
        500,
        error
      )
  }
}

/**
 * 认证错误处理
 */
export function handleAuthError(error: any): AppError {
  const errorMessage = error?.message?.toLowerCase() || ''

  if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
    return new AppError(
      ErrorType.AUTHENTICATION,
      '认证凭据无效',
      '登录信息无效，请重新登录',
      401,
      error
    )
  }

  if (errorMessage.includes('expired')) {
    return new AppError(
      ErrorType.AUTHENTICATION,
      '会话已过期',
      '登录已过期，请重新登录',
      401,
      error
    )
  }

  return new AppError(
    ErrorType.AUTHENTICATION,
    `认证失败: ${error?.message || '未知错误'}`,
    '认证失败，请重新登录',
    401,
    error
  )
}

/**
 * 外部API错误处理
 */
export function handleExternalApiError(
  error: any,
  serviceName: string
): AppError {
  const statusCode = error?.status || error?.statusCode || 500

  return new AppError(
    ErrorType.EXTERNAL_API,
    `${serviceName} API错误: ${error?.message || '请求失败'}`,
    '外部服务暂时不可用，请稍后重试',
    statusCode >= 500 ? 503 : statusCode,
    error
  )
}

/**
 * 验证错误处理
 */
export function createValidationError(
  field: string,
  message: string
): AppError {
  return new AppError(
    ErrorType.VALIDATION,
    `验证失败: ${field} - ${message}`,
    message,
    400
  )
}

/**
 * 统一API错误处理函数
 * 用于API路由的catch块
 */
export function handleApiError(error: unknown): Response {
  // 如果已经是AppError，直接返回
  if (error instanceof AppError) {
    return Response.json(
      error.toResponse(),
      { status: error.statusCode }
    )
  }

  // 记录未知错误
  console.error('Unhandled API Error:', error)

  // 返回通用错误响应
  const genericError = new AppError(
    ErrorType.UNKNOWN,
    error instanceof Error ? error.message : '未知错误',
    '服务器错误，请稍后重试',
    500,
    error
  )

  return Response.json(
    genericError.toResponse(),
    { status: 500 }
  )
}

/**
 * 日志记录工具
 */
export const logger = {
  error: (context: string, error: unknown, metadata?: Record<string, any>) => {
    console.error(`[ERROR] ${context}:`, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      metadata,
      timestamp: new Date().toISOString()
    })
  },

  warn: (context: string, message: string, metadata?: Record<string, any>) => {
    console.warn(`[WARN] ${context}:`, {
      message,
      metadata,
      timestamp: new Date().toISOString()
    })
  },

  info: (context: string, message: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${context}:`, {
        message,
        metadata,
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * 安全执行函数 - 自动捕获并转换错误
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logger.error(context, error)
    throw handleDatabaseError(error, context)
  }
}
