'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Lock, Calendar, Clock } from 'lucide-react'
import { getDaysInMonth, isDateUnlocked, LAUNCH_DATE } from '@/lib/seth365/wallpaper'

interface CalendarViewProps {
  onSelectDate: (date: Date) => void
  selectedDate: Date | null
}

export function CalendarView({ onSelectDate, selectedDate }: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const days = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // 检查日期是否在启动日期范围内（>=启动日期）
  const isInLaunchRange = (date: Date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate >= LAUNCH_DATE
  }

  // 检查日期是否已解锁（可以点击查看）
  const isDateAvailable = (date: Date) => {
    return isDateUnlocked(date)
  }

  // 检查日期是否是未来日期（在启动范围内但还没解锁）
  const isFutureDate = (date: Date) => {
    return isInLaunchRange(date) && !isDateUnlocked(date)
  }

  const handleDateClick = (date: Date) => {
    // 启动日期范围内的日期都可以点击
    if (isInLaunchRange(date)) {
      onSelectDate(date)
    }
  }

  // 检查当前月份是否在启动日期之前
  const isMonthBeforeLaunch = () => {
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)
    return monthEnd < LAUNCH_DATE
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
    >
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">
            {currentYear}年{currentMonth + 1}月
          </h3>
        </div>

        <button
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 填充月初空白 */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* 日期 */}
        {days.map((date) => {
          const available = isDateAvailable(date)
          const future = isFutureDate(date)
          const inRange = isInLaunchRange(date)
          const todayDate = isToday(date)
          const selected = isSelected(date)

          return (
            <motion.button
              key={date.getDate()}
              whileHover={inRange ? { scale: 1.1 } : {}}
              whileTap={inRange ? { scale: 0.95 } : {}}
              onClick={() => handleDateClick(date)}
              disabled={!inRange}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center
                transition-all duration-200 relative
                ${inRange
                  ? 'hover:bg-purple-500/30 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed'
                }
                ${todayDate
                  ? 'bg-purple-600/40 border-2 border-purple-400'
                  : future
                    ? 'bg-amber-600/20 border border-amber-500/30'
                    : available
                      ? 'bg-white/5'
                      : 'bg-white/5'
                }
                ${selected && !todayDate
                  ? 'bg-blue-600/40 border-2 border-blue-400'
                  : ''
                }
              `}
            >
              <span
                className={`text-lg font-medium ${
                  todayDate ? 'text-purple-200' : future ? 'text-amber-300' : 'text-white'
                }`}
              >
                {date.getDate()}
              </span>

              {/* 未来日期图标 */}
              {future && !todayDate && (
                <Clock className="w-3 h-3 text-amber-400 absolute bottom-1" />
              )}

              {/* 锁定图标（启动前日期） */}
              {!inRange && (
                <Lock className="w-3 h-3 text-gray-500 absolute bottom-1" />
              )}

              {/* 今天标记 */}
              {todayDate && (
                <span className="text-[10px] text-purple-300 absolute bottom-0.5">
                  今天
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 月份提示 */}
      {isMonthBeforeLaunch() && (
        <div className="mt-4 text-center text-sm text-gray-400">
          此月份在启动日期之前，暂无壁纸
        </div>
      )}
    </motion.div>
  )
}
