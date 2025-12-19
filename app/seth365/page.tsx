'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CountdownCard } from '@/components/seth365/CountdownCard'
import { CalendarView } from '@/components/seth365/CalendarView'
import { WallpaperCarousel } from '@/components/seth365/WallpaperCarousel'
import { DownloadSection } from '@/components/seth365/DownloadSection'
import { PosterEditor } from '@/components/seth365/PosterEditor'
import { isLaunched, Wallpaper, getDaysUntilLaunch } from '@/lib/seth365/wallpaper'

export default function Seth365Page() {
  const router = useRouter()
  const launched = isLaunched()
  const daysUntilLaunch = getDaysUntilLaunch()

  // 测试模式：允许在启动前预览壁纸
  const [testMode, setTestMode] = useState(false)

  // 默认选中今天（测试模式下选12月21日）
  const today = new Date()
  const defaultDate = launched ? today : new Date(2025, 11, 21) // 使用本地时间避免时区问题
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate)
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null)

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
              onClick={() => router.push('/portal')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回门户</span>
            </button>

            {/* 标题 */}
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              赛斯365
            </h1>

            {/* 测试模式切换（仅在未启动时显示） */}
            {!launched && (
              <button
                onClick={() => setTestMode(!testMode)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {testMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {testMode ? '退出预览' : '预览壁纸'}
              </button>
            )}
            {launched && <div className="w-24" />}
          </div>
        </div>
      </motion.nav>

      {/* 主内容 */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 未启动且非测试模式：显示倒计时 */}
          {!launched && !testMode ? (
            <div className="py-12">
              <CountdownCard />
            </div>
          ) : (
            // 已启动 或 测试模式：显示壁纸
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
                        onSelectDate={(date) => {
                          setSelectedDate(date)
                          setShowCalendar(false)
                        }}
                        testMode={testMode}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 壁纸轮播 */}
                <WallpaperCarousel
                  date={selectedDate}
                  onOpenPosterEditor={(wallpaper) => setEditingWallpaper(wallpaper)}
                />
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
          )}
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
    </div>
  )
}
