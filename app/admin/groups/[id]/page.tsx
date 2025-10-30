'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, TrendingUp, Award, BarChart3,
  Edit2, Trash2, X, BookOpen, Calendar, User
} from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  consciousness_level: number
  composite_score: number
  created_at: string
}

interface Assignment {
  id: string
  course_system_id: string
  assigned_at: string
  notes: string | null
  course_systems: {
    title: string
    system_key: string
  }
  assigned_by_admin: {
    full_name: string
    email: string
  }
}

interface GroupDetail {
  id: string
  group_name: string
  description: string | null
  group_type: string
  created_at: string
  created_by_admin: {
    full_name: string
    email: string
  }
}

interface Stats {
  total_students: number
  total_assignments: number
  avg_level: number
  avg_score: number
  level_distribution: Record<number, number>
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

const GROUP_TYPE_NAMES = {
  'auto_level': '系统分组',
  'custom': '自定义',
  'class': '班级'
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({ group_name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'stats'>('students')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchGroupDetail()
  }, [groupId])

  const fetchGroupDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/groups/${groupId}`)
      const data = await response.json()

      if (data.error) {
        console.error('获取分组详情失败:', data.error)
        return
      }

      setGroup(data.group)
      setStudents(data.students)
      setAssignments(data.assignments)
      setStats(data.stats)
      setEditForm({
        group_name: data.group.group_name,
        description: data.group.description || ''
      })
    } catch (error) {
      console.error('获取分组详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editForm.group_name.trim()) {
      alert('请输入分组名称')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.error) {
        alert(`更新失败: ${data.error}`)
        return
      }

      setShowEditDialog(false)
      fetchGroupDetail()
    } catch (error) {
      console.error('更新分组失败:', error)
      alert('更新分组失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        alert(`删除失败: ${data.error}`)
        setDeleting(false)
        return
      }

      router.push('/admin/groups')
    } catch (error) {
      console.error('删除分组失败:', error)
      alert('删除分组失败')
      setDeleting(false)
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

  if (loading || !group) {
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
                onClick={() => router.push('/admin/groups')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{group.group_name}</h1>
                  <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full font-semibold">
                    {GROUP_TYPE_NAMES[group.group_type as keyof typeof GROUP_TYPE_NAMES]}
                  </span>
                </div>
                {group.description && (
                  <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {group.group_type !== 'auto_level' && (
                <>
                  <button
                    onClick={() => setShowEditDialog(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/20 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-cyan-400" />
                <span className="text-gray-400 text-sm">学员总数</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_students}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <span className="text-gray-400 text-sm">平均等级</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.avg_level.toFixed(1)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8 text-yellow-400" />
                <span className="text-gray-400 text-sm">平均评分</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.avg_score.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-green-400" />
                <span className="text-gray-400 text-sm">课程分配</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_assignments}</p>
            </motion.div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 mb-6 p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold ${
              activeTab === 'students'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            学员列表 ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold ${
              activeTab === 'assignments'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            课程分配 ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-3 rounded-lg transition-all font-semibold ${
              activeTab === 'stats'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            统计数据
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-300">该分组暂无学员</p>
                </div>
              ) : (
                students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => router.push(`/admin/students/${student.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                        {student.full_name?.[0] || student.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{student.full_name || '未命名'}</h4>
                        <p className="text-sm text-gray-400">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                          Level {student.consciousness_level}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">评分</p>
                          <p className="text-cyan-400 font-semibold">{student.composite_score.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-300">该分组暂无课程分配</p>
                </div>
              ) : (
                assignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/5 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{assignment.course_systems.title}</h4>
                        <p className="text-sm text-gray-400">课程代码: {assignment.course_systems.system_key}</p>
                        {assignment.notes && (
                          <p className="text-sm text-gray-300 mt-2">{assignment.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                          <User className="w-3 h-3" />
                          <span>{assignment.assigned_by_admin.full_name || assignment.assigned_by_admin.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  等级分布
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map(level => {
                    const count = stats.level_distribution[level] || 0
                    const percentage = stats.total_students > 0 ? (count / stats.total_students) * 100 : 0
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            Level {level} - {LEVEL_NAMES[level as keyof typeof LEVEL_NAMES]}
                          </span>
                          <span className="text-white font-semibold">
                            {count} 人 ({percentage.toFixed(1)}%)
                          </span>
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
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">创建时间</p>
                  <p className="text-white font-semibold">{new Date(group.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">创建者</p>
                  <p className="text-white font-semibold">{group.created_by_admin.full_name || group.created_by_admin.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <AnimatePresence>
        {showEditDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !saving && setShowEditDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/20 rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">编辑分组</h2>
                <button
                  onClick={() => !saving && setShowEditDialog(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  disabled={saving}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    分组名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.group_name}
                    onChange={(e) => setEditForm({ ...editForm, group_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    描述
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  disabled={saving}
                >
                  取消
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                  disabled={saving || !editForm.group_name.trim()}
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !deleting && setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-400/20 rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">确认删除分组？</h2>
                <p className="text-gray-400">
                  {stats && stats.total_students > 0
                    ? `该分组中还有 ${stats.total_students} 名学员，请先移除学员后再删除。`
                    : '删除后无法恢复，确定要删除该分组吗？'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                  disabled={deleting || (stats ? stats.total_students > 0 : false)}
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
