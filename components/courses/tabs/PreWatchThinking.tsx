// @ts-nocheck
'use client'

import { MessageCircle } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface PreWatchThinkingProps {
  questions: string[]
  contentId: string
}

export function PreWatchThinking({ questions, contentId }: PreWatchThinkingProps) {
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
      title="观看前思考"
      subtitle="在观看视频之前，先思考这些问题"
      icon="🤔"
      iconBgClass=""
    >
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-green-500/50 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border border-green-500/30 text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-xs text-green-400 uppercase font-semibold">Pre-Watch</span>
            </div>
            <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
            <button
              onClick={() => handleClickQuestion(question)}
              className="btn-stardust flex items-center gap-2 px-4 py-2"
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
