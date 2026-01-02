// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SubmissionDialog from './SubmissionDialog'
import SubmissionHistory from './SubmissionHistory'

interface SubmissionButtonProps {
  userId: string
  contentId: string
  contentTitle: string
  onVisibilityChanged?: () => void
}

export default function SubmissionButton({
  userId,
  contentId,
  contentTitle,
  onVisibilityChanged
}: SubmissionButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleSuccess = (score?: number, isPublic?: boolean) => {
    // 如果是公开的高分作业，触发局部刷新
    if (score && score >= 90 && isPublic && onVisibilityChanged) {
      onVisibilityChanged()
    }
    // 刷新页面以更新解锁状态（分数>=60时解锁下一课）
    if (score && score >= 60) {
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex gap-3">
        {/* 主按钮：提交作业 */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="
            btn-stardust
            flex-1 py-4 px-6 font-semibold text-h3
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          提交作业/感悟
        </button>

        {/* 次级按钮：查看提交记录 - 使用炫彩边框效果 */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="
            btn-stardust
            px-6 py-4 font-medium text-h3
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          查看记录
        </button>
      </div>

      {isDialogOpen && (
        <SubmissionDialog
          userId={userId}
          contentId={contentId}
          contentTitle={contentTitle}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isHistoryOpen && (
        <SubmissionHistory
          userId={userId}
          contentId={contentId}
          onClose={() => setIsHistoryOpen(false)}
          onVisibilityChanged={onVisibilityChanged}
        />
      )}
    </>
  )
}
