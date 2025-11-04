'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Trash2, User } from 'lucide-react'
import { CommentForm } from './CommentForm'

interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  user_type: string | null
}

interface Discussion {
  id: string
  content: string
  user_id: string
  likes_count: number
  created_at: string
  updated_at: string
  user: Profile
  replies?: Discussion[]
}

interface DiscussionCardProps {
  discussion: Discussion
  currentUserId: string | null
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (discussionId: string) => Promise<void>
  onUnlike: (discussionId: string) => Promise<void>
  onDelete: (discussionId: string) => Promise<void>
  isReply?: boolean
}

export function DiscussionCard({
  discussion,
  currentUserId,
  onReply,
  onLike,
  onUnlike,
  onDelete,
  isReply = false
}: DiscussionCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [localLikesCount, setLocalLikesCount] = useState(discussion.likes_count)

  const isOwnComment = currentUserId === discussion.user_id

  // 检查是否已点赞
  useEffect(() => {
    if (!currentUserId) return

    const checkLikeStatus = async () => {
      try {
        const response = await fetch(
          `/api/discussions/likes?discussion_ids=${discussion.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setIsLiked(data.likes[discussion.id] || false)
        }
      } catch (error) {
        console.error('Error checking like status:', error)
      }
    }

    checkLikeStatus()
  }, [discussion.id, currentUserId])

  const handleLikeToggle = async () => {
    if (!currentUserId) {
      alert('请先登录')
      return
    }

    // 乐观更新
    const previousLiked = isLiked
    const previousCount = localLikesCount

    setIsLiked(!isLiked)
    setLocalLikesCount(prev => prev + (isLiked ? -1 : 1))

    try {
      if (isLiked) {
        await onUnlike(discussion.id)
      } else {
        await onLike(discussion.id)
      }
    } catch (error) {
      // 回滚
      setIsLiked(previousLiked)
      setLocalLikesCount(previousCount)
    }
  }

  const handleReplySubmit = async (content: string) => {
    await onReply(discussion.id, content)
    setShowReplyForm(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUserBadge = (userType: string | null) => {
    if (userType === 'principal' || userType === 'teacher') {
      return (
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
          教师
        </span>
      )
    }
    return null
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg ${isReply ? 'ml-12' : ''}`}>
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            {discussion.user.avatar_url ? (
              <img
                src={discussion.user.avatar_url}
                alt={discussion.user.username || '用户'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white">
                {discussion.user.username || '匿名用户'}
              </span>
              {getUserBadge(discussion.user.user_type)}
              <span className="text-xs text-gray-500">
                {formatTime(discussion.created_at)}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {discussion.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-13 text-sm">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 transition-colors ${
              isLiked
                ? 'text-red-400 hover:text-red-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{localLikesCount > 0 ? localLikesCount : '点赞'}</span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>回复</span>
          </button>

          {isOwnComment && (
            <button
              onClick={() => onDelete(discussion.id)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder={`回复 ${discussion.user.username || '匿名用户'}...`}
              autoFocus
              onCancel={() => setShowReplyForm(false)}
              submitLabel="回复"
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="border-t border-white/10 pt-4 space-y-4">
          {discussion.replies.map((reply) => (
            <DiscussionCard
              key={reply.id}
              discussion={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onLike={onLike}
              onUnlike={onUnlike}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}
