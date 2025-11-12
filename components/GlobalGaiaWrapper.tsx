"use client"

import { usePathname } from 'next/navigation'
import { GlobalGaia } from './GlobalGaia'

/**
 * 全局盖亚包装器
 * 在除探索者联盟外的所有页面显示盖亚
 */
export function GlobalGaiaWrapper() {
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

  return <GlobalGaia />
}
