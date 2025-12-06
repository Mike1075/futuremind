// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { X, Send, Inbox, Mail, Trash2, Eye, MessageSquare, Check as CheckIcon, XIcon, Users, FolderOpen, Settings2, CheckSquare, Square, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InvitationCard } from './InvitationCard'
import { reviewProjectJoinRequest } from '@/lib/aip/api'
import { triggerUnreadCountRefresh } from '@/lib/aip/useUnreadCount'
import { PromptDialog } from '@/components/ui/PromptDialog'
import { Toast } from '@/components/ui/Toast'

// 检查是否是需要审核的文档通知（未处理的）
const isFileReviewNotification = (interaction: any): boolean => {
  if (interaction.interactionType !== 'notification') return false
  const notif = interaction.originalRequest
  return notif?.type === 'file_review_request'
}

// 检查文档是否待审核（未处理）
const isPendingFileReview = (interaction: any): boolean => {
  return isFileReviewNotification(interaction) && interaction.status === 'unread'
}

// 检查是否是收到的邀请通知
const isInvitationReceivedNotification = (interaction: any): boolean => {
  if (interaction.interactionType !== 'notification') return false
  const notif = interaction.originalRequest
  return notif?.type === 'invitation_received'
}

// 检查邀请是否待响应
const isPendingInvitation = (interaction: any): boolean => {
  return isInvitationReceivedNotification(interaction) && interaction.status === 'unread'
}

interface InteractionLogProps {
  onClose: () => void
  onUnreadCountChange?: () => void
}

type TabType = 'all' | 'received' | 'sent' | 'notifications'
type InteractionType = 'notification' | 'project_request'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  metadata: any
  is_read: boolean
  created_at: string
}

interface ProjectJoinRequest {
  id: string
  project_id: string
  user_id: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  user?: {
    id: string
    full_name?: string
    email?: string
  }
  project?: {
    name: string
  }
}

interface UnifiedInteraction {
  id: string
  interactionType: InteractionType
  title: string
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'read' | 'unread'
  created_at: string
  metadata?: any
  applicantName?: string
  applicantEmail?: string
  requestMessage?: string
  originalRequest?: any
}

export function InteractionLog({ onClose, onUnreadCountChange }: InteractionLogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [interactions, setInteractions] = useState<UnifiedInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  // 文档拒绝原因对话框状态
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingFile, setRejectingFile] = useState<{ interactionId: string; fileId: string } | null>(null)

  // Toast 提示
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  useEffect(() => {
    loadInteractions()

    // 实时订阅通知更新
    const supabase = createClient()
    const channel = supabase
      .channel('inbox-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        setTimeout(() => {
          loadInteractions()
          triggerUnreadCountRefresh()
        }, 500)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_join_requests'
      }, () => {
        setTimeout(() => {
          loadInteractions()
          triggerUnreadCountRefresh()
        }, 500)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadInteractions = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const allInteractions: UnifiedInteraction[] = []

      // 1. 加载notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!notifError && notifications) {
        notifications.forEach((notif: Notification) => {
          allInteractions.push({
            id: notif.id,
            interactionType: 'notification',
            title: notif.title,
            message: notif.message,
            status: notif.is_read ? 'read' : 'unread',
            created_at: notif.created_at,
            metadata: notif.metadata,
            originalRequest: notif
          })
        })
      }

      // 2. 加载用户管理的项目的加入申请
      const { data: projectMembers } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .in('role_in_project', ['owner', 'manager'])

      const managedProjectIds = projectMembers?.map(pm => pm.project_id) || []

      if (managedProjectIds.length > 0) {
        const { data: projectRequests, error: reqError } = await supabase
          .from('project_join_requests')
          .select(`
            *,
            user:user_id(id, full_name, email),
            project:project_id(name)
          `)
          .in('project_id', managedProjectIds)
          .order('created_at', { ascending: false })

        if (!reqError && projectRequests) {
          projectRequests.forEach((req: any) => {
            const applicantName = req.user?.full_name || req.user?.email || '未知用户'
            const projectName = req.project?.name || '未知项目'

            allInteractions.push({
              id: req.id,
              interactionType: 'project_request',
              title: '加入项目申请',
              message: `${applicantName} 申请加入项目"${projectName}"`,
              status: req.status,
              created_at: req.created_at,
              metadata: {
                project_id: req.project_id,
                project_name: projectName,
                applicant_id: req.user_id,
                applicant_name: applicantName
              },
              applicantName,
              applicantEmail: req.user?.email || '',
              requestMessage: req.message,
              originalRequest: req
            })
          })
        }
      }

      // 按时间倒序排列
      allInteractions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setInteractions(allInteractions)
    } catch (error) {
      console.error('加载交互记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)
    try {
      const result = await reviewProjectJoinRequest(requestId, action === 'approve' ? 'approved' : 'rejected')

      if (result.error) {
        throw new Error(result.error)
      }

      showToast(action === 'approve' ? '申请已批准' : '申请已拒绝', 'success')
      await loadInteractions()
    } catch (error: any) {
      console.error('处理申请失败:', error)
      showToast(`操作失败：${error.message || '请重试'}`, 'error')
    } finally {
      setProcessing(null)
    }
  }

  // 处理邀请响应
  const handleInvitationResponse = async (notificationId: string, invitationId: string, action: 'accept' | 'reject') => {
    setProcessing(notificationId)
    try {
      const response = await fetch('/api/aip/respond-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitationId,
          action: action
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '操作失败')
      }

      // 标记通知为已读
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      showToast(action === 'accept' ? '已接受邀请，您已加入项目' : '已拒绝邀请', 'success')
      await loadInteractions()
      triggerUnreadCountRefresh()
    } catch (error: any) {
      console.error('响应邀请失败:', error)
      showToast(`操作失败：${error.message || '请重试'}`, 'error')
    } finally {
      setProcessing(null)
    }
  }

  // 处理文档审核
  const handleFileReview = async (notificationId: string, fileId: string, action: 'approve' | 'reject', comment?: string) => {
    setProcessing(notificationId)
    try {
      const response = await fetch('/api/aip/review-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          action: action,
          comment: comment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '审核失败')
      }

      // 标记通知为已读
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      showToast(action === 'approve' ? '文档已通过审核' : '文档已拒绝', 'success')
      await loadInteractions()
      triggerUnreadCountRefresh()
    } catch (error: any) {
      console.error('审核文档失败:', error)
      showToast(`操作失败：${error.message || '请重试'}`, 'error')
    } finally {
      setProcessing(null)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setInteractions(prev =>
        prev.map(i => i.id === notificationId ? { ...i, status: 'read' as const } : i)
      )
      triggerUnreadCountRefresh()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleDelete = async (interactionId: string) => {
    try {
      const interaction = interactions.find(i => i.id === interactionId)
      if (!interaction) return

      const supabase = createClient()

      // 只能删除通知类型的记录
      if (interaction.interactionType === 'notification') {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', interactionId)

        if (error) {
          console.error('删除通知失败:', error)
          showToast('删除失败: ' + error.message, 'error')
          return
        }

        setInteractions(prev => prev.filter(i => i.id !== interactionId))
        triggerUnreadCountRefresh()
      }
    } catch (error: any) {
      console.error('删除通知失败:', error)
      showToast('删除失败: ' + (error?.message || '未知错误'), 'error')
    }
  }

  // 切换选择项
  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 判断项目是否可删除
  const canDeleteItem = (interaction: UnifiedInteraction): boolean => {
    // 待审核的项目申请不可删除
    if (interaction.interactionType === 'project_request' && interaction.status === 'pending') {
      return false
    }
    // 待审核的文档通知不可删除
    if (isPendingFileReview(interaction)) {
      return false
    }
    // 待响应的邀请不可删除
    if (isPendingInvitation(interaction)) {
      return false
    }
    return true
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    const deletableItems = filteredInteractions.filter(i => canDeleteItem(i))

    if (selectedItems.size === deletableItems.length && deletableItems.length > 0) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(deletableItems.map(i => i.id)))
    }
  }

  // 批量删除
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    const confirmDelete = window.confirm(`确定要删除选中的 ${selectedItems.size} 条记录吗？`)
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClient()

      // 分类选中项
      const notificationIds: string[] = []
      const requestIds: string[] = []

      selectedItems.forEach(id => {
        const item = interactions.find(i => i.id === id)
        if (item?.interactionType === 'notification') {
          notificationIds.push(id)
        } else if (item?.interactionType === 'project_request' && item.status !== 'pending') {
          requestIds.push(id)
        }
      })

      // 删除通知
      if (notificationIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .in('id', notificationIds)
        if (error) throw error
      }

      // 删除已处理的项目申请
      if (requestIds.length > 0) {
        const { error } = await supabase
          .from('project_join_requests')
          .delete()
          .in('id', requestIds)
        if (error) throw error
      }

      // 更新状态
      setInteractions(prev => prev.filter(i => !selectedItems.has(i.id)))
      setSelectedItems(new Set())
      setIsManageMode(false)
      triggerUnreadCountRefresh()
    } catch (error) {
      console.error('批量删除失败:', error)
      showToast('删除失败，请重试', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // 退出管理模式
  const exitManageMode = () => {
    setIsManageMode(false)
    setSelectedItems(new Set())
  }

  const toggleExpanded = async (interactionId: string) => {
    const newExpanded = new Set(expandedItems)
    const interaction = interactions.find(i => i.id === interactionId)

    if (newExpanded.has(interactionId)) {
      newExpanded.delete(interactionId)
    } else {
      newExpanded.add(interactionId)

      // 展开未读通知时自动标记为已读
      if (interaction && interaction.interactionType === 'notification' && interaction.status === 'unread') {
        await handleMarkAsRead(interactionId)
      }
    }

    setExpandedItems(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays}天前`
    } else if (diffHours > 0) {
      return `${diffHours}小时前`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`
    } else {
      return '刚刚'
    }
  }

  const getStatusBadge = (interaction: UnifiedInteraction) => {
    // 项目申请的状态显示
    if (interaction.interactionType === 'project_request') {
      if (interaction.status === 'pending') {
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full border border-yellow-500/20">待处理</span>
      }
      if (interaction.status === 'approved') {
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">已批准</span>
      }
      if (interaction.status === 'rejected') {
        return <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded-full border border-red-500/20">已拒绝</span>
      }
    }

    // 文档审核通知的状态显示
    if (isPendingFileReview(interaction)) {
      return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full border border-amber-500/20">待审核</span>
    }
    if (isFileReviewNotification(interaction) && interaction.status === 'read') {
      return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">已处理</span>
    }

    // 邀请通知的状态显示
    if (isPendingInvitation(interaction)) {
      return <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs rounded-full border border-purple-500/20">待响应</span>
    }
    if (isInvitationReceivedNotification(interaction) && interaction.status === 'read') {
      return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">已响应</span>
    }

    // 普通通知的状态显示
    if (interaction.status === 'unread') {
      return <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full border border-orange-500/20">未读</span>
    }
    return <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded-full">已读</span>
  }

  const filteredInteractions = interactions.filter(interaction => {
    if (activeTab === 'all') return true

    if (activeTab === 'received') {
      // 接收的: 项目申请 + invitation_received通知
      if (interaction.interactionType === 'project_request') return true
      if (interaction.interactionType === 'notification') {
        const notif = interaction.originalRequest as Notification
        return notif.type?.includes('request') || notif.type === 'invitation_received'
      }
    }

    if (activeTab === 'sent') {
      // 发送的: invitation_sent通知
      if (interaction.interactionType === 'notification') {
        const notif = interaction.originalRequest as Notification
        return notif.type === 'invitation_sent'
      }
      return false
    }

    if (activeTab === 'notifications') {
      // 通知类型才显示
      return interaction.interactionType === 'notification'
    }

    return true
  })

  const receivedCount = interactions.filter(i => {
    if (i.interactionType === 'project_request') return true
    if (i.interactionType === 'notification') {
      const notif = i.originalRequest as Notification
      return notif.type?.includes('request') || notif.type === 'invitation_received'
    }
    return false
  }).length
  const sentCount = interactions.filter(i => {
    if (i.interactionType === 'notification') {
      const notif = i.originalRequest as Notification
      return notif.type === 'invitation_sent'
    }
    return false
  }).length

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">消息盒子</h2>
              <p className="text-sm text-zinc-400">
                查看所有通知和申请记录
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 管理模式控制 */}
            {isManageMode ? (
              <>
                {/* 删除选中按钮 */}
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedItems.size === 0 || isDeleting}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? '删除中...' : `删除 (${selectedItems.size})`}
                </button>
                {/* 退出管理 */}
                <button
                  onClick={exitManageMode}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                  退出管理
                </button>
              </>
            ) : (
              <>
                {/* 管理按钮 */}
                {interactions.length > 0 && (
                  <button
                    onClick={() => setIsManageMode(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
                    title="管理消息"
                  >
                    <Settings2 className="h-4 w-4" />
                    管理
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            全部 ({interactions.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            接收的 ({receivedCount})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            发送的 ({sentCount})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            通知 ({interactions.filter(i => i.interactionType === 'notification').length})
          </button>
        </div>

        {/* 管理模式下的全选栏 */}
        {isManageMode && filteredInteractions.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-800/30">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={toggleSelectAll}
            >
              <div className="flex items-center justify-center w-5 h-5">
                {(() => {
                  const deletableItems = filteredInteractions.filter(i => canDeleteItem(i))
                  const isAllSelected = selectedItems.size === deletableItems.length && deletableItems.length > 0
                  return isAllSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Square className="h-5 w-5 text-zinc-500" />
                  )
                })()}
              </div>
              <span className="text-sm text-zinc-400">
                全选可删除项 ({filteredInteractions.filter(i => canDeleteItem(i)).length})
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 ml-8">
              提示：待处理的项目申请和待审核的文档不可删除，需先处理
            </p>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredInteractions.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                暂无通知
              </h3>
              <p className="text-zinc-400">
                {activeTab === 'all' && '还没有任何通知'}
                {activeTab === 'received' && '还没有收到任何通知'}
                {activeTab === 'sent' && '还没有发送任何通知'}
                {activeTab === 'notifications' && '还没有任何通知'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInteractions.map((interaction) => {
                const isExpanded = expandedItems.has(interaction.id)
                const canDelete = canDeleteItem(interaction)
                const isSelected = selectedItems.has(interaction.id)
                const isFileReview = isFileReviewNotification(interaction)
                const isPendingReview = isPendingFileReview(interaction)
                const isInvitationReceived = isInvitationReceivedNotification(interaction)
                const isPendingInvite = isPendingInvitation(interaction)

                return (
                  <div
                    key={interaction.id}
                    className={`border rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : interaction.status === 'unread' || interaction.status === 'pending'
                        ? 'border-orange-500/30 bg-orange-500/5'
                        : 'border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800'
                    }`}
                  >
                    {/* 通知头部 */}
                    <div
                      className="p-3 cursor-pointer flex items-center justify-between group"
                      onClick={() => {
                        if (isManageMode && canDelete) {
                          toggleSelectItem(interaction.id)
                        } else {
                          toggleExpanded(interaction.id)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* 管理模式下显示复选框 */}
                        {isManageMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (canDelete) {
                                toggleSelectItem(interaction.id)
                              }
                            }}
                            className={`flex-shrink-0 ${!canDelete ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={!canDelete}
                            title={!canDelete ? '待处理的申请不可删除' : '选择此项'}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Square className="h-5 w-5 text-zinc-500" />
                            )}
                          </button>
                        )}

                        <div className="flex-shrink-0">
                          {interaction.interactionType === 'project_request' ? (
                            <Users className="h-5 w-5 text-purple-500" />
                          ) : isFileReview ? (
                            <FileText className="h-5 w-5 text-amber-500" />
                          ) : (interaction.originalRequest as Notification)?.type === 'invitation_sent' ? (
                            <Send className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Inbox className="h-5 w-5 text-green-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">
                            {interaction.title}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate">
                            {interaction.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(interaction)}

                        {/* 未读/待处理标识 */}
                        {(interaction.status === 'unread' || interaction.status === 'pending') && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}

                        {/* 删除按钮 (只对可删除项显示，非管理模式) */}
                        {!isManageMode && canDelete && interaction.interactionType === 'notification' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(interaction.id)
                            }}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="删除通知"
                          >
                            <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
                          </button>
                        )}

                        {/* 邀请快捷按钮 - 直接显示在卡片上，无需展开 */}
                        {isPendingInvite && interaction.metadata?.invitation_id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInvitationResponse(interaction.id, interaction.metadata.invitation_id, 'accept')
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '接受'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInvitationResponse(interaction.id, interaction.metadata.invitation_id, 'reject')
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '拒绝'}
                            </button>
                          </div>
                        )}

                        {/* 项目申请快捷按钮 */}
                        {interaction.interactionType === 'project_request' && interaction.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRequest(interaction.id, 'approve')
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '批准'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRequest(interaction.id, 'reject')
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '拒绝'}
                            </button>
                          </div>
                        )}

                        {/* 文档审核快捷按钮 */}
                        {isPendingReview && interaction.metadata?.file_id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFileReview(interaction.id, interaction.metadata.file_id, 'approve')
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '通过'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setRejectingFile({ interactionId: interaction.id, fileId: interaction.metadata.file_id })
                                setRejectDialogOpen(true)
                              }}
                              disabled={processing === interaction.id}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {processing === interaction.id ? '...' : '拒绝'}
                            </button>
                          </div>
                        )}

                        <span className="text-xs text-zinc-500">
                          {formatDate(interaction.created_at)}
                        </span>
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 展开的详细信息 */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-zinc-800">
                        <div className="pt-3 space-y-3">
                          <p className="text-sm text-zinc-300">
                            {interaction.message}
                          </p>

                          {/* 项目申请的详细信息 */}
                          {interaction.interactionType === 'project_request' && (
                            <div className="space-y-3">
                              <div className="bg-zinc-900/50 rounded-md p-3 text-xs text-zinc-400 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>申请人: {interaction.applicantName}</span>
                                </div>
                                {interaction.applicantEmail && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    <span>邮箱: {interaction.applicantEmail}</span>
                                  </div>
                                )}
                                {interaction.metadata?.project_name && (
                                  <div className="flex items-center gap-2">
                                    <FolderOpen className="h-3 w-3" />
                                    <span>项目: {interaction.metadata.project_name}</span>
                                  </div>
                                )}
                              </div>

                              {interaction.requestMessage && (
                                <div className="bg-zinc-900/50 rounded-md p-3">
                                  <p className="text-xs text-zinc-500 mb-1">申请留言:</p>
                                  <p className="text-sm text-zinc-300">{interaction.requestMessage}</p>
                                </div>
                              )}

                              {/* 批准/拒绝按钮 (仅待处理状态) */}
                              {interaction.status === 'pending' && (
                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRequest(interaction.id, 'approve')
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors text-sm border border-green-500/20 disabled:opacity-50"
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '批准'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRequest(interaction.id, 'reject')
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors text-sm border border-red-500/20 disabled:opacity-50"
                                  >
                                    <XIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '拒绝'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 文档审核通知的详细信息和按钮 */}
                          {isFileReview && (
                            <div className="space-y-3">
                              {interaction.metadata && (
                                <div className="bg-zinc-900/50 rounded-md p-3 text-xs text-zinc-400 space-y-1">
                                  {interaction.metadata.file_title && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-3 w-3" />
                                      <span>文档: {interaction.metadata.file_title}</span>
                                    </div>
                                  )}
                                  {interaction.metadata.project_id && (
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-3 w-3" />
                                      <span>项目ID: {interaction.metadata.project_id}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 文档审核按钮 - 只对待审核的显示 */}
                              {isPendingReview && interaction.metadata?.file_id && (
                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleFileReview(interaction.id, interaction.metadata.file_id, 'approve')
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors text-sm border border-green-500/20 disabled:opacity-50"
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '通过审核'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRejectingFile({ interactionId: interaction.id, fileId: interaction.metadata.file_id })
                                      setRejectDialogOpen(true)
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors text-sm border border-red-500/20 disabled:opacity-50"
                                  >
                                    <XIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '拒绝'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 普通通知的详细信息 */}
                          {interaction.interactionType === 'notification' && !isFileReview && (
                            <>
                              {interaction.metadata && (
                                <div className="bg-zinc-900/50 rounded-md p-3 text-xs text-zinc-400 space-y-1">
                                  {interaction.metadata.target_name && (
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-3 w-3" />
                                      <span>项目: {interaction.metadata.target_name}</span>
                                    </div>
                                  )}
                                  {interaction.metadata.project_name && !interaction.metadata.target_name && (
                                    <div>项目: {interaction.metadata.project_name}</div>
                                  )}
                                  {interaction.metadata.organization_name && (
                                    <div>组织: {interaction.metadata.organization_name}</div>
                                  )}
                                  {interaction.metadata.applicant_name && (
                                    <div>申请人: {interaction.metadata.applicant_name}</div>
                                  )}
                                </div>
                              )}

                              {/* 邀请响应按钮 - 只对收到的邀请且待响应的显示 */}
                              {isInvitationReceived && isPendingInvite && interaction.metadata?.invitation_id && (
                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInvitationResponse(interaction.id, interaction.metadata.invitation_id, 'accept')
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors text-sm border border-green-500/20 disabled:opacity-50"
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '接受邀请'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInvitationResponse(interaction.id, interaction.metadata.invitation_id, 'reject')
                                    }}
                                    disabled={processing === interaction.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors text-sm border border-red-500/20 disabled:opacity-50"
                                  >
                                    <XIcon className="h-3 w-3" />
                                    {processing === interaction.id ? '处理中...' : '拒绝'}
                                  </button>
                                </div>
                              )}

                              {/* 标记为已读按钮 - 不是邀请或已响应的显示 */}
                              {interaction.status === 'unread' && !isPendingInvite && (
                                <div className="flex items-center gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(interaction.id)
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors text-sm border border-blue-500/20"
                                  >
                                    <Eye className="h-3 w-3" />
                                    标记为已读
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 拒绝文档原因对话框 */}
      <PromptDialog
        isOpen={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false)
          setRejectingFile(null)
        }}
        onConfirm={(reason) => {
          if (rejectingFile) {
            handleFileReview(rejectingFile.interactionId, rejectingFile.fileId, 'reject', reason || undefined)
          }
          setRejectDialogOpen(false)
          setRejectingFile(null)
        }}
        title="拒绝文档审核"
        message="请输入拒绝原因（可选）"
        placeholder="说明拒绝的原因，帮助上传者改进..."
        confirmText="确认拒绝"
        cancelText="取消"
        multiline={true}
      />

      {/* Toast 提示 */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
