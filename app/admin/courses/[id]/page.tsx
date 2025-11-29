'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Users, FileText, UsersRound, Plus, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Course {
  id: string
  system_key: string
  title: string
  description: string | null
  structure_type: string
  total_units: number | null
}

interface Student {
  id: string
  email: string
  full_name: string | null
  assigned_at: string
}

interface Material {
  id: string
  file_name: string | null
  file_url: string | null
  external_url: string | null
  resource_type: string | null
  description: string | null
  display_order: number | null
  created_at: string | null
}

interface Group {
  id: string
  name: string
  description: string | null
  member_ids: string[] | null
  created_at: string | null
}

type TabType = 'students' | 'materials' | 'groups'

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params?.id as string
  const tabParam = searchParams?.get('tab') as TabType | null
  const toast = useToast()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'students')
  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [courseId])

  // 监听URL参数变化，切换标签
  useEffect(() => {
    if (tabParam && (tabParam === 'students' || tabParam === 'materials' || tabParam === 'groups')) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    if (activeTab === 'students' && students.length === 0) {
      loadStudents()
    } else if (activeTab === 'materials' && materials.length === 0) {
      loadMaterials()
    } else if (activeTab === 'groups' && groups.length === 0) {
      loadGroups()
    }
  }, [activeTab])

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const userRole = (profile as unknown as { role?: string })?.role

      if (!userRole || !['principal', 'teacher'].includes(userRole)) {
        toast.warning('您没有权限访问此页面')
        router.push('/admin')
        return
      }

      await loadCourse()
      await loadStudents()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadCourse = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('course_systems')
        .select('*')
        .eq('id', courseId)
        .maybeSingle()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('加载课程失败:', error)
      toast.error('课程不存在')
      router.push('/admin/courses')
    }
  }

  const loadStudents = async () => {
    try {
      const supabase = createClient()

      // Get student assignments
      const { data: assignments, error } = await supabase
        .from('student_course_assignments')
        .select(`
          student_id,
          assigned_at,
          student:profiles!student_course_assignments_student_id_fkey(id, email, full_name)
        `)
        .eq('course_system_id', courseId)
        .eq('status', 'active')

      if (error) throw error

      const studentList = assignments?.map((a: any) => ({
        id: a.student.id,
        email: a.student.email,
        full_name: a.student.full_name,
        assigned_at: a.assigned_at
      })) || []

      setStudents(studentList)
    } catch (error) {
      console.error('加载学员列表失败:', error)
    }
  }

  const loadMaterials = async () => {
    try {
      const supabase = createClient()

      // 首先获取该课程的所有 course_contents
      const { data: contents, error: contentsError } = await supabase
        .from('course_contents')
        .select('id')
        .eq('system_id', courseId)

      if (contentsError) throw contentsError

      const contentIds = contents?.map((c: any) => c.id) || []

      if (contentIds.length === 0) {
        setMaterials([])
        return
      }

      // 然后获取这些 course_contents 关联的所有资料
      const { data, error } = await supabase
        .from('media_resources')
        .select('*')
        .in('course_content_id', contentIds)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('加载资料列表失败:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .eq('course_id', courseId)
        .eq('group_type', 'course')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('加载分组列表失败:', error)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentEmail.trim()) {
      toast.warning('请输入邮箱')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      // Find user by email
      const { data: targetUser, error: findError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', newStudentEmail.trim())
        .maybeSingle()

      if (findError || !targetUser) {
        toast.error('未找到该邮箱的用户，请确认用户已注册')
        return
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('student_course_assignments')
        .select('id')
        .eq('student_id', targetUser.id)
        .eq('course_system_id', courseId)
        .maybeSingle()

      if (existing) {
        toast.warning('该学员已选修此课程')
        return
      }

      // Get current user for assigned_by
      const { data: { user } } = await supabase.auth.getUser()

      // Add enrollment
      const { error: insertError } = await supabase
        .from('student_course_assignments')
        .insert({
          student_id: targetUser.id,
          course_system_id: courseId,
          assigned_by: user?.id,
          status: 'active'
        })

      if (insertError) throw insertError

      toast.success('成功添加学员')
      setNewStudentEmail('')
      setShowAddStudentModal(false)
      await loadStudents()
    } catch (error) {
      console.error('添加学员失败:', error)
      toast.error('添加失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveStudent = async (student: Student) => {
    const confirmed = await confirm({
      title: '确认操作',
      message: `确定要将「${student.full_name || student.email}」移出本课程吗？`,
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('student_course_assignments')
        .delete()
        .eq('student_id', student.id)
        .eq('course_system_id', courseId)

      if (error) throw error

      toast.success('已移除学员')
      await loadStudents()
    } catch (error) {
      console.error('移除学员失败:', error)
      toast.error('移除失败，请重试')
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    const confirmed = await confirm({
      title: '确认操作',
      message: '确定要删除这个资料吗？',
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('media_resources')
        .delete()
        .eq('id', materialId)

      if (error) throw error

      toast.success('已删除资料')
      await loadMaterials()
    } catch (error) {
      console.error('删除资料失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      toast.warning('请输入分组名称')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('student_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          group_type: 'course',
          course_id: courseId,
          member_ids: [],
          created_by: user?.id
        })

      if (error) throw error

      toast.success('创建成功')
      setNewGroupName('')
      setNewGroupDescription('')
      setShowAddGroupModal(false)
      await loadGroups()
    } catch (error) {
      console.error('创建分组失败:', error)
      toast.error('创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    const confirmed = await confirm({
      title: '确认操作',
      message: '确定要删除这个分组吗？\n\n删除分组不会删除学员，只会解除分组关系。',
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      toast.success('已删除分组')
      await loadGroups()
    } catch (error) {
      console.error('删除分组失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return null
  }

  return (
    <div className="min-h-screen bg-cosmic-void">
      {/* Header */}
      <header className="bg-cosmic-void/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/courses')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-starlight-muted" />
              </button>
              <div>
                <h1 className="text-h2 font-bold text-starlight">{course.title}</h1>
                <p className="text-small text-purple-300 mt-1">{course.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-cosmic-void/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'students'
                  ? 'border-purple-500 text-starlight'
                  : 'border-transparent text-starlight-muted hover:text-starlight'
              }`}
            >
              <Users className="w-4 h-4" />
              选课学员
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'materials'
                  ? 'border-purple-500 text-starlight'
                  : 'border-transparent text-starlight-muted hover:text-starlight'
              }`}
            >
              <Upload className="w-4 h-4" />
              课程资料
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-purple-500 text-starlight'
                  : 'border-transparent text-starlight-muted hover:text-starlight'
              }`}
            >
              <UsersRound className="w-4 h-4" />
              课程分组
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h3 font-bold text-starlight">选课学员列表 ({students.length}人)</h2>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn-stardust flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加学员
              </button>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12 card-glass">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-starlight-muted">暂无学员选修此课程</p>
              </div>
            ) : (
              <div className="card-glass overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase">姓名</th>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase">邮箱</th>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase">选课时间</th>
                      <th className="px-6 py-3 text-right text-small font-medium text-starlight-muted uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-small text-starlight">
                          {student.full_name || '未设置'}
                        </td>
                        <td className="px-6 py-4 text-small text-gray-300">{student.email}</td>
                        <td className="px-6 py-4 text-small text-starlight-muted">
                          {new Date(student.assigned_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveStudent(student)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-small text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            移除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h3 font-bold text-starlight">课程资料 ({materials.length}个)</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-stardust flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                上传资料
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="text-center py-12 card-glass">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-starlight-muted">暂无课程资料</p>
                <p className="text-starlight-dim text-small mt-2">点击上方按钮上传资料</p>
              </div>
            ) : (
              <div className="card-glass overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase tracking-wider">
                        文件名
                      </th>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase tracking-wider">
                        描述
                      </th>
                      <th className="px-6 py-3 text-left text-small font-medium text-starlight-muted uppercase tracking-wider">
                        上传时间
                      </th>
                      <th className="px-6 py-3 text-right text-small font-medium text-starlight-muted uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {materials.map((material) => (
                      <tr key={material.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div>
                              <div className="text-starlight font-medium">{material.file_name}</div>
                              {material.external_url && (
                                <a
                                  href={material.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-small text-cyan-400 hover:text-cyan-300"
                                >
                                  查看链接 ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-small rounded">
                            {material.resource_type || '文件'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-small text-gray-300">
                          {material.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-small text-starlight-muted">
                          {material.created_at ? new Date(material.created_at).toLocaleDateString('zh-CN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-small text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-h3 font-bold text-starlight">课程分组 ({groups.length}个)</h2>
              <button
                onClick={() => setShowAddGroupModal(true)}
                className="btn-stardust flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建分组
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-12 card-glass">
                <UsersRound className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-starlight-muted">暂无课程分组</p>
                <p className="text-starlight-dim text-small mt-2">点击上方按钮创建分组</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="card-glass p-6 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-h3 font-semibold text-starlight mb-2">{group.name}</h3>
                        {group.description && (
                          <p className="text-small text-starlight-muted mb-3">{group.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="删除分组"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-small">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Users className="w-4 h-4" />
                        <span>{group.member_ids?.length || 0} 名成员</span>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/groups/${group.id}`)}
                        className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded transition-colors"
                      >
                        管理成员
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-glass p-6 w-full max-w-md">
            <h2 className="text-h3 font-bold text-starlight mb-4">添加学员</h2>
            <form onSubmit={handleAddStudent}>
              <div className="mb-4">
                <label className="block text-small font-medium text-gray-300 mb-2">
                  学员邮箱
                </label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="请输入已注册用户的邮箱"
                  className="input-ethereal"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false)
                    setNewStudentEmail('')
                  }}
                  className="px-4 py-2 text-starlight-muted hover:text-starlight transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-stardust disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-glass p-6 w-full max-w-md">
            <h2 className="text-h3 font-bold text-starlight mb-4">创建课程分组</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-small font-medium text-gray-300 mb-2">
                  分组名称
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例如：高级班、实验组等"
                  className="input-ethereal"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-small font-medium text-gray-300 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="分组说明..."
                  rows={3}
                  className="input-ethereal resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddGroupModal(false)
                    setNewGroupName('')
                    setNewGroupDescription('')
                  }}
                  className="px-4 py-2 text-starlight-muted hover:text-starlight transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-stardust disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
