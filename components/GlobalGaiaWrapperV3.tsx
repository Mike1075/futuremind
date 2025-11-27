"use client"

import { usePathname } from 'next/navigation'
import { GlobalGaiaV3 } from './GlobalGaiaV3'

/**
 * 全局盖亚包装器 V3
 * 在除探索者联盟外的所有页面显示统一的盖亚
 */
export function GlobalGaiaWrapperV3() {
  const pathname = usePathname()

  // 排除特定路径：首页（有自己的浮动按钮）和探索者联盟
  const excludePrefixes = [
    '/explorer-alliance',
    '/pbl' // 如果PBL也属于探索者联盟，也排除
  ]

  // 精确匹配首页
  const isHomePage = pathname === '/'
  const isExcludedPrefix = excludePrefixes.some(path => pathname?.startsWith(path))

  const shouldShowGaia = !isHomePage && !isExcludedPrefix

  if (!shouldShowGaia) {
    return null
  }

  return <GlobalGaiaV3 />
}
