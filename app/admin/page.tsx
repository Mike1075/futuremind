// @ts-nocheck
'use client'

import dynamic from 'next/dynamic'

// 使用动态导入，完全禁用服务端渲染，避免 hydration 错误
const AdminDashboardClient = dynamic(
  () => import('./AdminDashboardClient'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-starlight-muted mt-4">加载中...</p>
        </div>
      </div>
    )
  }
)

export default function AdminDashboard() {
  return <AdminDashboardClient />
}
