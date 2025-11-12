'use client'

import { useState, useEffect } from 'react'
import { X, Send, Inbox, Mail, Trash2, Eraser, Eye, MessageSquare, Check as CheckIcon, XIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InvitationCard } from './InvitationCard'

interface InteractionLogProps {
  onClose: () => void
  onUnreadCountChange?: () => void
}

type TabType = 'all' | 'received' | 'sent' | 'notifications'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  metadata: any
  is_read: boolean
  created_at: string
}

export function InteractionLog({ onClose, onUnreadCountChange }: InteractionLogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadNotifications()

    // 实时订阅通知更新
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        loadNotifications()
        onUnreadCountChange?.()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('加载通知失败:', error)
    } finally {
      setLoading(false)
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

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      onUnreadCountChange?.()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      onUnreadCountChange?.()
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  const handleClearCompleted = async () => {
    try {
      const supabase = createClient()
      const readIds = notifications.filter(n => n.is_read).map(n => n.id)

      if (readIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', readIds)

      if (error) throw error

      setNotifications(prev => prev.filter(n => !n.is_read))
      onUnreadCountChange?.()
    } catch (error) {
      console.error('清空已读失败:', error)
    }
  }

  const toggleExpanded = async (notificationId: string) => {
    const newExpanded = new Set(expandedItems)
    const notification = notifications.find(n => n.id === notificationId)

    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId)
    } else {
      newExpanded.add(notificationId)

      // 展开未读通知时自动标记为已读
      if (notification && !notification.is_read) {
        await handleMarkAsRead(notificationId)
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

  const getStatusBadge = (notification: Notification) => {
    if (!notification.is_read) {
      return <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full border border-orange-500/20">未读</span>
    }
    return <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded-full">已读</span>
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true
    if (activeTab === 'notifications') return true
    // 根据type判断是received还是sent
    if (activeTab === 'received') {
      return n.type?.includes('request') || n.type === 'invitation_received'
    }
    if (activeTab === 'sent') {
      return n.type === 'invitation_sent'
    }
    return true
  })

  const readCount = notifications.filter(n => n.is_read).length

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
            {/* 清空已读按钮 */}
            {readCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                title="清空所有已读通知"
              >
                <Eraser className="h-4 w-4" />
                清空已完成
                <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full text-xs">
                  {readCount}
                </span>
              </button>
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
            全部 ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            接收的 ({notifications.filter(n => n.type?.includes('request') || n.type === 'invitation_received').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            发送的 ({notifications.filter(n => n.type === 'invitation_sent').length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            通知 ({notifications.length})
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
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
              {filteredNotifications.map((notification) => {
                const isExpanded = expandedItems.has(notification.id)

                return (
                  <div
                    key={notification.id}
                    className={`border rounded-lg transition-all duration-200 ${
                      !notification.is_read
                        ? 'border-orange-500/30 bg-orange-500/5'
                        : 'border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800'
                    }`}
                  >
                    {/* 通知头部 */}
                    <div
                      className="p-3 cursor-pointer flex items-center justify-between group"
                      onClick={() => toggleExpanded(notification.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {notification.type === 'invitation_sent' ? (
                            <Send className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Inbox className="h-5 w-5 text-green-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate">
                            {notification.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(notification)}

                        {/* 未读标识 */}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}

                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          className="p-1 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="删除通知"
                        >
                          <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
                        </button>

                        <span className="text-xs text-zinc-500">
                          {formatDate(notification.created_at)}
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
                            {notification.message}
                          </p>

                          {notification.metadata && (
                            <div className="bg-zinc-900/50 rounded-md p-3 text-xs text-zinc-400 space-y-1">
                              {notification.metadata.project_name && (
                                <div>项目: {notification.metadata.project_name}</div>
                              )}
                              {notification.metadata.organization_name && (
                                <div>组织: {notification.metadata.organization_name}</div>
                              )}
                              {notification.metadata.applicant_name && (
                                <div>申请人: {notification.metadata.applicant_name}</div>
                              )}
                            </div>
                          )}

                          {/* 标记为已读按钮 */}
                          {!notification.is_read && (
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors text-sm border border-blue-500/20"
                              >
                                <Eye className="h-3 w-3" />
                                标记为已读
                              </button>
                            </div>
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
    </div>
  )
}
