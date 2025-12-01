// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, User, TrendingUp, BookOpen, History, AlertCircle, UsersRound } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface StudentDetail {
  student: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    consciousness_level: number
    composite_score: number
    percentile_rank: number | null
    level_updated_at: string | null
    created_at: string
  }
  summary: {
    personality_traits: any
    learning_style: string
    strengths: string[]
    areas_for_growth: string[]
    overall_summary: string
    course_summaries: any
  } | null
  level_history: any[]
  behavior_stats: any[]
  progress: {
    total_items: number
    by_course: any
  }
  submissions: {
    total: number
    avg_score: number
  }
  conversations: {
    total: number
    avg_depth: number
  }
  enrolled_courses?: Array<{
    course_id: string
    course_title: string
    assigned_at: string
    ai_evaluation: string
  }>
  groups?: Array<{
    id: string
    name: string
    group_type: 'global' | 'course'
    course_title?: string
  }>
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

export default function StudentDetailPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const params = useParams()
  const studentId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StudentDetail | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'groups' | 'stats' | 'progress' | 'history'>('overview')

  useEffect(() => {
    checkAuthAndFetchData()
  }, [studentId])

  const checkAuthAndFetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 检查是否是管理员（校长或老师）
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.role || !['principal', 'teacher'].includes(profile.role)) {
        toast.warning('只有校长和老师可以访问学员详情。')
        router.push('/admin')
        return
      }

      // 获取学员详情
      const response = await fetch(`/api/admin/students/${studentId}`)
      const studentData = await response.json()

      if (studentData.error) {
        console.error('获取学员详情失败:', studentData.error)
        return
      }

      setData(studentData)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-red-300">学员信息加载失败</p>
        </div>
      </div>
    )
  }

  const { student, summary, level_history, behavior_stats, progress, submissions, conversations } = data

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/students')}
                className="p-2 btn-stardust text-white rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{student.full_name || '未命名'}</h1>
                <p className="text-sm text-purple-300 mt-1">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-white font-semibold ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                Level {student.consciousness_level} - {LEVEL_NAMES[student.consciousness_level as keyof typeof LEVEL_NAMES]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-md rounded-xl p-6 border border-purple-400/30"
          >
            <div className="text-sm text-gray-300 mb-2">综合评分</div>
            <div className="text-3xl font-bold text-white">{student.composite_score.toFixed(2)}</div>
            {student.percentile_rank !== null && (
              <div className="text-sm text-purple-300 mt-1">
                前 {((1 - student.percentile_rank) * 100).toFixed(1)}%
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30"
          >
            <div className="text-sm text-gray-300 mb-2">对话次数</div>
            <div className="text-3xl font-bold text-white">{conversations.total}</div>
            <div className="text-sm text-cyan-300 mt-1">平均深度 {conversations.avg_depth} 轮</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-green-700/20 backdrop-blur-md rounded-xl p-6 border border-green-400/30"
          >
            <div className="text-sm text-gray-300 mb-2">作业提交</div>
            <div className="text-3xl font-bold text-white">{submissions.total}</div>
            <div className="text-sm text-green-300 mt-1">平均分 {submissions.avg_score}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 backdrop-blur-md rounded-xl p-6 border border-orange-400/30"
          >
            <div className="text-sm text-gray-300 mb-2">学习进度</div>
            <div className="text-3xl font-bold text-white">{progress.total_items}</div>
            <div className="text-sm text-orange-300 mt-1">个课程单元</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 mb-8">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-5 h-5 inline mr-2" />
              概览
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              选修课程
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'groups'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UsersRound className="w-5 h-5 inline mr-2" />
              所属分组
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              统计数据
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'progress'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              课程进度
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'history'
                  ? 'text-white bg-purple-500/20 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-5 h-5 inline mr-2" />
              成长历程
            </button>
          </div>

          <div className="p-8">
            {/* Tab 1: 概览 - AI评价 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {summary ? (
                  <>
                    {/* 总体评价 */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">AI综合评价</h3>
                      <p className="text-gray-300 leading-relaxed">{summary.overall_summary}</p>
                    </div>

                    {/* 学习风格 */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">学习风格</h4>
                      <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg">
                        <span className="text-cyan-300 font-semibold">{summary.learning_style}</span>
                      </div>
                    </div>

                    {/* 优势 */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">优势</h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.strengths?.map((strength: string, index: number) => (
                          <div
                            key={index}
                            className="px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300"
                          >
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 成长空间 */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">成长空间</h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.areas_for_growth?.map((area: string, index: number) => (
                          <div
                            key={index}
                            className="px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-lg text-orange-300"
                          >
                            {area}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">暂无AI评价数据</p>
                    <p className="text-sm text-gray-500 mt-2">AI评价将在每周日自动生成</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 选修课程 */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">选修课程</h3>

                {data.enrolled_courses && data.enrolled_courses.length > 0 ? (
                  <div className="space-y-4">
                    {data.enrolled_courses.map((course) => (
                      <div
                        key={course.course_id}
                        className="bg-white/5 rounded-lg p-6 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-1">{course.course_title}</h4>
                            <p className="text-xs text-gray-400">
                              选课时间: {new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>

                        {/* AI Evaluation */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                              AI 评价
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed italic">
                            {course.ai_evaluation}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            * 此为占位文本，实际AI评价将从 student_summaries 表的 course_summaries 字段读取
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">该学员暂未选修任何课程</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: 所属分组 */}
            {activeTab === 'groups' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">所属分组</h3>

                {data.groups && data.groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.groups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold">{group.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            group.group_type === 'global'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {group.group_type === 'global' ? '全局' : '课程'}
                          </span>
                        </div>
                        {group.course_title && (
                          <p className="text-xs text-gray-400 mt-2">
                            关联课程: {group.course_title}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UsersRound className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">该学员暂未加入任何分组</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: 统计数据 */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">行为统计</h3>

                {behavior_stats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 最近30天活跃度 */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4">活跃天数</h4>
                      <div className="text-4xl font-bold text-cyan-400 mb-2">
                        {behavior_stats.length}
                      </div>
                      <p className="text-sm text-gray-400">最近30天有学习记录的天数</p>
                    </div>

                    {/* 总在线时长 */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4">在线时长</h4>
                      <div className="text-4xl font-bold text-purple-400 mb-2">
                        {Math.round(
                          behavior_stats.reduce((sum, stat) => sum + (stat.total_online_minutes || 0), 0) / 60
                        )}
                      </div>
                      <p className="text-sm text-gray-400">小时（最近30天）</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">暂无统计数据</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: 课程进度 */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">课程进度</h3>

                {Object.keys(progress.by_course || {}).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(progress.by_course).map(([courseKey, courseData]: [string, any]) => (
                      <div key={courseKey} className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-white">{courseData.title}</h4>
                          <span className="text-2xl font-bold text-cyan-400">{courseData.percentage}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all"
                            style={{ width: `${courseData.percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          已完成 {courseData.completed} / {courseData.total} 个单元
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">暂无课程进度数据</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: 成长历程 */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">等级历史</h3>

                {level_history.length > 0 ? (
                  <div className="space-y-3">
                    {level_history.map((record, index) => (
                      <div
                        key={record.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-white font-semibold ${LEVEL_COLORS[record.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                            Level {record.consciousness_level}
                          </span>
                          <div>
                            <p className="text-white font-semibold">
                              {LEVEL_NAMES[record.consciousness_level as keyof typeof LEVEL_NAMES]}
                            </p>
                            <p className="text-sm text-gray-400">
                              评分: {record.composite_score.toFixed(2)} | 百分位: {(record.percentile_rank * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">
                            {new Date(record.recorded_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">暂无历史记录</p>
                    <p className="text-sm text-gray-500 mt-2">等级计算后会自动记录</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
