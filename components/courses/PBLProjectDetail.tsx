// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PublicSubmissions } from '@/components/courses/PublicSubmissions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/ui/Toast'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'
import { SubmitTaskDialog } from '@/components/courses/SubmitTaskDialog'
import { PBLSubmissionsHistory } from '@/components/courses/PBLSubmissionsHistory'
import { getModuleName, preprocessContentToMarkdown, DIFFICULTY_COLORS } from '@/lib/pbl/utils'

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


export function PBLProjectDetail({
  project,
  systemKey,
  userProgress = {},
  isSelected = false,
  selectionId
}: PBLProjectDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [currentDayKey, setCurrentDayKey] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // 项目选择/取消相关状态
  const [showSelectConfirm, setShowSelectConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'|'info'|'warning'}>({
    show: false, message: '', type: 'success'
  })
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 提交记录相关状态
  const [showSubmissionsHistory, setShowSubmissionsHistory] = useState(false)
  const [historyDayKey, setHistoryDayKey] = useState<string | null>(null)
  const [historyDayLabel, setHistoryDayLabel] = useState<string | null>(null)

  // 公开作业刷新机制
  const [publicSubmissionsRefreshKey, setPublicSubmissionsRefreshKey] = useState(0)

  // 未选择项目提示弹窗
  const [showSelectProjectModal, setShowSelectProjectModal] = useState(false)

  // 删除提交记录确认对话框
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

  // 检查某个 activity 是否解锁
  // 参数：weekNumber - 当前周号，activityIndex - 当前 activity 在本周的索引（0起始）
  const isActivityUnlocked = (weekNumber: number, activityIndex: number, currentWeekActivities: Activity[]): boolean => {
    // 第1周第1个任务总是解锁
    if (weekNumber === 1 && activityIndex === 0) return true

    // 如果不是本周第一个任务，检查本周前一个任务是否完成
    if (activityIndex > 0) {
      const prevActivity = currentWeekActivities[activityIndex - 1]
      const prevDayRangeStr = prevActivity.day_range || prevActivity.day_label?.match(/\d+/)?.[0] || String(activityIndex)
      const prevDayNumber = parseInt(prevDayRangeStr.toString().split('-')[0])
      const prevDayKey = `project_${project.sequence_number}_week${weekNumber}_day${prevDayNumber}`
      return (userProgress[prevDayKey] || 0) > 0
    }

    // 如果是本周第一个任务（但不是第1周），检查上周最后一个任务是否完成
    const prevWeek = weekNumber - 1
    const prevWeekPlan = project.week_plan?.find(w => w.week === prevWeek)
    if (!prevWeekPlan?.activities?.length) return false

    // 获取上周最后一个 activity 的 dayNumber
    const lastActivity = prevWeekPlan.activities[prevWeekPlan.activities.length - 1]
    const lastDayRangeStr = lastActivity.day_range || lastActivity.day_label?.match(/\d+/)?.[0] || String(prevWeekPlan.activities.length)
    const lastDayNumber = parseInt(lastDayRangeStr.toString().split('-')[0])
    const prevDayKey = `project_${project.sequence_number}_week${prevWeek}_day${lastDayNumber}`
    return (userProgress[prevDayKey] || 0) > 0
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
    if (!isSelected) {
      setShowSelectProjectModal(true)
      return
    }
    const dayKey = `project_${project.sequence_number}_week${weekNumber}_day${dayNumber}`
    setCurrentDayKey(dayKey)
    setHistoryDayLabel(dayLabel || `Day ${dayNumber}`)
    setShowSubmitDialog(true)
  }

  // 提交成功回调
  const handleSubmitSuccess = (score: number, isPublic: boolean) => {
    router.refresh()
    if (score >= 90 && isPublic) {
      setPublicSubmissionsRefreshKey(prev => prev + 1)
    }
  }

  // 可见性变更回调
  const handleVisibilityChanged = () => {
    setPublicSubmissionsRefreshKey(prev => prev + 1)
  }

  // 删除提交记录
  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('pbl_submissions')
        .delete()
        .eq('id', submissionId)

      if (error) throw error

      setToast({
        show: true,
        message: '提交记录已删除',
        type: 'success'
      })
      router.refresh()
    } catch (error) {
      setToast({
        show: true,
        message: '删除失败，请重试',
        type: 'error'
      })
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
                    if (!prevWeekPlan?.activities?.length) return false
                    // 检查前一周是否有任何任务完成（使用正确的 day_range）
                    return prevWeekPlan.activities.some((activity, idx) => {
                      const dayRangeStr = activity.day_range || activity.day || String(idx + 1)
                      const dayNumber = parseInt(dayRangeStr.toString().split('-')[0])
                      const prevDayKey = `project_${project.sequence_number}_week${week.week - 1}_day${dayNumber}`
                      return (userProgress[prevDayKey] || 0) > 0
                    })
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
                {isWeekExpanded && week.activities && (() => {
                  // ✨ 先排序，保存引用以便传给解锁检查函数
                  const sortedActivities = [...week.activities].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                  return (
                  <div className="p-4 space-y-3">
                    {sortedActivities.map((activity, index) => {
                        // ✨ 优先使用新字段day_range，向后兼容旧的day字段
                        const dayRangeStr = activity.day_range || activity.day || String(index + 1)
                        // 从day_range提取第一个数字作为dayNumber（如"2-4" -> 2）
                        const dayNumber = parseInt(dayRangeStr.toString().split('-')[0])
                        const dayKey = `project_${project.sequence_number}_week${week.week}_day${dayNumber}`
                        const isCompleted = (userProgress[dayKey] || 0) > 0  // 有得分就算完成
                        const isUnlocked = isActivityUnlocked(week.week, index, sortedActivities)
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
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {/* 提交对话框 */}
      <SubmitTaskDialog
        isOpen={showSubmitDialog}
        onClose={() => {
          setShowSubmitDialog(false)
          setHistoryDayLabel(null)
        }}
        dayLabel={historyDayLabel}
        projectId={project.id}
        currentDayKey={currentDayKey}
        userId={userId}
        selectionId={selectionId}
        onSuccess={handleSubmitSuccess}
        supabase={supabase}
      />

      {/* 提交记录列表弹窗 */}
      <PBLSubmissionsHistory
        isOpen={showSubmissionsHistory}
        onClose={() => {
          setShowSubmissionsHistory(false)
          setHistoryDayLabel(null)
        }}
        projectId={project.id}
        projectTitle={project.title}
        dayKey={historyDayKey}
        dayLabel={historyDayLabel}
        selectionId={selectionId}
        onVisibilityChanged={handleVisibilityChanged}
      />

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

      {/* 删除提交记录确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteSubmission(deleteConfirmId)
            setDeleteConfirmId(null)
          }
        }}
        title="确认删除"
        message="确定要删除这条提交记录吗？删除后无法恢复。"
        confirmText="确认删除"
        cancelText="取消"
        type="warning"
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
