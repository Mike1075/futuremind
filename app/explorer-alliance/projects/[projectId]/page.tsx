// @ts-nocheck
'use client'

import { use, useState, useEffect } from 'react'
import { useProject, useProjectTasks } from '@/lib/aip/hooks'
import { TaskList } from '@/components/aip/TaskList'
import { CreateTaskModal } from '@/components/aip/CreateTaskModal'
import { FloatingChatBot } from '@/components/aip/FloatingChatBot'
import { NotificationBadge } from '@/components/aip/NotificationBadge'
import { InteractionLog } from '@/components/aip/InteractionLog'
import { PendingRequestsPanel } from '@/components/aip/PendingRequestsPanel'
import { FileUploadModal } from '@/components/aip/FileUploadModal'
import { InviteModal } from '@/components/aip/InviteModal'
import { ShowcasePanel } from '@/components/aip/ShowcasePanel'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Settings, UserPlus, Upload, ArrowLeft, Trash2, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { project, loading: projectLoading } = useProject(projectId)
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useProjectTasks(projectId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'showcases' | 'members'>('overview')
  const [isManager, setIsManager] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [showRenameDialog, setShowRenameDialog] = useState<{id: string, title: string} | null>(null)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [showInteractionLog, setShowInteractionLog] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

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

      setIsMember(!!membership)
      setIsManager(membership?.role_in_project === 'manager' || membership?.role_in_project === 'owner')
    }

    const loadDocuments = async () => {
      const supabase = createClient()
      setDocumentsLoading(true)
      try {
        // 从 project_files 表查询原始上传文件（不是分块数据）
        const { data, count, error } = await supabase
          .from('project_files')
          .select('*', { count: 'exact' })
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) throw error

        // 如果有数据，单独获取上传者信息
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(d => d.user_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          // 合并用户信息
          const docsWithUploader = data.map(doc => ({
            ...doc,
            uploader: profiles?.find(p => p.id === doc.user_id) || null
          }))
          setDocuments(docsWithUploader)
        } else {
          setDocuments([])
        }
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

  // 刷新文档列表的函数
  const refreshDocuments = async () => {
    const supabase = createClient()
    setDocumentsLoading(true)
    try {
      const { data, count, error } = await supabase
        .from('project_files')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const docsWithUploader = data.map(doc => ({
          ...doc,
          uploader: profiles?.find(p => p.id === doc.user_id) || null
        }))
        setDocuments(docsWithUploader)
      } else {
        setDocuments([])
      }
      setDocumentsCount(count || 0)
    } catch (error) {
      console.error('加载文档失败:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }

  // 重命名文档
  const handleRenameDocument = async () => {
    if (!showRenameDialog || !newDocTitle.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('project_files')
        .update({ title: newDocTitle.trim() })
        .eq('id', showRenameDialog.id)

      if (error) throw error

      // 更新本地状态
      setDocuments(docs => docs.map(doc =>
        doc.id === showRenameDialog.id
          ? { ...doc, title: newDocTitle.trim() }
          : doc
      ))

      setShowRenameDialog(null)
      setNewDocTitle('')
      alert('文档已重命名')
    } catch (error) {
      console.error('重命名失败:', error)
      alert('重命名失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 审核文档
  const handleReviewDocument = async (docId: string, action: 'approve' | 'reject', comment?: string) => {
    setReviewingDocId(docId)
    try {
      const response = await fetch('/api/aip/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: docId,
          action: action,
          comment: comment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '审核失败')
      }

      setShowRejectDialog(null)
      setRejectComment('')
      // 先刷新数据，确保用户看到更新后的状态
      await refreshDocuments()
      alert(action === 'approve' ? '文档已通过审核' : '文档已拒绝')
    } catch (error) {
      console.error('审核文档失败:', error)
      alert('审核失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setReviewingDocId(null)
    }
  }

  // 过滤可见的文档
  // 规则：待审核/已拒绝的文档只有上传者和管理员可见，已通过的文档所有成员可见
  const visibleDocuments = documents.filter(doc => {
    const isOwnDoc = !!(doc.user_id && userId && doc.user_id === userId)
    const isPending = doc.review_status === 'pending'
    const isRejected = doc.review_status === 'rejected'

    // 已通过的文档所有成员可见
    if (doc.review_status === 'approved') return true
    // 待审核或已拒绝的文档只有上传者和管理员可见
    if (isPending || isRejected) return isOwnDoc || isManager
    // 默认显示（兼容旧数据，没有 review_status 的文档）
    return true
  })

  // 待审核数量（管理员专用）
  const pendingCount = documents.filter(doc => doc.review_status === 'pending').length

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

      // 1. 获取要删除的文件的标题（用于删除对应的分块）
      const filesToDelete = documents.filter(doc => idsToDelete.includes(doc.id))
      const titlesToDelete = filesToDelete.map(doc => doc.title)

      // 2. 删除 project_files 记录
      const { error: fileError } = await supabase
        .from('project_files')
        .delete()
        .in('id', idsToDelete)

      if (fileError) throw fileError

      // 3. 删除对应的 documents 分块（通过 title 和 project_id 匹配）
      // 使用 metadata->>'title' 匹配，因为 N8N 存储在 metadata 里
      for (const title of titlesToDelete) {
        await supabase
          .from('documents')
          .delete()
          .or(`project_id.eq.${projectId},metadata->>project_id.eq.${projectId}`)
          .or(`title.eq.${title},metadata->>title.eq.${title}`)
      }

      // 先清空选择和退出管理模式
      setSelectedDocuments(new Set())
      setIsManageMode(false)

      // 重新加载文档列表
      const { data, count, error: loadError } = await supabase
        .from('project_files')
        .select(`
          *,
          uploader:profiles!project_files_user_id_fkey(full_name)
        `, { count: 'exact' })
        .eq('project_id', projectId)
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
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
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
    <div className="min-h-screen text-white">
      {/* 统一导航栏 */}
      <UnifiedNavbar
        onOpenProfile={() => setShowProfileModal(true)}
        rightExtra={<NotificationBadge onClick={() => setShowInteractionLog(true)} />}
      />

      {/* 项目信息头部 */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-12 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb with Back Button */}
            <div className="flex items-center gap-3">
              <Link
                href={project.organization_id ? `/explorer-alliance/organizations/${project.organization_id}` : '/explorer-alliance'}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                title="返回上一级"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/explorer-alliance" className="hover:text-white transition-colors">
                  探索者联盟
                </Link>
                <span>/</span>
                {project.organization_id && (
                  <>
                    <Link
                      href={`/explorer-alliance/organizations/${project.organization_id}`}
                      className="hover:text-white transition-colors"
                    >
                      我的组织
                    </Link>
                    <span>/</span>
                  </>
                )}
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
              { key: 'overview', label: '概览', memberOnly: false },
              { key: 'tasks', label: '任务', memberOnly: true },
              { key: 'documents', label: '文档', memberOnly: true },
              { key: 'showcases', label: '成果展示', memberOnly: false },
              { key: 'members', label: '成员', memberOnly: true },
            ].filter(tab => isMember || !tab.memberOnly).map((tab) => (
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
                <p className="text-sm text-gray-400 mt-1">
                  共 {visibleDocuments.length} 份文档
                  {isManager && pendingCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                      {pendingCount} 份待审核
                    </span>
                  )}
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
                      className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg transition-colors"
                    >
                      退出管理
                    </button>
                    <button
                      onClick={toggleSelectAll}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
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
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    管理文档
                  </button>
                )}
                {/* 所有成员都能上传文档，普通成员上传后需要审核 */}
                {isMember && (
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
                  >
                    <Upload className="w-5 h-5" />
                    上传文档
                  </button>
                )}
              </div>
            </div>

            {documentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">加载文档中...</span>
              </div>
            ) : visibleDocuments.length === 0 ? (
              <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-zinc-700/50 rounded-xl p-12 text-center">
                <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">开始分享文档</h3>
                <p className="text-gray-400 mb-6">
                  上传项目相关文档，让团队成员快速了解项目进展
                  {!isManager && <span className="block text-yellow-400 text-sm mt-1">您上传的文档需要项目管理员审核后才能进入知识库</span>}
                </p>
                {isMember && (
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 mx-auto"
                  >
                    <Upload className="w-5 h-5" />
                    上传第一份文档
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleDocuments.map((doc) => {
                  const isSelected = selectedDocuments.has(doc.id)
                  const uploaderName = doc.uploader?.full_name || '未知用户'
                  const fileSize = doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : '未知'
                  const fileIcon = doc.file_type?.includes('pdf') ? '📄' :
                                   doc.file_type?.includes('word') ? '📝' : '📰'
                  const isPending = doc.review_status === 'pending'
                  const isRejected = doc.review_status === 'rejected'
                  const isApproved = doc.review_status === 'approved'

                  // 获取审核状态样式
                  const getStatusStyle = () => {
                    if (isPending) return 'border-yellow-500/50 bg-yellow-500/5'
                    if (isRejected) return 'border-red-500/50 bg-red-500/5'
                    return 'border-zinc-700/50'
                  }

                  // 检查是否是自己的文件（确保 userId 不为空）
                  const isOwnFile = !!(doc.user_id && userId && doc.user_id === userId)

                  return (
                    <div
                      key={doc.id}
                      className={`bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border rounded-xl p-6 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : getStatusStyle() + ' hover:border-zinc-600/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isManageMode && isManager && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectDocument(doc.id)}
                              className="w-5 h-5 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-800 cursor-pointer flex-shrink-0"
                            />
                          )}
                          <span className="text-3xl flex-shrink-0">{fileIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-white truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]" title={doc.title}>{doc.title}</h3>
                              {/* 审核状态标签 */}
                              {isPending && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 whitespace-nowrap flex-shrink-0">
                                  待审核
                                </span>
                              )}
                              {isApproved && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 whitespace-nowrap flex-shrink-0">
                                  已通过
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 whitespace-nowrap flex-shrink-0">
                                  已拒绝
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 truncate max-w-[150px] sm:max-w-[180px]">{doc.file_name}</p>
                          </div>
                        </div>
                        {/* 重命名和删除按钮 - 管理员或自己的文件可操作 */}
                        {(isManager || isOwnFile) && !isManageMode && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* 重命名按钮 */}
                            <button
                              onClick={() => {
                                setShowRenameDialog({ id: doc.id, title: doc.title })
                                setNewDocTitle(doc.title)
                              }}
                              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-zinc-400 hover:text-blue-400"
                              title="重命名文档"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {/* 删除按钮 */}
                            <button
                              onClick={async () => {
                                if (!confirm(`确定要删除文档"${doc.title}"吗？此操作不可撤销。`)) return
                                const supabase = createClient()
                                try {
                                  await supabase.from('project_files').delete().eq('id', doc.id)
                                  // 刷新文档列表
                                  const { data, count } = await supabase
                                    .from('project_files')
                                    .select('*', { count: 'exact' })
                                    .eq('project_id', projectId)
                                    .order('created_at', { ascending: false })
                                  if (data) {
                                    const userIds = [...new Set(data.map(d => d.user_id))]
                                    const { data: profiles } = await supabase
                                      .from('profiles')
                                      .select('id, full_name')
                                      .in('id', userIds)
                                    setDocuments(data.map(d => ({
                                      ...d,
                                      uploader: profiles?.find(p => p.id === d.user_id) || null
                                    })))
                                  }
                                  setDocumentsCount(count || 0)
                                  alert('文档已删除')
                                } catch (err) {
                                  console.error('删除失败:', err)
                                  alert('删除失败')
                                }
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                              title="删除文档"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">上传者:</span>
                          <span>{uploaderName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">大小:</span>
                          <span>{fileSize}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">上传时间:</span>
                          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('zh-CN') : '未知'}</span>
                        </div>
                        {/* 显示拒绝原因 */}
                        {isRejected && doc.review_comment && (
                          <div className="pt-2 border-t border-zinc-700/50">
                            <span className="text-red-400 text-xs">拒绝原因：{doc.review_comment}</span>
                          </div>
                        )}
                        {/* 审核按钮 - 管理员可对待审核文档进行审核 */}
                        {isManager && isPending && (
                          <div className="flex gap-2 pt-3 mt-3 border-t border-zinc-700/50">
                            <button
                              onClick={() => handleReviewDocument(doc.id, 'approve')}
                              disabled={reviewingDocId === doc.id}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {reviewingDocId === doc.id ? '处理中...' : '通过'}
                            </button>
                            <button
                              onClick={() => setShowRejectDialog(doc.id)}
                              disabled={reviewingDocId === doc.id}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 拒绝文档对话框 */}
            {showRejectDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-96">
                  <h4 className="text-lg font-semibold text-white mb-4">拒绝文档</h4>
                  <textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="请输入拒绝原因（可选）..."
                    className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowRejectDialog(null)
                        setRejectComment('')
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleReviewDocument(showRejectDialog, 'reject', rejectComment)}
                      disabled={reviewingDocId === showRejectDialog}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      确认拒绝
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 重命名文档对话框 */}
            {showRenameDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-96">
                  <h4 className="text-lg font-semibold text-white mb-4">重命名文档</h4>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="请输入新的文档名称..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameDocument()
                      if (e.key === 'Escape') {
                        setShowRenameDialog(null)
                        setNewDocTitle('')
                      }
                    }}
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowRenameDialog(null)
                        setNewDocTitle('')
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleRenameDocument}
                      disabled={!newDocTitle.trim() || newDocTitle.trim() === showRenameDialog.title}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      确认
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'showcases' && (
          <ShowcasePanel projectId={projectId} isMember={isMember} />
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
          onSuccess={async () => {
            // 重新加载文档列表和数量
            const supabase = createClient()
            const { data, count, error } = await supabase
              .from('project_files')
              .select('*', { count: 'exact' })
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })

            if (!error && data) {
              // 获取上传者信息
              const userIds = [...new Set(data.map(d => d.user_id))]
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds)

              const docsWithUploader = data.map(doc => ({
                ...doc,
                uploader: profiles?.find(p => p.id === doc.user_id) || null
              }))
              setDocuments(docsWithUploader)
            }
            setDocumentsCount(count || 0)
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
          projectId={projectId}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Interaction Log */}
      {showInteractionLog && (
        <InteractionLog onClose={() => setShowInteractionLog(false)} />
      )}

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
