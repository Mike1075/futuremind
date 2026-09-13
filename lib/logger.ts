// @ts-nocheck
/**
 * 统一日志系统 - 替代所有 console.log
 *
 * 功能：
 * - 开发环境：输出详细日志
 * - 生产环境：只输出错误和警告
 * - 自动添加时间戳和上下文
 * - 支持结构化日志
 * - DB-12: 请求ID追踪，关联同一请求的多个日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
  requestId?: string
}

// DB-12: 生成唯一请求ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'
  private currentRequestId: string | null = null

  /**
   * DB-12: 设置当前请求ID，用于关联日志
   */
  setRequestId(requestId?: string): string {
    this.currentRequestId = requestId || generateRequestId()
    return this.currentRequestId
  }

  /**
   * DB-12: 获取当前请求ID
   */
  getRequestId(): string | null {
    return this.currentRequestId
  }

  /**
   * DB-12: 清除请求ID（请求结束时调用）
   */
  clearRequestId(): void {
    this.currentRequestId = null
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    // DB-12: 在日志中包含请求ID
    const requestIdPart = this.currentRequestId ? ` [${this.currentRequestId}]` : ''
    const prefix = `[${timestamp}] [${level.toUpperCase()}]${requestIdPart}`

    if (context && Object.keys(context).length > 0) {
      // DB-12: 自动添加requestId到context
      const contextWithRequestId = this.currentRequestId
        ? { ...context, requestId: this.currentRequestId }
        : context
      return `${prefix} ${message} ${JSON.stringify(contextWithRequestId)}`
    }

    return `${prefix} ${message}`
  }

  /**
   * 调试日志 - 仅在开发环境输出
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * 信息日志 - 仅在开发环境输出
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  /**
   * 警告日志 - 开发和生产环境都输出
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context))
  }

  /**
   * 错误日志 - 开发和生产环境都输出
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error ? {
        name: error.name,
        message: error.message,
        ...(this.isDevelopment ? { stack: error.stack } : {})
      } : { error: String(error) })
    }

    console.error(this.formatMessage('error', message, errorContext))
  }

  /**
   * 性能计时开始
   */
  timeStart(label: string) {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  /**
   * 性能计时结束
   */
  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }

  /**
   * API请求日志
   */
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API ${method} ${path}`, context)
  }

  /**
   * API响应日志
   */
  apiResponse(method: string, path: string, status: number, duration: number) {
    this.info(`API ${method} ${path} - ${status}`, { duration: `${duration}ms` })
  }

  /**
   * 数据库查询日志
   */
  dbQuery(table: string, operation: string, context?: LogContext) {
    this.debug(`DB ${operation} ${table}`, context)
  }

  /**
   * SEC-06: 安全审计日志 - 在使用管理员权限前记录
   * 生产环境和开发环境都会输出，用于安全审计追踪
   */
  audit(action: string, context: LogContext) {
    const auditContext = {
      ...context,
      auditTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    }
    // 审计日志始终输出，用于安全追踪
    console.info(this.formatMessage('info', `[AUDIT] ${action}`, auditContext))
  }

  /**
   * 安全的错误信息（生产环境）
   */
  safeError(message: string, error?: Error | unknown): string {
    if (this.isDevelopment) {
      return error instanceof Error ? error.message : String(error)
    }
    return message // 生产环境只返回通用消息
  }
}

// 导出单例
export const logger = new Logger()

// 导出便捷函数
export const logApiRequest = (req: Request) => {
  const method = req.method
  const url = new URL(req.url)
  // DB-12: 自动为每个请求设置追踪ID
  const requestId = logger.setRequestId()
  logger.apiRequest(method, url.pathname, { requestId })
  return requestId
}

export const logApiError = (error: unknown, endpoint: string) => {
  logger.error(`API Error at ${endpoint}`, error)
}

// DB-12: 导出请求ID生成函数
export { generateRequestId }

/**
 * DB-12: API路由包装器 - 自动添加请求ID追踪
 * 用法：export const GET = withRequestTracking(async (req) => { ... })
 */
export function withRequestTracking<T extends (req: Request, ...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (req: Request, ...args: unknown[]) => {
    const requestId = logApiRequest(req)
    try {
      const response = await handler(req, ...args)
      // 在响应头中添加请求ID，方便前端调试
      if (response instanceof Response) {
        response.headers.set('X-Request-ID', requestId)
      }
      return response
    } finally {
      logger.clearRequestId()
    }
  }) as T
}
