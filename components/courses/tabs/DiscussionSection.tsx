// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DiscussionCard } from '../discussion/DiscussionCard'
import { CommentForm } from '../discussion/CommentForm'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  user_type: string | null
}

interface Discussion {
  id: string
  content: string
  course_content_id: string
  user_id: string
  parent_id: string | null
  likes_count: number
  created_at: string
  updated_at: string
  is_deleted: boolean
  user: Profile
  replies?: Discussion[]
}

interface DiscussionSectionProps {
  courseContentId: string
}

export function DiscussionSection({ courseContentId }: DiscussionSectionProps) {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    checkAuth()
    loadDiscussions()

    // 设置实时订阅
    const supabase = createClient()
    const channel = supabase
      .channel(`discussions:${courseContentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_discussions',
          filter: `course_content_id=eq.${courseContentId}`
        },
        () => {
          // 当有新的讨论或更新时，重新加载
          loadDiscussions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [courseContentId, refreshTrigger])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadDiscussions = async () => {
    try {
      const response = await fetch(
        `/api/discussions?course_content_id=${courseContentId}`
      )

      if (!response.ok) throw new Error('Failed to load discussions')

      const data = await response.json()
      setDiscussions(data.discussions || [])
    } catch (error) {
      console.error('Error loading discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (content: string) => {
    if (!currentUser) {
      toast.warning('请先登录')
      return
    }

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_content_id: courseContentId,
          content
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post comment')
      }

      // 触发刷新
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error(error instanceof Error ? error.message : '发表评论失败，请重试')
    }
  }

  const handleReplySubmit = async (parentId: string, content: string) => {
    if (!currentUser) {
      toast.warning('请先登录')
      return
    }

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_content_id: courseContentId,
          content,
          parent_id: parentId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post reply')
      }

      // 触发刷新
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error(error instanceof Error ? error.message : '回复失败，请重试')
    }
  }

  const handleLike = async (discussionId: string) => {
    if (!currentUser) {
      toast.warning('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/discussions/${discussionId}/like`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to like')
      }

      // 触发刷新
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error liking discussion:', error)
    }
  }

  const handleUnlike = async (discussionId: string) => {
    if (!currentUser) {
      toast.warning('请先登录')
      return
    }

    try {
      const response = await fetch(`/api/discussions/${discussionId}/like`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unlike')
      }

      // 触发刷新
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error unliking discussion:', error)
    }
  }

  const handleDelete = async (discussionId: string) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: '确定要删除这条评论吗？',
      type: 'warning'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/discussions/${discussionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete')
      }

      // 触发刷新
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting discussion:', error)
      toast.error(error instanceof Error ? error.message : '删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-3 text-gray-400">加载讨论中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          课程讨论区
        </h3>
        <p className="text-gray-400 text-sm">
          与同学们分享你的想法和疑问，互相学习共同进步
        </p>
      </div>

      {/* Comment Form */}
      {currentUser ? (
        <CommentForm
          onSubmit={handleCommentSubmit}
          placeholder="分享你的想法和疑问..."
        />
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">请先登录后参与讨论</p>
        </div>
      )}

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">暂无讨论，成为第一个发言的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              currentUserId={currentUser?.id || null}
              onReply={handleReplySubmit}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
