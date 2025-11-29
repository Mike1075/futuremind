'use client'

import { use, useState, useEffect } from 'react'
import { useProject } from '@/lib/aip/hooks'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Eye, EyeOff, UserPlus, UserX } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface ProjectMember {
  user_id: string
  role_in_project: string
  user?: {
    full_name: string | null
    email: string
  }
}

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { project, loading: projectLoading } = useProject(projectId)
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [saving, setSaving] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active')
  const [isPublic, setIsPublic] = useState(false)
  const [isRecruiting, setIsRecruiting] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data: membership } = await supabase
        .from('project_members')
        .select('role_in_project')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      const hasPermission = membership?.role_in_project === 'manager' || membership?.role_in_project === 'owner'
      setIsManager(hasPermission)

      if (!hasPermission) {
        router.push(`/explorer-alliance/projects/${projectId}`)
      }
    }

    const loadMembers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role_in_project,
          user:user_id (
            full_name,
            email
          )
        `)
        .eq('project_id', projectId)

      if (data) {
        setMembers(data as unknown as ProjectMember[])
      }
    }

    checkPermissions()
    loadMembers()
  }, [projectId, router])

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status as 'active' | 'completed' | 'archived')
      setIsPublic(project.is_public || false)
      setIsRecruiting(project.is_recruiting || false)
    }
  }, [project])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('项目名称不能为空')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description,
          status,
          is_public: isPublic,
          is_recruiting: isRecruiting,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      toast.success('设置已保存')
      router.push(`/explorer-alliance/projects/${projectId}`)
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!await confirm({
      title: '确认删除',
      message: '确定要删除此项目吗？此操作不可撤销，所有相关数据将被永久删除。',
      type: 'warning'
    })) {
      return
    }

    try {
      const supabase = createClient()

      // 删除项目文档
      const { error: docsError } = await supabase
        .from('project_documents')
        .delete()
        .eq('project_id', projectId)

      if (docsError) throw docsError

      // 删除项目成员
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)

      if (membersError) throw membersError

      // 删除任务
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', projectId)

      if (tasksError) throw tasksError

      // 删除项目
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (projectError) throw projectError

      toast.success('项目已删除')
      router.push('/explorer-alliance')
    } catch (error) {
      console.error('删除项目失败:', error)
      toast.error('删除项目失败')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'manager':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return '所有者'
      case 'manager':
        return '管理员'
      default:
        return '成员'
    }
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-cosmic-void text-starlight flex items-center justify-center">
        <div className="loader-ethereal"></div>
      </div>
    )
  }

  if (!project || !isManager) {
    return null
  }

  return (
    <div className="min-h-screen bg-cosmic-void text-starlight">
      {/* Header */}
      <div className="nav-ethereal sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/explorer-alliance/projects/${projectId}`}
                className="badge-ethereal"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-h2">项目设置</h1>
                <p className="text-small text-starlight-muted mt-1">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 btn-stardust flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                删除项目
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-stardust flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="card-glass border border-white/10">
            <h2 className="text-h3 mb-6">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-small font-medium text-starlight-muted mb-2">
                  项目名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-ethereal"
                  placeholder="输入项目名称"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-starlight-muted mb-2">
                  项目描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="input-ethereal resize-none"
                  placeholder="输入项目描述"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-starlight-muted mb-2">
                  项目状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'archived')}
                  className="input-ethereal"
                >
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visibility & Permissions */}
          <div className="card-glass border border-white/10">
            <h2 className="text-h3 mb-6">可见性与权限</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Eye className="h-5 w-5 text-green-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-amber-400" />
                  )}
                  <div>
                    <div className="font-medium">项目可见性</div>
                    <div className="text-small text-starlight-muted">
                      {isPublic ? '公开项目，所有人可见' : '私密项目，仅成员可见'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {isRecruiting ? (
                    <UserPlus className="h-5 w-5 text-green-400" />
                  ) : (
                    <UserX className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium">招募状态</div>
                    <div className="text-small text-starlight-muted">
                      {isRecruiting ? '正在招募新成员' : '暂不招募新成员'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecruiting(!isRecruiting)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRecruiting ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRecruiting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Project Members */}
          <div className="card-glass border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h3">项目成员 ({members.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-4 bg-black/30 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {member.user?.full_name?.[0] || member.user?.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {member.user?.full_name || member.user?.email}
                    </div>
                    <div className="text-small text-starlight-muted truncate">
                      {member.user?.email}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded border ${getRoleBadgeColor(
                      member.role_in_project
                    )}`}
                  >
                    {getRoleLabel(member.role_in_project)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
