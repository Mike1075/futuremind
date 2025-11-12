"use client"

import { usePathname } from 'next/navigation'
import { GlobalGaiaV3 } from './GlobalGaiaV3'

/**
 * 全局盖亚包装器 V3
 * 在除探索者联盟外的所有页面显示统一的盖亚
 */
export function GlobalGaiaWrapperV3() {
  const pathname = usePathname()

  // 排除探索者联盟相关路径
  const excludePaths = [
    '/explorer-alliance',
    '/pbl' // 如果PBL也属于探索者联盟，也排除
  ]

  const shouldShowGaia = !excludePaths.some(path => pathname.startsWith(path))

  if (!shouldShowGaia) {
    return null
  }

  return <GlobalGaiaV3 />
}
