// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { EarthContentDetail } from '@/components/courses/EarthContentDetail'
import type { Database } from '@/types/database'

type CourseContent = Database['public']['Tables']['course_contents']['Row']

interface StageInfo {
  id: string
  stage_number: number
  stage_name: string
}

interface EarthContentWrapperV2Props {
  content: CourseContent
  systemKey: string
  isCompleted: boolean
  prevContent: CourseContent | null
  nextContent: CourseContent | null
  currentStage: StageInfo | null
  stageContentIds: string[]
  prevStage: StageInfo | null
  prevStageFirstContentId: string | null
  nextStage: StageInfo | null
  nextStageFirstContentId: string | null
}

export function EarthContentWrapperV2({
  content,
  systemKey,
  isCompleted,
  prevContent,
  nextContent,
  currentStage,
  stageContentIds,
  prevStage,
  prevStageFirstContentId,
  nextStage,
  nextStageFirstContentId
}: EarthContentWrapperV2Props) {
  const [refreshTrigger, setRefreshTrigger] = useState(0) // 用于触发进度刷新

  // 自动记录访问
  useEffect(() => {
    const recordVisit = async () => {
      try {
        await fetch('/api/progress/visit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId: content.id })
        })
      } catch (error) {
        // 静默失败，不影响用户体验
        console.error('Failed to record visit:', error)
      }
    }

    recordVisit()
  }, [content.id])

  // 旧的handler - 保持兼容性，但不实际使用
  const handleDiscussWithGaia = () => {
    // 不再使用独立的盖亚侧边栏，所有对话统一到全局盖亚
    // 这个函数保留只是为了满足接口要求
  }

  return (
    <EarthContentDetail
      content={content}
      systemKey={systemKey}
      isCompleted={isCompleted}
      prevContent={prevContent}
      nextContent={nextContent}
      onDiscussWithGaia={handleDiscussWithGaia}
      currentStage={currentStage}
      stageContentIds={stageContentIds}
      prevStage={prevStage}
      prevStageFirstContentId={prevStageFirstContentId}
      nextStage={nextStage}
      nextStageFirstContentId={nextStageFirstContentId}
      refreshTrigger={refreshTrigger}
    />
  )
}
