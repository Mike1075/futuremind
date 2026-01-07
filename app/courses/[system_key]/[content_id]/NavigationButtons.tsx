'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LockedNextButton } from './LockedNextButton'

interface NavigationButtonsProps {
  systemKey: string
  prevContentId: string | null
  nextContentId: string | null
  initialUnlocked: boolean
  currentHighestScore: number
}

export function NavigationButtons({
  systemKey,
  prevContentId,
  nextContentId,
  initialUnlocked,
  currentHighestScore
}: NavigationButtonsProps) {
  // 使用客户端状态管理解锁状态，这样提交作业后可以立即更新
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked)
  const [highestScore, setHighestScore] = useState(currentHighestScore)

  // 暴露给外部调用的解锁方法（通过 window 事件）
  if (typeof window !== 'undefined') {
    (window as any).__unlockNextLesson = (score: number) => {
      if (score >= 60) {
        setIsUnlocked(true)
        setHighestScore(Math.max(highestScore, score))
      }
    }
  }

  return (
    <div className="flex justify-between items-center pt-8 border-t border-gray-800">
      {prevContentId ? (
        <Link
          href={`/courses/${systemKey}/${prevContentId}`}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一天
        </Link>
      ) : (
        <div></div>
      )}

      {nextContentId ? (
        isUnlocked ? (
          <Link
            href={`/courses/${systemKey}/${nextContentId}`}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            下一天
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <LockedNextButton currentScore={highestScore} />
        )
      ) : (
        <div></div>
      )}
    </div>
  )
}
