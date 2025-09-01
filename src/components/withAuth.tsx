'use client'

import React from 'react'
import { useAuth } from '@/components/AuthProvider'
import { UserRole, hasPermission } from '@/types/auth'

// 权限保护的高阶组件
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole?: UserRole,
  requiredPermission?: { resource: string; action: string }
) {
  return function AuthenticatedComponent(props: T) {
    const { user, profile, loading } = useAuth()

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">需要登录</h1>
            <p className="text-gray-300">请先登录以访问此页面</p>
          </div>
        </div>
      )
    }

    if (requiredRole && profile?.role !== requiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">权限不足</h1>
            <p className="text-gray-300">您没有访问此页面的权限</p>
          </div>
        </div>
      )
    }

    if (requiredPermission && !hasPermission(profile?.role || 'guest', requiredPermission.resource, requiredPermission.action)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">权限不足</h1>
            <p className="text-gray-300">您没有执行此操作的权限</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
