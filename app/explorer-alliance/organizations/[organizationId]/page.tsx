'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Plus, UserPlus, Folder } from 'lucide-react'
import { useOrganizationProjects, useProjectTasks } from '@/lib/aip/hooks'
import { ChatBot } from '@/components/aip/ChatBot'
import { ProjectGrid } from '@/components/aip/ProjectGrid'
import { CompactTaskList } from '@/components/aip/CompactTaskList'
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
  const [userProjectPermissions, setUserProjectPermissions] = useState<Record<string, 'manager' | 'member' | 'none'>>({})
  const [userId, setUserId] = useState<string | null>(null)

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

      const permissions: Record<string, 'manager' | 'member' | 'none'> = {}
      memberships?.forEach(m => {
        permissions[m.project_id] = m.role_in_project as 'manager' | 'member'
      })
      setUserProjectPermissions(permissions)
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

  // Split projects into user's projects and other projects
  const myProjects = projects.filter(p => userProjectPermissions[p.id] === 'manager' || userProjectPermissions[p.id] === 'member')
  const otherProjects = projects.filter(p => !userProjectPermissions[p.id] || userProjectPermissions[p.id] === 'none')

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

  const handleEditDescription = async (projectId: string, projectName: string, currentDescription: string) => {
    const newDescription = prompt(`编辑项目"${projectName}"的描述:`, currentDescription)
    if (newDescription === null) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({ description: newDescription })
        .eq('id', projectId)

      if (error) throw error

      alert('项目描述已更新')
      reloadProjects()
    } catch (err) {
      console.error('更新描述失败:', err)
      alert('更新描述失败')
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

    if (!confirm(`确定要申请加入项目"${projectName}"吗？`)) return

    try {
      const supabase = createClient()

      // Create a notification for project managers
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'project_join_request',
          title: '新的项目加入申请',
          message: `有用户申请加入项目"${projectName}"`,
          metadata: { project_id: projectId }
        })

      if (error) throw error

      alert('申请已提交，等待项目管理员审核')
    } catch (err) {
      console.error('提交申请失败:', err)
      alert('提交申请失败')
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
            {/* My Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  我的项目
                  <span className="ml-3 text-lg font-normal text-zinc-500">
                    ({myProjects.length})
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    创建项目
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    邀请成员
                  </button>
                </div>
              </div>

              {projectsLoading ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-zinc-400">加载项目中...</p>
                </div>
              ) : myProjects.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                  <Folder className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-4">你还没有参与任何项目</p>
                  <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                    创建第一个项目
                  </button>
                </div>
              ) : (
                <ProjectGrid
                  projects={myProjects}
                  onProjectClick={handleProjectClick}
                  onDeleteProject={handleDeleteProject}
                  onEditDescription={handleEditDescription}
                  onTogglePublic={handleTogglePublic}
                  onToggleRecruiting={handleToggleRecruiting}
                  userProjectPermissions={userProjectPermissions}
                  showEditControls={true}
                  showApplyButton={false}
                />
              )}
            </div>

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
      <ChatBot />
    </div>
  )
}
