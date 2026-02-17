// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft, Ear, Globe, Rocket, Plus, Trash2, Brain, Sunrise, Heart, Flame, Lightbulb, Zap } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface CourseSystem {
  id: string
  title: string
  description: string | null
  system_key: string
}

export default function CoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)
  const [courseSystems, setCourseSystems] = useState<CourseSystem[]>([])
  const toast = useToast()
  const { confirm } = useConfirm()

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
      await loadCourses()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('course_systems')
        .select('id, title, description, system_key')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setCourseSystems(data || [])
    } catch (error) {
      console.error('加载课程列表失败:', error)
    }
  }

  const deleteCourse = async (courseId: string, courseTitle: string, systemKey: string) => {
    // 检查是否是原始课程
    const protectedCourses = ['listening', 'earth', 'pbl', 'icarus', 'dawn_awakening', 'dependency_freedom', 'desire_flame', 'wisdom_awakening', 'energy_alchemy']
    if (protectedCourses.includes(systemKey)) {
      toast.warning('原始课程不可删除\n\n「' + courseTitle + '」是系统预设课程，不能删除。\n只有新增的课程可以删除。')
      return
    }

    // 第一次确认
    const confirmed = await confirm({
      title: '警告',
      message: `确定要**永久删除**课程「${courseTitle}」吗？\n\n` +
        `这将：\n` +
        `1. 永久删除课程系统记录\n` +
        `2. 永久删除该课程下的所有内容（视频、问题、项目等）\n` +
        `3. 删除所有学生的学习记录和进度\n` +
        `4. 已选择该课程的学生将无法再看到此课程\n\n` +
        `此操作**不可恢复**！`,
      type: 'warning'
    })
    if (!confirmed) return

    // 第二次确认
    const finalConfirm = await confirm({
      title: '最后确认',
      message: `请再次确认删除「${courseTitle}」\n\n` +
        `这是最后一次确认机会。\n` +
        `点击"确定"将立即永久删除该课程。`,
      type: 'warning'
    })
    if (!finalConfirm) return

    try {
      // 调用删除API
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        // 显示详细错误信息
        if (data.message) {
          toast.error(`${data.error}\n\n${data.message}`)
        } else {
          toast.error(`删除失败：${data.error}\n\n${data.details || ''}`)
        }
        return
      }

      toast.success(`删除成功\n\n${data.message}\n\n删除统计：\n- 阶段：${data.deletedCounts.stages}个\n- 内容：${data.deletedCounts.contents}个`)
      await loadCourses() // 重新加载列表
    } catch (error) {
      console.error('删除课程失败:', error)
      toast.error('删除失败，请检查网络连接后重试')
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

  // Icon mapping
  const getIconAndGradient = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return {
          icon: Ear,
          gradient: 'from-purple-500 via-indigo-500 to-blue-500'
        }
      case 'earth':
        return {
          icon: Globe,
          gradient: 'from-cyan-500 via-teal-500 to-green-500'
        }
      case 'icarus':
      case 'pbl':
        return {
          icon: Rocket,
          gradient: 'from-orange-500 via-red-500 to-pink-500'
        }
      case 'dawn_awakening':
        return {
          icon: Sunrise,
          gradient: 'from-amber-500 via-orange-500 to-yellow-500'
        }
      case 'dependency_freedom':
        return {
          icon: Heart,
          gradient: 'from-rose-500 via-purple-500 to-indigo-500'
        }
      case 'desire_flame':
        return {
          icon: Flame,
          gradient: 'from-red-500 via-orange-500 to-yellow-500'
        }
      case 'wisdom_awakening':
        return {
          icon: Lightbulb,
          gradient: 'from-indigo-500 via-blue-500 to-emerald-500'
        }
      case 'energy_alchemy':
        return {
          icon: Zap,
          gradient: 'from-teal-500 via-cyan-500 to-blue-500'
        }
      default:
        return {
          icon: BookOpen,
          gradient: 'from-gray-500 via-gray-600 to-gray-700'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cosmic-void relative overflow-hidden">
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
      <header className="card-glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 card-glass hover:bg-white/20 text-starlight rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-h2 font-bold text-starlight">课程管理</h1>
                <p className="text-small text-starlight-muted mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/gaia-kb')}
                className="btn-stardust flex items-center gap-2 px-4 py-2"
              >
                <Brain className="w-5 h-5" />
                <span className="text-small font-medium">盖亚知识库</span>
              </button>
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
            const { icon: Icon, gradient } = getIconAndGradient(course.system_key)
            // 根据课程类型决定跳转路径
            const getCoursePath = () => {
              if (course.system_key === 'listening') return '/admin/courses/listening'
              if (course.system_key === 'earth') return '/admin/courses/earth'
              if (course.system_key === 'icarus' || course.system_key === 'pbl') return '/admin/courses/pbl'
              if (course.system_key === 'dawn_awakening') return '/admin/courses/dawn-awakening'
              if (course.system_key === 'dependency_freedom') return '/admin/courses/dependency-freedom'
              if (course.system_key === 'desire_flame') return '/admin/courses/desire-flame'
              if (course.system_key === 'wisdom_awakening') return '/admin/courses/wisdom-awakening'
              if (course.system_key === 'energy_alchemy') return '/admin/courses/energy-alchemy'
              return `/admin/courses/${course.id}`
            }

            // 检查是否是原始课程（不可删除）
            const protectedCourses = ['listening', 'earth', 'pbl', 'icarus', 'dawn_awakening', 'dependency_freedom', 'desire_flame', 'wisdom_awakening', 'energy_alchemy']
            const isDeletable = !protectedCourses.includes(course.system_key)

            return (
              <div key={course.id} className="group relative card-glass rounded-2xl p-8 border border-white/10 card-rainbow-border transition-all duration-300 hover:scale-105 hover:bg-white/10 min-h-[280px] flex flex-col items-center justify-center text-center">
                {/* Gradient Background Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`} />

                {/* Delete Button - 只在新增课程上显示 */}
                {isDeletable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCourse(course.id, course.title, course.system_key)
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-100 rounded-lg border border-red-500/30 transition-all z-20 opacity-0 group-hover:opacity-100"
                    title="永久删除课程"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* 原始课程标识 */}
                {!isDeletable && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30 z-20">
                    系统预设
                  </div>
                )}

                {/* Main Content - Clickable */}
                <button
                  onClick={() => router.push(getCoursePath())}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  {/* Icon */}
                  <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-10 h-10 text-starlight" />
                  </div>

                  {/* Title */}
                  <h2 className="relative text-h2 font-bold text-starlight mb-3 group-hover:scale-105 transition-transform duration-300">
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p className="relative text-small text-starlight-muted group-hover:text-starlight transition-colors duration-300">
                    {course.description}
                  </p>

                  {/* Arrow Indicator */}
                  <div className="mt-6 flex items-center text-starlight-muted group-hover:text-starlight transition-colors duration-300">
                    <span className="text-xs mr-1">进入管理</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              </div>
            )
          })}

          {/* 新增课程体系卡片 */}
          <button
            onClick={() => router.push('/admin/courses/new')}
            className="group relative card-glass rounded-2xl p-8 border-2 border-dashed border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:bg-white/10 min-h-[280px] flex flex-col items-center justify-center text-center"
          >
            {/* Icon */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-10 h-10 text-starlight" />
            </div>

            {/* Title */}
            <h2 className="relative text-h2 font-bold text-starlight mb-3 group-hover:scale-105 transition-transform duration-300">
              新增课程体系
            </h2>

            {/* Description */}
            <p className="relative text-small text-starlight-muted group-hover:text-starlight-dim transition-colors duration-300">
              点击创建新的课程体系
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
