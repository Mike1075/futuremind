// @ts-nocheck
/**
 * Rate Limiting 实现
 *
 * 防止：
 * - DDoS 攻击
 * - API 滥用
 * - 暴力破解
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

// 内存存储（生产环境建议使用 Redis）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

/**
 * 清理过期的记录（每小时执行一次）
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key)
    }
  }
}, 60 * 60 * 1000)

/**
 * 获取客户端标识符
 */
function getClientIdentifier(req: NextRequest): string {
  // 优先使用用户ID（如果已登录）
  const userId = req.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // 使用IP地址
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate Limit 中间件
 */
export function rateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, message = 'Too many requests' } = config

  return async (req: NextRequest) => {
    const identifier = getClientIdentifier(req)
    const now = Date.now()

    // 获取或创建记录
    let record = requestCounts.get(identifier)

    if (!record || record.resetTime < now) {
      // 创建新记录
      record = {
        count: 1,
        resetTime: now + windowMs
      }
      requestCounts.set(identifier, record)
      return null // 允许请求
    }

    // 增加计数
    record.count++

    if (record.count > maxRequests) {
      // 超出限制
      logger.warn('Rate limit exceeded', {
        identifier,
        count: record.count,
        maxRequests
      })

      return NextResponse.json(
        {
          error: message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000))
          }
        }
      )
    }

    // 在响应头中添加限流信息
    return {
      headers: {
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(maxRequests - record.count),
        'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000))
      }
    }
  }
}

/**
 * 预定义的限流配置
 */
export const rateLimitConfigs = {
  // 通用API（每小时100次）
  api: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000
  },

  // 认证API（每15分钟5次）
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts'
  },

  // 上传API（每小时10次）
  upload: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    message: 'Upload rate limit exceeded'
  },

  // AI聊天API（每分钟20次）
  chat: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: 'Too many chat requests'
  },

  // 搜索API（每分钟30次）
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000
  }
}

/**
 * API路由包装器 - 自动添加Rate Limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    const limiter = rateLimit(config)
    const limitResult = await limiter(req)

    if (limitResult && limitResult instanceof NextResponse) {
      // 被限流
      return limitResult
    }

    // 执行原始处理器
    const response = await handler(req, ...args)

    // 添加限流响应头
    if (limitResult?.headers) {
      Object.entries(limitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    return response
  }) as T
}
