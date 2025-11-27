'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  TreePine,
  LogOut,
  BookOpen,
  Settings,
  Ear,
  Globe,
  ChevronRight,
  Atom,
  User,
  Home,
  ChevronDown,
  Key
} from 'lucide-react'
import { usePortalCourses } from '@/lib/hooks/usePortalCourses'
import { ConsciousnessTreeView } from '@/components/consciousness/ConsciousnessTreeView'

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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      {/* 顶部导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="nav-ethereal relative z-20"
      >
        <div className="flex justify-between items-center w-full px-6 py-4">
          {/* 左侧：用户下拉菜单 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 text-starlight hover:text-starlight/80 transition-colors duration-300 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-mystic-purple/30 to-ethereal-blue/30 rounded-full flex items-center justify-center border border-mystic-purple/40 group-hover:border-mystic-purple/60 transition-all duration-300">
                <User className="w-5 h-5 text-mystic-purple" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-small font-medium text-starlight">{userName || '探索者'}</p>
                <p className="text-xs text-starlight-muted truncate max-w-[120px]">{userEmail}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-starlight-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉菜单 */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-2 w-56 card-glass rounded-xl overflow-hidden shadow-2xl border border-white/10"
                >
                  {/* 菜单项 */}
                  <div className="py-2">
                    {/* 修改密码 */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push('/reset-password')
                      }}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-white/5 transition-colors duration-200"
                    >
                      <Key className="w-4 h-4 text-gaia-gold" />
                      <span className="text-small text-starlight">修改密码</span>
                    </button>

                    {/* 管理后台 - 仅管理员可见 */}
                    {userRole && ['principal', 'teacher'].includes(userRole) && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          router.push('/admin')
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-white/5 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4 text-ethereal-blue" />
                        <span className="text-small text-starlight">管理后台</span>
                      </button>
                    )}

                    {/* 分隔线 */}
                    <div className="my-2 border-t border-white/10" />

                    {/* 退出登录 */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-life-pink/10 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 text-life-pink" />
                      <span className="text-small text-life-pink">退出登录</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 右侧：返回首页 */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-mystic-purple hover:text-mystic-purple/80 transition-colors duration-300 group"
          >
            <span className="text-small font-medium hidden sm:inline">返回首页</span>
            <div className="w-10 h-10 bg-mystic-purple/20 rounded-full flex items-center justify-center group-hover:bg-mystic-purple/30 transition-colors duration-300 border border-mystic-purple/30">
              <Home className="w-5 h-5 text-mystic-purple" />
            </div>
          </button>
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
                        className="relative group/card cursor-pointer rounded-2xl p-[2px] transition-all duration-500"
                        onClick={() => router.push(`/courses/${course.course_system_key}`)}
                      >
                        {/* 炫彩边框背景 - 悬停时显示 */}
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
                          style={{
                            background: 'linear-gradient(90deg, #FFD700, #FF6B6B, #9D00FF, #00FFFF, #00FF88, #FFD700, #FF6B6B, #9D00FF, #00FFFF, #FFD700)',
                            backgroundSize: '300% 100%',
                            animation: 'border-flow 8s linear infinite',
                          }}
                        />
                        {/* 炫彩发光效果 - 悬停时显示 */}
                        <div
                          className="absolute -inset-1 rounded-2xl opacity-0 group-hover/card:opacity-40 transition-opacity duration-500 -z-10"
                          style={{
                            background: 'linear-gradient(90deg, #FFD700, #FF6B6B, #9D00FF, #00FFFF, #00FF88, #FFD700)',
                            backgroundSize: '300% 100%',
                            animation: 'border-flow 8s linear infinite',
                            filter: 'blur(12px)',
                          }}
                        />

                        {/* 卡片内容 - 内层完全不透明背景遮住渐变 */}
                        <div
                          className="relative rounded-[calc(1rem-1px)] p-6"
                          style={{ background: '#0a0a1f' }}
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
                            <ChevronRight className="w-5 h-5 text-starlight-muted group-hover/card:text-starlight transition-colors" />
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
                className="btn-stardust w-full mt-6 py-4 flex items-center justify-center"
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
                className="btn-stardust w-full py-3 flex items-center justify-center"
              >
                查看完整意识树
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
