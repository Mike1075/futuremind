'use client'

import { X, Target, TrendingUp, Sparkles } from 'lucide-react'

interface LockedNextModalProps {
  currentScore?: number  // 当前分数（如果有的话）
  onClose: () => void
}

export function LockedNextModal({ currentScore, onClose }: LockedNextModalProps) {
  // 根据分数生成不同的鼓励话术
  const getMessage = () => {
    if (!currentScore || currentScore === 0) {
      return {
        title: '还没提交作业哦',
        subtitle: '完成今天的学习感悟，开启下一段旅程',
        emoji: '📝',
        tip: '点击"提交作业/感悟"按钮，分享你的学习体会'
      }
    } else if (currentScore < 30) {
      return {
        title: '再深入思考一下',
        subtitle: '每一次用心的反思都是成长的种子',
        emoji: '🌱',
        tip: '试着多写一些你的真实感受和体会'
      }
    } else if (currentScore < 50) {
      return {
        title: '快到了！',
        subtitle: '你已经迈出了重要的一步，再努力一点点',
        emoji: '💪',
        tip: '可以结合自己的生活经历来分享感悟'
      }
    } else {
      return {
        title: '就差一点点！',
        subtitle: '你的感悟已经很棒了，再深入一些就能解锁',
        emoji: '✨',
        tip: '试着写得更具体、更深入，分享你的独特见解'
      }
    }
  }

  const message = getMessage()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-white/20 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰 */}
        <div className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 p-6 text-center relative">
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
          <p className="text-gray-300 mb-6">{message.subtitle}</p>

          {/* 分数显示（如果有） */}
          {currentScore !== undefined && currentScore > 0 && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span className="text-gray-300">当前最高分</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold text-amber-400">{currentScore}</span>
                <span className="text-gray-500">/</span>
                <span className="text-2xl text-gray-400">60分</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                还差 {60 - currentScore} 分解锁下一课
              </div>
            </div>
          )}

          {/* 解锁条件 */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-300 font-medium">解锁条件</span>
            </div>
            <p className="text-emerald-400 font-semibold">
              提交作业并获得 60 分以上
            </p>
          </div>

          {/* 提示 */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-white/5 rounded-lg px-4 py-3">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{message.tip}</span>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full btn-stardust py-3"
          >
            好的，我去完成作业
          </button>
        </div>
      </div>
    </div>
  )
}
