// @ts-nocheck
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Folder, Users, Briefcase } from 'lucide-react'
import { useOrganizationProjects, useProjectTasks } from '@/lib/aip/hooks'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'
import { FloatingChatBot } from '@/components/aip/FloatingChatBot'
import { ProjectGrid } from '@/components/aip/ProjectGrid'
import { CompactTaskList } from '@/components/aip/CompactTaskList'
import { CreateProjectModal } from '@/components/aip/CreateProjectModal'
import { EditDescriptionModal } from '@/components/aip/EditDescriptionModal'
import { PendingRequestsPanel } from '@/components/aip/PendingRequestsPanel'
import { NotificationBadge } from '@/components/aip/NotificationBadge'
import { InteractionLog } from '@/components/aip/InteractionLog'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Project, Task } from '@/lib/aip/types'

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const organizationId = params?.organizationId as string

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
  const [showInteractionLog, setShowInteractionLog] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null)

  // 申请加入项目对话框
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [applyingProject, setApplyingProject] = useState<{ id: string; name: string } | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)

  // 删除项目确认对话框
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { projects, loading: projectsLoading, reload: reloadProjects } = useOrganizationProjects(organizationId)

  useEffect(() => {
    setIsMounted(true)
    loadAllData()
  }, [organizationId])

  const loadAllData = async () => {
    try {
      const supabase = createClient()

      // 并行加载所有数据
      const [
        { data: { user } },
        { data: orgData, error: orgError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('organizations').select('*').eq('id', organizationId).single(),
      ])

      if (orgError) {
        setError('获取组织信息失败')
        console.error(orgError)
        setLoading(false)
        return
      }

      setOrganization(orgData as Organization)

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      // 并行加载用户相关数据
      const [
        { data: tasks },
        { data: memberships },
        { data: orgMembership }
      ] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(*)').eq('assignee_id', user.id).order('created_at', { ascending: false }),
        supabase.from('project_members').select('project_id, role_in_project').eq('user_id', user.id),
        supabase.from('user_organizations').select('role_in_org').eq('user_id', user.id).eq('organization_id', organizationId).single()
      ])

      setUserTasks((tasks as any) || [])

      const permissions: Record<string, 'owner' | 'manager' | 'member' | 'none'> = {}
      memberships?.forEach(m => {
        permissions[m.project_id] = m.role_in_project as 'owner' | 'manager' | 'member'
      })
      setUserProjectPermissions(permissions)

      setIsOrgAdmin(orgMembership?.role_in_org === 'admin' || orgMembership?.role_in_org === 'owner')

    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载数据失败')
    } finally {
      setLoading(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  // 判断是否是"社区项目"组织（显示所有公开项目，不分类）
  const isCommunityOrg = organization?.name === '社区项目'

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

  // 打开申请对话框
  const handleApplyToJoin = (projectId: string, projectName: string) => {
    if (!userId) {
      alert('请先登录')
      return
    }
    setApplyingProject({ id: projectId, name: projectName })
    setApplyDialogOpen(true)
  }

  // 提交申请
  const submitApply = async (message: string) => {
    if (!applyingProject || !userId) return

    setApplyLoading(true)
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
          project_id: applyingProject.id,
          user_id: userId,
          message: message.trim() || null,
          status: 'pending'
        })

      if (error) {
        // 处理重复申请错误
        if (error.code === '23505') {
          alert('您已经申请过此项目，请等待审核结果')
          setApplyDialogOpen(false)
          setApplyingProject(null)
          setApplyLoading(false)
          return
        }
        throw error
      }

      // 获取项目的所有管理员（owner和manager）
      const { data: managers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', applyingProject.id)
        .in('role_in_project', ['owner', 'manager'])

      // 为每个管理员创建通知
      if (managers && managers.length > 0) {
        const notifications = managers.map(manager => ({
          user_id: manager.user_id,
          type: 'join_request',
          title: '新的加入申请',
          message: `${applicantProfile?.full_name || applicantProfile?.email || '用户'} 申请加入项目"${applyingProject.name}"${message.trim() ? `\n理由：${message.trim()}` : ''}`,
          metadata: {
            request_type: 'project',
            project_id: applyingProject.id,
            project_name: applyingProject.name,
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
      setApplyDialogOpen(false)
      setApplyingProject(null)
    } catch (err) {
      console.error('提交申请失败:', err)
      alert('提交申请失败，请重试')
    } finally {
      setApplyLoading(false)
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

      {/* 统一导航栏 */}
      <UnifiedNavbar
        transparent
        onOpenProfile={() => setShowProfileModal(true)}
        rightExtra={<NotificationBadge onClick={() => setShowInteractionLog(true)} />}
      />

      {/* 组织信息头部 */}
      <div className="relative border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-12 z-20">
        <div className="container mx-auto px-6 py-4">
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
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all duration-300 text-sm font-medium bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                <Plus className="w-4 h-4" />
                创建项目
              </button>
            </div>

{projectsLoading ? (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-zinc-400">加载项目中...</p>
              </div>
            ) : isCommunityOrg ? (
              /* 社区项目：显示所有公开项目，不分类 */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-2">
                    <Folder className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    所有公开项目
                    <span className="ml-3 text-lg font-normal text-zinc-500">
                      ({projects.length})
                    </span>
                  </h2>
                </div>
                {projects.length === 0 ? (
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                    <Folder className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-4">暂无公开项目</p>
                    <button
                      onClick={() => setShowCreateProject(true)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      创建第一个项目
                    </button>
                  </div>
                ) : (
                  <ProjectGrid
                    projects={projects}
                    onProjectClick={handleProjectClick}
                    onDeleteProject={handleDeleteProject}
                    onEditDescription={handleEditDescription}
                    onTogglePublic={handleTogglePublic}
                    onToggleRecruiting={handleToggleRecruiting}
                    onApplyToJoin={handleApplyToJoin}
                    userProjectPermissions={userProjectPermissions}
                    userId={userId}
                    showEditControls={true}
                    showApplyButton={true}
                    showCreatorBadge={true}
                  />
                )}
              </div>
            ) : allMyProjects.length === 0 ? (
              /* 普通组织：用户没有参与任何项目 */
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
              /* 普通组织：按照发起和参与分类显示 */
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
                      userId={userId}
                      showEditControls={true}
                      showApplyButton={false}
                      showCreatorBadge={true}
                    />
                  </div>
                )}

                {/* My Joined Projects Section */}
                {myJoinedProjects.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-2">
                        <Users className="w-5 h-5 text-blue-400" />
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
                      userId={userId}
                      showEditControls={true}
                      showApplyButton={false}
                      showCreatorBadge={true}
                    />
                  </div>
                )}
              </>
            )}

            {/* Organization Projects Section (projects user hasn't joined) - 不在社区项目中显示 */}
            {!isCommunityOrg && otherProjects.length > 0 && (
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
                  userId={userId}
                  showEditControls={false}
                  showApplyButton={true}
                  showCreatorBadge={true}
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
            loadAllData()  // 重新加载用户权限，确保新项目显示在"我的项目"中
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

      {showInteractionLog && (
        <InteractionLog onClose={() => setShowInteractionLog(false)} />
      )}

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 申请加入项目对话框 */}
      <PromptDialog
        isOpen={applyDialogOpen}
        onClose={() => {
          setApplyDialogOpen(false)
          setApplyingProject(null)
        }}
        onConfirm={submitApply}
        title={`申请加入项目"${applyingProject?.name || ''}"`}
        message="请输入申请理由（可选）"
        placeholder="介绍一下自己，说明为什么想加入这个项目..."
        confirmText="提交申请"
        cancelText="取消"
        multiline={true}
        loading={applyLoading}
      />
    </div>
  )
}
