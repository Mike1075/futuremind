'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { withAuth } from '@/components/withAuth'
import { authClient } from '@/lib/auth'
import { 
  Users, 
  BookOpen, 
  Target, 
  Settings,
  BarChart3,
  Shield,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  ArrowLeft
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalGroups: number
  totalProjects: number
  activeUsers: number
  pendingApplications: number
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalGroups: 0,
    totalProjects: 0,
    activeUsers: 0,
    pendingApplications: 0
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'groups' | 'projects'>('overview')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    
    // 模拟统计数据
    setStats({
      totalUsers: 156,
      totalCourses: 12,
      totalGroups: 8,
      totalProjects: 15,
      activeUsers: 89,
      pendingApplications: 5
    })
    
    setLoading(false)
  }

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: '活跃用户',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      change: '+8%'
    },
    {
      title: '课程数量',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      change: '+3'
    },
    {
      title: '学习小组',
      value: stats.totalGroups,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      change: '+2'
    },
    {
      title: '项目数量',
      value: stats.totalProjects,
      icon: Target,
      color: 'from-pink-500 to-pink-600',
      change: '+5'
    },
    {
      title: '待审核申请',
      value: stats.pendingApplications,
      icon: Shield,
      color: 'from-red-500 to-red-600',
      change: '-2'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 头部导航 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                返回仪表板
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6" />
                管理员后台
              </h1>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span>欢迎，{profile?.full_name || '管理员'}</span>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 标签页导航 */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-8 overflow-x-auto">
          {[
            { key: 'overview', label: '概览', icon: BarChart3 },
            { key: 'users', label: '用户管理', icon: Users },
            { key: 'courses', label: '课程管理', icon: BookOpen },
            { key: 'groups', label: '小组管理', icon: Users },
            { key: 'projects', label: '项目管理', icon: Target }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === key 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{card.title}</p>
                      <p className="text-2xl font-bold text-white">{card.value}</p>
                      <p className={`text-xs ${
                        card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {card.change} 本月
                      </p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 快速操作 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  <span>创建课程</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('groups')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Users className="w-5 h-5" />
                  <span>管理小组</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('projects')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Target className="w-5 h-5" />
                  <span>管理项目</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Shield className="w-5 h-5" />
                  <span>用户权限</span>
                </button>
              </div>
            </motion.div>

            {/* 最近活动 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">最近活动</h3>
              <div className="space-y-3">
                {[
                  { action: '新用户注册', user: '张三', time: '2分钟前', type: 'user' },
                  { action: '创建新小组', user: '李四', time: '15分钟前', type: 'group' },
                  { action: '发布新课程', user: '王五', time: '1小时前', type: 'course' },
                  { action: '加入项目', user: '赵六', time: '2小时前', type: 'project' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'user' ? 'bg-blue-500/20' :
                      activity.type === 'group' ? 'bg-green-500/20' :
                      activity.type === 'course' ? 'bg-purple-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {activity.type === 'user' ? <Users className="w-4 h-4 text-blue-400" /> :
                       activity.type === 'group' ? <Users className="w-4 h-4 text-green-400" /> :
                       activity.type === 'course' ? <BookOpen className="w-4 h-4 text-purple-400" /> :
                       <Target className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-gray-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 其他标签页内容将在后续实现 */}
        {activeTab !== 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 text-center"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeTab === 'users' ? '用户管理' :
               activeTab === 'courses' ? '课程管理' :
               activeTab === 'groups' ? '小组管理' :
               '项目管理'}
            </h3>
            <p className="text-gray-400">此功能正在开发中...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// 使用权限保护包装组件
export default withAuth(AdminDashboard, 'admin')
