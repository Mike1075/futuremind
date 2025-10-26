'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft, Ear, Globe, Rocket, Plus } from 'lucide-react'

export default function CoursesPage() {
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

  const courseSystems = [
    {
      title: '自在聆听·观音之旅',
      description: '14天的聆听练习，开启觉知之门',
      href: '/admin/courses/listening',
      icon: Ear,
      gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      iconColor: 'text-purple-400'
    },
    {
      title: '欢迎来到地球',
      description: '感官探索与科学认知的奇妙旅程',
      href: '/admin/courses/earth',
      icon: Globe,
      gradient: 'from-cyan-500 via-teal-500 to-green-500',
      iconColor: 'text-cyan-400'
    },
    {
      title: '伊卡洛斯计划',
      description: 'PBL项目式学习，探索无形的纽带',
      href: '/admin/courses/pbl',
      icon: Rocket,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      iconColor: 'text-orange-400'
    }
  ]

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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">课程管理</h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* 课程体系网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {courseSystems.map((course) => {
            const Icon = course.icon
            return (
              <button
                key={course.title}
                onClick={() => router.push(course.href)}
                className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:bg-white/10 min-h-[280px] flex flex-col items-center justify-center text-center"
              >
                {/* Gradient Background Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${course.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${course.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h2 className="relative text-2xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                  {course.title}
                </h2>

                {/* Description */}
                <p className="relative text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                  {course.description}
                </p>

                {/* Arrow Indicator */}
                <div className="relative mt-6 flex items-center text-purple-300 group-hover:text-white transition-colors duration-300">
                  <span className="text-xs mr-1">进入管理</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            )
          })}

          {/* 新增课程体系卡片 */}
          <button
            onClick={() => alert('新增课程体系功能开发中...')}
            className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border-2 border-dashed border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/10 min-h-[280px] flex flex-col items-center justify-center text-center"
          >
            {/* Icon */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="relative text-2xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">
              新增课程体系
            </h2>

            {/* Description */}
            <p className="relative text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              点击创建新的课程体系
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
