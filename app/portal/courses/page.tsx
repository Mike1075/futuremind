'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle, Plus, Loader2, Ear, Globe, Rocket } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  system_key: string
  is_active: boolean | null
  structure_type: string
}

interface EnrolledCourse {
  course_id: string
  course_title: string
  assigned_at: string
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Load all active courses
      const { data: coursesData } = await supabase
        .from('course_systems')
        .select('id, title, description, system_key, is_active, structure_type')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setAllCourses(coursesData || [])

      // Load enrolled courses
      const { data: enrolledData } = await supabase
        .from('student_course_assignments')
        .select(`
          assigned_at,
          course_systems (id, title)
        `)
        .eq('student_id', user.id)
        .eq('status', 'active')

      const enrolled: EnrolledCourse[] = enrolledData?.map((item: any) => ({
        course_id: item.course_systems.id,
        course_title: item.course_systems.title,
        assigned_at: item.assigned_at
      })) || []

      setEnrolledCourses(enrolled)
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!userId) return

    // Check if already enrolled
    if (enrolledCourses.some(c => c.course_id === courseId)) {
      alert('您已经选修了这门课程')
      return
    }

    setEnrolling(true)
    try {
      const { error } = await supabase
        .from('student_course_assignments')
        .insert({
          student_id: userId,
          course_system_id: courseId,
          assigned_by: userId,
          status: 'active'
        })

      if (error) throw error

      alert('✅ 选课成功！')
      await loadData()
    } catch (error) {
      console.error('选课失败:', error)
      alert('❌ 选课失败，请重试')
    } finally {
      setEnrolling(false)
    }
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
        return 'from-purple-500/20 to-indigo-500/20'
      case 'earth':
        return 'from-cyan-500/20 to-teal-500/20'
      case 'icarus':
      case 'pbl':
        return 'from-orange-500/20 to-red-500/20'
      default:
        return 'from-gray-500/20 to-gray-600/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    )
  }

  const enrolledCourseIds = enrolledCourses.map(c => c.course_id)
  const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id))

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/portal')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">我的课程</h1>
              <p className="text-sm text-gray-400">管理您的课程选择</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enrolled Courses */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
            已选课程 ({enrolledCourses.length})
          </h2>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const fullCourse = allCourses.find(c => c.id === course.course_id)
                if (!fullCourse) return null

                const Icon = getCourseIcon(fullCourse.system_key)
                const gradient = getCourseGradient(fullCourse.system_key)

                return (
                  <motion.div
                    key={course.course_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative bg-gradient-to-br ${gradient} backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-green-400/50 transition-all`}
                  >
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>

                    <Icon className="w-12 h-12 text-white mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">{course.course_title}</h3>
                    {fullCourse.description && (
                      <p className="text-sm text-gray-300 mb-4">{fullCourse.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      选课时间：{new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">您还没有选修任何课程</p>
              <p className="text-sm text-gray-500 mt-2">从下方可选课程中开始您的学习之旅</p>
            </div>
          )}
        </section>

        {/* Available Courses */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Plus className="w-6 h-6 text-purple-400 mr-2" />
            可选课程 ({availableCourses.length})
          </h2>

          {availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => {
                const Icon = getCourseIcon(course.system_key)
                const gradient = getCourseGradient(course.system_key)

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative bg-gradient-to-br ${gradient} backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/50 transition-all group`}
                  >
                    <Icon className="w-12 h-12 text-white mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-300 mb-6">{course.description}</p>
                    )}

                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          选课中...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          选修此课程
                        </>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-green-400">太棒了！您已经选修了所有可用的课程</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
