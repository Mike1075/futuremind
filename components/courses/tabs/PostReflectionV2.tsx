'use client'

import { MessageCircle } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface PostReflectionV2Props {
  postReflection: string[]
  contentId: string
}

export function PostReflectionV2({
  postReflection,
  contentId
}: PostReflectionV2Props) {
  const { confirm } = useConfirm()

  // 点击反思问题，打开盖亚（先检查是否已讨论过）
  const handleClickReflection = async (reflection: string) => {
    if (typeof window === 'undefined') return

    try {
      // 检查是否已讨论过
      const response = await fetch('/api/gaia/check-discussed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: reflection })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.discussed) {
          const shouldContinue = await confirm({
            title: '提示',
            message: '这个反思我们之前聊过哦！\n\n要不要回顾一下之前的思考，继续深化认识呢？',
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
        detail: { question: reflection }
      }))
    } catch (error) {
      console.error('[PostReflection] 检查失败，fallback:', error)
      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', {
        detail: { question: reflection }
      }))
    }
  }

  if (postReflection.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
          🌟
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">课后反思</h2>
          <p className="text-sm text-gray-400">沉淀思考，内化学习</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {postReflection.map((reflection, index) => (
          <div
            key={index}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 group-hover:scale-[1.02] overflow-hidden">
              {/* 装饰性背景 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/5 to-transparent rounded-bl-full" />

              {/* 编号标签 */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-400/20 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-cyan-400 font-bold text-lg">{index + 1}</span>
              </div>

              {/* 内容 */}
              <div className="pr-14">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-400 uppercase font-semibold tracking-wider">Reflection</span>
                </div>
                <p className="text-gray-100 leading-relaxed text-lg mb-4">{reflection}</p>
              </div>

              {/* 探讨按钮 */}
              <button
                onClick={() => handleClickReflection(reflection)}
                className="btn-stardust w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                与盖亚深入探讨
              </button>

              {/* 装饰性元素 */}
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-teal-400/5 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
