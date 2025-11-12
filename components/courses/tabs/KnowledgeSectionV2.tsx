'use client'

import { useState } from 'react'
import { Lightbulb, MessageSquare, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface KnowledgeSectionV2Props {
  knowledgePoints: string[]
  contentId: string
}

export function KnowledgeSectionV2({
  knowledgePoints,
  contentId
}: KnowledgeSectionV2Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Record<number, string>>({})

  // 生成启发性问题
  const generateQuestion = async (point: string, index: number) => {
    if (questions[index]) {
      // 已生成过，直接展开
      setExpandedIndex(expandedIndex === index ? null : index)
      return
    }

    setLoadingIndex(index)
    setExpandedIndex(index)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase.functions.invoke('generate-inspiring-questions', {
        body: {
          topic: point,
          originalText: point,
          userId: user?.id || null,
          contentId: contentId
        }
      })

      if (!error && data?.questions) {
        setQuestions(prev => ({ ...prev, [index]: data.questions }))
      } else {
        // 失败时使用默认问题
        setQuestions(prev => ({
          ...prev,
          [index]: `很开心你对这个话题感兴趣！😊\n\n你有什么想法吗？`
        }))
      }
    } catch (error) {
      console.error('Failed to generate question:', error)
      setQuestions(prev => ({
        ...prev,
        [index]: `很开心你对这个话题感兴趣！😊\n\n你有什么想法吗？`
      }))
    } finally {
      setLoadingIndex(null)
    }
  }

  // 点击问题，打开全局盖亚
  const handleClickQuestion = (question: string) => {
    // 触发全局盖亚打开事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openGaiaWithQuestion', { detail: { question } }))
    }
  }

  if (knowledgePoints.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
        <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">本阶段暂无知识点</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-400" />
          核心知识点
        </h3>
        <p className="text-gray-400 text-sm">
          点击任意知识点，盖亚会为你生成启发性问题
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {knowledgePoints.map((point, index) => {
          const isExpanded = expandedIndex === index
          const isLoading = loadingIndex === index
          const question = questions[index]

          return (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-green-500/50 transition-all"
            >
              {/* 知识点 */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => generateQuestion(point, index)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                        Knowledge Point
                      </span>
                    </div>
                    <p className="text-gray-200 leading-relaxed text-lg">
                      {point}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    ) : (
                      <MessageSquare className={`w-5 h-5 ${isExpanded ? 'text-purple-400' : 'text-gray-600'}`} />
                    )}
                  </div>
                </div>
              </div>

              {/* 盖亚的问题 */}
              {isExpanded && question && (
                <div className="border-t border-gray-800 bg-purple-900/10 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-400 font-medium mb-2">盖亚的问题</p>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {question}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClickQuestion(question)}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                    与盖亚深入探讨
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
