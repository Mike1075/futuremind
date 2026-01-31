// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { CourseContent } from '@/lib/supabase/database.types'
import { recordInteraction, getEarthProgress, type ItemType } from '@/lib/utils/interaction-tracker'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { KnowledgeSectionV2 } from '@/components/courses/tabs/KnowledgeSectionV2'
import { CollapsibleSection } from '@/components/courses/tabs/CollapsibleSection'
import { PreWatchThinking } from '@/components/courses/tabs/PreWatchThinking'
import { DuringWatchThinking } from '@/components/courses/tabs/DuringWatchThinking'
import { PostWatchThinking } from '@/components/courses/tabs/PostWatchThinking'
import { Play, ExternalLink } from 'lucide-react'
import { PublicSubmissions } from '@/components/courses/PublicSubmissions'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'
import { globalToast } from '@/components/ui/ToastProvider'
import { StageProgressSection } from '@/components/courses/StageProgressSection'
import { SubmissionHistoryModal } from '@/components/courses/SubmissionHistoryModal'

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
  const [stageProgress, setStageProgress] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false)
  const [contentProgress, setContentProgress] = useState(0) // 当前内容的进度
  const [showMilestone, setShowMilestone] = useState<number | null>(null) // 里程碑动画
  const [selectedProject, setSelectedProject] = useState<any>(null) // 选中的探险家项目
  const [showProfileModal, setShowProfileModal] = useState(false) // 个人资料弹窗

  // 提交相关状态
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submissionContent, setSubmissionContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any | null>(null)
  const [isPublic, setIsPublic] = useState(false) // 作业是否公开（默认私密）

  // 提交记录相关状态
  const [showSubmissionsHistory, setShowSubmissionsHistory] = useState(false)
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyProject, setHistoryProject] = useState<any>(null) // 当前查看提交记录的项目

  // 公开作业刷新机制
  const [publicSubmissionsRefreshKey, setPublicSubmissionsRefreshKey] = useState(0)

  // 文件输入ref（用于重置以允许重复选择同一文件）
  const fileInputRef = useRef<HTMLInputElement>(null)

  // PF-02: 使用useCallback优化fetchStageProgress
  const fetchStageProgress = useCallback(async () => {
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
      // 保留1位小数
      setStageProgress(Number(avgProgress.toFixed(1)))

      // 检查是否达到解锁条件（60%）
      const wasUnlocked = isUnlocked
      const shouldUnlock = avgProgress >= 60

      if (!wasUnlocked && shouldUnlock) {
        // 触发解锁动画
        setShowUnlockAnimation(true)
        setTimeout(() => setShowUnlockAnimation(false), 2000)
      }

      setIsUnlocked(shouldUnlock)
    } catch (error) {
      // 静默处理错误
    }
  }, [stageContentIds, isUnlocked])

  // 计算阶段进度（使用新的进度系统）
  useEffect(() => {
    fetchStageProgress()
  }, [fetchStageProgress])

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

  // 打开提交对话框
  const openSubmitDialog = (project: any) => {
    setSelectedProject(project)
    setSubmissionContent('')
    setUploadedFiles([])
    setSubmissionResult(null)
    setIsPublic(false) // 默认私密
    setShowSubmitDialog(true)
  }

  // 处理文件选择（只允许图片，自动压缩）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const filesArray = Array.from(e.target.files)
    // 重置 input 值，允许再次选择相同的文件
    e.target.value = ''
    const processedFiles: File[] = []

    // 允许的图片格式
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    for (const file of filesArray) {
      // 验证文件类型：只允许图片
      if (!file.type.startsWith('image/') || !allowedImageTypes.includes(file.type)) {
        globalToast.error(`不支持的文件格式: ${file.name}\n只支持图片格式: JPG, PNG, GIF, WEBP`)
        continue
      }

      // 如果图片大于1MB，自动压缩
      if (file.size > 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 1,          // 压缩到最大1MB
            maxWidthOrHeight: 1920, // 最大宽高1920px
            useWebWorker: true,
            fileType: file.type as any
          }

          const compressedFile = await imageCompression(file, options)

          // 保持原文件名
          const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type })
          processedFiles.push(renamedFile)
        } catch (error) {
          // 压缩失败，使用原图
          processedFiles.push(file)
        }
      } else {
        // 小于1MB，直接使用
        processedFiles.push(file)
      }
    }

    if (processedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...processedFiles])
    }

    // 重置文件输入，允许用户再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 移除已选择的文件
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 获取提交记录（根据具体项目过滤）
  const fetchSubmissionsHistory = async (project: any) => {
    if (!project) return

    setLoadingHistory(true)
    try {
      // 计算项目的唯一标识（与提交时一致）
      const projectKey = `explorer_project_${project.id || project.title.replace(/\s+/g, '_')}`

      // 使用dayKey参数过滤特定项目的提交
      const response = await fetch(`/api/submissions?contentId=${content.id}&dayKey=${encodeURIComponent(projectKey)}`)
      if (response.ok) {
        const { submissions } = await response.json()
        setSubmissionsHistory(submissions || [])
      }
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoadingHistory(false)
    }
  }

  // 删除提交记录（供子组件调用）
  const handleDeleteSubmission = async (submissionId: string, wasPublic: boolean) => {
    const response = await fetch(`/api/submissions?id=${submissionId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '删除失败')
    }

    // 立即从本地状态中移除
    setSubmissionsHistory(prev => prev.filter(s => s.id !== submissionId))

    // 如果删除的是公开作业，刷新优秀作业展示
    if (wasPublic) {
      setPublicSubmissionsRefreshKey(prev => prev + 1)
    }
  }

  // 切换作业可见性（供子组件调用）
  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    const isCurrentlyPublic = currentIsPublic ?? false

    const response = await fetch('/api/submissions/toggle-visibility', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submissionId,
        isPublic: !isCurrentlyPublic
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '切换失败')
    }

    const result = await response.json()
    const actualIsPublic = result.isPublic

    // 更新本地状态
    setSubmissionsHistory(prev => prev.map(s =>
      s.id === submissionId
        ? { ...s, is_public: actualIsPublic }
        : s
    ))

    // 触发公开作业列表刷新
    setPublicSubmissionsRefreshKey(prev => prev + 1)
  }

  // 提交任务
  const handleSubmitTask = async () => {
    if (!submissionContent.trim()) {
      globalToast.warning('请填写提交内容')
      return
    }

    if (!userId) {
      globalToast.warning('请先登录')
      return
    }

    if (!selectedProject) {
      globalToast.error('项目信息错误')
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

          const uploadResponse = await fetch('/api/submissions/upload', {
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
          submission_type: 'project_deliverable',
          attachments: attachments, // 传递附件信息
          is_public: isPublic // 传递作业可见性设置
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
      globalToast.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* 半透明渐变覆盖层 - 让星空背景透出 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20 pointer-events-none" />

      {/* 统一导航栏 */}
      <UnifiedNavbar
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回课程',
          href: `/courses/${systemKey}`
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* 内容头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {isCompleted && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                ✓ 已完成
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
            {content.title}
          </h1>
        </div>

        {/* 1. 视频链接 - 使用副标题作为标题 */}
        {content.documentary_url && (
          <CollapsibleSection
            title={content.subtitle || "课程视频"}
            subtitle="点击观看本阶段的视频内容"
            icon={<Play className="w-6 h-6 text-white" />}
            iconBgClass="bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20"
          >
            <a
              href={content.documentary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl hover:border-red-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">观看视频</p>
                  <p className="text-sm text-gray-400 truncate max-w-md">{content.documentary_url}</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </a>
          </CollapsibleSection>
        )}

        {/* 2. 观看前思考 */}
        <PreWatchThinking
          questions={socraticQuestions.pre_watch || []}
          contentId={content.id}
        />

        {/* 3. 观看中思考 */}
        <DuringWatchThinking
          questions={socraticQuestions.during_watch || []}
          contentId={content.id}
        />

        {/* 4. 观看后思考 */}
        <PostWatchThinking
          questions={socraticQuestions.post_watch || []}
          reflections={postReflection}
          contentId={content.id}
        />

        {/* 5. 核心知识点 */}
        {knowledgePoints.length > 0 && (
          <CollapsibleSection
            title="核心知识点 Knowledge Points"
            subtitle="点击任意知识点，盖亚会为你生成启发性问题"
            icon="💡"
            iconBgClass="bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/20"
          >
            <KnowledgeSectionV2
              knowledgePoints={knowledgePoints}
              contentId={content.id}
            />
          </CollapsibleSection>
        )}

        {/* 6. 小探险家项目 */}
        {explorerProjects.length > 0 && (
          <CollapsibleSection
            title="小探险家项目"
            subtitle="动手实践，化知识为体验"
            icon="🔬"
            iconBgClass="bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 shadow-orange-500/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {explorerProjects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -3 }}
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
                        className="btn-stardust w-full px-4 py-3 flex items-center justify-center gap-2"
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
          </CollapsibleSection>
        )}

        {/* 阶段进度条和下一阶段 */}
        {currentStage && (
          <StageProgressSection
            currentStage={currentStage}
            stageProgress={stageProgress}
            isUnlocked={isUnlocked}
            showUnlockAnimation={showUnlockAnimation}
            systemKey={systemKey}
            prevStage={prevStage}
            prevStageFirstContentId={prevStageFirstContentId}
            nextStage={nextStage}
            nextStageFirstContentId={nextStageFirstContentId}
          />
        )}

        {/* 优秀作业展示区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 mb-12 pt-12 border-t border-gray-800"
        >
          <PublicSubmissions
            contentId={content.id}
            limit={12}
            refreshKey={publicSubmissionsRefreshKey}
          />
        </motion.div>

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

                {/* 提交作业和查看记录按钮 */}
                <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
                  <button
                    onClick={() => openSubmitDialog(selectedProject)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    提交作业
                  </button>

                  <button
                    onClick={() => {
                      setHistoryProject(selectedProject)
                      setShowSubmissionsHistory(true)
                      fetchSubmissionsHistory(selectedProject)
                    }}
                    className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 border border-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    查看提交记录
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 提交作业对话框 - 玻璃透明效果 */}
        <AnimatePresence>
          {showSubmitDialog && selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitDialog(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">提交作业 - {selectedProject.title}</h3>

                {/* 如果没有AI评估结果，显示提交表单 */}
                {!submissionResult && (
                  <>
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="请描述你完成的项目内容和收获...&#10;&#10;提示：&#10;- 你做了什么实验或观察？&#10;- 你发现了什么有趣的现象？&#10;- 你学到了什么新知识？"
                      className="w-full h-48 bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 mb-4 transition-all"
                    />

                    {/* 文件上传区域 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        上传照片或文件（可选）
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                          <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-orange-500/50 hover:bg-white/5 transition-all">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-300">点击选择图片或拖拽到此处</p>
                            <p className="text-xs text-gray-500 mt-1">仅支持图片格式 (JPG, PNG, GIF, WEBP)</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
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
                        <p className="text-sm font-medium text-gray-300">已选择的文件：</p>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
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

                    {/* 公开/私密选项 */}
                    <div className="mb-4 bg-white/5 border border-white/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">作业可见性</h4>
                          <p className="text-xs text-gray-400">
                            {isPublic
                              ? '你的作业将对其他同学公开展示（需评分≥85分）'
                              : '你的作业仅自己和老师可见'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPublic(!isPublic)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                            isPublic ? 'bg-orange-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isPublic ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded ${
                          isPublic ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-400'
                        }`}>
                          {isPublic ? '公开' : '私密'}
                        </span>
                      </div>
                    </div>

                    {/* 隐私警告（仅在选择公开时显示） */}
                    {isPublic && (
                      <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-cyan-400 mb-1">隐私提示</h5>
                            <ul className="text-xs text-gray-300 space-y-1">
                              <li>• 仅评分达到85分及以上的作业会被公开展示</li>
                              <li>• 展示内容包括：你的姓名、作业内容和提交时间</li>
                              <li>• 老师可以隐藏任何不适当的公开作业</li>
                              <li>• 你可以随时将作业改为私密状态</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 上传进度提示 */}
                    {uploading && (
                      <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="animate-spin h-5 w-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-amber-400 font-medium">🔬 AI导师正在认真看你的探索成果...</p>
                        </div>
                        <p className="text-xs text-amber-300/80 ml-8">
                          请耐心等待约20秒，不要关闭窗口哦~
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitTask}
                        disabled={submitting || !submissionContent.trim() || uploading}
                        className="btn-stardust flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? '上传中...' : submitting ? '提交中...' : '确认提交'}
                      </button>
                      <button
                        onClick={() => setShowSubmitDialog(false)}
                        disabled={submitting || uploading}
                        className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 text-white"
                      >
                        取消
                      </button>
                    </div>
                  </>
                )}

                {/* AI评估结果 */}
                {submissionResult?.evaluation && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">提交成功！</h4>
                        <p className="text-sm text-gray-400">AI助教已完成批改</p>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-orange-400">评分</h5>
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                          {submissionResult.evaluation.score || '-'}/100
                        </span>
                      </div>

                      {submissionResult.evaluation.feedback && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h5 className="font-semibold text-amber-400 mb-2">反馈意见</h5>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {submissionResult.evaluation.feedback}
                          </p>
                        </div>
                      )}

                      {submissionResult.evaluation.suggestions && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h5 className="font-semibold text-green-400 mb-2">改进建议</h5>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {submissionResult.evaluation.suggestions}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        // 如果是公开的高分作业，刷新优秀作业展示
                        if (isPublic && submissionResult?.evaluation?.score >= 85) {
                          setPublicSubmissionsRefreshKey(prev => prev + 1)
                        }
                        setShowSubmitDialog(false)
                        setSubmissionResult(null)
                        setSelectedProject(null)
                        // 刷新进度条
                        fetchStageProgress()
                      }}
                      className="btn-stardust w-full px-6 py-3"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 提交记录列表弹窗 */}
        <SubmissionHistoryModal
          isOpen={showSubmissionsHistory}
          onClose={() => setShowSubmissionsHistory(false)}
          projectTitle={historyProject?.title}
          submissions={submissionsHistory}
          loading={loadingHistory}
          onDelete={handleDeleteSubmission}
          onToggleVisibility={handleToggleVisibility}
        />
      </div>

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
