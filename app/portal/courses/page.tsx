// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle, Plus, Loader2, Ear, Globe, Rocket, Sunrise } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

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
  const toast = useToast()

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

      const enrolled: EnrolledCourse[] = enrolledData
        ?.filter(item => item.course_systems) // Filter out null course_systems
        ?.map((item: any) => ({
          course_id: item.course_systems?.id,
          course_title: item.course_systems?.title,
          assigned_at: item.assigned_at
        }))
        .filter((item): item is EnrolledCourse =>
          item.course_id !== undefined && item.course_title !== undefined
        ) || []

      setEnrolledCourses(enrolled)
    } catch {
      // 静默处理加载失败
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!userId) return

    // Check if already enrolled
    if (enrolledCourses.some(c => c.course_id === courseId)) {
      toast.info('您已经选修了这门课程')
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

      toast.success('选课成功！')
      await loadData()
    } catch {
      toast.error('选课失败，请重试')
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
      case 'dawn_awakening':
        return Sunrise
      default:
        return BookOpen
    }
  }

  // 获取课程边框颜色（用于炫彩效果）
  const getCourseBorderColor = (systemKey: string) => {
    switch (systemKey) {
      case 'listening':
        return 'rgba(168, 85, 247, 0.25)' // 紫色
      case 'earth':
        return 'rgba(34, 211, 238, 0.25)' // 青色
      case 'icarus':
      case 'pbl':
        return 'rgba(251, 146, 60, 0.25)' // 橙色
      case 'dawn_awakening':
        return 'rgba(251, 191, 36, 0.25)' // 金色（破晓）
      default:
        return 'rgba(156, 163, 175, 0.25)' // 灰色
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-ethereal"></div>
      </div>
    )
  }

  const enrolledCourseIds = enrolledCourses.map(c => c.course_id)
  const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id))

  // Filter out deleted courses (courses that no longer exist in allCourses)
  const validEnrolledCourses = enrolledCourses.filter(course =>
    allCourses.some(c => c.id === course.course_id)
  )

  const handleCourseClick = (systemKey: string) => {
    router.push(`/courses/${systemKey}`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="nav-ethereal sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/portal')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-starlight" />
            </button>
            <div>
              <h1 className="text-h2 text-starlight">我的课程</h1>
              <p className="text-small text-starlight-muted">管理您的课程选择</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enrolled Courses */}
        <section className="mb-12">
          <h2 className="text-h3 text-starlight mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 text-wisdom-green mr-2" />
            已选课程 ({validEnrolledCourses.length})
          </h2>

          {validEnrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {validEnrolledCourses.map((course, index) => {
                const fullCourse = allCourses.find(c => c.id === course.course_id)
                if (!fullCourse) return null

                const Icon = getCourseIcon(fullCourse.system_key)
                const borderColor = getCourseBorderColor(fullCourse.system_key)

                return (
                  <motion.div
                    key={course.course_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCourseClick(fullCourse.system_key)}
                    className="portal-card-wrapper cursor-pointer"
                    style={{ '--course-border-color': borderColor } as React.CSSProperties}
                  >
                    <div className="portal-card-inner relative p-6">
                      <div className="absolute top-4 right-4">
                        <CheckCircle className="w-6 h-6 text-wisdom-green" />
                      </div>

                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                        <Icon className="w-6 h-6 text-starlight" />
                      </div>
                      <h3 className="text-h3 text-starlight mb-2">{course.course_title}</h3>
                      {fullCourse.description && (
                        <p className="text-small text-starlight-dim mb-4">{fullCourse.description}</p>
                      )}
                      <p className="text-xs text-starlight-muted">
                        选课时间：{new Date(course.assigned_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 card-glass">
              <BookOpen className="w-16 h-16 text-starlight-muted mx-auto mb-4" />
              <p className="text-body text-starlight-muted">您还没有选修任何课程</p>
              <p className="text-small text-starlight-dim mt-2">从下方可选课程中开始您的学习之旅</p>
            </div>
          )}
        </section>

        {/* Available Courses */}
        <section>
          <h2 className="text-h3 text-starlight mb-6 flex items-center">
            <Plus className="w-6 h-6 text-mystic-purple mr-2" />
            可选课程 ({availableCourses.length})
          </h2>

          {availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course, index) => {
                const Icon = getCourseIcon(course.system_key)
                const borderColor = getCourseBorderColor(course.system_key)

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="portal-card-wrapper group"
                    style={{ '--course-border-color': borderColor } as React.CSSProperties}
                  >
                    <div className="portal-card-inner p-6">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-starlight" />
                      </div>
                      <h3 className="text-h3 text-starlight mb-2">{course.title}</h3>
                      {course.description && (
                        <p className="text-small text-starlight-dim mb-6">{course.description}</p>
                      )}

                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling}
                        className="btn-stardust w-full py-3 flex items-center justify-center gap-2"
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
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 card-glass">
              <CheckCircle className="w-16 h-16 text-wisdom-green mx-auto mb-4" />
              <p className="text-body text-wisdom-green">太棒了！您已经选修了所有可用的课程</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
