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
import { ShowcasePanel } from '@/components/aip/ShowcasePanel'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Settings, UserPlus, Upload, ArrowLeft, Trash2 } from 'lucide-react'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { project, loading: projectLoading } = useProject(projectId)
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useProjectTasks(projectId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'showcases' | 'members'>('overview')
  const [isManager, setIsManager] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)

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

    const loadDocuments = async () => {
      const supabase = createClient()
      setDocumentsLoading(true)
      try {
        // N8N Supabase Vector Store 把 project_id 存储在 metadata 里
        // 需要用 JSONB 查询语法：metadata->>'project_id'
        const { data, count, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact' })
          .or(`project_id.eq.${projectId},metadata->>project_id.eq.${projectId}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        setDocuments(data || [])
        setDocumentsCount(count || 0)
      } catch (error) {
        console.error('加载文档失败:', error)
      } finally {
        setDocumentsLoading(false)
      }
    }

    checkUserRole()
    loadDocuments()
  }, [projectId])

  const toggleSelectDocument = (docId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocuments(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedDocuments.size === 0) return

    const deleteCount = selectedDocuments.size
    if (!confirm(`确定要删除选中的 ${deleteCount} 份文档吗？此操作不可撤销。`)) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const idsToDelete = Array.from(selectedDocuments)
      const { error } = await supabase
        .from('documents')
        .delete()
        .in('id', idsToDelete)

      if (error) throw error

      // 先清空选择和退出管理模式
      setSelectedDocuments(new Set())
      setIsManageMode(false)

      // 重新加载文档列表
      const { data, count, error: loadError } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .or(`project_id.eq.${projectId},metadata->>project_id.eq.${projectId}`)
        .order('created_at', { ascending: false })

      if (loadError) throw loadError

      // 更新状态
      setDocuments(data || [])
      setDocumentsCount(count || 0)

      // 最后显示成功提示
      alert(`成功删除 ${deleteCount} 份文档`)
    } catch (error) {
      console.error('批量删除失败:', error)
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-cosmic-void text-starlight flex items-center justify-center">
        <div className="loader-ethereal"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-cosmic-void text-starlight flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h2 text-starlight-muted">项目不存在</h1>
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
    <div className="min-h-screen bg-cosmic-void text-starlight">
      {/* Header */}
      <div className="nav-ethereal sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-3">
              <Link
                href={project.organization_id ? `/explorer-alliance/organizations/${project.organization_id}` : '/explorer-alliance'}
                className="badge-ethereal"
                title="返回上一级"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2 text-small text-starlight-muted">
                <Link href="/explorer-alliance" className="hover:text-starlight transition-colors">
                  探索者联盟
                </Link>
                <span>/</span>
                {project.organization_id && (
                  <>
                    <Link
                      href={`/explorer-alliance/organizations/${project.organization_id}`}
                      className="hover:text-starlight transition-colors"
                    >
                      我的组织
                    </Link>
                    <span>/</span>
                  </>
                )}
                <span className="text-starlight">{project.name}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isManager && (
                <Link
                  href={`/explorer-alliance/projects/${projectId}/settings`}
                  className="badge-ethereal"
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
                <h1 className="text-h1">{project.name}</h1>
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
                <p className="text-starlight-muted mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-small text-starlight-dim">
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
              { key: 'showcases', label: '成果展示' },
              { key: 'members', label: '成员' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-2 text-small font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-purple-400'
                    : 'text-starlight-muted hover:text-starlight'
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
              <div className="card-glass">
                <h3 className="text-h3 mb-4">项目信息</h3>
                <div className="space-y-3 text-small">
                  <div className="flex justify-between">
                    <span className="text-starlight-muted">状态</span>
                    <span>{statusLabels[project.status]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-starlight-muted">创建时间</span>
                    <span>{new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-starlight-muted">更新时间</span>
                    <span>{new Date(project.updated_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-h3 mb-4">项目进度</h3>
                <div className="space-y-4">
                  {/* Percentage */}
                  <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {tasks.length > 0
                        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
                        : 0}%
                    </div>
                    <div className="text-small text-starlight-muted mt-1">完成度</div>
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
                      <div className="text-h3 text-purple-400">{tasks.length}</div>
                      <div className="text-xs text-starlight-dim">总计</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-h3 text-green-400">
                        {tasks.filter(t => t.status === 'completed').length}
                      </div>
                      <div className="text-xs text-starlight-dim">已完成</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-h3 text-blue-400">
                        {tasks.filter(t => t.status === 'in_progress').length}
                      </div>
                      <div className="text-xs text-starlight-dim">进行中</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card-glass">
                <h3 className="text-h3 mb-4">团队统计</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-h2 text-blue-400">{project.members?.length || 0}</div>
                    <div className="text-small text-starlight-muted">团队成员</div>
                  </div>
                  <div>
                    <div className="text-h2 text-amber-400">{documentsCount}</div>
                    <div className="text-small text-starlight-muted">项目文档</div>
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
                <h2 className="text-h2">任务列表</h2>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="btn-stardust"
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
                <h2 className="text-h2">项目文档</h2>
                <p className="text-small text-starlight-muted mt-1">
                  共 {documentsCount} 份文档
                  {selectedDocuments.size > 0 && (
                    <span className="ml-2 text-blue-400">（已选择 {selectedDocuments.size} 份）</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isManageMode && isManager && (
                  <>
                    <button
                      onClick={() => {
                        setIsManageMode(false)
                        setSelectedDocuments(new Set())
                      }}
                      className="badge-ethereal"
                    >
                      退出管理
                    </button>
                    <button
                      onClick={toggleSelectAll}
                      className="badge-ethereal"
                    >
                      {selectedDocuments.size === documents.length ? '取消全选' : '全选'}
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={isDeleting || selectedDocuments.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeleting ? '删除中...' : `删除 (${selectedDocuments.size})`}
                    </button>
                  </>
                )}
                {!isManageMode && isManager && documentsCount > 0 && (
                  <button
                    onClick={() => setIsManageMode(true)}
                    className="badge-ethereal flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    管理文档
                  </button>
                )}
                {isManager && (
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="btn-stardust flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    上传文档
                  </button>
                )}
              </div>
            </div>

            {documentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loader-ethereal"></div>
                <span className="ml-3 text-starlight-muted">加载文档中...</span>
              </div>
            ) : documentsCount === 0 ? (
              <div className="card-glass p-12 text-center">
                <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-h3 text-starlight mb-2">开始分享文档</h3>
                <p className="text-starlight-muted mb-6">上传项目相关文档，让团队成员快速了解项目进展</p>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="btn-stardust flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  上传第一份文档
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  // N8N把字段存在metadata里，需要兼容处理
                  const docTitle = doc.title || doc.metadata?.title || '未命名文档'
                  const isKnowledgeBase = docTitle === '项目智慧库'
                  const contentLength = doc.content?.length || 0
                  const isSelected = selectedDocuments.has(doc.id)
                  return (
                    <div
                      key={doc.id}
                      className={`card-glass transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'hover:border-zinc-600/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          {isManageMode && isManager && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectDocument(doc.id)}
                              className="w-5 h-5 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-800 cursor-pointer"
                            />
                          )}
                          <span className="text-3xl">{isKnowledgeBase ? '📚' : '📄'}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-starlight truncate">{docTitle}</h3>
                            {isKnowledgeBase && (
                              <span className="text-xs text-blue-400">系统默认</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-small text-starlight-muted">
                        <div className="flex items-center gap-2">
                          <span className="text-starlight-dim">内容:</span>
                          <span>{contentLength} 字符</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-starlight-dim">创建时间:</span>
                          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('zh-CN') : '未知'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'showcases' && (
          <ShowcasePanel projectId={projectId} />
        )}

        {activeTab === 'members' && (
          <div>
            {/* Enhanced Header with Invite Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h2">团队成员</h2>
                <p className="text-small text-starlight-muted mt-1">共 {project.members?.length || 0} 位成员</p>
              </div>
              {isManager && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="btn-stardust flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  邀请成员
                </button>
              )}
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member) => (
                <div key={member.user_id} className="card-glass hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {member.user?.full_name?.[0] || member.user?.email?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{member.user?.full_name || member.user?.email}</div>
                      <div className="text-small text-starlight-muted">
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
        organization={project.organization_id ? {
          id: project.organization_id,
          name: project.organization?.name || '未知组织',
          description: project.organization?.description || null,
          settings: {},
          created_at: '',
          updated_at: ''
        } : undefined}
        showProjectSelector={true}
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
