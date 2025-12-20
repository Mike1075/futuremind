'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Lock, Calendar, Clock, Sparkles, X } from 'lucide-react'
import { getDaysInMonth, isDateUnlocked, LAUNCH_DATE } from '@/lib/seth365/wallpaper'

interface CalendarViewProps {
  onSelectDate: (date: Date) => void
  selectedDate: Date | null
}

// 月份锁定时的鼓励话语
const LOCKED_MONTH_MESSAGES = [
  '美好的事物值得等待，让我们一起期待这个月的灵感绽放吧！✨',
  '每一天的等待都是为了更美好的相遇，这个月的壁纸正在为你准备中～',
  '时间会带来最好的礼物，让我们一起期待这个月的惊喜吧！',
  '未来的每一天都值得期待，这个月的灵感会在恰当的时候与你相遇～',
  '好的内容需要耐心等待，这个月的壁纸会在最合适的时机解锁！'
]

export function CalendarView({ onSelectDate, selectedDate }: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [lockedMonthInfo, setLockedMonthInfo] = useState<{ year: number; month: number } | null>(null)

  const days = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 检查某个月份是否有解锁的日期（至少第一天已解锁）
  const isMonthUnlocked = (year: number, month: number) => {
    // 月份的第一天
    const firstDayOfMonth = new Date(year, month, 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    // 如果第一天已解锁，说明整个月都可以访问
    // 或者如果今天在这个月内，也可以访问
    const todayNorm = new Date(today)
    todayNorm.setHours(0, 0, 0, 0)

    return firstDayOfMonth <= todayNorm && firstDayOfMonth >= LAUNCH_DATE
  }

  // 检查某个月份是否有任何在启动范围内的日期
  const isMonthInRange = (year: number, month: number) => {
    // 月份的最后一天
    const lastDayOfMonth = new Date(year, month + 1, 0)
    lastDayOfMonth.setHours(0, 0, 0, 0)

    return lastDayOfMonth >= LAUNCH_DATE
  }

  // 获取随机鼓励话语
  const getRandomMessage = () => {
    return LOCKED_MONTH_MESSAGES[Math.floor(Math.random() * LOCKED_MONTH_MESSAGES.length)]
  }

  const goToPrevMonth = () => {
    let prevYear = currentYear
    let prevMonth = currentMonth - 1

    if (prevMonth < 0) {
      prevYear -= 1
      prevMonth = 11
    }

    // 检查上个月是否在启动范围内
    if (isMonthInRange(prevYear, prevMonth)) {
      setCurrentYear(prevYear)
      setCurrentMonth(prevMonth)
    }
  }

  const goToNextMonth = () => {
    let nextYear = currentYear
    let nextMonth = currentMonth + 1

    if (nextMonth > 11) {
      nextYear += 1
      nextMonth = 0
    }

    // 检查下个月是否有解锁的日期
    if (isMonthUnlocked(nextYear, nextMonth)) {
      setCurrentYear(nextYear)
      setCurrentMonth(nextMonth)
    } else if (isMonthInRange(nextYear, nextMonth)) {
      // 在启动范围内但未解锁，显示提示弹窗
      setLockedMonthInfo({ year: nextYear, month: nextMonth })
      setShowLockedModal(true)
    }
  }

  // 检查是否可以导航到上个月
  const canGoPrev = () => {
    let prevYear = currentYear
    let prevMonth = currentMonth - 1
    if (prevMonth < 0) {
      prevYear -= 1
      prevMonth = 11
    }
    return isMonthInRange(prevYear, prevMonth)
  }

  // 检查是否可以导航到下个月（只检查是否在启动范围内，点击时再判断是否解锁）
  const canGoNext = () => {
    let nextYear = currentYear
    let nextMonth = currentMonth + 1
    if (nextMonth > 11) {
      nextYear += 1
      nextMonth = 0
    }
    return isMonthInRange(nextYear, nextMonth)
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
          disabled={!canGoPrev()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            canGoPrev()
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-white/5 opacity-30 cursor-not-allowed'
          }`}
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
          disabled={!canGoNext()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            canGoNext()
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-white/5 opacity-30 cursor-not-allowed'
          }`}
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

      {/* 月份锁定提示弹窗 */}
      <AnimatePresence>
        {showLockedModal && lockedMonthInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowLockedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl border border-white/20 p-6 max-w-sm w-full text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 border border-white/20 hover:bg-zinc-700 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* 图标 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-white mb-2">
                {lockedMonthInfo.year}年{lockedMonthInfo.month + 1}月
              </h3>

              {/* 副标题 */}
              <p className="text-amber-400 text-sm mb-4">
                这个月的壁纸还在路上～
              </p>

              {/* 鼓励话语 */}
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {getRandomMessage()}
              </p>

              {/* 确认按钮 */}
              <button
                onClick={() => setShowLockedModal(false)}
                className="w-full btn-stardust py-3"
              >
                我知道了，继续探索
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
