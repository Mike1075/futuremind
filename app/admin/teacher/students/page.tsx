'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, ArrowLeft, UserPlus, UserMinus, CheckCircle } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  consciousness_level: number
  composite_score: number
  created_at: string
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

export default function TeacherStudentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [managedStudents, setManagedStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

      // 检查是否是老师
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'teacher') {
        alert('⚠️ 此功能仅限老师使用')
        router.push('/admin')
        return
      }

      await fetchStudents()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students')
      const data = await response.json()

      if (data.error) {
        console.error('获取学员失败:', data.error)
        return
      }

      setManagedStudents(data.managed_students || [])
      setAvailableStudents(data.available_students || [])
    } catch (error) {
      console.error('获取学员失败:', error)
    }
  }

  const toggleSelect = (studentId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedIds(newSelected)
  }

  const addStudents = async () => {
    if (selectedIds.size === 0) return

    setProcessing(true)
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: Array.from(selectedIds) })
      })

      const data = await response.json()

      if (data.error) {
        alert(`添加失败: ${data.error}`)
        return
      }

      alert(`✅ 成功添加 ${data.added_count} 位学员`)
      setSelectedIds(new Set())
      await fetchStudents()
    } catch (error) {
      console.error('添加学员失败:', error)
      alert('添加失败，请稍后重试')
    } finally {
      setProcessing(false)
    }
  }

  const removeStudent = async (studentId: string) => {
    if (!confirm('确定要移除该学员吗？')) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        alert(`移除失败: ${data.error}`)
        return
      }

      alert('✅ 移除成功')
      await fetchStudents()
    } catch (error) {
      console.error('移除学员失败:', error)
      alert('移除失败，请稍后重试')
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
                <h1 className="text-2xl font-bold text-white">我的学员管理</h1>
                <p className="text-sm text-purple-300 mt-1">管理选了您课程的学员</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 已管理的学员 */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-green-400" />
                已管理学员 ({managedStudents.length})
              </h2>
            </div>

            {managedStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">还没有管理任何学员</p>
                <p className="text-sm text-gray-500 mt-2">从右侧列表添加学员</p>
              </div>
            ) : (
              <div className="space-y-3">
                {managedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-green-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                          {student.full_name?.[0] || student.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{student.full_name || '未命名'}</h3>
                          <p className="text-sm text-gray-400 truncate">{student.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-white text-xs ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                              Lv.{student.consciousness_level}
                            </span>
                            <span className="text-xs text-gray-400">
                              评分: {student.composite_score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStudent(student.id)}
                        disabled={processing}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all disabled:opacity-50"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 可添加的学员 */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-purple-400" />
                可添加学员 ({availableStudents.length})
              </h2>
              {selectedIds.size > 0 && (
                <button
                  onClick={addStudents}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  添加选中 ({selectedIds.size})
                </button>
              )}
            </div>

            {availableStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">暂无可添加的学员</p>
                <p className="text-sm text-gray-500 mt-2">学员需要先选您的课程</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white/5 rounded-lg p-4 border transition-all cursor-pointer ${
                      selectedIds.has(student.id)
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-white/10 hover:border-purple-400/50'
                    }`}
                    onClick={() => toggleSelect(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedIds.has(student.id)
                          ? 'border-purple-400 bg-purple-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedIds.has(student.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {student.full_name?.[0] || student.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{student.full_name || '未命名'}</h3>
                        <p className="text-sm text-gray-400 truncate">{student.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-white text-xs ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                            Lv.{student.consciousness_level}
                          </span>
                          <span className="text-xs text-gray-400">
                            评分: {student.composite_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
