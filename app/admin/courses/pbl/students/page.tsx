// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, UserPlus, Trash2, Search } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Student {
  id: string
  full_name: string | null
  email: string
  assigned_at: string
}

export default function PBLStudentsPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [pblSystemId, setPblSystemId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalSearchTerm, setModalSearchTerm] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadData()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()

      // 获取伊卡洛斯课程 system_id
      const { data: systemData, error: systemError } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'icarus')
        .maybeSingle()

      if (systemError) throw systemError
      if (!systemData) throw new Error('未找到伊卡洛斯课程体系')
      setPblSystemId(systemData.id)

      // 获取选课学员
      const { data: assignments, error: assignError } = await supabase
        .from('student_course_assignments')
        .select(`
          student_id,
          assigned_at,
          profiles:student_id (
            id,
            full_name,
            email
          )
        `)
        .eq('course_system_id', systemData.id)
        .eq('status', 'active')

      if (assignError) throw assignError

      const studentList = assignments?.map((a: any) => ({
        id: a.profiles.id,
        full_name: a.profiles.full_name,
        email: a.profiles.email,
        assigned_at: a.assigned_at
      })) || []

      setStudents(studentList)

      // 获取所有用户（用于添加，包括老师和校长）
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name')

      if (profilesError) throw profilesError
      setAllUsers(allProfiles || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleAddStudent = async (studentId: string) => {
    if (!pblSystemId) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('student_course_assignments')
        .insert({
          student_id: studentId,
          course_system_id: pblSystemId,
          assigned_by: user?.id,
          assigned_by_role: 'principal',
          status: 'active'
        })

      if (error) throw error

      toast.success('添加成功！')
      setShowAddModal(false)
      setModalSearchTerm('')
      await loadData()
    } catch (error: any) {
      console.error('添加学员失败:', error)
      if (error.code === '23505') {
        toast.warning('该学员已经在课程中了')
      } else {
        toast.error('添加失败，请重试')
      }
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!pblSystemId) return
    if (!await confirm({ title: '确认操作', message: '确定要移除该学员吗？', type: 'warning' })) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('student_course_assignments')
        .delete()
        .eq('student_id', studentId)
        .eq('course_system_id', pblSystemId)

      if (error) throw error

      toast.success('移除成功！')
      await loadData()
    } catch (error) {
      console.error('移除学员失败:', error)
      toast.error('移除失败，请重试')
    }
  }

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableUsers = allUsers.filter(u =>
    !students.some(s => s.id === u.id) &&
    (u.full_name?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
     u.email.toLowerCase().includes(modalSearchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
          <p className="text-orange-300 mt-4">加载中...</p>
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
                onClick={() => router.push('/admin/courses/pbl')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">伊卡洛斯计划 - 选课学员</h1>
                <p className="text-sm text-orange-300 mt-1">管理课程学员</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              添加学员
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索学员姓名或邮箱..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* 学员列表 */}
        <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Users className="w-5 h-5 text-orange-400" />
              <span className="font-medium">选课学员列表</span>
              <span className="text-gray-400 text-sm">({filteredStudents.length} 人)</span>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                暂无学员数据
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="p-4 hover:bg-white/5 transition-all flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{student.full_name || '未设置姓名'}</p>
                    <p className="text-gray-400 text-sm mt-1">{student.email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      加入时间: {new Date(student.assigned_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all"
                    title="移除学员"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 添加学员模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">添加学员到课程</h2>
              <p className="text-gray-400 text-sm mt-2">可以添加学员、老师或校长</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* 搜索框 */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="搜索姓名或邮箱..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {availableUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">所有学员都已添加</p>
                ) : (
                  availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddStudent(user.id)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
                    >
                      <p className="text-white font-medium">{user.full_name || '未设置姓名'}</p>
                      <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setModalSearchTerm('')
                }}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
