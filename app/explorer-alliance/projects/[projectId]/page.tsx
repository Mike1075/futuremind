'use client'

import { use, useState, useEffect } from 'react'
import { useProject, useProjectTasks } from '@/lib/aip/hooks'
import { TaskList } from '@/components/aip/TaskList'
import { CreateTaskModal } from '@/components/aip/CreateTaskModal'
import { FloatingChatBot } from '@/components/aip/FloatingChatBot'
import { NotificationBadge } from '@/components/aip/NotificationBadge'
import { PendingRequestsPanel } from '@/components/aip/PendingRequestsPanel'
import { FileUploadModal } from '@/components/aip/FileUploadModal'
import { InviteModal } from '@/components/aip/InviteModal'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Settings, UserPlus, Upload, ArrowLeft } from 'lucide-react'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { project, loading: projectLoading } = useProject(projectId)
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useProjectTasks(projectId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'members'>('overview')
  const [isManager, setIsManager] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [documentsCount, setDocumentsCount] = useState(0)

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return
      setUserId(user.id)

      const { data: membership } = await supabase
        .from('project_members')
        .select('role_in_project')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      setIsManager(membership?.role_in_project === 'manager' || membership?.role_in_project === 'owner')
    }

    const loadDocumentsCount = async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      setDocumentsCount(count || 0)
    }

    checkUserRole()
    loadDocumentsCount()
  }, [projectId])

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-400">项目不存在</h1>
          <Link href="/explorer-alliance" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    archived: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }

  const statusLabels = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/explorer-alliance"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                title="返回探索者联盟"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/explorer-alliance" className="hover:text-white transition-colors">
                  探索者联盟
                </Link>
                <span>/</span>
                <span className="text-white">{project.name}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isManager && (
                <Link
                  href={`/explorer-alliance/projects/${projectId}/settings`}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                  title="项目设置"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              )}
              <NotificationBadge />
            </div>
          </div>

          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <span className={`text-xs px-3 py-1 rounded border ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                {project.is_public && (
                  <span className="text-xs px-3 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    公开
                  </span>
                )}
                {project.is_recruiting && (
                  <span className="text-xs px-3 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                    招募中
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-gray-400 mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                {project.creator && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>创建者: {project.creator.full_name || project.creator.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{project.members?.length || 0} 成员</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-white/10">
            {[
              { key: 'overview', label: '概览' },
              { key: 'tasks', label: '任务' },
              { key: 'documents', label: '文档' },
              { key: 'members', label: '成员' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Project Info */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">项目信息</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态</span>
                    <span>{statusLabels[project.status]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">创建时间</span>
                    <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">更新时间</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">项目进度</h3>
                <div className="space-y-4">
                  {/* Percentage */}
                  <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {tasks.length > 0
                        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-400 mt-1">完成度</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                      style={{
                        width: `${tasks.length > 0
                          ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>

                  {/* Task Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-xl font-bold text-purple-400">{tasks.length}</div>
                      <div className="text-xs text-gray-500">总计</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-xl font-bold text-green-400">
                        {tasks.filter(t => t.status === 'completed').length}
                      </div>
                      <div className="text-xs text-gray-500">已完成</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-xl font-bold text-blue-400">
                        {tasks.filter(t => t.status === 'in_progress').length}
                      </div>
                      <div className="text-xs text-gray-500">进行中</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">团队统计</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{project.members?.length || 0}</div>
                    <div className="text-sm text-gray-400">团队成员</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">{documentsCount}</div>
                    <div className="text-sm text-gray-400">项目文档</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Pending Requests Panel - Only for Managers */}
            {isManager && (
              <PendingRequestsPanel
                projectId={projectId}
                type="project"
              />
            )}

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">任务列表</h2>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  + 创建任务
                </button>
              </div>
              <TaskList tasks={tasks} loading={tasksLoading} projectId={projectId} onUpdate={reloadTasks} />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">项目文档</h2>
                <p className="text-sm text-gray-400 mt-1">共 {documentsCount} 份文档</p>
              </div>
              {isManager && (
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                >
                  <Upload className="w-5 h-5" />
                  上传文档
                </button>
              )}
            </div>

            {documentsCount === 0 ? (
              <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-zinc-700/50 rounded-xl p-12 text-center">
                <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">开始分享文档</h3>
                <p className="text-gray-400 mb-6">上传项目相关文档，让团队成员快速了解项目进展</p>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  上传第一份文档
                </button>
              </div>
            ) : (
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <p className="text-center text-zinc-400">共 {documentsCount} 份文档</p>
                <p className="text-center text-zinc-500 text-sm mt-2">点击"上传文档"按钮查看和管理文档</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            {/* Enhanced Header with Invite Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">团队成员</h2>
                <p className="text-sm text-gray-400 mt-1">共 {project.members?.length || 0} 位成员</p>
              </div>
              {isManager && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  <UserPlus className="w-5 h-5" />
                  邀请成员
                </button>
              )}
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member) => (
                <div key={member.user_id} className="bg-black/30 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {member.user?.full_name?.[0] || member.user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{member.user?.full_name || member.user?.email}</div>
                      <div className="text-sm text-gray-400">
                        {member.role_in_project === 'owner' ? '所有者' :
                         member.role_in_project === 'manager' ? '管理员' : '成员'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FloatingChatBot */}
      <FloatingChatBot
        currentProject={project}
        showProjectSelector={false}
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUploadModal
          projectId={projectId}
          onClose={() => setShowFileUpload(false)}
          onSuccess={() => {
            // 重新加载文档数量
            const loadDocumentsCount = async () => {
              const supabase = createClient()
              const { count } = await supabase
                .from('project_documents')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectId)

              setDocumentsCount(count || 0)
            }
            loadDocumentsCount()
          }}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTask(false)}
          onSuccess={() => {
            setShowCreateTask(false)
            reloadTasks()
          }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  )
}
