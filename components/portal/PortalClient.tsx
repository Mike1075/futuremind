// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  TreePine,
  LogOut,
  BookOpen,
  Settings,
  Ear,
  Globe,
  Rocket,
  ChevronRight,
  Atom,
  User,
  Home,
  ChevronDown,
  Key
} from 'lucide-react'
import { usePortalCourses } from '@/lib/hooks/usePortalCourses'
import { ConsciousnessTreeView } from '@/components/consciousness/ConsciousnessTreeView'
import UserProfileModal from '@/components/UserProfileModal'

interface PortalClientProps {
  userId: string
  userEmail: string
  userName?: string
  userRole: string | null
  consciousnessGrowth: number
}

export function PortalClient({
  userId,
  userEmail,
  userName,
  userRole,
  consciousnessGrowth: initialConsciousnessGrowth
}: PortalClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // ✅ 使用SWR缓存课程数据（首次3秒，后续瞬间）
  const { courses: enrolledCourses, loading: coursesLoading } = usePortalCourses(userId)

  // 🌱 登录时自动触发总结和意识树计算（24小时规则）
  useEffect(() => {
    const triggerSummary = async () => {
      try {
        const response = await fetch('/api/trigger-summary', {
          method: 'POST'
        })

        // 静默处理结果
      } catch {
        // 静默处理错误
      }
    }

    triggerSummary()
  }, []) // 只在组件挂载时执行一次

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getCourseIcon = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return Ear
      case 'earth':
        return Globe
      case 'icarus':
      case 'pbl':
        return Atom  // 原子图标代表科学探索和实验精神
      default:
        return BookOpen
    }
  }

  const getCourseGradient = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return 'from-purple-500/20 to-indigo-500/20 border-purple-400/30'
      case 'earth':
        return 'from-cyan-500/20 to-teal-500/20 border-cyan-400/30'
      case 'icarus':
      case 'pbl':
        return 'from-orange-500/20 to-red-500/20 border-orange-400/30'
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-400/30'
    }
  }

  // 获取课程边框颜色（用于炫彩边框效果）
  const getCourseBorderColor = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return 'rgba(168, 85, 247, 0.4)' // 紫色
      case 'earth':
        return 'rgba(34, 197, 94, 0.4)' // 绿色
      case 'icarus':
      case 'pbl':
        return 'rgba(249, 115, 22, 0.4)' // 橙色
      default:
        return 'rgba(156, 163, 175, 0.3)' // 灰色
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background particles - 减少数量提升性能 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* 顶部导航栏 - 与首页位置一致 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-20"
      >
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：用户名下拉菜单 - 与首页位置一致 */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
                className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors duration-300 group"
              >
                <div className="user-avatar-icon">
                  <div className="user-avatar-icon-inner">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="font-medium">{userName || '用户'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 下拉菜单 */}
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                  {/* 用户信息头部 */}
                  <div className="px-4 py-3 border-b border-zinc-700">
                    <p className="text-sm font-medium text-white">{userName || '用户'}</p>
                    <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
                  </div>

                  {/* 菜单项 */}
                  <div className="py-2">
                    {/* 个人资料 */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        setIsProfileModalOpen(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>个人资料</span>
                    </button>

                    {/* 修改密码 */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        router.push('/reset-password')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      <span>修改密码</span>
                    </button>

                    {/* 管理后台 - 仅管理员可见 */}
                    {userRole && ['principal', 'teacher'].includes(userRole) && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          router.push('/admin')
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>管理后台</span>
                      </button>
                    )}

                    {/* 分隔线 */}
                    <div className="my-2 border-t border-zinc-700"></div>

                    {/* 退出登录 */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：返回首页 */}
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center space-x-2 text-orange-300 hover:text-orange-200 transition-colors duration-300 group"
            >
              <span className="font-medium">返回首页</span>
              <div className="w-8 h-8 bg-orange-600/20 rounded-full flex items-center justify-center group-hover:bg-orange-600/40 transition-colors duration-300">
                <Home className="w-5 h-5 text-orange-400" />
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：我的课程 */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">我的课程</h3>
              </div>

              {/* 课程加载中（仅首次无缓存时显示） */}
              {coursesLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">正在加载课程...</p>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.map((course, index) => {
                    const Icon = getCourseIcon(course.course_system_key)
                    const borderColor = getCourseBorderColor(course.course_system_key)
                    return (
                      <motion.div
                        key={course.course_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="portal-card-wrapper cursor-pointer"
                        onClick={() => router.push(`/courses/${course.course_system_key}`)}
                        style={{ '--course-border-color': borderColor } as React.CSSProperties}
                      >
                        <div className="portal-card-inner p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 border border-white/20">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-white">{course.course_title}</h4>
                                <p className="text-sm text-gray-400">
                                  开始时间: {new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/60" />
                          </div>

                          {/* 进度条 - 使用炫彩进度条样式 */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-400">学习进度</span>
                              <span className="text-sm text-white font-medium">{course.progress}%</span>
                            </div>
                            <div className="progress-ethereal">
                              <div
                                className="progress-ethereal-bar"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">您还没有选修任何课程</p>
                  <p className="text-sm text-gray-500 mb-6">开始探索，选择您感兴趣的课程</p>
                </div>
              )}

              {/* 探索所有课程按钮 - 使用炫彩边框效果 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => router.push('/portal/courses')}
                className="w-full mt-6 btn-stardust py-4 flex items-center justify-center"
              >
                探索所有课程
              </motion.button>
            </motion.div>
          </div>

          {/* 右侧：意识进化树 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <TreePine className="w-6 h-6 text-red-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">意识进化树</h3>
              </div>
              <div className="relative h-64 w-full bg-black rounded-lg mb-4 overflow-hidden">
                {/* 预览：直接渲染，让Canvas自适应容器 */}
                <div className="w-full h-full">
                  <ConsciousnessTreeView userId={userId} isPreview={true} />
                </div>
              </div>

              {/* 成长数据 */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-red-400">
                    等级1：探索者
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/consciousness-tree')}
                className="w-full btn-stardust py-3 flex items-center justify-center"
              >
                <TreePine className="w-5 h-5 mr-2" />
                查看完整意识树
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 用户资料Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  )
}
