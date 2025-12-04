// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { PublicSubmissions } from '@/components/courses/PublicSubmissions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'
import { globalToast } from '@/components/ui/ToastProvider'

// 伊卡洛斯项目模块名称映射（与主界面保持一致）
const MODULE_NAMES: Record<number, string> = {
  1: '模块一：无形的纽带',
  2: '模块一：无形的纽带',
  3: '模块一：无形的纽带',
  4: '模块二：无形的地图',
  5: '模块二：无形的地图',
  6: '模块二：无形的地图',
  7: '模块二：无形的地图',
  8: '模块三：延展的心灵',
  9: '模块三：延展的心灵',
  10: '模块三：延展的心灵',
  11: '模块三：延展的心灵',
}

// 根据sequence_number获取统一的模块名称
const getModuleName = (sequenceNumber: number): string => {
  return MODULE_NAMES[sequenceNumber] || '伊卡洛斯计划'
}

// 智能文本预处理器：将中文段落标签转换为Markdown格式并添加表情
function preprocessContentToMarkdown(content: string): string {
  if (!content) return ''

  let processed = content

  // 步骤1: 移除开头的时长标记并转为醒目提示
  processed = processed.replace(/^\(任务时长：([^)]+)\)\n?/m, '> ⏱️ **任务时长**: $1\n\n')

  // 步骤2: 将句子结尾的单个换行符转为段落分隔（双换行符）
  // 匹配中文句号、感叹号、问号、省略号后的单个换行符
  processed = processed.replace(/([。！？…"」』】])\n(?!\n)/g, '$1\n\n')

  // 步骤3: 主要段落标题（转为三级标题 ###）
  const mainLabels = [
    { pattern: /^(任务说明|任务|主要任务|核心任务)[:：]/gm, emoji: '📝', title: '任务' },
    { pattern: /^(目标|学习目标|本周目标)[:：]/gm, emoji: '🎯', title: '目标' },
    { pattern: /^(准备材料|所需材料|材料准备)[:：]/gm, emoji: '🛠️', title: '准备材料' },
    { pattern: /^(思考一下|思考|思考问题)[:：]/gm, emoji: '💭', title: '思考' },
    { pattern: /^(接受任务|开始任务|任务开始)[:：]/gm, emoji: '✅', title: '接受任务' },
    { pattern: /^(提交要求|提交|上传)[:：]/gm, emoji: '📤', title: '提交要求' },
    { pattern: /^(温馨提示|注意事项|重要提示)[:：]/gm, emoji: '⚠️', title: '注意事项' },
    { pattern: /^(展示你的工具|展示作品|成果展示)[:：]/gm, emoji: '🎨', title: '展示作品' },
    { pattern: /^(提交你的调查报告|提交报告|上传作业)[:：]/gm, emoji: '📋', title: '提交报告' }
  ]

  mainLabels.forEach(({ pattern, emoji, title }) => {
    processed = processed.replace(pattern, `\n### ${emoji} ${title}\n\n`)
  })

  // 步骤4: 次要段落标题（转为四级标题 ####）
  const subLabels = [
    { pattern: /^(步骤|操作步骤|详细步骤)[:：]/gm, emoji: '👣', title: '步骤' },
    { pattern: /^(选项[A-Z]|方案[A-Z])[:：]/gm, emoji: '🔹', keep: true }, // 保留原标题
    { pattern: /^(示例|例子|参考示例)[:：]/gm, emoji: '💡', title: '示例' },
    { pattern: /^(建议|小建议|友情提示)[:：]/gm, emoji: '💫', title: '建议' },
    { pattern: /^(格式|提交格式|格式要求)[:：]/gm, emoji: '📄', title: '格式' }
  ]

  subLabels.forEach(({ pattern, emoji, title, keep }) => {
    if (keep) {
      processed = processed.replace(pattern, (match) => `\n#### ${emoji} ${match.replace(/[:：]/, '')}\n\n`)
    } else {
      processed = processed.replace(pattern, `\n#### ${emoji} ${title}\n\n`)
    }
  })

  // 步骤5: 处理项目符号列表 - 检测以"●"、"•"、"○"或数字开头的行
  processed = processed.replace(/^([●•○])\s+(.+)$/gm, '- $2')
  processed = processed.replace(/^(\d+[.、])\s+(.+)$/gm, '1. $2')

  // 步骤6: 为特殊内容添加表情（句子开头的关键词）
  const sentenceEmojis = [
    { pattern: /^(欢迎|恭喜)/gm, emoji: '🎉 ' },
    { pattern: /^(重要|注意|警告)/gm, emoji: '⚠️ ' },
    { pattern: /^(提示|小贴士)/gm, emoji: '💡 ' }
  ]

  sentenceEmojis.forEach(({ pattern, emoji }) => {
    processed = processed.replace(pattern, emoji + '$1')
  })

  // 步骤7: 清理多余的空行（超过2个连续换行符的）
  processed = processed.replace(/\n{3,}/g, '\n\n')

  return processed.trim()
}

interface Activity {
  sequence: number  // ✨ 新增：用于排序
  day_label: string  // "Day 1", "Day 2-4"
  day_range: string  // "1", "2-4"
  title_zh: string
  title_en?: string
  duration?: string
  content?: string  // ✨ 新增：完整的markdown内容
  // 保留旧字段以向后兼容
  day?: string | number
  title?: string
  description?: string
  tasks?: string[]
  deliverables?: string[]
}

interface WeekPlan {
  week: number
  theme: string
  days_range?: string  // ✨ 新增
  goals?: string[]
  activities: Activity[]
}

interface Project {
  id: string
  title: string
  subtitle: string | null
  project_intro: string | null
  difficulty_level: string | null
  module_name: string | null
  week_plan: WeekPlan[]
  estimated_duration: number | null
  project_visibility: string
  sequence_number: number
}

interface UserProgress {
  [key: string]: number // 'project_1_week1_day1': 85 (存储最高分)
}

interface PBLProjectDetailProps {
  project: Project
  systemKey: string
  userProgress?: UserProgress
  isSelected?: boolean
  selectionId?: string
}

const DIFFICULTY_COLORS = {
  '基础探索': 'from-green-500 to-emerald-600',
  '进阶挑战': 'from-blue-500 to-cyan-600',
  '深度研究': 'from-purple-500 to-pink-600',
  '创新实践': 'from-orange-500 to-red-600'
}

export function PBLProjectDetail({
  project,
  systemKey,
  userProgress = {},
  isSelected = false,
  selectionId
}: PBLProjectDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1])) // 默认展开第1周
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [submittingDay, setSubmittingDay] = useState<string | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [currentDayKey, setCurrentDayKey] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // 项目选择/取消相关状态
  const [showSelectConfirm, setShowSelectConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'|'info'|'warning'}>({
    show: false,
    message: '',
    type: 'success'
  })
  const [showProfileModal, setShowProfileModal] = useState(false) // 个人资料弹窗

  // 提交记录相关状态
  const [showSubmissionsHistory, setShowSubmissionsHistory] = useState(false)
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [historyDayKey, setHistoryDayKey] = useState<string | null>(null)
  const [historyDayLabel, setHistoryDayLabel] = useState<string | null>(null) // 存储实际的day标签（如"Day 2-4"）
  const [isPublic, setIsPublic] = useState(false) // 作业是否公开（默认私密）
  const [togglingId, setTogglingId] = useState<string | null>(null) // 正在切换可见性的作业ID

  // 公开作业刷新机制
  const [publicSubmissionsRefreshKey, setPublicSubmissionsRefreshKey] = useState(0)

  // 未选择项目提示弹窗
  const [showSelectProjectModal, setShowSelectProjectModal] = useState(false)

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

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber)
      } else {
        newSet.add(weekNumber)
      }
      return newSet
    })
  }

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey)
      } else {
        newSet.add(dayKey)
      }
      return newSet
    })
  }

  // 检查某一天是否解锁
  const isDayUnlocked = (weekNumber: number, dayNumber: number): boolean => {
    // 第1周第1天总是解锁
    if (weekNumber === 1 && dayNumber === 1) return true

    // 检查前一天是否完成
    let prevWeek = weekNumber
    let prevDay = dayNumber - 1

    if (prevDay === 0) {
      // 如果是某周的第1天，检查上周的最后一天
      prevWeek = weekNumber - 1
      const prevWeekPlan = project.week_plan?.find(w => w.week === prevWeek)
      prevDay = prevWeekPlan?.activities?.length || 0
    }

    const prevDayKey = `project_${project.sequence_number}_week${prevWeek}_day${prevDay}`
    return (userProgress[prevDayKey] || 0) > 0  // 有得分就算完成
  }

  // PF-02: 使用useCallback优化handleToggleSelection
  const handleToggleSelection = useCallback(() => {
    if (isSelected && selectionId) {
      // 显示取消确认对话框
      setShowCancelConfirm(true)
    } else {
      // 显示选择确认对话框
      setShowSelectConfirm(true)
    }
  }, [isSelected, selectionId])

  // PF-02: 使用useCallback优化confirmCancelProject
  const confirmCancelProject = useCallback(async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/pbl/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectionId,
          status: 'cancelled'
        })
      })

      if (response.ok) {
        setShowCancelConfirm(false)
        setToast({
          show: true,
          message: '项目已取消',
          type: 'success'
        })
        // 刷新当前页面，不跳转
        router.refresh()
      } else {
        setToast({
          show: true,
          message: '取消项目失败，请重试',
          type: 'error'
        })
      }
    } catch (error) {
      setToast({
        show: true,
        message: '取消项目失败，请重试',
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [selectionId, router])

  // PF-02: 使用useCallback优化confirmSelectProject
  const confirmSelectProject = useCallback(async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/pbl/select-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id })
      })

      if (response.ok) {
        setShowSelectConfirm(false)
        setToast({
          show: true,
          message: '项目选择成功！',
          type: 'success'
        })
        router.refresh()
      } else {
        const error = await response.json()
        setToast({
          show: true,
          message: error.error || '选择项目失败',
          type: 'error'
        })
      }
    } catch (error) {
      setToast({
        show: true,
        message: '选择项目失败，请重试',
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [project.id, router])

  // 打开提交对话框
  const openSubmitDialog = (weekNumber: number, dayNumber: number, dayLabel?: string) => {
    // 检查是否已选择项目
    if (!isSelected) {
      setShowSelectProjectModal(true)
      return
    }

    const dayKey = `project_${project.sequence_number}_week${weekNumber}_day${dayNumber}`
    setCurrentDayKey(dayKey)
    setHistoryDayLabel(dayLabel || `Day ${dayNumber}`) // 存储day标签用于对话框标题
    setSubmissionContent('')
    setUploadedFiles([])
    setSubmissionResult(null)
    setIsPublic(false) // 默认私密
    setShowSubmitDialog(true)
  }

  // 处理文件选择（自动压缩图片）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const filesArray = Array.from(e.target.files)
    // 重置 input 值，允许再次选择相同的文件
    e.target.value = ''
    const processedFiles: File[] = []

    for (const file of filesArray) {
      // 如果是图片且大于1MB，自动压缩
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
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
        // 不是图片或小于1MB，直接使用
        processedFiles.push(file)
      }
    }

    setUploadedFiles(prev => [...prev, ...processedFiles])
  }

  // 移除已选择的文件
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 获取提交记录（根据具体day_key过滤）
  const fetchSubmissionsHistory = async (dayKey: string) => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/submissions?contentId=${project.id}&dayKey=${encodeURIComponent(dayKey)}`)
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

  // 删除提交记录
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('确定要删除这条提交记录吗？')) return

    try {
      const response = await fetch(`/api/submissions?id=${submissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 立即从本地状态中移除
        setSubmissionsHistory(prev => prev.filter(s => s.id !== submissionId))
        globalToast.success('删除成功')
      } else {
        const error = await response.json()
        globalToast.error(`删除失败: ${error.error || '请重试'}`)
      }
    } catch (error) {
      globalToast.error('删除失败，请重试')
    }
  }

  // 切换作业可见性
  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    setTogglingId(submissionId)
    try {
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
    } catch (err) {
      globalToast.error(`操作失败：${err instanceof Error ? err.message : '请重试'}`)
    } finally {
      setTogglingId(null)
    }
  }

  // 提交任务
  const handleSubmitTask = async () => {
    if (!currentDayKey || !submissionContent.trim()) {
      globalToast.warning('请填写提交内容')
      return
    }

    if (!userId) {
      globalToast.warning('请先登录')
      return
    }

    try {
      setSubmittingDay(currentDayKey)
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

      // 调用边缘函数进行评估
      const { data, error: functionError } = await supabase.functions.invoke('evaluate-pbl-task', {
        body: {
          user_id: userId,
          content_id: project.id,
          day_key: currentDayKey,
          submission_content: submissionContent,
          submission_type: 'project_deliverable',
          attachments,
          is_public: isPublic
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

      // 🔄 立即刷新页面数据，更新进度和解锁状态
      router.refresh()

    } catch (error) {
      globalToast.error('提交失败，请重试')
    } finally {
      setSubmittingDay(null)
      setUploading(false)
    }
  }

  // 计算当前项目的进度（考虑得分权重）
  const totalDays = project.week_plan?.reduce((sum, week) => sum + (week.activities?.length || 0), 0) || 0

  // 只统计当前项目的加权进度
  const currentProjectPrefix = `project_${project.sequence_number}_`
  let totalWeightedProgress = 0
  let completedDays = 0

  if (totalDays > 0) {
    for (const [key, value] of Object.entries(userProgress)) {
      if (key.startsWith(currentProjectPrefix)) {
        // 兼容旧数据格式：布尔值 true 视为默认分数 80，数字则直接使用
        let score = 0
        if (typeof value === 'number' && value > 0) {
          score = value
        } else if (value === true) {
          // 旧格式：布尔值 true，按 80 分计算
          score = 80
        }

        if (score > 0) {
          // 每天的基础进度 = 1 / 总天数
          const baseProgress = 1 / totalDays
          // 实际进度 = 基础进度 × (得分/100)
          const actualProgress = baseProgress * (score / 100)
          totalWeightedProgress += actualProgress
          completedDays++
        }
      }
    }
  }

  // 转换为百分比（0-100）
  const progressPercentage = Math.round(totalWeightedProgress * 100)

  return (
    <div className="min-h-screen text-white">
      {/* 统一导航栏 */}
      <UnifiedNavbar
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回项目列表',
          href: `/courses/${systemKey}`
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 项目头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {project.title}
          </h1>

          {project.subtitle && (
            <p className="text-xl text-gray-400 mb-6">{project.subtitle}</p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              {getModuleName(project.sequence_number)}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {project.week_plan.length} 周
            </span>
          </div>

          {/* 进度条 (仅当已选择项目时显示) */}
          {isSelected && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">项目进度</span>
                <span className="text-white font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full progress-ethereal rounded-full h-3">
                <div
                  className="progress-ethereal-bar h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                已完成 {completedDays} / {totalDays} 天
              </p>
            </div>
          )}

          {/* 项目简介 */}
          {project.project_intro && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-blue-400">📋 项目简介</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {project.project_intro}
              </p>
            </div>
          )}

          {/* 选择/取消项目按钮 */}
          <button
            onClick={handleToggleSelection}
            className={`btn-stardust px-6 py-3 font-medium ${isSelected ? 'text-gray-300' : ''}`}
          >
            {isSelected ? '取消项目' : '选择这个项目'}
          </button>
        </div>

        {/* 周计划 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">📅 项目计划</h2>

          {[...(project.week_plan || [])].sort((a, b) => a.week - b.week).map((week) => {
            const isWeekExpanded = expandedWeeks.has(week.week)

            return (
              <div
                key={week.week}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
              >
                {/* 周标题 */}
                {(() => {
                  // 判断该周是否解锁：第1周始终解锁，其他周需要前一周有任务完成
                  const isWeekUnlocked = week.week === 1 || (() => {
                    const prevWeekPlan = project.week_plan?.find(w => w.week === week.week - 1)
                    if (!prevWeekPlan) return false
                    // 检查前一周是否有任何任务完成
                    return prevWeekPlan.activities?.some((_, idx) => {
                      const dayNumber = idx + 1
                      const prevDayKey = `project_${project.sequence_number}_week${week.week - 1}_day${dayNumber}`
                      return (userProgress[prevDayKey] || 0) > 0
                    }) || false
                  })()

                  return (
                <button
                  onClick={() => {
                    if (!isWeekUnlocked) {
                      setToast({ show: true, message: '需要完成上一个项目才能解锁哦', type: 'info' })
                      return
                    }
                    toggleWeek(week.week)
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        第 {week.week} 周：{week.theme}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {week.activities?.length || 0} 个任务
                      </p>
                    </div>
                  </div>
                  {isWeekUnlocked ? (
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        isWeekExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                  )
                })()}

                {/* 周目标 (展开时显示) */}
                {isWeekExpanded && week.goals && week.goals.length > 0 && (
                  <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-800">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">本周目标：</h4>
                    <ul className="space-y-1">
                      {week.goals.map((goal, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 每日任务列表 */}
                {isWeekExpanded && week.activities && (
                  <div className="p-4 space-y-3">
                    {/* ✨ 按sequence字段排序activities */}
                    {[...week.activities]
                      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                      .map((activity, index) => {
                        // ✨ 优先使用新字段day_range，向后兼容旧的day字段
                        const dayRangeStr = activity.day_range || activity.day || String(index + 1)
                        // 从day_range提取第一个数字作为dayNumber（如"2-4" -> 2）
                        const dayNumber = parseInt(dayRangeStr.toString().split('-')[0])
                        const dayKey = `project_${project.sequence_number}_week${week.week}_day${dayNumber}`
                        const isCompleted = (userProgress[dayKey] || 0) > 0  // 有得分就算完成
                        const isUnlocked = isDayUnlocked(week.week, dayNumber)
                        const isDayExpanded = expandedDays.has(dayKey)

                        // ✨ 使用新字段，向后兼容
                        const activityTitle = activity.title_zh || activity.title || '未命名活动'
                        const activityDayLabel = activity.day_label || `Day ${dayNumber}`
                        const activityDuration = activity.duration
                        // 智能预处理：将中文标签转换为Markdown格式
                        const activityContent = activity.content ? preprocessContentToMarkdown(activity.content) : null

                      return (
                        <div
                          key={dayKey}
                          className={`border rounded-lg overflow-hidden transition-all ${
                            isCompleted
                              ? 'border-green-500/30 bg-green-500/5'
                              : isUnlocked
                              ? 'border-gray-700 bg-gray-900/30'
                              : 'border-gray-800/50 bg-gray-900/10'
                          }`}
                        >
                          {/* 日任务标题 */}
                          <div className="flex items-center justify-between p-4">
                            <button
                              onClick={() => toggleDay(dayKey)}
                              disabled={!isUnlocked}
                              className="flex-1 flex items-center gap-3 text-left"
                            >
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                  : isUnlocked
                                  ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-white'
                                  : 'bg-gray-800 text-gray-600'
                              }`}>
                                {isCompleted ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : !isUnlocked ? (
                                  <span className="text-gray-500">🔒</span>
                                ) : (
                                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                )}
                              </div>

                              <div className="flex-1">
                                <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                  {activityDayLabel}: {activityTitle}
                                </h4>
                                {activityDuration && (
                                  <p className={`text-xs mt-1 ${isUnlocked ? 'text-gray-500' : 'text-gray-600'}`}>
                                    {activityDuration}
                                  </p>
                                )}
                              </div>

                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isDayExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* 状态标签 */}
                            {isCompleted && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium ml-3">
                                已完成
                              </span>
                            )}
                            {!isUnlocked && (
                              <span className="px-3 py-1 bg-gray-700/50 text-gray-500 text-xs rounded-full font-medium ml-3">
                                🔒 锁定
                              </span>
                            )}
                          </div>

                          {/* 详细内容 (展开时显示) */}
                          {isDayExpanded && isUnlocked && (
                            <div className="px-4 pb-4 space-y-4 border-t border-gray-800 mt-4">
                              {/* ✨ 完整的Markdown内容 */}
                              {activityContent ? (
                                <div className="prose prose-invert prose-sm max-w-none
                                  prose-headings:text-white prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-6
                                  prose-h1:text-2xl prose-h1:text-purple-300 prose-h1:border-b prose-h1:border-purple-500/30 prose-h1:pb-2
                                  prose-h2:text-xl prose-h2:text-blue-300
                                  prose-h3:text-lg prose-h3:text-purple-400
                                  prose-h4:text-base prose-h4:text-cyan-400
                                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                                  prose-strong:text-white prose-strong:font-semibold prose-strong:bg-purple-500/10 prose-strong:px-1 prose-strong:rounded
                                  prose-em:text-cyan-300 prose-em:not-italic
                                  prose-ul:text-gray-300 prose-ul:space-y-2 prose-ul:my-4
                                  prose-ol:text-gray-300 prose-ol:space-y-2 prose-ol:my-4
                                  prose-li:text-gray-300 prose-li:leading-relaxed
                                  prose-li::marker:text-purple-400
                                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300
                                  prose-code:text-purple-300 prose-code:bg-gray-800/50 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-purple-500/20
                                  prose-pre:bg-gray-900/50 prose-pre:border prose-pre:border-purple-500/20 prose-pre:rounded-lg
                                  prose-blockquote:border-l-4 prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r
                                  prose-blockquote:text-gray-400 prose-blockquote:italic
                                  prose-table:text-gray-300 prose-table:border-collapse
                                  prose-thead:bg-purple-500/10 prose-thead:border-b prose-thead:border-purple-500/30
                                  prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-purple-300
                                  prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-gray-700/50
                                  prose-tr:hover:bg-gray-800/30
                                  prose-hr:border-gray-700/50 prose-hr:my-8">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      // 优化段落间距
                                      p: ({node, children, ...props}) => {
                                        return <p className="my-3" {...props}>{children}</p>
                                      },
                                      // 优化列表项显示
                                      li: ({node, children, ...props}) => {
                                        return <li className="my-2 pl-2" {...props}>{children}</li>
                                      },
                                      // 优化引用块样式
                                      blockquote: ({node, children, ...props}) => {
                                        return <blockquote className="border-l-4 border-purple-500 bg-purple-500/10 py-3 px-4 rounded-r my-4" {...props}>{children}</blockquote>
                                      }
                                    }}
                                  >
                                    {activityContent}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <>
                                  {/* 向后兼容：如果没有content字段，显示旧的tasks/deliverables */}
                                  {activity.tasks && activity.tasks.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-purple-400 mb-2">📝 今日任务：</h5>
                                      <ul className="space-y-2">
                                        {activity.tasks.map((task, idx) => (
                                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 pl-4">
                                            <span className="text-purple-400">•</span>
                                            <span>{task}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {activity.deliverables && activity.deliverables.length > 0 && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-orange-400 mb-2">📦 需要提交：</h5>
                                      <ul className="space-y-1">
                                        {activity.deliverables.map((deliverable, idx) => (
                                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 pl-4">
                                            <span className="text-orange-400">✓</span>
                                            <span>{deliverable}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* 操作按钮区域 - 在任务详情展开后显示 */}
                              <div className="pt-4 mt-4 border-t border-gray-700 flex gap-2">
                                <button
                                  onClick={() => openSubmitDialog(week.week, dayNumber, activityDayLabel)}
                                  className="btn-stardust flex-1 px-4 py-2 text-sm font-medium"
                                >
                                  {isCompleted ? '再次提交' : '提交任务'}
                                </button>
                                <button
                                  onClick={() => {
                                    if (!isSelected) {
                                      setShowSelectProjectModal(true)
                                      return
                                    }
                                    setHistoryDayKey(dayKey)
                                    setHistoryDayLabel(activityDayLabel)
                                    setShowSubmissionsHistory(true)
                                    fetchSubmissionsHistory(dayKey)
                                  }}
                                  className="btn-stardust px-4 py-2 text-sm font-medium"
                                >
                                  查看记录
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 未解锁遮罩 */}
                          {!isUnlocked && isDayExpanded && (
                            <div className="px-4 pb-4 text-center text-gray-500 text-sm">
                              完成前一天的任务后解锁
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 提交对话框 */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full p-6 my-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{historyDayLabel ? `${historyDayLabel} - 提交任务` : '提交任务'}</h3>

            {/* 如果没有AI评估结果，显示提交表单 */}
            {!submissionResult && (
              <>
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="请描述你今天完成的任务和收获..."
                  className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* 文件上传区域 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    上传附件（可选）
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
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
                          <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className="mb-4 flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-blue-400">正在上传文件和提交作业...</p>
                  </div>
                )}

                {/* 公开/私密选项 */}
                <div className="mb-4 bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-starlight mb-1">作业可见性</h4>
                      <p className="text-xs text-starlight-muted">
                        {isPublic
                          ? '你的作业将对其他同学公开展示（需评分≥90分）'
                          : '你的作业仅自己和老师可见'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${
                        isPublic ? 'bg-emerald-500' : 'bg-white/20'
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
                      isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-starlight-muted'
                    }`}>
                      {isPublic ? '公开' : '私密'}
                    </span>
                  </div>
                </div>

                {/* 隐私警告（仅在选择公开时显示） */}
                {isPublic && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-blue-400 mb-1">隐私提示</h5>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• 仅评分达到90分及以上的作业会被公开展示</li>
                          <li>• 展示内容包括：你的姓名、作业内容和提交时间</li>
                          <li>• 老师可以隐藏任何不适当的公开作业</li>
                          <li>• 你可以随时将作业改为私密状态</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitTask}
                    disabled={!!submittingDay || !submissionContent.trim() || uploading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? '上传中...' : submittingDay ? '提交中...' : '确认提交'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitDialog(false)
                      setHistoryDayLabel(null)
                    }}
                    disabled={!!submittingDay || uploading}
                    className="px-4 py-2 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
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

                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-blue-400">评分</h5>
                    <span className="text-2xl font-bold text-white">
                      {submissionResult.evaluation.score || '-'}/100
                    </span>
                  </div>

                  {submissionResult.evaluation.feedback && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-purple-400 mb-2">反馈意见</h5>
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
                    setSubmissionContent('')
                    setUploadedFiles([])
                    setHistoryDayLabel(null)
                    router.refresh()
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  关闭
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提交记录列表弹窗 */}
      {showSubmissionsHistory && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowSubmissionsHistory(false)
            setSelectedSubmission(null)
            setHistoryDayLabel(null)
          }}
        >
          <div
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {historyDayLabel ? `${project.title} - ${historyDayLabel} - 提交记录` : '我的提交记录'}
              </h3>
              <button
                onClick={() => {
                  setShowSubmissionsHistory(false)
                  setSelectedSubmission(null)
                  setHistoryDayLabel(null)
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 加载状态 */}
            {loadingHistory && (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {/* 提交记录列表 */}
            {!loadingHistory && submissionsHistory.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>还没有提交记录</p>
              </div>
            )}

            {!loadingHistory && submissionsHistory.length > 0 && (
              <div className="space-y-4">
                {submissionsHistory.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* 状态标签 */}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            submission.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : submission.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {submission.status === 'approved' ? '已批改' : submission.status === 'rejected' ? '已拒绝' : '待批改'}
                          </span>

                          {/* 评分 */}
                          {submission.score !== null && (
                            <span className="text-lg font-bold text-white">
                              {submission.score}/100
                            </span>
                          )}

                          {/* 提交时间 */}
                          <span className="text-sm text-gray-400">
                            {new Date(submission.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        {/* 提交内容预览 */}
                        <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                          {submission.content}
                        </p>

                        {/* 反馈（如果有） */}
                        {submission.feedback && (
                          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-gray-300 line-clamp-3">
                              <strong className="text-blue-400">反馈：</strong>
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 公开/私密切换 */}
                    {submission.status === 'approved' && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-starlight-muted">作业可见性:</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            (submission.is_public ?? false) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-starlight-muted'
                          }`}>
                            {(submission.is_public ?? false) ? '公开' : '私密'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleVisibility(submission.id, submission.is_public)}
                          disabled={togglingId === submission.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            togglingId === submission.id
                              ? 'opacity-50 cursor-not-allowed'
                              : (submission.is_public ?? false)
                              ? 'bg-emerald-500'
                              : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              (submission.is_public ?? false) ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors text-white"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(submission.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提交详情弹窗 */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">提交详情</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 评分和状态 */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">评分</p>
                  <p className="text-3xl font-bold text-white">
                    {selectedSubmission.score !== null ? `${selectedSubmission.score}/100` : '未评分'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">状态</p>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    selectedSubmission.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : selectedSubmission.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedSubmission.status === 'approved' ? '已批改' : selectedSubmission.status === 'rejected' ? '已拒绝' : '待批改'}
                  </span>
                </div>
              </div>

              {/* 提交时间 */}
              <div>
                <p className="text-sm text-gray-400 mb-1">提交时间</p>
                <p className="text-white">{new Date(selectedSubmission.created_at).toLocaleString('zh-CN')}</p>
              </div>

              {/* 提交内容 */}
              <div>
                <p className="text-sm text-gray-400 mb-2">提交内容</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.content}</p>
                </div>
              </div>

              {/* 附件图片 */}
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">附件（{selectedSubmission.attachments.length}）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubmission.attachments.map((attachment: any, index: number) => (
                      attachment.type === 'image' && (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors h-48"
                        >
                          <Image
                            src={attachment.url}
                            alt={attachment.name || `图片 ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-sm truncate">{attachment.name || `图片 ${index + 1}`}</p>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                              >
                                查看原图 →
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 反馈 */}
              {selectedSubmission.feedback && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">AI反馈</p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}

              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-all text-white"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 优秀作业展示区域 */}
      <div className="mt-16 mb-12 pt-12 border-t border-gray-800">
        <PublicSubmissions
          contentId={project.id}
          limit={12}
          refreshKey={publicSubmissionsRefreshKey}
        />
      </div>

      {/* 未选择项目提示弹窗 */}
      {showSelectProjectModal && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSelectProjectModal(false)}
        >
          <div
            className="bg-white/5 backdrop-blur-xl border border-purple-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部图标和关闭按钮 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowSelectProjectModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 标题 */}
            <h3 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              请先选择项目
            </h3>

            {/* 说明文字 */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              在提交作业之前，您需要先点击页面顶部的 <span className="text-purple-400 font-semibold">「选择这个项目」</span> 按钮来激活该项目。
            </p>

            {/* 特性说明 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">选择项目后，您可以按顺序完成每日任务</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">系统会追踪您的学习进度和成就</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">AI助教会实时评估您的作业</p>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSelectProjectModal(false)
                  // 滚动到页面顶部（项目选择按钮位置）
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                前往选择项目
              </button>
              <button
                onClick={() => setShowSelectProjectModal(false)}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-gray-300"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 选择项目确认对话框 */}
      <ConfirmDialog
        isOpen={showSelectConfirm}
        onClose={() => setShowSelectConfirm(false)}
        onConfirm={confirmSelectProject}
        title="确认选择项目"
        message={`确定要选择「${project.title}」这个项目吗？选择后，您将开始这个项目的学习之旅。`}
        confirmText="确认选择"
        cancelText="取消"
        type="info"
        loading={isProcessing}
      />

      {/* 取消项目确认对话框 */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={confirmCancelProject}
        title="确认取消项目"
        message={`确定要取消「${project.title}」这个项目吗？您的学习进度将会保留。`}
        confirmText="确认取消"
        cancelText="不取消"
        type="warning"
        loading={isProcessing}
      />

      {/* Toast 通知 */}
      <Toast
        isOpen={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        message={toast.message}
        type={toast.type}
        duration={3000}
      />

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
