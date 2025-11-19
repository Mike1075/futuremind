'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  UserCheck,
  Brain
} from 'lucide-react'

export default function AdminDashboardClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  // 所有 useState 必须在组件顶层声明（React Hooks 规则）
  const [particles, setParticles] = useState<any[]>([])
  const [portalCards, setPortalCards] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // 检查用户角色
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('获取用户资料失败:', profileError)
        alert('⚠️ 无法获取用户信息，请重新登录')
        router.push('/')
        return
      }

      // 检查是否有管理权限
      if (!profile.role || !['principal', 'teacher'].includes(profile.role)) {
        alert('⚠️ 您没有管理员权限\n\n只有校长和老师可以访问管理后台。')
        router.push('/')
        return
      }

      setUserEmail(user.email || '')
      setUserRole(profile.role)
    } catch (error) {
      console.error('认证失败:', error)
      alert('❌ 系统错误，请稍后重试')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  // 生成粒子（仅在客户端挂载后）
  useEffect(() => {
    if (isMounted) {
      setParticles([...Array(50)].map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        duration: Math.random() * 3 + 2,
        left: Math.random() * 100,
        top: Math.random() * 100,
      })))
    }
  }, [isMounted])

  // 根据角色生成卡片（新架构：校长2个，老师1个）
  useEffect(() => {
    const cards = []

    // 校长专属：人员管理
    if (userRole === 'principal') {
      cards.push({
        title: '人员管理',
        description: '管理校长、教师、学员，设置角色权限',
        href: '/admin/users',
        icon: Users,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500'
      })
    }

    // 校长和老师共有：课程管理
    if (userRole === 'principal' || userRole === 'teacher') {
      cards.push({
        title: '课程管理',
        description: '管理课程内容、资料上传、选课学员',
        href: '/admin/courses',
        icon: BookOpen,
        gradient: 'from-purple-500 via-pink-500 to-rose-500'
      })
    }

    setPortalCards(cards)
  }, [userRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 relative z-10">
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

      {/* Main Content - Minimalist Portal */}
      <main className="max-w-7xl mx-auto px-6 py-12 min-h-[calc(100vh-120px)] flex items-center justify-center relative z-10">
        {portalCards.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-400 text-lg">正在加载管理功能...</p>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className={`grid grid-cols-1 ${portalCards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 max-w-5xl`}>
              {portalCards.map((card) => {
                const Icon = card.icon
                return (
                  <button
                    key={card.title}
                    onClick={() => router.push(card.href)}
                    className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-10 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:bg-white/10 min-h-[320px] w-full flex flex-col items-center justify-center"
                  >
                  {/* Gradient Background Effect */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                  {/* Icon */}
                  <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="relative text-2xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                    {card.title}
                  </h2>

                  {/* Description */}
                  <p className="relative text-sm text-gray-300 text-center group-hover:text-white transition-colors duration-300">
                    {card.description}
                  </p>

                  {/* Arrow Indicator */}
                  <div className="relative mt-4 flex items-center text-purple-300 group-hover:text-white transition-colors duration-300">
                    <span className="text-xs mr-1">进入</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              )
            })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
