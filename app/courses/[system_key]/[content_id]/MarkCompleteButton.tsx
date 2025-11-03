'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MarkCompleteButtonProps {
  userId: string
  courseSystemId: string
  contentId: string
  initialCompleted: boolean
}

export default function MarkCompleteButton({
  userId,
  courseSystemId,
  contentId,
  initialCompleted
}: MarkCompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const toggleComplete = async () => {
    const newCompletedState = !isCompleted

    // 乐观更新UI
    setIsCompleted(newCompletedState)

    startTransition(async () => {
      try {
        // 检查是否已存在进度记录
        const { data: existingProgress } = await (supabase
          .from('user_progress') as any)
          .select('id')
          .eq('user_id', userId)
          .eq('content_id', contentId)
          .single()

        if (existingProgress) {
          // 更新现有记录
          const { error } = await (supabase
            .from('user_progress') as any)
            .update({
              completed: newCompletedState,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id)

          if (error) throw error
        } else {
          // 创建新记录
          const { error } = await (supabase
            .from('user_progress') as any)
            .insert({
              user_id: userId,
              course_system_id: courseSystemId,
              content_id: contentId,
              completed: newCompletedState,
              progress_percentage: newCompletedState ? 100 : 0
            })

          if (error) throw error
        }
      } catch (error) {
        console.error('标记完成状态失败:', error)
        // 回滚UI
        setIsCompleted(!newCompletedState)
        alert('操作失败，请重试')
      }
    })
  }

  return (
    <button
      onClick={toggleComplete}
      disabled={isPending}
      className={`
        w-full py-4 px-6 rounded-lg font-semibold text-lg
        transition-all duration-200 transform
        ${isCompleted
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isPending ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          处理中...
        </span>
      ) : isCompleted ? (
        <span className="flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          已完成！点击取消
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          标记为已完成
        </span>
      )}
    </button>
  )
}
