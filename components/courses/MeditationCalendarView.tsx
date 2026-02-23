// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

interface MeditationCalendarViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
  bypassDateCheck?: boolean
  // 日历配置
  year: number
  month: number // 1-indexed (1=一月, 3=三月)
  systemKey: string
  colors: Array<{ from: string; to: string }>
  titleGradient: string // CSS gradient class for title
  subtitle: string
}

// 星期几的中文名称
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

// 中文月份名
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export function MeditationCalendarView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassDateCheck = false,
  year,
  month,
  systemKey,
  colors,
  titleGradient,
  subtitle
}: MeditationCalendarViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  // 获取今天的日期（只比较年月日）
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  // 月份索引（0-indexed）
  const monthIndex = month - 1

  // 该月天数
  const daysInMonth = new Date(year, month, 0).getDate()

  // 生成日历数据
  const calendarData = useMemo(() => {
    // 该月1日是星期几
    const firstDayOfMonth = new Date(year, monthIndex, 1).getDay()

    // 生成日历格子
    const calendar: Array<{
      date: number | null
      dayIndex: number | null // 课程第几天（0-indexed）
      content: CourseContent | null
    }> = []

    // 填充月初空白
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendar.push({ date: null, dayIndex: null, content: null })
    }

    // 填充日期 - 全月每天都是课程日
    for (let date = 1; date <= daysInMonth; date++) {
      const dayIndex = date - 1 // 1日=index 0
      calendar.push({
        date,
        dayIndex,
        content: contents[dayIndex] || null
      })
    }

    return calendar
  }, [contents, year, monthIndex, daysInMonth])

  // 预先计算解锁状态映射
  // 解锁条件：1. 日期已到 2. 前一天分数>=60（第一天无需分数条件）
  const unlockMap = useMemo(() => {
    const map = new Map<string, boolean>()

    contents.forEach((content, index) => {
      // 管理员直接解锁所有课程
      if (bypassDateCheck) {
        map.set(content.id, true)
        return
      }

      // 计算该课程的日期
      const courseDate = new Date(year, monthIndex, index + 1)
      const dateReached = today >= courseDate

      if (index === 0) {
        // 第一天只需要日期到了就解锁
        map.set(content.id, dateReached)
      } else {
        // 后续天需要：日期到了 + 前一天分数>=60
        const prevContent = contents[index - 1]
        const prevUnlocked = map.get(prevContent.id) === true
        const prevScore = scoreMap.get(prevContent.id) || 0
        map.set(content.id, dateReached && prevUnlocked && prevScore >= 60)
      }
    })

    return map
  }, [contents, scoreMap, today, bypassDateCheck, year, monthIndex])

  // 计算进度
  const completedCount = Array.from(completionMap.values()).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / contents.length) * 100)

  // 获取悬停日期的详情
  const hoveredContent = hoveredDay !== null && calendarData[hoveredDay]?.content
    ? calendarData[hoveredDay]
    : null

  return (
    <div className="min-h-screen text-starlight relative overflow-hidden">
      {/* 宇宙背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-cosmic-deep/60 to-mystic-purple/20 pointer-events-none" />

      {/* 统一导航栏 */}
      <UnifiedNavbar
        transparent
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回学习中心',
          href: '/portal'
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* 课程头部 */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
            {courseSystem.title}
          </h1>
          <p className="text-gray-400 mb-2 max-w-2xl mx-auto">{subtitle}</p>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">{courseSystem.description}</p>

          {/* 进度显示 */}
          <div className="mt-6 inline-flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              <span className="text-white font-semibold">{completedCount} / {contents.length}</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="text-amber-400 font-bold">{progressPercentage}%</div>
          </div>
        </div>

        {/* 日历 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* 月份标题 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">{year}年{MONTH_NAMES[monthIndex]}</h2>
            <p className="text-gray-400 text-sm mt-1">{contents.length}天冥想之旅</p>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 || index === 6 ? 'text-amber-400/70' : 'text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((cell, index) => {
              if (cell.date === null) {
                // 空白格子
                return <div key={index} className="aspect-square" />
              }

              const isCourseDay = cell.dayIndex !== null && cell.content
              const content = cell.content
              const dayIndex = cell.dayIndex ?? 0
              const color = colors[dayIndex] || colors[0]

              // 是否已解锁
              const isUnlocked = content ? unlockMap.get(content.id) === true : false
              // 是否已完成
              const isCompleted = content ? completionMap.get(content.id) === true : false
              // 分数
              const score = content ? scoreMap.get(content.id) || 0 : 0
              const isPassed = score >= 60

              // 是否是今天
              const cellDate = new Date(year, monthIndex, cell.date)
              const isToday = cellDate.getTime() === today.getTime()

              // 是否是未来日期
              const isFuture = cellDate > today

              if (!isCourseDay) {
                // 非课程日（不应出现，因为全月都是课程日）
                return (
                  <div
                    key={index}
                    className="aspect-square flex items-center justify-center text-gray-600 text-sm"
                  >
                    {cell.date}
                  </div>
                )
              }

              // 课程日
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: dayIndex * 0.015, type: 'spring' }}
                  className="aspect-square relative"
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {isUnlocked ? (
                    <Link
                      href={`/courses/${systemKey}/${content!.id}`}
                      className="block w-full h-full"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full h-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                          isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent' : ''
                        }`}
                        style={{
                          background: isCompleted
                            ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                            : `linear-gradient(135deg, ${color.from}CC, ${color.to}CC)`,
                          border: isPassed
                            ? '2px solid rgba(255,255,255,0.5)'
                            : '2px solid rgba(255,255,255,0.15)',
                          boxShadow: isCompleted ? `0 0 20px ${color.from}40` : 'none',
                        }}
                      >
                        {/* 光晕效果 - 悬停时显示 */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(circle at center, ${color.to}40, transparent 70%)`,
                          }}
                        />

                        {/* 日期数字 */}
                        <span className="text-lg sm:text-xl font-bold text-white relative z-10">
                          {cell.date}
                        </span>

                        {/* 课程天数标签 */}
                        <span className="text-[10px] sm:text-xs text-white/70 relative z-10">
                          Day {dayIndex + 1}
                        </span>

                        {/* 完成标记 */}
                        {isCompleted && (
                          <div className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    // 未解锁的课程日
                    <div
                      className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all ${
                        isFuture
                          ? 'bg-gray-800/30 border border-gray-700/30'
                          : 'bg-gray-800/50 border border-gray-700/50'
                      } ${isToday ? 'ring-2 ring-amber-400/50 ring-offset-2 ring-offset-transparent' : ''}`}
                    >
                      {/* 日期数字 */}
                      <span className="text-lg sm:text-xl font-bold text-gray-500">
                        {cell.date}
                      </span>

                      {/* 锁定图标或等待图标 */}
                      {isFuture ? (
                        <span className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                          未到
                        </span>
                      ) : (
                        <svg className="w-3 h-3 text-gray-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* 悬停详情 - 固定高度容器防止页面闪动 */}
          <div className="mt-6 h-[72px]">
            {hoveredContent && hoveredContent.content ? (
              <div className="p-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-400 text-sm font-medium">
                      {month}月{hoveredContent.date}日 · 第{hoveredContent.dayIndex! + 1}天
                    </p>
                    <p className="text-white font-bold mt-1">{hoveredContent.content.title}</p>
                  </div>
                  {scoreMap.get(hoveredContent.content.id) !== undefined && (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      scoreMap.get(hoveredContent.content.id)! >= 60
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {scoreMap.get(hoveredContent.content.id)} 分
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-transparent rounded-xl">
                <p className="text-gray-500 text-sm text-center">悬停日期查看详情</p>
              </div>
            )}
          </div>
        </div>

        {/* 图例说明 */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: `linear-gradient(135deg, ${colors[0]?.from}, ${colors[0]?.to})` }}></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: `linear-gradient(135deg, ${colors[0]?.from}CC, ${colors[0]?.to}CC)` }}></div>
            <span>可进入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
              <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span>需完成前一天</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800/30 border border-gray-700/30"></div>
            <span>日期未到</span>
          </div>
        </div>
      </div>

      {/* 用户资料弹窗 */}
      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
