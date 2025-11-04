'use client'

import { useState } from 'react'
import { EarthContentDetail } from '@/components/courses/EarthContentDetail'
import { GaiaSidebar } from '@/components/courses/GaiaSidebar'
import type { CourseContent } from '@/lib/supabase/database.types'

interface EarthContentWrapperProps {
  content: CourseContent
  systemKey: string
  isCompleted: boolean
  prevContent: CourseContent | null
  nextContent: CourseContent | null
}

export function EarthContentWrapper({
  content,
  systemKey,
  isCompleted,
  prevContent,
  nextContent
}: EarthContentWrapperProps) {
  const [gaiaOpen, setGaiaOpen] = useState(false)
  const [gaiaContext, setGaiaContext] = useState<{
    text: string
    type: 'knowledge_point' | 'question'
  } | undefined>(undefined)

  const handleDiscussWithGaia = (
    context: string,
    contextType: 'knowledge_point' | 'question'
  ) => {
    setGaiaContext({ text: context, type: contextType })
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
        }}
        initialContext={gaiaContext}
      />
    </>
  )
}
