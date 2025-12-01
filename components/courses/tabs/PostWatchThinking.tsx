// @ts-nocheck
'use client'

import { MessageCircle } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'

interface PostWatchThinkingProps {
  questions: string[]
  reflections: string[]
  contentId: string
}

export function PostWatchThinking({ questions, reflections, contentId }: PostWatchThinkingProps) {
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

  // 合并 post_watch 问题和 post_reflection 反思
  const allItems = [
    ...questions.map(q => ({ type: 'question' as const, content: q })),
    ...reflections.map(r => ({ type: 'reflection' as const, content: r }))
  ]

  if (allItems.length === 0) {
    return null
  }

  return (
    <CollapsibleSection
      title="观看后思考 Post-Watch"
      subtitle="看完视频后，深化理解与反思"
      icon="🌟"
      iconBgClass=""
    >
      <div className="space-y-4">
        {allItems.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-orange-500/30 to-amber-500/30 text-orange-400 border border-orange-500/30 text-sm font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-gray-200 leading-relaxed mb-4">{item.content}</p>
                <button
                  onClick={() => handleClickQuestion(item.content)}
                  className="btn-stardust flex items-center gap-2 px-4 py-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  与盖亚深入探讨
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}
