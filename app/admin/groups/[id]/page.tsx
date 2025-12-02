// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Users, Trash2, UserPlus, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Group {
  id: string
  name: string
  description: string | null
  group_type: string | null
  course_id: string | null
  member_ids: string[] | null
  created_at: string | null
}

interface Student {
  id: string
  full_name: string | null
  email: string
  consciousness_level: number | null
  composite_score: number | null
}

interface AllStudent {
  id: string
  full_name: string | null
  email: string
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

export default function GroupDetailPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const params = useParams()
  const groupId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<AllStudent[]>([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [groupId])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 先加载分组信息，然后根据分组类型加载学生列表
      const groupData = await loadGroup()
      if (groupData) {
        await loadAllStudents(groupData)
      }
    } catch (error) {
      console.error('加载失败:', error)
      router.push('/admin/groups')
    } finally {
      setLoading(false)
    }
  }

  const loadGroup = async (): Promise<Group | null> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) throw error

      setGroup(data)
      await loadMembers(data.member_ids || [])
      return data
    } catch (error) {
      console.error('加载分组失败:', error)
      return null
    }
  }

  const loadMembers = async (memberIds: string[]) => {
    if (memberIds.length === 0) {
      setMembers([])
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, consciousness_level, composite_score')
        .in('id', memberIds)

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('加载成员失败:', error)
    }
  }

  const loadAllStudents = async (groupData: Group) => {
    try {
      const supabase = createClient()

      // 如果是课程分组，只加载选择了该课程的学生
      if (groupData.group_type === 'course' && groupData.course_id) {
        // 先获取选择了该课程的学生ID列表
        const { data: assignments, error: assignmentError } = await supabase
          .from('student_course_assignments')
          .select('student_id')
          .eq('course_system_id', groupData.course_id)
          .eq('status', 'active')

        if (assignmentError) throw assignmentError

        const studentIds = assignments?.map((a: any) => a.student_id) || []

        if (studentIds.length === 0) {
          setAllStudents([])
          return
        }

        // 获取这些学生的详细信息
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
          .eq('role', 'student')
          .order('full_name', { ascending: true, nullsFirst: false })

        if (error) throw error
        setAllStudents(data || [])
      } else {
        // 全局分组或自定义分组，加载所有学生
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'student')
          .order('full_name', { ascending: true, nullsFirst: false })

        if (error) throw error
        setAllStudents(data || [])
      }
    } catch (error) {
      console.error('加载学生列表失败:', error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !group) return

    if (group.member_ids?.includes(selectedStudentId)) {
      toast.info('该学员已在分组中')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const newMemberIds = [...(group.member_ids || []), selectedStudentId]

      const { error } = await supabase
        .from('student_groups')
        .update({ member_ids: newMemberIds })
        .eq('id', groupId)

      if (error) throw error

      toast.success('成功添加成员')
      setSelectedStudentId('')
      setShowAddModal(false)
      await loadGroup()
    } catch (error) {
      console.error('添加成员失败:', error)
      toast.error('添加失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (studentId: string) => {
    if (!group) return

    const student = members.find(m => m.id === studentId)
    const confirmed = await confirm({
      title: '确认操作',
      message: `确定要将「${student?.full_name || student?.email}」移出分组吗？`,
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const newMemberIds = (group.member_ids || []).filter(id => id !== studentId)

      const { error } = await supabase
        .from('student_groups')
        .update({ member_ids: newMemberIds })
        .eq('id', groupId)

      if (error) throw error

      toast.success('已移除成员')
      await loadGroup()
    } catch (error) {
      console.error('移除成员失败:', error)
      toast.error('移除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  const availableStudents = allStudents.filter(s => !(group.member_ids || []).includes(s.id))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{group.name}</h1>
                {group.description && (
                  <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-semibold">{members.length} 名成员</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">分组成员</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            添加成员
          </button>
        </div>

        {/* Members List */}
        {members.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">该分组暂无成员</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {member.full_name?.[0] || member.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{member.full_name || '未设置'}</h4>
                      <p className="text-sm text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-white text-xs font-medium ${LEVEL_COLORS[member.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                      L{member.consciousness_level}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="移除成员"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">添加成员</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  选择学员
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">请选择...</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </option>
                  ))}
                </select>
                {availableStudents.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">所有学员都已在分组中</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedStudentId('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={submitting || !selectedStudentId}
                >
                  {submitting ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
