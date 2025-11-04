'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
  onCancel?: () => void
  submitLabel?: string
}

export function CommentForm({
  onSubmit,
  placeholder = '写下你的评论...',
  autoFocus = false,
  onCancel,
  submitLabel = '发表'
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || submitting) return

    if (content.trim().length < 5) {
      alert('评论内容至少需要5个字符')
      return
    }

    if (content.trim().length > 2000) {
      alert('评论内容不能超过2000个字符')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('') // 清空输入框
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={submitting}
        className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none"
        rows={3}
      />
      <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {content.length > 0 && (
            <span className={content.length > 2000 ? 'text-red-400' : ''}>
              {content.length} / 2000
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || submitting || content.length > 2000}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
