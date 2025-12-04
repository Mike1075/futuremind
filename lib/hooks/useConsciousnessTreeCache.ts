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
  if (typeof window === 'undefined') return null

  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsed: CachedTreeData = JSON.parse(cached)

    // 检查是否是同一用户的数据
    if (parsed.userId !== userId) return null

    // 检查缓存是否过期
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }

    return parsed.data
  } catch {
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
  } catch {
    // 静默处理存储错误（如 quota exceeded）
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
