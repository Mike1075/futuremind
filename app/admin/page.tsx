'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Users,
  BookOpen,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Sparkles
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: '总用户数', value: '---', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: '课程内容', value: '---', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    { label: '对话记录', value: '---', icon: MessageSquare, color: 'from-green-500 to-emerald-500' },
    { label: 'PBL项目', value: '---', icon: Sparkles, color: 'from-orange-500 to-red-500' },
  ]

  const quickActions = [
    { label: '内容管理', href: '/admin/content', icon: FileText, description: '管理课程和学习内容' },
    { label: '用户管理', href: '/admin/users', icon: Users, description: '查看和管理用户' },
    { label: '数据分析', href: '/admin/analytics', icon: BarChart3, description: '查看使用数据和统计' },
    { label: '系统设置', href: '/admin/settings', icon: Settings, description: '配置系统参数' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">未来心智学院 - 管理后台</h1>
              <p className="text-sm text-purple-300 mt-1">欢迎回来，{userEmail}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
            >
              返回首页
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">快捷操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all text-left group"
                >
                  <Icon className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold text-white mb-2">{action.label}</h3>
                  <p className="text-sm text-gray-400">{action.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">最近活动</h2>
          <div className="text-center py-12">
            <p className="text-gray-400">暂无活动记录</p>
          </div>
        </div>
      </main>
    </div>
  )
}
