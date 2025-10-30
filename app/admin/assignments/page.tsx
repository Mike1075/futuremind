'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, X, BookOpen, Users, User,
  Calendar, Trash2, UserCheck, Layers
} from 'lucide-react'

// 分组课程分配
interface GroupAssignment {
  id: string
  group_id: string
  course_system_id: string
  assigned_at: string
  notes: string | null
  student_groups: {
    id: string
    group_name: string
    group_type: string
  }
  course_systems: {
    id: string
    title: string
    system_key: string
  }
  assigned_by_admin: {
    full_name: string
    email: string
  }
  student_count: number
}

// 学员个人课程分配
interface StudentAssignment {
  id: string
  student_id: string
  course_system_id: string
  assigned_at: string
  notes: string | null
  student: {
    id: string
    full_name: string
    email: string
    consciousness_level: number
  }
  course_systems: {
    id: string
    title: string
    system_key: string
  }
  assigned_by_admin: {
    full_name: string
    email: string
  }
}

interface Group {
  id: string
  group_name: string
  group_type: string
}

interface Course {
  id: string
  title: string
  system_key: string
}

interface Student {
  id: string
  full_name: string
  email: string
  consciousness_level: number
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

export default function AssignmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  const [activeTab, setActiveTab] = useState<'group' | 'student'>('group')
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([])
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)

  // 可用的分组、课程、学员列表
  const [groups, setGroups] = useState<Group[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])

  // 创建表单
  const [newGroupAssignment, setNewGroupAssignment] = useState({
    group_id: '',
    course_system_id: '',
    notes: ''
  })
  const [newStudentAssignment, setNewStudentAssignment] = useState({
    student_id: '',
    course_system_id: '',
    notes: ''
  })

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (userEmail) {
      fetchData()
    }
  }, [userEmail, activeTab])

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

  const fetchData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'group') {
        // 获取分组分配
        const assignmentsRes = await fetch('/api/admin/assignments')
        const assignmentsData = await assignmentsRes.json()
        setGroupAssignments(assignmentsData.assignments || [])

        // 获取所有分组
        const groupsRes = await fetch('/api/admin/groups?pageSize=100')
        const groupsData = await groupsRes.json()
        setGroups(groupsData.groups || [])
      } else {
        // 获取学员个人分配
        const assignmentsRes = await fetch('/api/admin/assignments/students')
        const assignmentsData = await assignmentsRes.json()
        setStudentAssignments(assignmentsData.assignments || [])

        // 获取所有学员
        const studentsRes = await fetch('/api/admin/students?pageSize=100')
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }

      // 获取所有课程
      const supabase = createClient()
      const { data: coursesData } = await supabase
        .from('course_systems')
        .select('id, title, system_key')
        .order('title')
      setCourses(coursesData || [])

    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroupAssignment = async () => {
    if (!newGroupAssignment.group_id || !newGroupAssignment.course_system_id) {
      alert('请选择分组和课程')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroupAssignment)
      })

      const data = await response.json()

      if (data.error) {
        alert(`创建失败: ${data.error}`)
        return
      }

      setNewGroupAssignment({ group_id: '', course_system_id: '', notes: '' })
      setShowCreateDialog(false)
      fetchData()
    } catch (error) {
      console.error('创建分配失败:', error)
      alert('创建分配失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateStudentAssignment = async () => {
    if (!newStudentAssignment.student_id || !newStudentAssignment.course_system_id) {
      alert('请选择学员和课程')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/assignments/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentAssignment)
      })

      const data = await response.json()

      if (data.error) {
        alert(`创建失败: ${data.error}`)
        return
      }

      setNewStudentAssignment({ student_id: '', course_system_id: '', notes: '' })
      setShowCreateDialog(false)
      fetchData()
    } catch (error) {
      console.error('创建分配失败:', error)
      alert('创建分配失败')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteGroupAssignment = async (id: string) => {
    if (!confirm('确定要删除这个课程分配吗？')) return

    try {
      const response = await fetch(`/api/admin/assignments/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        alert(`删除失败: ${data.error}`)
        return
      }

      fetchData()
    } catch (error) {
      console.error('删除分配失败:', error)
      alert('删除分配失败')
    }
  }

  const handleDeleteStudentAssignment = async (id: string) => {
    if (!confirm('确定要删除这个课程分配吗？')) return

    try {
      const response = await fetch(`/api/admin/assignments/students/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        alert(`删除失败: ${data.error}`)
        return
      }

      fetchData()
    } catch (error) {
      console.error('删除分配失败:', error)
      alert('删除分配失败')
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

  if (loading && groupAssignments.length === 0 && studentAssignments.length === 0) {
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
                <h1 className="text-2xl font-bold text-white">课程分配</h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-semibold">
                {activeTab === 'group' ? `分组分配：${groupAssignments.length}` : `个人分配：${studentAssignments.length}`}
              </span>
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Tab Navigation and Create Button */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1 flex gap-1 flex-1">
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'group'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-5 h-5" />
              分组分配
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-5 h-5" />
              个人分配
            </button>
          </div>

          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            新建分配
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'group' ? (
            // 分组分配列表
            groupAssignments.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 border border-white/10 text-center">
                <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-300">暂无分组课程分配</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
                >
                  创建第一个分配
                </button>
              </div>
            ) : (
              groupAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {assignment.course_systems.title}
                        </h3>
                        <span className="text-sm text-gray-400">
                          ({assignment.course_systems.system_key})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-400 font-semibold">
                            {assignment.student_groups.group_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">
                            {assignment.student_count} 名学员
                          </span>
                        </div>
                      </div>

                      {assignment.notes && (
                        <p className="text-sm text-gray-400 mt-3 bg-white/5 rounded-lg p-3">
                          {assignment.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>
                            {assignment.assigned_by_admin.full_name || assignment.assigned_by_admin.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(assignment.assigned_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGroupAssignment(assignment.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )
          ) : (
            // 学员个人分配列表
            studentAssignments.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 border border-white/10 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-300">暂无学员个人课程分配</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
                >
                  创建第一个分配
                </button>
              </div>
            ) : (
              studentAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {assignment.course_systems.title}
                        </h3>
                        <span className="text-sm text-gray-400">
                          ({assignment.course_systems.system_key})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyan-400 font-semibold">
                            {assignment.student.full_name || assignment.student.email}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${LEVEL_COLORS[assignment.student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                          Level {assignment.student.consciousness_level}
                        </span>
                      </div>

                      {assignment.notes && (
                        <p className="text-sm text-gray-400 mt-3 bg-white/5 rounded-lg p-3">
                          {assignment.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>
                            {assignment.assigned_by_admin.full_name || assignment.assigned_by_admin.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(assignment.assigned_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStudentAssignment(assignment.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )
          )}
        </div>
      </main>

      {/* Create Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !creating && setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/20 rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === 'group' ? '分配课程给分组' : '分配课程给学员'}
                </h2>
                <button
                  onClick={() => !creating && setShowCreateDialog(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  disabled={creating}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {activeTab === 'group' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        选择分组 <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={newGroupAssignment.group_id}
                        onChange={(e) => setNewGroupAssignment({ ...newGroupAssignment, group_id: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled={creating}
                      >
                        <option value="">请选择分组</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.group_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        选择学员 <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={newStudentAssignment.student_id}
                        onChange={(e) => setNewStudentAssignment({ ...newStudentAssignment, student_id: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled={creating}
                      >
                        <option value="">请选择学员</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.full_name || student.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    选择课程 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={activeTab === 'group' ? newGroupAssignment.course_system_id : newStudentAssignment.course_system_id}
                    onChange={(e) => {
                      if (activeTab === 'group') {
                        setNewGroupAssignment({ ...newGroupAssignment, course_system_id: e.target.value })
                      } else {
                        setNewStudentAssignment({ ...newStudentAssignment, course_system_id: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={creating}
                  >
                    <option value="">请选择课程</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.system_key})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    备注（可选）
                  </label>
                  <textarea
                    value={activeTab === 'group' ? newGroupAssignment.notes : newStudentAssignment.notes}
                    onChange={(e) => {
                      if (activeTab === 'group') {
                        setNewGroupAssignment({ ...newGroupAssignment, notes: e.target.value })
                      } else {
                        setNewStudentAssignment({ ...newStudentAssignment, notes: e.target.value })
                      }
                    }}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  onClick={activeTab === 'group' ? handleCreateGroupAssignment : handleCreateStudentAssignment}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
