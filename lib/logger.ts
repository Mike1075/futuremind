/**
 * 统一日志系统 - 替代所有 console.log
 *
 * 功能：
 * - 开发环境：输出详细日志
 * - 生产环境：只输出错误和警告
 * - 自动添加时间戳和上下文
 * - 支持结构化日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`
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
  logger.apiRequest(method, url.pathname)
}

export const logApiError = (error: unknown, endpoint: string) => {
  logger.error(`API Error at ${endpoint}`, error)
}
