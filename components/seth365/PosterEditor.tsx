'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Download, RotateCcw, Move, ZoomIn, ZoomOut, Trash2, HelpCircle, ExternalLink } from 'lucide-react'
import { Wallpaper, getWallpaperUrl, getDisplayName, formatDate } from '@/lib/seth365/wallpaper'

interface PosterEditorProps {
  wallpaper: Wallpaper
  onClose: () => void
}

// 二维码默认位置和大小（右下角底部）
const DEFAULT_QR_POSITION = {
  x: 0.88, // 相对于图片宽度的比例
  y: 0.92, // 相对于图片高度的比例，更靠近底部
  size: 0.10 // 相对于图片宽度的比例
}

export function PosterEditor({ wallpaper, onClose }: PosterEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null)
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null)
  const [qrPosition, setQrPosition] = useState(DEFAULT_QR_POSITION)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载海报图片
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setPosterImage(img)
      setIsLoading(false)
    }
    img.onerror = () => {
      setError('海报加载失败，请确保图片已上传')
      setIsLoading(false)
    }
    img.src = getWallpaperUrl(wallpaper)
  }, [wallpaper])

  // 绘制画布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !posterImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = posterImage.width
    canvas.height = posterImage.height

    // 绘制海报
    ctx.drawImage(posterImage, 0, 0)

    // 绘制二维码
    if (qrImage) {
      const qrSize = posterImage.width * qrPosition.size
      const qrX = posterImage.width * qrPosition.x - qrSize / 2
      const qrY = posterImage.height * qrPosition.y - qrSize / 2

      // 绘制白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)

      // 绘制二维码
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
    }
  }, [posterImage, qrImage, qrPosition])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // 处理二维码上传
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        setQrImage(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
    // 清空 input 以便重新上传同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 删除二维码
  const handleDeleteQr = () => {
    setQrImage(null)
    setQrPosition(DEFAULT_QR_POSITION)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 更换二维码
  const handleChangeQr = () => {
    fileInputRef.current?.click()
  }

  // 处理拖动
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!qrImage) return
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    const x = ((e.clientX - rect.left) * scaleX) / canvasRef.current.width
    const y = ((e.clientY - rect.top) * scaleY) / canvasRef.current.height

    // 允许拖动到更边缘的位置，特别是底部
    // 考虑二维码大小，防止完全超出边界
    const halfSize = qrPosition.size / 2
    setQrPosition((prev) => ({
      ...prev,
      x: Math.max(halfSize, Math.min(1 - halfSize, x)),
      y: Math.max(halfSize, Math.min(1 - halfSize, y))
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 调整二维码大小
  const adjustSize = (delta: number) => {
    setQrPosition((prev) => ({
      ...prev,
      size: Math.max(0.03, Math.min(0.25, prev.size + delta))
    }))
  }

  // 重置位置
  const resetPosition = () => {
    setQrPosition(DEFAULT_QR_POSITION)
  }

  // 下载生成的海报
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `我的赛斯365_${formatDate(wallpaper.date)}_${getDisplayName(wallpaper)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">生成我的海报</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* 左侧：画布预览 */}
          <div className="flex-1 p-4 flex items-center justify-center bg-black/50 min-h-[400px]">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">加载中...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                <p>{error}</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[60vh] cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            )}
          </div>

          {/* 右侧：控制面板 */}
          <div className="w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-white/10 space-y-4">
            {/* 上传二维码标题 + 帮助按钮 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                上传你的二维码
              </label>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
                title="如何获取二维码"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* 帮助说明（可展开） */}
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-sm"
              >
                <h4 className="text-purple-300 font-medium mb-2">如何获取心灵家园推广二维码？</h4>
                <ol className="text-gray-400 space-y-2 list-decimal list-inside">
                  <li>打开<span className="text-white">「心灵家园」</span>微信小程序</li>
                  <li>点击<span className="text-white">「我的」</span>→<span className="text-white">「邀请好友」</span></li>
                  <li>长按保存你的专属推广二维码</li>
                  <li>在此上传该二维码图片</li>
                </ol>
                <p className="text-gray-500 mt-2 text-xs">
                  好友扫码关注后，你将获得推广奖励积分
                </p>
              </motion.div>
            )}

            {/* 上传区域 */}
            <div>
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="hidden"
              />

              {qrImage ? (
                // 已上传二维码：显示预览和操作按钮
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={qrImage.src}
                        alt="二维码"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">已上传二维码</p>
                      <p className="text-xs text-gray-500">拖动画布调整位置</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangeQr}
                      className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      更换
                    </button>
                    <button
                      onClick={handleDeleteQr}
                      className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                // 未上传：显示上传区域
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">点击上传二维码图片</span>
                  <span className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 位置调整 */}
            {qrImage && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    调整位置
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 rounded-lg p-3">
                    <Move className="w-4 h-4" />
                    <span>拖动画布中的二维码调整位置</span>
                  </div>
                </div>

                {/* 大小调整 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    调整大小
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustSize(-0.01)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <ZoomOut className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1 text-center text-gray-300">
                      {Math.round(qrPosition.size * 100)}%
                    </div>
                    <button
                      onClick={() => adjustSize(0.01)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* 重置按钮 */}
                <button
                  onClick={resetPosition}
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置位置
                </button>
              </>
            )}

            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              disabled={!posterImage}
              className="w-full btn-stardust py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              下载我的海报
            </button>

            {/* 提示 */}
            <p className="text-xs text-gray-500 text-center">
              {qrImage
                ? '拖动画布中的二维码调整位置，满意后点击下载'
                : '点击右上角 ? 查看如何获取心灵家园推广二维码'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
