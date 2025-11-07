'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { CourseContent } from '@/lib/supabase/database.types'
import { Lock, Unlock } from 'lucide-react'
import { recordInteraction, getEarthProgress, type ItemType } from '@/lib/utils/interaction-tracker'
import { createClient } from '@/lib/supabase/client'

interface SocraticQuestions {
  pre_watch?: string[]
  during_watch?: string[]
  post_watch?: string[]
}

interface StageInfo {
  id: string
  stage_number: number
  stage_name: string
}

interface EarthContentDetailProps {
  content: CourseContent
  systemKey: string
  isCompleted: boolean
  prevContent: CourseContent | null
  nextContent: CourseContent | null
  onDiscussWithGaia: (context: string, contextType: 'knowledge_point' | 'question', itemIndex: number, itemType: ItemType) => void
  currentStage: StageInfo | null
  stageContentIds: string[]
  prevStage: StageInfo | null
  prevStageFirstContentId: string | null
  nextStage: StageInfo | null
  nextStageFirstContentId: string | null
  refreshTrigger?: number
}

export function EarthContentDetail({
  content,
  systemKey,
  isCompleted,
  prevContent,
  nextContent,
  onDiscussWithGaia,
  currentStage,
  stageContentIds,
  prevStage,
  prevStageFirstContentId,
  nextStage,
  nextStageFirstContentId,
  refreshTrigger
}: EarthContentDetailProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [stageProgress, setStageProgress] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false)
  const [contentProgress, setContentProgress] = useState(0) // 当前内容的进度
  const [showMilestone, setShowMilestone] = useState<number | null>(null) // 里程碑动画
  const [selectedProject, setSelectedProject] = useState<any>(null) // 选中的探险家项目

  // 提交相关状态
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submissionContent, setSubmissionContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any | null>(null)

  // 计算阶段进度（使用新的进度系统）
  useEffect(() => {
    const fetchStageProgress = async () => {
      if (!stageContentIds || stageContentIds.length === 0) return

      try {
        // 批量查询每个内容的进度
        const progressPromises = stageContentIds.map(id => getEarthProgress(id))
        const progressResults = await Promise.all(progressPromises)

        // 过滤掉null结果，计算平均进度
        const validResults = progressResults.filter(r => r !== null)
        if (validResults.length === 0) {
          setStageProgress(0)
          return
        }

        const totalProgress = validResults.reduce((sum, r) => sum + (r?.progress || 0), 0)
        const avgProgress = totalProgress / validResults.length
        setStageProgress(Math.round(avgProgress))

        // 检查是否达到解锁条件（80%）
        const wasUnlocked = isUnlocked
        const shouldUnlock = avgProgress >= 80

        if (!wasUnlocked && shouldUnlock) {
          // 触发解锁动画
          setShowUnlockAnimation(true)
          setTimeout(() => setShowUnlockAnimation(false), 2000)
        }

        setIsUnlocked(shouldUnlock)
      } catch (error) {
        console.error('Failed to fetch stage progress:', error)
      }
    }

    fetchStageProgress()
  }, [stageContentIds, isUnlocked])

  const knowledgePoints = (content.knowledge_points as string[]) || []
  const socraticQuestions = (content.socratic_questions as SocraticQuestions) || {}
  const postReflection = (content.post_reflection as string[]) || []
  const explorerProjects = (content.explorer_projects as any[]) || []

  // 页面访问追踪（Level 1）
  useEffect(() => {
    recordInteraction({
      contentId: content.id,
      interactionType: 'page_visit'
    })

    // 初始加载进度
    refreshProgress()
  }, [content.id])

  // 监听刷新触发器（当盖亚对话框关闭时）
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      // 延迟100ms刷新，确保数据库已更新
      setTimeout(() => {
        refreshProgress()
      }, 100)
    }
  }, [refreshTrigger])

  // 获取用户ID
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  // 刷新进度
  const refreshProgress = async () => {
    const result = await getEarthProgress(content.id)
    if (result) {
      const oldProgress = contentProgress
      setContentProgress(result.progress)

      // 检测里程碑
      if (oldProgress < 25 && result.progress >= 25) {
        triggerMilestone(25)
      } else if (oldProgress < 50 && result.progress >= 50) {
        triggerMilestone(50)
      } else if (oldProgress < 75 && result.progress >= 75) {
        triggerMilestone(75)
      } else if (oldProgress < 80 && result.progress >= 80) {
        triggerMilestone(80)
      }
    }
  }

  // 触发里程碑动画
  const triggerMilestone = (milestone: number) => {
    setShowMilestone(milestone)
    setTimeout(() => setShowMilestone(null), 3000)
  }

  const handleKnowledgePointClick = async (point: string, index: number) => {
    // 记录点击（Level 2）
    await recordInteraction({
      contentId: content.id,
      interactionType: 'knowledge_click',
      itemIndex: index,
      itemType: 'knowledge_point'
    })

    // 刷新进度
    await refreshProgress()

    // 打开盖亚对话
    onDiscussWithGaia(point, 'knowledge_point', index, 'knowledge_point')
  }

  const handleQuestionClick = async (question: string, stage: ItemType, index: number) => {
    // 记录点击（Level 2）
    await recordInteraction({
      contentId: content.id,
      interactionType: 'question_click',
      itemIndex: index,
      itemType: stage // 'pre_watch', 'during_watch', 'post_watch', 'reflection'
    })

    // 刷新进度
    await refreshProgress()

    // 打开盖亚对话
    onDiscussWithGaia(question, 'question', index, stage)
  }

  // 打开提交对话框
  const openSubmitDialog = (project: any) => {
    setSelectedProject(project)
    setSubmissionContent('')
    setUploadedFiles([])
    setSubmissionResult(null)
    setShowSubmitDialog(true)
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setUploadedFiles(prev => [...prev, ...filesArray])
    }
  }

  // 移除已选择的文件
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 提交任务
  const handleSubmitTask = async () => {
    if (!submissionContent.trim()) {
      alert('请填写提交内容')
      return
    }

    if (!userId) {
      alert('请先登录')
      return
    }

    if (!selectedProject) {
      alert('项目信息错误')
      return
    }

    try {
      setSubmitting(true)
      setUploading(true)

      // 上传文件（如果有）
      const attachments: any[] = []
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            const { fileUrl, fileName } = await uploadResponse.json()
            attachments.push({
              type: file.type.startsWith('image/') ? 'image' : 'file',
              url: fileUrl,
              name: fileName
            })
          }
        }
      }

      // 使用项目ID作为唯一标识
      const projectKey = `explorer_project_${selectedProject.id || selectedProject.title.replace(/\s+/g, '_')}`

      // 调用边缘函数进行评估
      const { data, error: functionError } = await supabase.functions.invoke('evaluate-pbl-task', {
        body: {
          user_id: userId,
          content_id: content.id,
          day_key: projectKey,
          submission_content: submissionContent,
          submission_type: 'explorer_project'
        }
      })

      if (functionError) {
        throw functionError
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // 显示评估结果
      setSubmissionResult(data)

    } catch (error) {
      console.error('Failed to submit task:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
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
                  onClick={() => handleKnowledgePointClick(point, index)}
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
                        handleKnowledgePointClick(point, index)
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
                      onClick={() => handleQuestionClick(question, 'pre_watch', index)}
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
                                handleQuestionClick(question, 'pre_watch', index)
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
                      onClick={() => handleQuestionClick(question, 'during_watch', index)}
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
                                handleQuestionClick(question, 'during_watch', index)
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
                      onClick={() => handleQuestionClick(question, 'post_watch', index)}
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
                                handleQuestionClick(question, 'post_watch', index)
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
                  onClick={() => handleQuestionClick(reflection, 'reflection', index)}
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
                              handleQuestionClick(reflection, 'reflection', index)
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

        {/* 小探险家项目 - 探索者联盟 */}
        {explorerProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
                🔬
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">探索者联盟 - 小探险家项目</h2>
                <p className="text-sm text-gray-400">动手实践，化知识为体验</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {explorerProjects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative group cursor-pointer"
                >
                  {/* 背景光晕 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/30 rounded-2xl p-6 hover:border-orange-400 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {/* 背景装饰 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-2xl" />

                    {/* 图标 */}
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                      <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/40 flex items-center justify-center text-3xl">
                        {index % 3 === 0 ? '🔭' : index % 3 === 1 ? '🧪' : '🎯'}
                      </div>
                    </div>

                    {/* 标题和副标题 */}
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{project.subtitle}</p>

                    {/* 时长 */}
                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{project.duration}</span>
                    </div>

                    {/* 目标 */}
                    <div className="flex-1 mb-4">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        <span className="text-orange-400 font-semibold">目标：</span>
                        {project.goal}
                      </p>
                    </div>

                    {/* 材料列表 */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>所需材料</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.materials?.slice(0, 3).map((material: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-800/50 text-gray-400 px-2 py-1 rounded">
                            {material}
                          </span>
                        ))}
                        {project.materials?.length > 3 && (
                          <span className="text-xs bg-gray-800/50 text-gray-400 px-2 py-1 rounded">
                            +{project.materials.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 查看详情按钮 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4 border-t border-gray-700/50"
                    >
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-orange-300 rounded-lg text-sm font-semibold border border-orange-500/30 hover:border-orange-400/50 transition-all flex items-center justify-center gap-2"
                      >
                        <span>查看详细步骤</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </motion.div>

                    {/* 浮动光点 */}
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-6 right-6 w-2 h-2 rounded-full bg-orange-400 blur-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 阶段进度条和下一阶段 */}
        {currentStage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 mb-8"
          >
            {/* 阶段标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {currentStage.stage_name}
              </h3>
              <span className="text-lg font-semibold text-green-400">
                {stageProgress}%
              </span>
            </div>

            {/* 进度条 */}
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stageProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 relative"
              >
                {/* 进度条光效 */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>

            {/* 阶段导航 - 左右布局 */}
            <div className="flex items-stretch gap-4 mt-6">
              {/* 左侧：上一阶段 */}
              {prevStage && prevStageFirstContentId ? (
                <Link href={`/courses/${systemKey}/${prevStageFirstContentId}`} className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full px-6 py-4 bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">回顾上一阶段</div>
                        <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                          {prevStage.stage_name}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {/* 右侧：下一阶段 */}
              {nextStage && (
                isUnlocked && nextStageFirstContentId ? (
                  // 解锁状态 - 可点击
                  <Link href={`/courses/${systemKey}/${nextStageFirstContentId}`} className="flex-1">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative h-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl cursor-pointer group overflow-hidden"
                    >
                      {/* 解锁动画背景 */}
                      {showUnlockAnimation && (
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 3, opacity: 0 }}
                          transition={{ duration: 1.5 }}
                          className="absolute inset-0 bg-yellow-400 rounded-xl"
                        />
                      )}

                      <div className="relative flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-white/80">下一阶段已解锁</div>
                          <div className="text-sm font-bold text-white">
                            {nextStage.stage_name}
                          </div>
                        </div>
                        <Unlock className="w-5 h-5 text-white flex-shrink-0" />
                      </div>

                      {/* 光效 */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                    </motion.div>
                  </Link>
                ) : (
                  // 锁定状态
                  <div className="flex-1">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="relative h-full px-6 py-4 bg-gray-800/30 border-2 border-gray-700/50 rounded-xl cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 opacity-50">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">
                            {stageProgress >= 80 ? '即将解锁...' : `完成${Math.ceil(80 - stageProgress)}%后解锁`}
                          </div>
                          <div className="text-sm font-medium text-gray-400">
                            {nextStage.stage_name}
                          </div>
                        </div>
                        <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      </div>

                      {/* 锁定粒子效果 */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -10, 0], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                            className="absolute w-1 h-1 bg-gray-600 rounded-full"
                            style={{ left: `${30 + i * 20}%`, top: '50%' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* 项目详情弹窗 */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                {/* 关闭按钮 */}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 标题 */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.title}</h2>
                  <p className="text-gray-400">{selectedProject.subtitle}</p>
                </div>

                {/* 时长 */}
                <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{selectedProject.duration}</span>
                </div>

                {/* 目标 */}
                {selectedProject.goal && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">🎯 项目目标</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedProject.goal}</p>
                  </div>
                )}

                {/* 材料 */}
                {selectedProject.materials && selectedProject.materials.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">📦 所需材料</h3>
                    <ul className="space-y-2">
                      {selectedProject.materials.map((material: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300">
                          <span className="text-orange-400 mt-1">•</span>
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 步骤 */}
                {selectedProject.steps && selectedProject.steps.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-3">📝 实验步骤</h3>
                    <ol className="space-y-3">
                      {selectedProject.steps.map((step: string, i: number) => (
                        <li key={i} className="flex gap-3 text-gray-300">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-semibold">
                            {i + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* 预期成果 */}
                {selectedProject.expectedOutcome && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">✨ 预期成果</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedProject.expectedOutcome}</p>
                  </div>
                )}

                {/* 提示 */}
                {selectedProject.tips && selectedProject.tips.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">💡 温馨提示</h3>
                    <ul className="space-y-2">
                      {selectedProject.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 提交作业按钮 */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => openSubmitDialog(selectedProject)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    提交作业
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 提交作业对话框 */}
        <AnimatePresence>
          {showSubmitDialog && selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-orange-500/30 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              >
                <h3 className="text-2xl font-bold mb-4 text-white">提交作业 - {selectedProject.title}</h3>

                {/* 如果没有AI评估结果，显示提交表单 */}
                {!submissionResult && (
                  <>
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="请描述你完成的项目内容和收获...&#10;&#10;提示：&#10;- 你做了什么实验或观察？&#10;- 你发现了什么有趣的现象？&#10;- 你学到了什么新知识？"
                      className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
                    />

                    {/* 文件上传区域 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        上传照片或文件（可选）
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                          <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-400">点击选择文件或拖拽到此处</p>
                            <p className="text-xs text-gray-500 mt-1">支持图片、文档等文件</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>

                    {/* 已选择的文件列表 */}
                    {uploadedFiles.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-sm font-medium text-gray-400">已选择的文件：</p>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="ml-3 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                              disabled={uploading}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 上传进度提示 */}
                    {uploading && (
                      <div className="mb-4 flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <svg className="animate-spin h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm text-orange-400">正在上传文件和提交作业...</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitTask}
                        disabled={submitting || !submissionContent.trim() || uploading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      >
                        {uploading ? '上传中...' : submitting ? '提交中...' : '确认提交'}
                      </button>
                      <button
                        onClick={() => setShowSubmitDialog(false)}
                        disabled={submitting || uploading}
                        className="px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 text-white"
                      >
                        取消
                      </button>
                    </div>
                  </>
                )}

                {/* AI评估结果 */}
                {submissionResult?.evaluation && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">提交成功！</h4>
                        <p className="text-sm text-gray-400">AI助教已完成批改</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-orange-400">评分</h5>
                        <span className="text-2xl font-bold text-white">
                          {submissionResult.evaluation.score || '-'}/100
                        </span>
                      </div>

                      {submissionResult.evaluation.feedback && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-amber-400 mb-2">反馈意见</h5>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {submissionResult.evaluation.feedback}
                          </p>
                        </div>
                      )}

                      {submissionResult.evaluation.suggestions && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-green-400 mb-2">改进建议</h5>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {submissionResult.evaluation.suggestions}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowSubmitDialog(false)
                        setSubmissionResult(null)
                        setSelectedProject(null)
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all text-white"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
