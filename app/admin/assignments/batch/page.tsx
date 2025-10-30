'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, BookOpen, CheckCircle, Zap } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  consciousness_level: number
}

interface Course {
  id: string
  title: string
  system_key: string
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

export default function BatchAssignmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 检查是否是管理员
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.role || !['principal', 'teacher'].includes(profile.role)) {
        alert('⚠️ 您不是管理员')
        router.push('/admin')
        return
      }

      await fetchData(supabase, profile.role)
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async (supabase: any, role: string) => {
    try {
      // 获取课程列表
      const { data: coursesData } = await supabase
        .from('course_systems')
        .select('id, title, system_key')
        .eq('is_active', true)
        .order('display_order')

      setCourses(coursesData || [])

      // 获取学员列表（根据角色过滤）
      let studentsQuery = supabase
        .from('profiles')
        .select('id, full_name, email, consciousness_level')
        .eq('role', 'student')
        .order('full_name')

      if (role === 'teacher') {
        // 老师只能看到自己管理的学员
        const { data: { user } } = await supabase.auth.getUser()
        const { data: assignment } = await supabase
          .from('teacher_assignments')
          .select('managed_student_ids')
          .eq('teacher_id', user.id)
          .single()

        const managedIds = assignment?.managed_student_ids || []
        if (managedIds.length > 0) {
          studentsQuery = studentsQuery.in('id', managedIds)
        } else {
          setStudents([])
          return
        }
      }

      const { data: studentsData } = await studentsQuery
      setStudents(studentsData || [])

    } catch (error) {
      console.error('获取数据失败:', error)
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudents)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setSelectedStudents(newSet)
  }

  const toggleCourse = (courseId: string) => {
    const newSet = new Set(selectedCourses)
    if (newSet.has(courseId)) {
      newSet.delete(courseId)
    } else {
      newSet.add(courseId)
    }
    setSelectedCourses(newSet)
  }

  const selectAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  const selectAllCourses = () => {
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set())
    } else {
      setSelectedCourses(new Set(courses.map(c => c.id)))
    }
  }

  const handleBatchAssign = async () => {
    if (selectedStudents.size === 0) {
      alert('请至少选择一个学员')
      return
    }

    if (selectedCourses.size === 0) {
      alert('请至少选择一门课程')
      return
    }

    const confirmMessage = `确定要为 ${selectedStudents.size} 位学员分配 ${selectedCourses.size} 门课程吗？\n\n总共将创建 ${selectedStudents.size * selectedCourses.size} 条分配记录。`

    if (!confirm(confirmMessage)) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/assignments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: Array.from(selectedStudents),
          course_system_ids: Array.from(selectedCourses)
        })
      })

      const data = await response.json()

      if (data.error) {
        alert(`分配失败: ${data.error}`)
        return
      }

      alert(`✅ 批量分配成功！\n\n创建了 ${data.created_count} 条新分配\n跳过了 ${data.skipped_count} 条已存在的分配`)

      // 清空选择
      setSelectedStudents(new Set())
      setSelectedCourses(new Set())

    } catch (error) {
      console.error('批量分配失败:', error)
      alert('分配失败，请稍后重试')
    } finally {
      setProcessing(false)
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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
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
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-7 h-7 text-yellow-400" />
                  批量课程分配
                </h1>
                <p className="text-sm text-purple-300 mt-1">同时为多个学员分配多门课程</p>
              </div>
            </div>
            {(selectedStudents.size > 0 && selectedCourses.size > 0) && (
              <button
                onClick={handleBatchAssign}
                disabled={processing}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                批量分配 ({selectedStudents.size} × {selectedCourses.size} = {selectedStudents.size * selectedCourses.size})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 选择学员 */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                选择学员 ({selectedStudents.size}/{students.length})
              </h2>
              <button
                onClick={selectAllStudents}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all"
              >
                {selectedStudents.size === students.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedStudents.has(student.id)
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-white/10 hover:border-blue-400/50 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedStudents.has(student.id)
                        ? 'border-blue-400 bg-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedStudents.has(student.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{student.full_name || '未命名'}</h3>
                      <p className="text-sm text-gray-400">{student.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                      Lv.{student.consciousness_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 选择课程 */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                选择课程 ({selectedCourses.size}/{courses.length})
              </h2>
              <button
                onClick={selectAllCourses}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-all"
              >
                {selectedCourses.size === courses.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCourses.has(course.id)
                      ? 'border-purple-400 bg-purple-500/10'
                      : 'border-white/10 hover:border-purple-400/50 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedCourses.has(course.id)
                        ? 'border-purple-400 bg-purple-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedCourses.has(course.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-400">{course.system_key}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 预览 */}
        {(selectedStudents.size > 0 || selectedCourses.size > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/30"
          >
            <h3 className="text-lg font-bold text-white mb-4">分配预览</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">选中学员</p>
                <p className="text-3xl font-bold text-blue-400">{selectedStudents.size}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">选中课程</p>
                <p className="text-3xl font-bold text-purple-400">{selectedCourses.size}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">将创建分配</p>
                <p className="text-3xl font-bold text-pink-400">{selectedStudents.size * selectedCourses.size}</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
