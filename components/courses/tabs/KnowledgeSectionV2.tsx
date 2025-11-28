// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, MessageSquare, Loader2, Sparkles, Check } from 'lucide-react'

interface KnowledgeSectionV2Props {
  knowledgePoints: string[]
  contentId: string
}

interface QuestionData {
  question: string
  questionIndex: number
  hasResponded: boolean
}

export function KnowledgeSectionV2({
  knowledgePoints,
  contentId
}: KnowledgeSectionV2Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Record<number, QuestionData>>({})
  const [prefetching, setPrefetching] = useState(false)

  // 页面加载时预获取所有问题
  useEffect(() => {
    if (knowledgePoints.length > 0 && !prefetching) {
      prefetchAllQuestions()
    }
  }, [contentId, knowledgePoints.length])

  // 批量预获取所有知识点的问题
  const prefetchAllQuestions = async () => {
    setPrefetching(true)

    // 并行获取所有问题
    const promises = knowledgePoints.map(async (point, index) => {
      try {
        const response = await fetch('/api/knowledge-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            knowledgePointIndex: index,
            knowledgePointText: point
          })
        })

        if (response.ok) {
          const data = await response.json()
          return {
            index,
            data: {
              question: data.question,
              questionIndex: data.questionIndex,
              hasResponded: data.hasResponded
            }
          }
        }
      } catch (error) {
        // 静默失败，用户点击时会再次尝试
      }
      return null
    })

    const results = await Promise.all(promises)

    // 更新所有成功获取的问题
    const newQuestions: Record<number, QuestionData> = {}
    results.forEach(result => {
      if (result) {
        newQuestions[result.index] = result.data
      }
    })

    setQuestions(prev => ({ ...prev, ...newQuestions }))
    setPrefetching(false)
  }

  // 点击知识点时获取问题
  const fetchQuestion = async (point: string, index: number) => {
    const existingQuestion = questions[index]

    // 如果已回答过，直接展开/收起（使用缓存）
    if (existingQuestion?.hasResponded) {
      setExpandedIndex(expandedIndex === index ? null : index)
      return
    }

    // 未回答的问题：每次点击都重新获取（实现随机变化）
    setLoadingIndex(index)
    setExpandedIndex(index)

    try {
      const response = await fetch('/api/knowledge-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          knowledgePointIndex: index,
          knowledgePointText: point
        })
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(prev => ({
          ...prev,
          [index]: {
            question: data.question,
            questionIndex: data.questionIndex,
            hasResponded: data.hasResponded
          }
        }))
      } else {
        // 失败时使用默认问题（无夸赞）
        setQuestions(prev => ({
          ...prev,
          [index]: {
            question: `这个概念与你的日常生活有什么联系？你能想到哪些具体的例子来说明它？`,
            questionIndex: -1,
            hasResponded: false
          }
        }))
      }
    } catch (error) {
      setQuestions(prev => ({
        ...prev,
        [index]: {
          question: `这个概念与你的日常生活有什么联系？你能想到哪些具体的例子来说明它？`,
          questionIndex: -1,
          hasResponded: false
        }
      }))
    } finally {
      setLoadingIndex(null)
    }
  }

  // 点击问题，打开全局盖亚并标记已回复
  const handleClickQuestion = async (question: string, knowledgePointIndex: number) => {
    if (typeof window === 'undefined') {
      return
    }

    // 标记用户已回复（用户点击"与盖亚深入探讨"即视为已回复）
    try {
      await fetch('/api/knowledge-questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          knowledgePointIndex
        })
      })

      // 更新本地状态
      setQuestions(prev => ({
        ...prev,
        [knowledgePointIndex]: {
          ...prev[knowledgePointIndex],
          hasResponded: true
        }
      }))
    } catch (error) {
      // 忽略错误，不影响主流程
    }

    try {
      // 先检查这个问题是否已经讨论过
      const response = await fetch('/api/gaia/check-discussed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.discussed) {
          // 问题已讨论过，触发跳转到历史记录的事件
          const shouldContinue = window.confirm(
            '💡 这个话题我们之前聊过哦！\n\n要不要回顾一下之前的讨论，继续深入探讨呢？'
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

      // 问题未讨论过，正常触发新问题事件
      const event = new CustomEvent('openGaiaWithQuestion', { detail: { question } })
      window.dispatchEvent(event)
    } catch (error) {
      // 出错时 fallback 到正常流程
      const event = new CustomEvent('openGaiaWithQuestion', { detail: { question } })
      window.dispatchEvent(event)
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
      <div className="grid grid-cols-1 gap-4">
        {knowledgePoints.map((point, index) => {
          const isExpanded = expandedIndex === index
          const isLoading = loadingIndex === index
          const questionData = questions[index]

          return (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-green-500/50 transition-all"
            >
              {/* 知识点 */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => fetchQuestion(point, index)}
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
                      {questionData?.hasResponded && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          已探讨
                        </span>
                      )}
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
              {isExpanded && questionData && (
                <div className="border-t border-gray-800 bg-purple-900/10 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-purple-400 font-medium">盖亚的问题</p>
                        {questionData.hasResponded && (
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            这是你的专属问题
                          </span>
                        )}
                      </div>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {questionData.question}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClickQuestion(questionData.question, index)}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {questionData.hasResponded ? '继续探讨' : '与盖亚深入探讨'}
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
