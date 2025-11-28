// @ts-nocheck
'use client'

import { MessageCircle } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface DuringWatchThinkingProps {
  questions: string[]
  contentId: string
}

export function DuringWatchThinking({ questions, contentId }: DuringWatchThinkingProps) {
  // 点击问题，打开盖亚（先检查是否已讨论过）
  const handleClickQuestion = async (question: string) => {
    if (typeof window === 'undefined') return

    try {
      const response = await fetch('/api/gaia/check-discussed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.discussed) {
          const shouldContinue = window.confirm(
            '💡 这个问题我们之前探讨过哦！\n\n要不要回顾一下之前的思考，继续深入呢？'
          )
          if (shouldContinue) {
            window.dispatchEvent(new CustomEvent('scrollToDiscussion', {
              detail: {
                conversationId: data.conversationId,
                messageIndex: data.messageIndex,
                totalMessages: data.messageCount
              }
            }))
          }
          return
        }
      }

      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', {
        detail: { question }
      }))
    } catch (error) {
      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', {
        detail: { question }
      }))
    }
  }

  if (!questions || questions.length === 0) {
    return null
  }

  return (
    <CollapsibleSection
      title="观看中思考"
      subtitle="观看视频时，带着这些问题去思考"
      icon="💭"
      iconBgClass="bg-gradient-to-br from-purple-400 to-violet-500 shadow-purple-500/20"
    >
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={index}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-xs text-purple-400 uppercase font-semibold">During-Watch</span>
            </div>
            <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
            <button
              onClick={() => handleClickQuestion(question)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              与盖亚深入探讨
            </button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}
