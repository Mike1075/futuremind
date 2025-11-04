'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CourseContent } from '@/lib/supabase/database.types'

interface SocraticQuestions {
  pre_watch?: string[]
  during_watch?: string[]
  post_watch?: string[]
}

interface EarthContentDetailProps {
  content: CourseContent
  systemKey: string
  isCompleted: boolean
  prevContent: CourseContent | null
  nextContent: CourseContent | null
  onDiscussWithGaia: (context: string, contextType: 'knowledge_point' | 'question') => void
}

export function EarthContentDetail({
  content,
  systemKey,
  isCompleted,
  prevContent,
  nextContent,
  onDiscussWithGaia
}: EarthContentDetailProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['knowledge']))

  const knowledgePoints = (content.knowledge_points as string[]) || []
  const socraticQuestions = (content.socratic_questions as SocraticQuestions) || {}
  const postReflection = (content.post_reflection as string[]) || []

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handleKnowledgePointClick = (point: string) => {
    onDiscussWithGaia(point, 'knowledge_point')
  }

  const handleQuestionClick = (question: string) => {
    onDiscussWithGaia(question, 'question')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href={`/courses/${systemKey}`}
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回课程
        </Link>

        {/* 内容头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {isCompleted && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
                ✓ 已完成
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-xl text-gray-400 mb-6">{content.subtitle}</p>
          )}
        </div>

        {/* 知识点 */}
        {knowledgePoints.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => toggleSection('knowledge')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                💡 核心知识点
              </h2>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedSections.has('knowledge') ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('knowledge') && (
              <div className="space-y-3">
                {knowledgePoints.map((point, index) => (
                  <div
                    key={index}
                    onClick={() => handleKnowledgePointClick(point)}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-green-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs text-gray-500 uppercase font-medium">Knowledge Point</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{point}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleKnowledgePointClick(point)
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        💬 与盖亚探讨
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 苏格拉底式问题 - 观看前 */}
        {socraticQuestions.pre_watch && socraticQuestions.pre_watch.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => toggleSection('pre_watch')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                🤔 观看前思考
              </h2>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedSections.has('pre_watch') ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('pre_watch') && (
              <div className="space-y-3">
                {socraticQuestions.pre_watch.map((question, index) => (
                  <div
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-blue-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">❓</span>
                          <span className="text-xs text-gray-500 uppercase font-medium">Before Watching</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{question}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuestionClick(question)
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        💬 与盖亚探讨
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 苏格拉底式问题 - 观看中 */}
        {socraticQuestions.during_watch && socraticQuestions.during_watch.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => toggleSection('during_watch')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                🎬 观看中思考
              </h2>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedSections.has('during_watch') ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('during_watch') && (
              <div className="space-y-3">
                {socraticQuestions.during_watch.map((question, index) => (
                  <div
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">💭</span>
                          <span className="text-xs text-gray-500 uppercase font-medium">While Watching</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{question}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuestionClick(question)
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        💬 与盖亚探讨
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 苏格拉底式问题 - 观看后 */}
        {socraticQuestions.post_watch && socraticQuestions.post_watch.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => toggleSection('post_watch')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                📝 观看后思考
              </h2>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedSections.has('post_watch') ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('post_watch') && (
              <div className="space-y-3">
                {socraticQuestions.post_watch.map((question, index) => (
                  <div
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-orange-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">✨</span>
                          <span className="text-xs text-gray-500 uppercase font-medium">After Watching</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{question}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuestionClick(question)
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        💬 与盖亚探讨
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 课后反思 */}
        {postReflection.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => toggleSection('reflection')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                🌟 课后反思
              </h2>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedSections.has('reflection') ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('reflection') && (
              <div className="space-y-3">
                {postReflection.map((reflection, index) => (
                  <div
                    key={index}
                    onClick={() => handleQuestionClick(reflection)}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🔮</span>
                          <span className="text-xs text-gray-500 uppercase font-medium">Reflection</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{reflection}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuestionClick(reflection)
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        💬 与盖亚探讨
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 导航按钮 */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-800">
          {prevContent ? (
            <Link
              href={`/courses/${systemKey}/${prevContent.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一课
            </Link>
          ) : (
            <div />
          )}

          {nextContent ? (
            <Link
              href={`/courses/${systemKey}/${nextContent.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded-lg transition-opacity"
            >
              下一课
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href={`/courses/${systemKey}`}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              完成课程 ✓
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
