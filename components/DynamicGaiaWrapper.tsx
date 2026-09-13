// @ts-nocheck
'use client'

import dynamic from 'next/dynamic'

// PF-12: 动态加载 GlobalGaia，减少初始包体积
// 使用 ssr: false 因为这个组件依赖浏览器 API
const GlobalGaiaWrapperV3 = dynamic(
  () => import('@/components/GlobalGaiaWrapperV3').then(mod => mod.GlobalGaiaWrapperV3),
  { ssr: false }
)

export function DynamicGaiaWrapper() {
  return <GlobalGaiaWrapperV3 />
}
