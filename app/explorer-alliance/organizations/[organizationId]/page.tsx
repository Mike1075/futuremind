'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Plus, UserPlus, Folder, CheckCircle2, Briefcase } from 'lucide-react'
import { useOrganizationProjects, useProjectTasks } from '@/lib/aip/hooks'
import { FloatingChatBot } from '@/components/aip/FloatingChatBot'
import { ProjectGrid } from '@/components/aip/ProjectGrid'
import { CompactTaskList } from '@/components/aip/CompactTaskList'
import { CreateProjectModal } from '@/components/aip/CreateProjectModal'
import { EditDescriptionModal } from '@/components/aip/EditDescriptionModal'
import { InviteModal } from '@/components/aip/InviteModal'
import { PendingRequestsPanel } from '@/components/aip/PendingRequestsPanel'
import { NotificationBadge } from '@/components/aip/NotificationBadge'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Project, Task } from '@/lib/aip/types'

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.organizationId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [userTasks, setUserTasks] = useState<Task[]>([])
  const [userProjectPermissions, setUserProjectPermissions] = useState<Record<string, 'owner' | 'manager' | 'member' | 'none'>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showEditDescription, setShowEditDescription] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null)

  const { projects, loading: projectsLoading, reload: reloadProjects } = useOrganizationProjects(organizationId)

  useEffect(() => {
    setIsMounted(true)
    loadOrganization()
    loadUserData()
  }, [organizationId])

  const loadOrganization = async () => {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (fetchError) {
        setError('获取组织信息失败')
        console.error(fetchError)
      } else {
        setOrganization(data as Organization)
      }
    } catch (err) {
      console.error('加载组织失败:', err)
      setError('加载组织失败')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Load user's tasks across all projects
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, project:projects(*)')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })

      setUserTasks((tasks as any) || [])

      // Load user's project permissions
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id, role_in_project')
        .eq('user_id', user.id)

      const permissions: Record<string, 'owner' | 'manager' | 'member' | 'none'> = {}
      memberships?.forEach(m => {
        permissions[m.project_id] = m.role_in_project as 'owner' | 'manager' | 'member'
      })
      setUserProjectPermissions(permissions)

      // 检查是否是组织管理员
      const { data: orgMembership } = await supabase
        .from('user_organizations')
        .select('role_in_org')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single()

      setIsOrgAdmin(orgMembership?.role_in_org === 'admin' || orgMembership?.role_in_org === 'owner')
    } catch (err) {
      console.error('加载用户数据失败:', err)
    }
  }

  // 生成星空粒子
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载组织信息中...</p>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '组织不存在'}</p>
          <button
            onClick={() => router.push('/explorer-alliance')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            返回组织列表
          </button>
        </div>
      </div>
    )
  }

  // Split projects into: owned by me, joined by me, and other projects
  const myOwnedProjects = projects.filter(p => userProjectPermissions[p.id] === 'owner')
  const myJoinedProjects = projects.filter(p => userProjectPermissions[p.id] === 'manager' || userProjectPermissions[p.id] === 'member')
  const otherProjects = projects.filter(p => !userProjectPermissions[p.id] || userProjectPermissions[p.id] === 'none')

  // For statistics: all projects I'm involved in
  const allMyProjects = [...myOwnedProjects, ...myJoinedProjects]

  const handleProjectClick = (project: Project) => {
    router.push(`/explorer-alliance/projects/${project.id}`)
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`确定要删除项目"${projectName}"吗？此操作不可恢复。`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      alert('项目已删除')
      reloadProjects()
    } catch (err) {
      console.error('删除项目失败:', err)
      alert('删除项目失败')
    }
  }

  const handleEditDescription = (projectId: string, projectName: string, currentDescription: string) => {
    setEditingProject({ id: projectId, name: projectName, description: currentDescription })
    setShowEditDescription(true)
  }

  const handleEditDescriptionConfirm = async (newName: string, newDescription: string) => {
    if (!editingProject) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({
          name: newName,
          description: newDescription
        })
        .eq('id', editingProject.id)

      if (error) throw error

      alert('项目信息已更新')
      setShowEditDescription(false)
      setEditingProject(null)
      reloadProjects()
    } catch (err) {
      console.error('更新项目信息失败:', err)
      alert('更新项目信息失败')
    }
  }

  const handleTogglePublic = async (projectId: string, isPublic: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ is_public: isPublic })
        .eq('id', projectId)

      if (error) throw error

      reloadProjects()
    } catch (err) {
      console.error('更新可见性失败:', err)
      alert('更新可见性失败')
    }
  }

  const handleToggleRecruiting = async (projectId: string, isRecruiting: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ is_recruiting: isRecruiting })
        .eq('id', projectId)

      if (error) throw error

      reloadProjects()
    } catch (err) {
      console.error('更新招募状态失败:', err)
      alert('更新招募状态失败')
    }
  }

  const handleApplyToJoin = async (projectId: string, projectName: string) => {
    if (!userId) {
      alert('请先登录')
      return
    }

    const message = prompt(`申请加入项目"${projectName}"\n\n请输入申请理由（可选）：`)
    if (message === null) return // 用户取消

    try {
      const supabase = createClient()

      // 获取申请人信息
      const { data: applicantProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      // 使用新的project_join_requests表
      const { error } = await supabase
        .from('project_join_requests')
        .insert({
          project_id: projectId,
          user_id: userId,
          message: message.trim() || null,
          status: 'pending'
        })

      if (error) {
        // 处理重复申请错误
        if (error.code === '23505') {
          alert('您已经申请过此项目，请等待审核结果')
          return
        }
        throw error
      }

      // 获取项目的所有管理员（owner和manager）
      const { data: managers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .in('role_in_project', ['owner', 'manager'])

      // 为每个管理员创建通知
      if (managers && managers.length > 0) {
        const notifications = managers.map(manager => ({
          user_id: manager.user_id,
          type: 'join_request',
          title: '新的加入申请',
          message: `${applicantProfile?.full_name || applicantProfile?.email || '用户'} 申请加入项目"${projectName}"${message.trim() ? `\n理由：${message.trim()}` : ''}`,
          metadata: {
            request_type: 'project',
            project_id: projectId,
            project_name: projectName,
            applicant_id: userId,
            applicant_name: applicantProfile?.full_name,
            applicant_email: applicantProfile?.email
          }
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
      }

      alert('申请已提交，等待项目管理员审核')
    } catch (err) {
      console.error('提交申请失败:', err)
      alert('提交申请失败，请重试')
    }
  }

  const handleTaskClick = (task: Task) => {
    // Navigate to project page with task focused
    if (task.project_id) {
      router.push(`/explorer-alliance/projects/${task.project_id}?taskId=${task.id}`)
    }
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-black">
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
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
      <div className="relative border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/explorer-alliance')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {organization.name}
                </h1>
                <p className="text-gray-400 mt-1">{organization.description || '暂无描述'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBadge />
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              >
                <Home className="w-5 h-5" />
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-8 z-10 max-w-[1600px]">
        {/* Dashboard Grid Layout: 1 column (tasks) + 3 columns (projects) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: CompactTaskList */}
          <div className="lg:col-span-1">
            <CompactTaskList
              tasks={userTasks}
              onTaskClick={handleTaskClick}
            />
          </div>

          {/* Right Columns: Project Sections */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section with Statistics */}
            <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    欢迎回来 👋
                  </h2>
                  <p className="text-zinc-400">
                    继续你的探索之旅，与团队一起创造精彩
                  </p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tasks Card */}
                <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4 hover:border-blue-500/40 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-400 font-medium mb-1">我的任务</p>
                      <p className="text-3xl font-bold text-white">{userTasks.length}</p>
                      <p className="text-xs text-zinc-500 mt-1">待完成的任务</p>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Projects Card */}
                <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/40 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-400 font-medium mb-1">参与项目</p>
                      <p className="text-3xl font-bold text-white">{allMyProjects.length}</p>
                      <p className="text-xs text-zinc-500 mt-1">正在进行的项目</p>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-lg">
                      <Briefcase className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Requests Panel - Only for Organization Admins */}
            {isOrgAdmin && (
              <PendingRequestsPanel
                organizationId={organizationId}
                type="organization"
              />
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mb-6">
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                创建项目
              </button>
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                邀请成员
              </button>
            </div>

            {projectsLoading ? (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-zinc-400">加载项目中...</p>
              </div>
            ) : allMyProjects.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                <Folder className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">你还没有参与任何项目</p>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  创建第一个项目
                </button>
              </div>
            ) : (
              <>
                {/* My Owned Projects Section */}
                {myOwnedProjects.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-2">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        我发起的项目
                        <span className="ml-3 text-lg font-normal text-zinc-500">
                          ({myOwnedProjects.length})
                        </span>
                      </h2>
                    </div>
                    <ProjectGrid
                      projects={myOwnedProjects}
                      onProjectClick={handleProjectClick}
                      onDeleteProject={handleDeleteProject}
                      onEditDescription={handleEditDescription}
                      onTogglePublic={handleTogglePublic}
                      onToggleRecruiting={handleToggleRecruiting}
                      userProjectPermissions={userProjectPermissions}
                      showEditControls={true}
                      showApplyButton={false}
                    />
                  </div>
                )}

                {/* My Joined Projects Section */}
                {myJoinedProjects.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-2">
                        <UserPlus className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        我参与的项目
                        <span className="ml-3 text-lg font-normal text-zinc-500">
                          ({myJoinedProjects.length})
                        </span>
                      </h2>
                    </div>
                    <ProjectGrid
                      projects={myJoinedProjects}
                      onProjectClick={handleProjectClick}
                      onDeleteProject={handleDeleteProject}
                      onEditDescription={handleEditDescription}
                      onTogglePublic={handleTogglePublic}
                      onToggleRecruiting={handleToggleRecruiting}
                      userProjectPermissions={userProjectPermissions}
                      showEditControls={true}
                      showApplyButton={false}
                    />
                  </div>
                )}
              </>
            )}

            {/* Organization Projects Section (projects user hasn't joined) */}
            {otherProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    组织项目
                    <span className="ml-3 text-lg font-normal text-zinc-500">
                      ({otherProjects.length})
                    </span>
                  </h2>
                  <p className="text-sm text-zinc-500">
                    发现更多可以加入的项目
                  </p>
                </div>

                <ProjectGrid
                  projects={otherProjects}
                  onProjectClick={handleProjectClick}
                  onApplyToJoin={handleApplyToJoin}
                  userProjectPermissions={userProjectPermissions}
                  showEditControls={false}
                  showApplyButton={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 聊天机器人 */}
      <FloatingChatBot
        organization={organization}
        showProjectSelector={true}
      />

      {/* Modals */}
      {showCreateProject && (
        <CreateProjectModal
          organizationId={organizationId}
          onClose={() => setShowCreateProject(false)}
          onSuccess={() => {
            setShowCreateProject(false)
            reloadProjects()
            loadUserData()  // 重新加载用户权限，确保新项目显示在"我的项目"中
          }}
        />
      )}

      {showEditDescription && editingProject && (
        <EditDescriptionModal
          isOpen={showEditDescription}
          onClose={() => {
            setShowEditDescription(false)
            setEditingProject(null)
          }}
          onConfirm={handleEditDescriptionConfirm}
          projectName={editingProject.name}
          currentDescription={editingProject.description}
        />
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  )
}
