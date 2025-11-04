'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WeekDay {
  day: number
  title: string
  description?: string
  tasks?: string[]
  deliverables?: string[]
}

interface WeekPlan {
  week: number
  theme: string
  goals?: string[]
  days: WeekDay[]
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
}

interface UserProgress {
  [key: string]: boolean // 'week1_day1': true
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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1])) // 默认展开第1周
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [submittingDay, setSubmittingDay] = useState<string | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [currentDayKey, setCurrentDayKey] = useState<string | null>(null)

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
      const prevWeekPlan = project.week_plan.find(w => w.week === prevWeek)
      prevDay = prevWeekPlan?.days.length || 0
    }

    const prevDayKey = `week${prevWeek}_day${prevDay}`
    return userProgress[prevDayKey] === true
  }

  // 处理选择/取消项目
  const handleToggleSelection = async () => {
    if (isSelected && selectionId) {
      // 取消项目
      if (!confirm('确定要取消这个项目吗？')) return

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
          router.push(`/courses/${systemKey}`)
        } else {
          alert('取消项目失败')
        }
      } catch (error) {
        console.error('Failed to cancel project:', error)
        alert('取消项目失败，请重试')
      }
    } else {
      // 选择项目
      try {
        const response = await fetch('/api/pbl/select-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id })
        })

        if (response.ok) {
          router.refresh()
        } else {
          const error = await response.json()
          alert(error.error || '选择项目失败')
        }
      } catch (error) {
        console.error('Failed to select project:', error)
        alert('选择项目失败，请重试')
      }
    }
  }

  // 打开提交对话框
  const openSubmitDialog = (weekNumber: number, dayNumber: number) => {
    const dayKey = `week${weekNumber}_day${dayNumber}`
    setCurrentDayKey(dayKey)
    setSubmissionContent('')
    setShowSubmitDialog(true)
  }

  // 提交任务
  const handleSubmitTask = async () => {
    if (!currentDayKey || !submissionContent.trim()) {
      alert('请填写提交内容')
      return
    }

    try {
      setSubmittingDay(currentDayKey)

      // TODO: 调用提交API
      const response = await fetch('/api/courses/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: project.id,
          progressKey: currentDayKey,
          submission: submissionContent
        })
      })

      if (response.ok) {
        setShowSubmitDialog(false)
        setSubmissionContent('')
        router.refresh()
      } else {
        alert('提交失败，请重试')
      }
    } catch (error) {
      console.error('Failed to submit task:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmittingDay(null)
    }
  }

  // 计算总进度
  const totalDays = project.week_plan.reduce((sum, week) => sum + week.days.length, 0)
  const completedDays = Object.values(userProgress).filter(Boolean).length
  const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

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
          返回项目列表
        </Link>

        {/* 项目头部 */}
        <div className="mb-8">
          {/* 难度标签 */}
          {project.difficulty_level && (
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 bg-gradient-to-r ${
              DIFFICULTY_COLORS[project.difficulty_level as keyof typeof DIFFICULTY_COLORS] || 'from-gray-500 to-gray-600'
            } text-white`}>
              {project.difficulty_level}
            </span>
          )}

          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {project.title}
          </h1>

          {project.subtitle && (
            <p className="text-xl text-gray-400 mb-6">{project.subtitle}</p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
            {project.module_name && (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                {project.module_name}
              </span>
            )}
            {project.estimated_duration && (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                预计 {project.estimated_duration} 分钟
              </span>
            )}
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {project.week_plan.length} 周计划
            </span>
          </div>

          {/* 进度条 (仅当已选择项目时显示) */}
          {isSelected && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">项目进度</span>
                <span className="text-white font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
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
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-blue-400">📋 项目简介</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {project.project_intro}
              </p>
            </div>
          )}

          {/* 选择/取消项目按钮 */}
          <button
            onClick={handleToggleSelection}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isSelected
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white'
            }`}
          >
            {isSelected ? '取消项目' : '选择这个项目'}
          </button>
        </div>

        {/* 周计划 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">📅 项目计划</h2>

          {project.week_plan.map((week) => {
            const isWeekExpanded = expandedWeeks.has(week.week)

            return (
              <div
                key={week.week}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
              >
                {/* 周标题 */}
                <button
                  onClick={() => toggleWeek(week.week)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                      {week.week}
                    </span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-white">
                        第 {week.week} 周：{week.theme}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {week.days.length} 天任务
                      </p>
                    </div>
                  </div>
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
                </button>

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
                {isWeekExpanded && (
                  <div className="p-4 space-y-3">
                    {week.days.map((day) => {
                      const dayKey = `week${week.week}_day${day.day}`
                      const isCompleted = userProgress[dayKey] === true
                      const isUnlocked = isDayUnlocked(week.week, day.day)
                      const isDayExpanded = expandedDays.has(dayKey)

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
                                ) : (
                                  day.day
                                )}
                              </div>

                              <div className="flex-1">
                                <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                  Day {day.day}: {day.title}
                                </h4>
                                {day.description && isDayExpanded && (
                                  <p className={`text-sm mt-1 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {day.description}
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
                            <div className="px-4 pb-4 space-y-4 border-t border-gray-800">
                              {/* 任务列表 */}
                              {day.tasks && day.tasks.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-purple-400 mb-2">📝 今日任务：</h5>
                                  <ul className="space-y-2">
                                    {day.tasks.map((task, idx) => (
                                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 pl-4">
                                        <span className="text-purple-400">•</span>
                                        <span>{task}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 交付物 */}
                              {day.deliverables && day.deliverables.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-orange-400 mb-2">📦 需要提交：</h5>
                                  <ul className="space-y-1">
                                    {day.deliverables.map((deliverable, idx) => (
                                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2 pl-4">
                                        <span className="text-orange-400">✓</span>
                                        <span>{deliverable}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 提交按钮 */}
                              {!isCompleted && isSelected && (
                                <button
                                  onClick={() => openSubmitDialog(week.week, day.day)}
                                  className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                  提交今日任务
                                </button>
                              )}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">提交今日任务</h3>
            <textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="请描述你今天完成的任务和收获..."
              className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmitTask}
                disabled={!!submittingDay || !submissionContent.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingDay ? '提交中...' : '确认提交'}
              </button>
              <button
                onClick={() => setShowSubmitDialog(false)}
                disabled={!!submittingDay}
                className="px-4 py-2 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
