'use client'

import { useState } from 'react'
import SubmissionButton from './SubmissionButton'
import { PublicSubmissions } from '@/components/courses/PublicSubmissions'

interface CourseContentClientProps {
  userId: string
  contentId: string
  contentTitle: string
}

export function CourseContentClient({
  userId,
  contentId,
  contentTitle
}: CourseContentClientProps) {
  const [publicSubmissionsRefreshKey, setPublicSubmissionsRefreshKey] = useState(0)

  const handleVisibilityChanged = () => {
    // 增加refreshKey以触发PublicSubmissions重新加载
    setPublicSubmissionsRefreshKey(prev => prev + 1)
  }

  return (
    <>
      {/* 作业提交按钮 */}
      <div className="mb-8">
        <SubmissionButton
          userId={userId}
          contentId={contentId}
          contentTitle={contentTitle}
          onVisibilityChanged={handleVisibilityChanged}
        />
      </div>

      {/* 优秀作业展示区域 */}
      <div className="mb-12 pt-12 border-t border-gray-800">
        <PublicSubmissions
          contentId={contentId}
          limit={12}
          refreshKey={publicSubmissionsRefreshKey}
        />
      </div>
    </>
  )
}
