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
  Sparkles
} from 'lucide-react'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

interface Course {
  id: string
  title: string
  description: string | null
  system_key: string
  is_active: boolean
}

interface EnrolledCourse {
  course_id: string
  course_title: string
  course_system_key: string
  assigned_at: string
  progress?: number
}

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [consciousnessGrowth, setConsciousnessGrowth] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user as User)

        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }

        // Load user progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('consciousness_growth')
          .eq('user_id', user.id)
          .single()

        if (progress) {
          setConsciousnessGrowth(progress.consciousness_growth || 0)
        }

        // Load enrolled courses
        await loadEnrolledCourses(user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const loadEnrolledCourses = async (userId: string) => {
    try {
      const { data: enrolledData, error } = await supabase
        .from('student_course_assignments')
        .select(`
          assigned_at,
          course_systems (id, title, system_key, is_active)
        `)
        .eq('student_id', userId)
        .eq('status', 'active')

      if (error) throw error

      // 过滤掉已删除的课程（course_systems为null）以及已停用的课程（is_active为false）
      const validEnrollments = (enrolledData || []).filter((item: any) =>
        item.course_systems !== null && item.course_systems.is_active === true
      )

      // 计算每个课程的真实进度
      const enrolled: EnrolledCourse[] = await Promise.all(
        validEnrollments.map(async (item: any) => {
          // 获取该课程体系下的所有已发布内容ID
          const { data: contents } = await supabase
            .from('course_contents')
            .select('id')
            .eq('system_id', item.course_systems.id)
            .eq('is_published', true)

          const totalContents = contents?.length || 0

          if (totalContents === 0 || !contents) {
            return {
              course_id: item.course_systems.id,
              course_title: item.course_systems.title,
              course_system_key: item.course_systems.system_key,
              assigned_at: item.assigned_at,
              progress: 0
            }
          }

          // 获取用户对这些内容的进度记录
          const contentIds = contents.map((c: any) => c.id)
          const { data: progressRecords } = await supabase
            .from('user_progress')
            .select('ref_item_id, progress_value')
            .eq('user_id', userId)
            .in('ref_item_id', contentIds)
            .eq('progress_type', 'reading')

          // 统计完成数量（progress_value === 100）
          let completedCount = 0
          progressRecords?.forEach((record: any) => {
            if (record.progress_value === 100) {
              completedCount++
            }
          })

          // 计算进度百分比
          const progress = Math.round((completedCount / totalContents) * 100)

          return {
            course_id: item.course_systems.id,
            course_title: item.course_systems.title,
            course_system_key: item.course_systems.system_key,
            assigned_at: item.assigned_at,
            progress
          }
        })
      )

      setEnrolledCourses(enrolled)
    } catch (error) {
      console.error('[Portal] 加载课程失败:', error)
    }
  }

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
        return Rocket
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
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

      {/* 顶部导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回主页 */}
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">返回主页</span>
            </button>

            {/* 中间：标题 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                <TreePine className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">个人探索基地</h2>
            </div>

            {/* 右侧：快捷入口与登出 */}
            <div className="flex items-center space-x-4">
              {/* 管理后台入口 - 仅管理员可见 */}
              {userRole && ['principal', 'teacher'].includes(userRole) && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-blue-300 hover:text-blue-200 transition-colors duration-300 group"
                >
                  <span className="font-medium">管理后台</span>
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/40 transition-colors duration-300">
                    <Settings className="w-5 h-5 text-blue-400" />
                  </div>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-300 hover:text-red-200 transition-colors duration-300 group"
              >
                <span className="font-medium">登出</span>
                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center group-hover:bg-red-600/40 transition-colors duration-300">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
              </button>
            </div>
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

              {enrolledCourses.length > 0 ? (
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
                        className={`bg-gradient-to-br ${gradient} rounded-xl p-6 border hover:scale-[1.02] transition-transform cursor-pointer`}
                        onClick={() => router.push(`/courses/${course.course_system_key}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">{course.course_title}</h4>
                              <p className="text-sm text-gray-300">
                                开始时间: {new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/60" />
                        </div>

                        {/* 进度条 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300">学习进度</span>
                            <span className="text-sm text-white font-medium">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            ></div>
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

              {/* 探索所有课程按钮 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => router.push('/portal/courses')}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
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
              className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">个性化推荐</h3>
              </div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-300 mb-2">AI 个性化推荐</p>
                <p className="text-sm text-gray-400">基于您的学习轨迹，为您推荐最适合的探索路径</p>
                <div className="mt-4 px-4 py-2 bg-purple-500/20 rounded-lg inline-block">
                  <span className="text-sm text-purple-300">即将上线...</span>
                </div>
              </div>
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
                <TreePine className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">意识进化树</h3>
              </div>
              <div className="relative h-80 w-full bg-gradient-to-b from-white/5 to-white/10 rounded-lg mb-4">
                <Image
                  src="/images/consciousness-tree-preview.png"
                  alt="意识进化树预览"
                  fill
                  className="object-contain opacity-80"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* 成长数据 */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">意识成长值</span>
                  <span className="text-lg font-bold text-green-400">{consciousnessGrowth}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((consciousnessGrowth / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => router.push('/simple-tree')}
                className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 hover:from-green-600/30 hover:to-blue-600/30 rounded-lg border border-green-500/30 transition-all duration-300 group"
              >
                <TreePine className="w-5 h-5 text-green-400 mr-2 group-hover:text-green-300 transition-colors" />
                <span className="text-green-300 group-hover:text-green-200 transition-colors font-medium">
                  查看完整意识树
                </span>
                <ChevronRight className="w-4 h-4 ml-2 text-green-400 group-hover:text-green-300 transition-colors" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
