'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, Layers, BookOpen, MessageSquare,
  FileText, TrendingUp, Award, BarChart3, Clock, Calendar
} from 'lucide-react'

interface Overview {
  total_students: number
  total_groups: number
  total_assignments: number
  total_conversations: number
  total_submissions: number
  avg_level: number
  avg_score: number
}

interface LevelChange {
  id: string
  user_id: string
  old_level: number
  new_level: number
  recorded_at: string
  profiles: {
    full_name: string
    email: string
  }
}

interface CourseStats {
  id: string
  title: string
  system_key: string
  assigned_students: number
  assigned_groups: number
}

const LEVEL_COLORS = {
  1: 'bg-gray-500',
  2: 'bg-green-500',
  3: 'bg-blue-500',
  4: 'bg-purple-500',
  5: 'bg-yellow-500',
  6: 'bg-orange-500',
  7: 'bg-red-500'
}

const LEVEL_NAMES = {
  1: '沉睡者',
  2: '觉醒者',
  3: '探索者',
  4: '实践者',
  5: '洞察者',
  6: '先锋者',
  7: '引领者'
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  const [overview, setOverview] = useState<Overview | null>(null)
  const [levelDistribution, setLevelDistribution] = useState<Record<number, number>>({})
  const [registrationTrend, setRegistrationTrend] = useState<any[]>([])
  const [activityTrend, setActivityTrend] = useState<any[]>([])
  const [recentLevelChanges, setRecentLevelChanges] = useState<LevelChange[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (userEmail) {
      fetchDashboardData()
    }
  }, [userEmail])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!admin) {
        router.push('/admin')
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (data.error) {
        console.error('获取统计数据失败:', data.error)
        return
      }

      setOverview(data.overview)
      setLevelDistribution(data.level_distribution)
      setRegistrationTrend(data.registration_trend)
      setActivityTrend(data.activity_trend)
      setRecentLevelChanges(data.recent_level_changes)
      setCourseStats(data.course_stats)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  const maxLevelCount = Math.max(...Object.values(levelDistribution))

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
                <h1 className="text-2xl font-bold text-white">统计看板</h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <span className="text-gray-400 text-sm">总学员数</span>
            </div>
            <p className="text-3xl font-bold text-white">{overview.total_students}</p>
            <div className="mt-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">
                平均等级: <span className="text-purple-400 font-semibold">{overview.avg_level}</span>
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-8 h-8 text-purple-400" />
              <span className="text-gray-400 text-sm">分组数量</span>
            </div>
            <p className="text-3xl font-bold text-white">{overview.total_groups}</p>
            <div className="mt-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">
                课程分配: <span className="text-green-400 font-semibold">{overview.total_assignments}</span>
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-8 h-8 text-yellow-400" />
              <span className="text-gray-400 text-sm">对话总数</span>
            </div>
            <p className="text-3xl font-bold text-white">{overview.total_conversations}</p>
            <div className="mt-2 text-sm text-gray-400">
              Gaia AI 对话记录
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-green-400" />
              <span className="text-gray-400 text-sm">作业总数</span>
            </div>
            <p className="text-3xl font-bold text-white">{overview.total_submissions}</p>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-400">
                平均分: <span className="text-cyan-400 font-semibold">{overview.avg_score}</span>
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Level Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              意识等级分布
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map(level => {
                const count = levelDistribution[level] || 0
                const percentage = maxLevelCount > 0 ? (count / maxLevelCount) * 100 : 0
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        Level {level} - {LEVEL_NAMES[level as keyof typeof LEVEL_NAMES]}
                      </span>
                      <span className="text-white font-semibold">{count} 人</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: level * 0.1 }}
                        className={`h-full ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Recent Level Changes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              最近等级变化
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentLevelChanges.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无等级变化记录</p>
              ) : (
                recentLevelChanges.map((change, index) => (
                  <motion.div
                    key={change.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">
                        {change.profiles.full_name || change.profiles.email}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${LEVEL_COLORS[change.old_level as keyof typeof LEVEL_COLORS]}`}>
                          L{change.old_level}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${LEVEL_COLORS[change.new_level as keyof typeof LEVEL_COLORS]}`}>
                          L{change.new_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(change.recorded_at).toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Activity Trend */}
        {activityTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              最近7天活跃度
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {activityTrend.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white/5 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </p>
                    <p className="text-lg font-bold text-cyan-400">{day.avg_online_minutes}</p>
                    <p className="text-xs text-gray-400">分钟</p>
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-sm font-semibold text-purple-400">{day.total_lessons}</p>
                      <p className="text-xs text-gray-400">课程</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Course Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            课程统计
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courseStats.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-4"
              >
                <h3 className="text-white font-semibold mb-1">{course.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{course.system_key}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">个人分配</span>
                    <span className="text-cyan-400 font-semibold">{course.assigned_students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">分组分配</span>
                    <span className="text-purple-400 font-semibold">{course.assigned_groups}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
