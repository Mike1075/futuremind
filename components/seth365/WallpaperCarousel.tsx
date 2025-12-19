'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Play,
  Maximize2,
  X,
  QrCode
} from 'lucide-react'
import {
  Wallpaper,
  getWallpapersForDate,
  getWallpaperUrl,
  getDisplayName,
  filterWallpapers,
  Language,
  Orientation,
  formatDate
} from '@/lib/seth365/wallpaper'

interface WallpaperCarouselProps {
  date: Date
  onOpenPosterEditor: (wallpaper: Wallpaper) => void
  onOpenBatchDownload: () => void
}

type FilterType = 'all' | 'chinese' | 'english' | 'portrait' | 'landscape'

export function WallpaperCarousel({ date, onOpenPosterEditor, onOpenBatchDownload }: WallpaperCarouselProps) {
  const allWallpapers = getWallpapersForDate(date)
  const [filter, setFilter] = useState<FilterType>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  // 根据筛选条件获取壁纸列表
  const getFilteredWallpapers = useCallback(() => {
    let language: Language | undefined
    let orientation: Orientation | undefined

    switch (filter) {
      case 'chinese':
        language = 'C'
        break
      case 'english':
        language = 'E'
        break
      case 'portrait':
        orientation = 'S'
        break
      case 'landscape':
        orientation = 'H'
        break
    }

    return filterWallpapers(allWallpapers, language, orientation)
  }, [allWallpapers, filter])

  const wallpapers = getFilteredWallpapers()
  const currentWallpaper = wallpapers[currentIndex]

  // 切换时重置索引
  useEffect(() => {
    setCurrentIndex(0)
  }, [filter, date])

  // 自动轮播
  useEffect(() => {
    if (!isPlaying || wallpapers.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % wallpapers.length)
    }, 5000) // 5秒切换

    return () => clearInterval(timer)
  }, [isPlaying, wallpapers.length])

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + wallpapers.length) % wallpapers.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % wallpapers.length)
  }

  const handleDownload = async (wallpaper: Wallpaper) => {
    const url = getWallpaperUrl(wallpaper)
    const link = document.createElement('a')
    link.href = url
    link.download = `赛斯365_${formatDate(wallpaper.date)}_${getDisplayName(wallpaper)}.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = async () => {
    for (const wallpaper of wallpapers) {
      await handleDownload(wallpaper)
      // 延迟避免浏览器阻止
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'chinese', label: '中文' },
    { key: 'english', label: '英文' },
    { key: 'portrait', label: '竖版' },
    { key: 'landscape', label: '横版' }
  ]

  if (!currentWallpaper) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
        <p className="text-gray-400">暂无壁纸</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
      >
        {/* 日期标题 */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white text-center">
            {formatDate(date)} 的壁纸
          </h3>
        </div>

        {/* 筛选标签 */}
        <div className="flex flex-wrap justify-center gap-2 p-4 border-b border-white/10">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                filter === f.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 轮播主体 */}
        <div className="relative">
          {/* 图片容器 */}
          <div className="relative aspect-[3/4] md:aspect-video bg-black/50 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {imageError[currentIndex] ? (
                  <div className="text-center text-gray-400">
                    <p>图片加载失败</p>
                    <p className="text-sm mt-2">请确保图片已上传到正确位置</p>
                  </div>
                ) : (
                  <Image
                    src={getWallpaperUrl(currentWallpaper)}
                    alt={getDisplayName(currentWallpaper)}
                    fill
                    className="object-contain"
                    onError={() => setImageError((prev) => ({ ...prev, [currentIndex]: true }))}
                    priority
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* 左右切换按钮 */}
            {wallpapers.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* 全屏按钮 */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>

            {/* 播放/暂停按钮 */}
            {wallpapers.length > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
            )}

            {/* 图片信息 */}
            <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg px-3 py-1.5">
              <span className="text-white text-sm">
                {getDisplayName(currentWallpaper)} ({currentIndex + 1}/{wallpapers.length})
              </span>
            </div>
          </div>
        </div>

        {/* 缩略图导航 */}
        <div className="flex gap-2 p-4 overflow-x-auto">
          {wallpapers.map((wallpaper, index) => (
            <button
              key={`${wallpaper.language}${wallpaper.orientation}${wallpaper.index}`}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-purple-500 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={getWallpaperUrl(wallpaper)}
                alt={getDisplayName(wallpaper)}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap justify-center gap-3 p-4 border-t border-white/10">
          <button
            onClick={() => handleDownload(currentWallpaper)}
            className="btn-stardust px-6 py-2 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载当前
          </button>
          <button
            onClick={onOpenBatchDownload}
            className="btn-stardust px-6 py-2 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            批量下载
          </button>
          <button
            onClick={() => onOpenPosterEditor(currentWallpaper)}
            className="btn-stardust px-6 py-2 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            生成我的海报
          </button>
        </div>
      </motion.div>

      {/* 全屏预览 */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <Image
              src={getWallpaperUrl(currentWallpaper)}
              alt={getDisplayName(currentWallpaper)}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* 全屏模式下的切换按钮 */}
            {wallpapers.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrev()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* 图片信息 */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 rounded-lg px-4 py-2">
              <span className="text-white">
                {formatDate(currentWallpaper.date)} - {getDisplayName(currentWallpaper)} ({currentIndex + 1}/{wallpapers.length})
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
