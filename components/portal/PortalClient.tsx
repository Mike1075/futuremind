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
  Sparkles,
  Atom
} from 'lucide-react'
import { usePortalCourses } from '@/lib/hooks/usePortalCourses'
import { ConsciousnessTreeView } from '@/components/consciousness/ConsciousnessTreeView'
import UserProfileButton from '@/components/UserProfileButton'

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-cosmic-void">
      {/* Ethereal background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-void via-cosmic-deep to-mystic-purple/10" />

      {/* Subtle animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `${(i * 7) % 100}%`,
              background: `radial-gradient(circle, ${['#FFD700', '#9D00FF', '#00FFFF'][i % 3]} 0%, transparent 70%)`,
              boxShadow: `0 0 6px ${['#FFD700', '#9D00FF', '#00FFFF'][i % 3]}30`,
            }}
            animate={{
              x: [0, (i % 2 === 0 ? 30 : -30), 0],
              y: [0, (i % 3 === 0 ? 20 : -20), 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 用户资料按钮（左上角） */}
      <UserProfileButton />

      {/* 顶部导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="nav-ethereal relative z-20"
      >
        <div className="flex justify-between items-center w-full px-6 py-4">
          {/* 左侧：返回主页 */}
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-shrink-0 flex items-center space-x-2 text-mystic-purple hover:text-mystic-purple/80 transition-colors duration-300 group"
          >
            <div className="w-8 h-8 bg-mystic-purple/20 rounded-full flex items-center justify-center group-hover:bg-mystic-purple/30 transition-colors duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-small font-medium hidden sm:inline">返回主页</span>
          </button>

          {/* 中间：标题 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gaia-gold/20 rounded-full flex items-center justify-center border border-gaia-gold/30">
              <TreePine className="w-5 h-5 text-gaia-gold" />
            </div>
            <h2 className="text-h3 text-starlight">个人探索基地</h2>
          </div>

          {/* 右侧：快捷入口与登出 */}
          <div className="flex-shrink-0 flex items-center space-x-4">
              {/* 管理后台入口 - 仅管理员可见 */}
              {userRole && ['principal', 'teacher'].includes(userRole) && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-ethereal-blue hover:text-ethereal-blue/80 transition-colors duration-300 group"
                >
                  <span className="text-small font-medium">管理后台</span>
                  <div className="w-8 h-8 bg-ethereal-blue/20 rounded-full flex items-center justify-center group-hover:bg-ethereal-blue/30 transition-colors duration-300">
                    <Settings className="w-5 h-5 text-ethereal-blue" />
                  </div>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-life-pink hover:text-life-pink/80 transition-colors duration-300 group"
              >
                <span className="text-small font-medium">登出</span>
                <div className="w-8 h-8 bg-life-pink/20 rounded-full flex items-center justify-center group-hover:bg-life-pink/30 transition-colors duration-300">
                  <LogOut className="w-5 h-5 text-life-pink" />
                </div>
              </button>
            </div>
        </div>
      </motion.nav>

      {/* 主内容区 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：我的课程 */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass p-8"
            >
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-mystic-purple mr-3" />
                <h3 className="text-h2 text-starlight">我的课程</h3>
              </div>

              {/* 课程加载中 */}
              {coursesLoading ? (
                <div className="text-center py-16">
                  <div className="loader-ethereal mx-auto"></div>
                  <p className="text-starlight-muted mt-4 text-body">正在加载课程...</p>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.map((course, index) => {
                    const Icon = getCourseIcon(course.course_system_key)
                    const gradient = getCourseGradient(course.course_system_key)
                    return (
                      <motion.div
                        key={course.course_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`card-content bg-gradient-to-br ${gradient} cursor-pointer`}
                        onClick={() => router.push(`/courses/${course.course_system_key}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 border border-white/20">
                              <Icon className="w-6 h-6 text-starlight" />
                            </div>
                            <div>
                              <h4 className="text-h3 text-starlight">{course.course_title}</h4>
                              <p className="text-small text-starlight-dim">
                                开始时间: {new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-starlight-muted" />
                        </div>

                        {/* 进度条 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-small text-starlight-dim">学习进度</span>
                            <span className="text-small text-starlight font-medium">{course.progress}%</span>
                          </div>
                          <div className="progress-ethereal">
                            <div
                              className="progress-ethereal-bar"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <BookOpen className="w-16 h-16 text-starlight-muted mx-auto mb-4" />
                  <p className="text-body text-starlight-dim mb-2">您还没有选修任何课程</p>
                  <p className="text-small text-starlight-muted mb-6">开始探索，选择您感兴趣的课程</p>
                </div>
              )}

              {/* 探索所有课程按钮 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => router.push('/portal/courses')}
                className="btn-stardust w-full mt-6 py-4 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                探索所有课程
              </motion.button>
            </motion.div>

            {/* 个性化推荐（预留位置） */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-glass bg-gradient-to-br from-mystic-purple/10 to-life-pink/10 p-8 border-mystic-purple/30"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-mystic-purple mr-3" />
                <h3 className="text-h3 text-starlight">个性化推荐</h3>
              </div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-mystic-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-mystic-purple/30">
                  <Sparkles className="w-8 h-8 text-mystic-purple" />
                </div>
                <p className="text-body text-starlight-dim mb-2">AI 个性化推荐</p>
                <p className="text-small text-starlight-muted">基于您的学习轨迹，为您推荐最适合的探索路径</p>
                <div className="mt-4">
                  <span className="badge-ethereal">即将上线...</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧：意识进化树 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-glass p-6"
            >
              <div className="flex items-center mb-4">
                <TreePine className="w-6 h-6 text-gaia-gold mr-3" />
                <h3 className="text-h3 text-starlight">意识进化树</h3>
              </div>
              <div className="relative h-64 w-full bg-cosmic-void rounded-lg mb-4 overflow-hidden border border-white/10">
                {/* 预览：直接渲染，让Canvas自适应容器 */}
                <div className="w-full h-full">
                  <ConsciousnessTreeView userId={userId} isPreview={true} />
                </div>
              </div>

              {/* 成长数据 */}
              <div className="bg-gaia-gold/10 rounded-lg p-4 mb-4 border border-gaia-gold/20">
                <div className="flex items-center">
                  <span className="text-body font-bold text-gaia-gold">
                    等级1：探索者
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/consciousness-tree')}
                className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-gaia-gold/20 to-nature-green/20 hover:from-gaia-gold/30 hover:to-nature-green/30 rounded-lg border border-gaia-gold/30 transition-all duration-300 group"
              >
                <TreePine className="w-5 h-5 text-gaia-gold mr-2 group-hover:text-gaia-gold/80 transition-colors" />
                <span className="text-gaia-gold group-hover:text-gaia-gold/80 transition-colors text-body font-medium">
                  查看完整意识树
                </span>
                <ChevronRight className="w-4 h-4 ml-2 text-gaia-gold group-hover:text-gaia-gold/80 transition-colors" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
