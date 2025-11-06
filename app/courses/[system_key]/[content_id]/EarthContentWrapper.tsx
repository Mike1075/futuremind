'use client'

import { useState, useEffect } from 'react'
import { EarthContentDetail } from '@/components/courses/EarthContentDetail'
import { GaiaSidebar } from '@/components/courses/GaiaSidebar'
import type { CourseContent } from '@/lib/supabase/database.types'
import type { ItemType } from '@/lib/utils/interaction-tracker'

interface StageInfo {
  id: string
  stage_number: number
  stage_name: string
}

interface EarthContentWrapperProps {
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

export function EarthContentWrapper({
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
}: EarthContentWrapperProps) {
  const [gaiaOpen, setGaiaOpen] = useState(false)
  const [gaiaContext, setGaiaContext] = useState<{
    text: string
    type: 'knowledge_point' | 'question'
    contentId: string
    itemIndex: number
    itemType: ItemType
  } | undefined>(undefined)
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

  const handleDiscussWithGaia = (
    context: string,
    contextType: 'knowledge_point' | 'question',
    itemIndex: number,
    itemType: ItemType
  ) => {
    setGaiaContext({
      text: context,
      type: contextType,
      contentId: content.id,
      itemIndex,
      itemType
    })
    setGaiaOpen(true)
  }

  return (
    <>
      {/* 主内容区域 */}
      <div className={gaiaOpen ? 'mr-96' : ''}>
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
      </div>

      {/* 盖亚浮动按钮（当侧边栏关闭时显示） */}
      {!gaiaOpen && (
        <button
          onClick={() => setGaiaOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-2xl z-40"
          aria-label="打开盖亚对话"
        >
          🌌
        </button>
      )}

      {/* 盖亚侧边栏 */}
      <GaiaSidebar
        isOpen={gaiaOpen}
        onClose={() => {
          setGaiaOpen(false)
          setGaiaContext(undefined)
          // 触发进度刷新
          setRefreshTrigger(prev => prev + 1)
        }}
        initialContext={gaiaContext}
      />
    </>
  )
}
