'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const knowledgePoints = (content.knowledge_points as string[]) || []
  const socraticQuestions = (content.socratic_questions as SocraticQuestions) || {}
  const postReflection = (content.post_reflection as string[]) || []

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

        {/* 知识点 - 创意卡片网格 */}
        {knowledgePoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-green-500/20">
                💡
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">核心知识点</h2>
                <p className="text-sm text-gray-400">点击卡片与盖亚深入探讨</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgePoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredCard(`knowledge-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleKnowledgePointClick(point)}
                  className="relative group cursor-pointer"
                >
                  {/* 背景渐变效果 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300 group-hover:scale-[1.02] overflow-hidden">
                    {/* 编号标签 */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-lg">{index + 1}</span>
                    </div>

                    {/* 内容 */}
                    <div className="pr-14">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 uppercase font-semibold tracking-wider">Knowledge</span>
                      </div>
                      <p className="text-gray-100 leading-relaxed mb-4">{point}</p>
                    </div>

                    {/* 探讨按钮 */}
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: hoveredCard === `knowledge-${index}` ? 1 : 0,
                        x: hoveredCard === `knowledge-${index}` ? 0 : -10
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleKnowledgePointClick(point)
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">💬</span>
                      <span>与盖亚深入探讨</span>
                    </motion.button>

                    {/* 装饰性元素 */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/5 to-transparent rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 苏格拉底式问题 - 创意时间轴布局 */}
        {((socraticQuestions.pre_watch && socraticQuestions.pre_watch.length > 0) ||
          (socraticQuestions.during_watch && socraticQuestions.during_watch.length > 0) ||
          (socraticQuestions.post_watch && socraticQuestions.post_watch.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                🤔
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">思考之旅</h2>
                <p className="text-sm text-gray-400">跟随问题深入探索</p>
              </div>
            </div>

            <div className="relative">
              {/* 时间轴垂直线 */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500" />

              <div className="space-y-6">
                {/* 观看前思考 */}
                {socraticQuestions.pre_watch && socraticQuestions.pre_watch.map((question, index) => (
                  <motion.div
                    key={`pre-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-16"
                  >
                    {/* 时间轴节点 */}
                    <div className="absolute left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-black shadow-lg shadow-blue-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>

                    <div
                      onClick={() => handleQuestionClick(question)}
                      onMouseEnter={() => setHoveredCard(`pre-${index}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800/80 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400 transition-all duration-300 overflow-hidden">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl">
                            ❓
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-blue-400 uppercase font-semibold tracking-wider bg-blue-500/10 px-2 py-1 rounded">观看前思考</span>
                            </div>
                            <p className="text-gray-100 leading-relaxed mb-3">{question}</p>

                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: hoveredCard === `pre-${index}` ? 1 : 0,
                                y: hoveredCard === `pre-${index}` ? 0 : 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuestionClick(question)
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30 transition-all inline-flex items-center gap-2"
                            >
                              <span>💬</span>
                              <span>与盖亚深入探讨</span>
                            </motion.button>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/5 to-transparent rounded-bl-full opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* 观看中思考 */}
                {socraticQuestions.during_watch && socraticQuestions.during_watch.map((question, index) => (
                  <motion.div
                    key={`during-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (socraticQuestions.pre_watch?.length || 0) * 0.1 + index * 0.1 }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-4 border-black shadow-lg shadow-purple-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>

                    <div
                      onClick={() => handleQuestionClick(question)}
                      onMouseEnter={() => setHoveredCard(`during-${index}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800/80 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400 transition-all duration-300 overflow-hidden">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl">
                            💭
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-purple-400 uppercase font-semibold tracking-wider bg-purple-500/10 px-2 py-1 rounded">观看中思考</span>
                            </div>
                            <p className="text-gray-100 leading-relaxed mb-3">{question}</p>

                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: hoveredCard === `during-${index}` ? 1 : 0,
                                y: hoveredCard === `during-${index}` ? 0 : 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuestionClick(question)
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30 transition-all inline-flex items-center gap-2"
                            >
                              <span>💬</span>
                              <span>与盖亚深入探讨</span>
                            </motion.button>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/5 to-transparent rounded-bl-full opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* 观看后思考 */}
                {socraticQuestions.post_watch && socraticQuestions.post_watch.map((question, index) => (
                  <motion.div
                    key={`post-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ((socraticQuestions.pre_watch?.length || 0) + (socraticQuestions.during_watch?.length || 0)) * 0.1 + index * 0.1 }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-3 top-6 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-black shadow-lg shadow-orange-500/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>

                    <div
                      onClick={() => handleQuestionClick(question)}
                      onMouseEnter={() => setHoveredCard(`post-${index}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800/80 border border-orange-500/30 rounded-2xl p-6 hover:border-orange-400 transition-all duration-300 overflow-hidden">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/40 flex items-center justify-center text-3xl">
                            ✨
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-orange-400 uppercase font-semibold tracking-wider bg-orange-500/10 px-2 py-1 rounded">观看后思考</span>
                            </div>
                            <p className="text-gray-100 leading-relaxed mb-3">{question}</p>

                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: hoveredCard === `post-${index}` ? 1 : 0,
                                y: hoveredCard === `post-${index}` ? 0 : 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuestionClick(question)
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30 transition-all inline-flex items-center gap-2"
                            >
                              <span>💬</span>
                              <span>与盖亚深入探讨</span>
                            </motion.button>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/5 to-transparent rounded-bl-full opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 课后反思 - 炫彩卡片布局 */}
        {postReflection.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  onMouseEnter={() => setHoveredCard(`reflection-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleQuestionClick(reflection)}
                  className="relative group cursor-pointer"
                >
                  {/* 动态背景光晕 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-3xl p-8 hover:border-cyan-400 transition-all duration-500 overflow-hidden">
                    {/* 背景装饰图案 */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-5">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400 to-transparent rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-400 to-transparent rounded-full blur-3xl" />
                    </div>

                    {/* 左侧装饰条 */}
                    <div className="absolute left-0 top-8 bottom-8 w-1.5 bg-gradient-to-b from-cyan-400 via-teal-400 to-emerald-400 rounded-full" />

                    {/* 内容 */}
                    <div className="relative pl-6">
                      <div className="flex items-start gap-5">
                        {/* 图标容器 */}
                        <div className="flex-shrink-0">
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 rounded-2xl -rotate-6 group-hover:-rotate-12 transition-transform duration-500" />
                            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/40 flex items-center justify-center text-4xl">
                              🔮
                            </div>
                          </div>
                        </div>

                        {/* 文字内容 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-cyan-400 uppercase font-bold tracking-widest bg-gradient-to-r from-cyan-500/20 to-teal-500/20 px-3 py-1.5 rounded-full border border-cyan-500/30">
                              Reflection #{index + 1}
                            </span>
                          </div>

                          <p className="text-gray-100 text-lg leading-relaxed mb-5">{reflection}</p>

                          {/* 探讨按钮 */}
                          <motion.button
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                              opacity: hoveredCard === `reflection-${index}` ? 1 : 0,
                              scale: hoveredCard === `reflection-${index}` ? 1 : 0.95
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuestionClick(reflection)
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-rose-500/30 text-purple-300 rounded-xl text-sm font-semibold border border-purple-500/30 hover:border-purple-400/50 transition-all inline-flex items-center gap-3 shadow-lg shadow-purple-500/10"
                          >
                            <span className="text-xl">💬</span>
                            <span>与盖亚深度探讨此反思</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* 浮动粒子效果 */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-4 right-4 w-3 h-3 rounded-full bg-cyan-400 blur-sm"
                    />
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.2, 0.5, 0.2]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                      className="absolute bottom-6 right-8 w-2 h-2 rounded-full bg-teal-400 blur-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
