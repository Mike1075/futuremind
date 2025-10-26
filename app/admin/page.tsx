'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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

  // 生成固定的粒子配置
  const particles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 3 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }, [isMounted])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  const portalCards = [
    {
      title: '课程管理',
      description: '管理课程内容、学习路径和教学资源',
      href: '/admin/courses',
      icon: BookOpen,
      gradient: 'from-purple-500 via-pink-500 to-rose-500'
    },
    {
      title: '学员管理',
      description: '查看学员信息、学习进度和成长轨迹',
      href: '/admin/students',
      icon: Users,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500'
    }
  ]

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
      <main className="max-w-7xl mx-auto px-6 py-8 h-[calc(100vh-120px)] flex items-center justify-center relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
          {portalCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.title}
                onClick={() => router.push(card.href)}
                className="group relative bg-white/5 backdrop-blur-md rounded-3xl p-16 border border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:bg-white/10 min-h-[400px] flex flex-col items-center justify-center"
              >
                {/* Gradient Background Effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-16 h-16 text-white" />
                </div>

                {/* Title */}
                <h2 className="relative text-4xl font-bold text-white mb-4 group-hover:scale-105 transition-transform duration-300">
                  {card.title}
                </h2>

                {/* Description */}
                <p className="relative text-lg text-gray-300 text-center group-hover:text-white transition-colors duration-300">
                  {card.description}
                </p>

                {/* Arrow Indicator */}
                <div className="relative mt-8 flex items-center text-purple-300 group-hover:text-white transition-colors duration-300">
                  <span className="text-sm mr-2">进入</span>
                  <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
