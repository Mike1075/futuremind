// @ts-nocheck
'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface PreWatchThinkingProps {
  questions: string[]
  contentId: string
}

export function PreWatchThinking({ questions, contentId }: PreWatchThinkingProps) {
  // 确认对话框状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDiscussion, setPendingDiscussion] = useState<{
    conversationId: string
    messageIndex: number
    messageCount: number
  } | null>(null)

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
          setPendingDiscussion({
            conversationId: data.conversationId,
            messageIndex: data.messageIndex,
            messageCount: data.messageCount
          })
          setConfirmOpen(true)
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

  const handleConfirmContinue = () => {
    if (pendingDiscussion) {
      window.dispatchEvent(new CustomEvent('scrollToDiscussion', {
        detail: {
          conversationId: pendingDiscussion.conversationId,
          messageIndex: pendingDiscussion.messageIndex,
          totalMessages: pendingDiscussion.messageCount
        }
      }))
    }
    setConfirmOpen(false)
    setPendingDiscussion(null)
  }

  if (!questions || questions.length === 0) {
    return null
  }

  return (
    <>
      <CollapsibleSection
        title="观看前思考 Pre-Watch"
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
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border border-green-500/30 text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
                  <button
                    onClick={() => handleClickQuestion(question)}
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setPendingDiscussion(null)
        }}
        onConfirm={handleConfirmContinue}
        title="💡 之前探讨过"
        message="这个问题我们之前探讨过哦！要不要回顾一下之前的思考，继续深入呢？"
        confirmText="回顾讨论"
        cancelText="取消"
      />
    </>
  )
}
