// @ts-nocheck
"use client"

import { usePathname } from 'next/navigation'
import { GlobalGaiaV3 } from './GlobalGaiaV3'

/**
 * 全局盖亚包装器 V3
 * 在除探索者联盟外的所有页面显示统一的盖亚
 */
export function GlobalGaiaWrapperV3() {
  const pathname = usePathname()

  // 排除特定路径：探索者联盟（有自己的聊天系统）
  const excludePrefixes = [
    '/explorer-alliance',
    '/pbl' // 如果PBL也属于探索者联盟，也排除
  ]

  // 精确匹配首页 - 首页有自己的浮动按钮，但仍需要 GlobalGaiaV3 处理对话
  const isHomePage = pathname === '/'
  const isExcludedPrefix = excludePrefixes.some(path => pathname?.startsWith(path))

  // 探索者联盟完全排除
  if (isExcludedPrefix) {
    return null
  }

  // 首页：渲染但隐藏浮动按钮（首页有自己的按钮）
  // 其他页面：正常渲染
  return <GlobalGaiaV3 hideFloatingButton={isHomePage} />
}
