'use client'

import { MessageCircle } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface SocraticQuestions {
  pre_watch?: string[]
  during_watch?: string[]
  post_watch?: string[]
}

interface SocraticQuestionsV2Props {
  socraticQuestions: SocraticQuestions
  contentId: string
}

export function SocraticQuestionsV2({
  socraticQuestions,
  contentId
}: SocraticQuestionsV2Props) {
  const { confirm } = useConfirm()

  // 点击问题，打开盖亚（先检查是否已讨论过）
  const handleClickQuestion = async (question: string, stage: string) => {
    if (typeof window === 'undefined') return

    try {
      // 检查是否已讨论过
      const response = await fetch('/api/gaia/check-discussed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.discussed) {
          const shouldContinue = await confirm({
            title: '提示',
            message: '这个问题我们之前探讨过哦！\n\n要不要回顾一下之前的思考，继续深入呢？',
            type: 'warning'
          })

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

      // 未讨论过，触发新问题事件
      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', {
        detail: { question }
      }))
    } catch (error) {
      console.error('[SocraticQuestions] 检查失败，fallback:', error)
      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', {
        detail: { question }
      }))
    }
  }

  const hasQuestions =
    (socraticQuestions.pre_watch && socraticQuestions.pre_watch.length > 0) ||
    (socraticQuestions.during_watch && socraticQuestions.during_watch.length > 0) ||
    (socraticQuestions.post_watch && socraticQuestions.post_watch.length > 0)

  if (!hasQuestions) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
          🤔
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">思考之旅</h2>
          <p className="text-sm text-gray-400">带着问题去探索</p>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-purple-400 to-orange-400" />

        <div className="space-y-6">
          {/* 观看前 */}
          {socraticQuestions.pre_watch?.map((question, index) => (
            <div key={`pre-${index}`} className="relative pl-8">
              <div className="absolute left-[-1.375rem] top-6 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-4 border-black flex items-center justify-center">
                <span className="text-xs text-white font-bold">{index + 1}</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-green-500/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-green-400 uppercase font-semibold">观看前 • Pre-Watch</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
                <button
                  onClick={() => handleClickQuestion(question, 'pre_watch')}
                  className="btn-stardust flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  与盖亚深入探讨
                </button>
              </div>
            </div>
          ))}

          {/* 观看中 */}
          {socraticQuestions.during_watch?.map((question, index) => (
            <div key={`during-${index}`} className="relative pl-8">
              <div className="absolute left-[-1.375rem] top-6 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-black flex items-center justify-center">
                <span className="text-xs text-white font-bold">{index + 1}</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-purple-500/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-purple-400 uppercase font-semibold">观看中 • During-Watch</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
                <button
                  onClick={() => handleClickQuestion(question, 'during_watch')}
                  className="btn-stardust flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  与盖亚深入探讨
                </button>
              </div>
            </div>
          ))}

          {/* 观看后 */}
          {socraticQuestions.post_watch?.map((question, index) => (
            <div key={`post-${index}`} className="relative pl-8">
              <div className="absolute left-[-1.375rem] top-6 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-black flex items-center justify-center">
                <span className="text-xs text-white font-bold">{index + 1}</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-orange-500/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-orange-400 uppercase font-semibold">观看后 • Post-Watch</span>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">{question}</p>
                <button
                  onClick={() => handleClickQuestion(question, 'post_watch')}
                  className="btn-stardust flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  与盖亚深入探讨
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
