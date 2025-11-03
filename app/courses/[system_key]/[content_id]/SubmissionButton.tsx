'use client'

import { useState } from 'react'
import SubmissionDialog from './SubmissionDialog'

interface SubmissionButtonProps {
  userId: string
  contentId: string
  contentTitle: string
}

export default function SubmissionButton({
  userId,
  contentId,
  contentTitle
}: SubmissionButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSuccess = () => {
    // 刷新页面以显示更新后的进度
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          bg-gradient-to-r from-purple-600 to-pink-600
          hover:from-purple-700 hover:to-pink-700
          text-white transition-all duration-200 transform hover:scale-[1.02]
          flex items-center justify-center gap-2
        "
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        提交作业/感悟
      </button>

      {isDialogOpen && (
        <SubmissionDialog
          userId={userId}
          contentId={contentId}
          contentTitle={contentTitle}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
