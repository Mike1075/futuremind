'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Calendar, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import {
  getWallpapersForDate,
  getWallpaperUrl,
  getFileName,
  isDateUnlocked,
  LAUNCH_DATE,
  formatDate,
  Language,
  Orientation
} from '@/lib/seth365/wallpaper'

interface BatchDownloadModalProps {
  onClose: () => void
}

type DownloadRange = 'today' | 'week' | 'month' | 'custom'
type FilterLanguage = 'all' | 'C' | 'E'
type FilterOrientation = 'all' | 'S' | 'H'

export function BatchDownloadModal({ onClose }: BatchDownloadModalProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [range, setRange] = useState<DownloadRange>('today')
  const [customMonth, setCustomMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [filterLanguage, setFilterLanguage] = useState<FilterLanguage>('all')
  const [filterOrientation, setFilterOrientation] = useState<FilterOrientation>('all')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // 计算日期范围内的已解锁日期
  const getUnlockedDatesInRange = useMemo(() => {
    const dates: Date[] = []

    if (range === 'today') {
      if (isDateUnlocked(today)) {
        dates.push(new Date(today))
      }
    } else if (range === 'week') {
      // 获取本周（周一到今天）
      const dayOfWeek = today.getDay()
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(today)
      monday.setDate(today.getDate() - mondayOffset)

      for (let d = new Date(monday); d <= today; d.setDate(d.getDate() + 1)) {
        if (isDateUnlocked(d)) {
          dates.push(new Date(d))
        }
      }
    } else if (range === 'month') {
      // 获取本月（1号到今天）
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
        if (isDateUnlocked(d)) {
          dates.push(new Date(d))
        }
      }
    } else if (range === 'custom') {
      // 获取自定义月份
      const firstDay = new Date(customMonth.year, customMonth.month, 1)
      const lastDay = new Date(customMonth.year, customMonth.month + 1, 0)
      const endDate = lastDay < today ? lastDay : today

      for (let d = new Date(firstDay); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (isDateUnlocked(d)) {
          dates.push(new Date(d))
        }
      }
    }

    return dates
  }, [range, customMonth, today])

  // 计算要下载的壁纸数量
  const wallpaperCount = useMemo(() => {
    let count = 0
    for (const date of getUnlockedDatesInRange) {
      const wallpapers = getWallpapersForDate(date)
      for (const w of wallpapers) {
        if (filterLanguage !== 'all' && w.language !== filterLanguage) continue
        if (filterOrientation !== 'all' && w.orientation !== filterOrientation) continue
        count++
      }
    }
    return count
  }, [getUnlockedDatesInRange, filterLanguage, filterOrientation])

  // 切换自定义月份
  const changeCustomMonth = (delta: number) => {
    const newDate = new Date(customMonth.year, customMonth.month + delta, 1)
    // 不能超过今天所在月份
    if (newDate > today) return
    // 不能早于启动日期所在月份
    if (newDate < new Date(LAUNCH_DATE.getFullYear(), LAUNCH_DATE.getMonth(), 1)) return

    setCustomMonth({ year: newDate.getFullYear(), month: newDate.getMonth() })
  }

  // 执行批量下载
  const handleDownload = async () => {
    if (wallpaperCount === 0) return

    setIsDownloading(true)
    setDownloadProgress(0)

    let downloaded = 0

    for (const date of getUnlockedDatesInRange) {
      const wallpapers = getWallpapersForDate(date)

      for (const wallpaper of wallpapers) {
        if (filterLanguage !== 'all' && wallpaper.language !== filterLanguage) continue
        if (filterOrientation !== 'all' && wallpaper.orientation !== filterOrientation) continue

        const url = getWallpaperUrl(wallpaper)
        const fileName = getFileName(wallpaper)

        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        downloaded++
        setDownloadProgress(Math.round((downloaded / wallpaperCount) * 100))

        // 延迟避免浏览器阻止
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    setIsDownloading(false)
    setDownloadProgress(100)

    // 下载完成后短暂显示100%，然后关闭
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  const rangeOptions: { key: DownloadRange; label: string; desc: string }[] = [
    { key: 'today', label: '今天', desc: '下载今天的壁纸' },
    { key: 'week', label: '本周', desc: '下载本周已解锁的壁纸' },
    { key: 'month', label: '本月', desc: '下载本月已解锁的壁纸' },
    { key: 'custom', label: '选择月份', desc: '选择特定月份下载' }
  ]

  const languageOptions: { key: FilterLanguage; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'C', label: '中文' },
    { key: 'E', label: '英文' }
  ]

  const orientationOptions: { key: FilterOrientation; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'S', label: '竖版' },
    { key: 'H', label: '横版' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 rounded-2xl border border-white/20 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-6 h-6 text-purple-400" />
            批量下载
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 日期范围选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              选择日期范围
            </label>
            <div className="grid grid-cols-2 gap-2">
              {rangeOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setRange(option.key)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    range === option.key
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    {range === option.key && <Check className="w-4 h-4 text-purple-400" />}
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义月份选择器 */}
          {range === 'custom' && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeCustomMonth(-1)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-medium text-white">
                      {customMonth.year}年{customMonth.month + 1}月
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => changeCustomMonth(1)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* 语言筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              语言
            </label>
            <div className="flex gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilterLanguage(option.key)}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    filterLanguage === option.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 方向筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              方向
            </label>
            <div className="flex gap-2">
              {orientationOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setFilterOrientation(option.key)}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    filterOrientation === option.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-gray-400 mb-1">将下载</div>
            <div className="text-3xl font-bold text-purple-400">
              {wallpaperCount} <span className="text-lg text-gray-400">张壁纸</span>
            </div>
            {getUnlockedDatesInRange.length > 0 && (
              <div className="text-sm text-gray-500 mt-2">
                共 {getUnlockedDatesInRange.length} 天的壁纸
              </div>
            )}
          </div>

          {/* 下载进度 */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">下载中...</span>
                <span className="text-purple-400">{downloadProgress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            disabled={wallpaperCount === 0 || isDownloading}
            className="w-full btn-stardust py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                下载中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                开始下载
              </>
            )}
          </button>

          {/* 提示 */}
          {wallpaperCount === 0 && (
            <p className="text-sm text-center text-amber-400">
              所选范围内没有已解锁的壁纸
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
