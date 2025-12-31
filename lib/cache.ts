/**
 * 简单的内存缓存工具
 * 用于减少重复的数据库查询
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// 全局缓存存储
const cacheStore = new Map<string, CacheEntry<unknown>>()

/**
 * 缓存配置选项
 */
interface CacheOptions {
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  ttl?: number
  /** 是否在后台刷新（在返回缓存数据的同时，后台更新数据） */
  backgroundRefresh?: boolean
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 分钟

/**
 * 获取缓存数据
 * @param key - 缓存键
 * @param fetcher - 数据获取函数
 * @param options - 缓存选项
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, backgroundRefresh = false } = options
  const now = Date.now()
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined

  // 如果缓存存在且未过期，返回缓存
  if (cached && cached.expiresAt > now) {
    // 如果启用后台刷新且缓存即将过期（剩余时间 < 20%），后台更新
    const remainingTime = cached.expiresAt - now
    const shouldBackgroundRefresh = backgroundRefresh && remainingTime < ttl * 0.2

    if (shouldBackgroundRefresh) {
      // 后台刷新，不阻塞返回
      refreshCache(key, fetcher, ttl).catch(() => {
        // 静默处理后台刷新错误
      })
    }

    return cached.data
  }

  // 缓存不存在或已过期，重新获取
  return refreshCache(key, fetcher, ttl)
}

/**
 * 刷新缓存
 */
async function refreshCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const data = await fetcher()
  const now = Date.now()

  cacheStore.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl
  })

  return data
}

/**
 * 使缓存失效
 * @param key - 缓存键，支持通配符前缀匹配（如 "user:*"）
 */
export function invalidateCache(key: string): void {
  if (key.endsWith('*')) {
    // 通配符匹配
    const prefix = key.slice(0, -1)
    for (const k of cacheStore.keys()) {
      if (k.startsWith(prefix)) {
        cacheStore.delete(k)
      }
    }
  } else {
    cacheStore.delete(key)
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  cacheStore.clear()
}

/**
 * 获取缓存统计信息（用于调试）
 */
export function getCacheStats(): {
  size: number
  keys: string[]
} {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys())
  }
}

// 定期清理过期缓存（每 10 分钟）
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of cacheStore.entries()) {
      if (entry.expiresAt < now) {
        cacheStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}
