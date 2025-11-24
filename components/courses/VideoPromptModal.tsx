'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Play } from 'lucide-react'

interface VideoPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  videoLink: string
  preWatchGuide: string
  stageTitle: string
  subtitle?: string // 副标题
}

export function VideoPromptModal({
  isOpen,
  onClose,
  onProceed,
  videoLink,
  preWatchGuide,
  stageTitle,
  subtitle
}: VideoPromptModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 模态框内容 */}
          <motion.div
            className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 顶部装饰 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 内容区域 */}
            <div className="p-8">
              {/* 标题 */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🎬
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{stageTitle}</h2>
                  <p className="text-sm text-gray-400 mt-1">开始学习前，请先观看视频</p>
                </div>
              </div>

              {/* 视频链接卡片 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  📺 视频内容
                </label>
                <a
                  href={videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-blue-500/50 hover:bg-gray-800/70 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Play className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                          {subtitle || '点击观看视频'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          点击跳转到视频平台观看
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>
                </a>
              </div>

              {/* 观看前思考 */}
              {preWatchGuide && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    💭 观看前思考
                  </label>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {preWatchGuide}
                    </p>
                  </div>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all border border-gray-700 hover:border-gray-600"
                >
                  我先去看视频，下次再学
                </button>
                <button
                  onClick={onProceed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                  我已看完视频，开始学习
                </button>
              </div>

              {/* 提示文字 */}
              <p className="text-xs text-gray-500 text-center mt-4">
                💡 提示：观看视频后学习效果会更好哦
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
