/**
 * 意识树数据缓存 Hook
 *
 * 解决的问题：
 * - Portal 页面预览意识树时加载数据
 * - 点击"查看完整意识树"时，应该立即显示缓存的数据
 * - 后台刷新最新数据，更新后平滑过渡
 */

import { TreeGrowthData } from '@/lib/utils/consciousnessTreeGenerator'

const CACHE_KEY = 'consciousness_tree_cache'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟缓存有效期

interface CachedTreeData {
  userId: string
  data: TreeGrowthData
  timestamp: number
}

/**
 * 从缓存获取意识树数据
 */
export function getCachedTreeData(userId: string): TreeGrowthData | null {
  if (typeof window === 'undefined') {
    console.log('[TreeCache] SSR环境，跳过缓存')
    return null
  }

  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    console.log('[TreeCache] 读取缓存', {
      key: CACHE_KEY,
      hasData: !!cached,
      userId
    })

    if (!cached) {
      console.log('[TreeCache] 缓存为空')
      return null
    }

    const parsed: CachedTreeData = JSON.parse(cached)
    console.log('[TreeCache] 解析缓存', {
      cachedUserId: parsed.userId,
      requestUserId: userId,
      match: parsed.userId === userId,
      timestamp: new Date(parsed.timestamp).toISOString(),
      age: Date.now() - parsed.timestamp
    })

    // 检查是否是同一用户的数据
    if (parsed.userId !== userId) {
      console.log('[TreeCache] 用户ID不匹配')
      return null
    }

    // 检查缓存是否过期
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      console.log('[TreeCache] 缓存已过期')
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    console.log('[TreeCache] ✅ 返回有效缓存', parsed.data)
    return parsed.data
  } catch (e) {
    console.error('[TreeCache] 读取缓存出错', e)
    return null
  }
}

/**
 * 设置意识树数据缓存
 */
export function setCachedTreeData(userId: string, data: TreeGrowthData): void {
  if (typeof window === 'undefined') return

  try {
    const cacheData: CachedTreeData = {
      userId,
      data,
      timestamp: Date.now()
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('[TreeCache] ✅ 已保存缓存', { userId, data })
  } catch (e) {
    console.error('[TreeCache] 保存缓存出错', e)
  }
}

/**
 * 清除意识树缓存
 */
export function clearTreeCache(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // 静默处理
  }
}
