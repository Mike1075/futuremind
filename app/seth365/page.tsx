'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CalendarView } from '@/components/seth365/CalendarView'
import { WallpaperCarousel } from '@/components/seth365/WallpaperCarousel'
import { DownloadSection } from '@/components/seth365/DownloadSection'
import { PosterEditor } from '@/components/seth365/PosterEditor'
import { BatchDownloadModal } from '@/components/seth365/BatchDownloadModal'
import { LockedDateModal } from '@/components/seth365/LockedDateModal'
import { Wallpaper, getDaysUntilLaunch, LAUNCH_DATE, isDateUnlocked, getLatestUnlockedDate } from '@/lib/seth365/wallpaper'

export default function Seth365Page() {
  const router = useRouter()
  const daysUntilLaunch = getDaysUntilLaunch()
  const isBeforeLaunch = daysUntilLaunch > 0

  // 默认选中最新可用日期（今天或启动前显示启动日期前一天的提示）
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const latest = getLatestUnlockedDate()
    return latest || new Date()
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null)
  const [showBatchDownload, setShowBatchDownload] = useState(false)
  const [lockedDateInfo, setLockedDateInfo] = useState<{ date: Date; daysUntil: number } | null>(null)

  const today = new Date()

  // 处理日期选择
  const handleSelectDate = (date: Date) => {
    if (isDateUnlocked(date)) {
      setSelectedDate(date)
      setShowCalendar(false)
    } else {
      // 计算还要等多少天
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      const todayNorm = new Date()
      todayNorm.setHours(0, 0, 0, 0)
      const daysUntil = Math.ceil((checkDate.getTime() - todayNorm.getTime()) / (1000 * 60 * 60 * 24))
      setLockedDateInfo({ date, daysUntil })
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* 顶部导航 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </button>

            {/* 标题 */}
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              赛斯365
            </h1>

            {/* 倒计时提示（启动前显示） */}
            {isBeforeLaunch ? (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Clock className="w-4 h-4" />
                <span>{daysUntilLaunch}天后启程</span>
              </div>
            ) : (
              <div className="w-24" />
            )}
          </div>
        </div>
      </motion.nav>

      {/* 主内容 */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 启动前提示横幅 */}
          {isBeforeLaunch && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4"
            >
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-white">
                  赛斯365将于 <span className="text-purple-300 font-bold">2025年12月21日</span> 正式启程
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-amber-400">
                  还有 <span className="font-bold">{daysUntilLaunch}</span> 天
                </span>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：壁纸展示区 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 日期选择器 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-4"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">
                    {selectedDate.getFullYear()}年
                    {selectedDate.getMonth() + 1}月
                    {selectedDate.getDate()}日
                  </span>
                  {selectedDate.toDateString() === today.toDateString() && (
                    <span className="px-2 py-0.5 bg-purple-600/30 rounded-full text-xs text-purple-300">
                      今天
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="btn-stardust px-4 py-2 text-sm"
                >
                  {showCalendar ? '隐藏日历' : '选择日期'}
                </button>
              </motion.div>

              {/* 日历（可展开） */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <CalendarView
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 壁纸轮播 */}
              {isDateUnlocked(selectedDate) ? (
                <WallpaperCarousel
                  date={selectedDate}
                  onOpenPosterEditor={(wallpaper) => setEditingWallpaper(wallpaper)}
                  onOpenBatchDownload={() => setShowBatchDownload(true)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center"
                >
                  <Clock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">即将启程</h3>
                  <p className="text-gray-400 mb-4">
                    赛斯365将于12月21日正式开始，届时每天都会有新的灵感壁纸等待你
                  </p>
                  <p className="text-purple-300">
                    还有 <span className="text-2xl font-bold">{daysUntilLaunch}</span> 天
                  </p>
                </motion.div>
              )}
            </div>

            {/* 右侧：下载区 */}
            <div className="space-y-6">
              <DownloadSection />

              {/* 使用提示 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">使用提示</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">1.</span>
                    <span>每天有8张壁纸：中英文各4张，竖版横版各2张</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">2.</span>
                    <span>点击壁纸可全屏预览，支持手势切换</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">3.</span>
                    <span>"生成我的海报"可替换成你自己的二维码</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">4.</span>
                    <span>下载客户端可实现自动切换壁纸</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* 海报编辑器 */}
      <AnimatePresence>
        {editingWallpaper && (
          <PosterEditor
            wallpaper={editingWallpaper}
            onClose={() => setEditingWallpaper(null)}
          />
        )}
      </AnimatePresence>

      {/* 批量下载弹窗 */}
      <AnimatePresence>
        {showBatchDownload && (
          <BatchDownloadModal onClose={() => setShowBatchDownload(false)} />
        )}
      </AnimatePresence>

      {/* 日期锁定提示弹窗 */}
      <AnimatePresence>
        {lockedDateInfo && (
          <LockedDateModal
            date={lockedDateInfo.date}
            daysUntil={lockedDateInfo.daysUntil}
            onClose={() => setLockedDateInfo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
