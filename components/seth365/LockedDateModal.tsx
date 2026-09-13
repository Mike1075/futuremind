'use client'

import { motion } from 'framer-motion'
import { Clock, X, Sparkles, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/seth365/wallpaper'

interface LockedDateModalProps {
  date: Date
  daysUntil: number
  onClose: () => void
}

export function LockedDateModal({ date, daysUntil, onClose }: LockedDateModalProps) {
  // 根据等待天数生成不同的鼓励话术
  const getMessage = () => {
    if (daysUntil === 1) {
      return {
        title: '明天见！',
        subtitle: '美好的灵感，只隔一夜的梦',
        emoji: '🌙'
      }
    } else if (daysUntil <= 3) {
      return {
        title: '就快到了！',
        subtitle: '好东西值得等待，灵感正在酝酿中',
        emoji: '✨'
      }
    } else if (daysUntil <= 7) {
      return {
        title: '一周之内！',
        subtitle: '时间会带来惊喜，保持期待',
        emoji: '🌟'
      }
    } else if (daysUntil <= 30) {
      return {
        title: '不远了！',
        subtitle: '每一天的等待都让期待更加甜蜜',
        emoji: '🎁'
      }
    } else {
      return {
        title: '未来可期！',
        subtitle: '时间是最好的礼物，这份灵感正在为你准备',
        emoji: '🌈'
      }
    }
  }

  const message = getMessage()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-white/20 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰 */}
        <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="text-5xl mb-3">{message.emoji}</div>
          <h2 className="text-2xl font-bold text-white">{message.title}</h2>
        </div>

        {/* 内容 */}
        <div className="p-6 text-center">
          {/* 日期显示 */}
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">{formatDate(date)}</span>
          </div>

          <p className="text-gray-400 mb-6">{message.subtitle}</p>

          {/* 倒计时 */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-gray-300">还需等待</span>
            </div>
            <div className="text-4xl font-bold text-amber-400">
              {daysUntil} <span className="text-xl text-gray-400">天</span>
            </div>
          </div>

          {/* 提示 */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4" />
            <span>每天0点准时解锁新的灵感</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full btn-stardust py-3"
          >
            知道了，期待那一天
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
