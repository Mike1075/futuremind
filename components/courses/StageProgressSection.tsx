// @ts-nocheck
'use client'

import { memo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Unlock } from 'lucide-react'
import { globalToast } from '@/components/ui/ToastProvider'

interface StageInfo {
  id: string
  stage_number: number
  stage_name: string
}

interface StageProgressSectionProps {
  currentStage: StageInfo
  stageProgress: number
  isUnlocked: boolean
  showUnlockAnimation: boolean
  systemKey: string
  prevStage: StageInfo | null
  prevStageFirstContentId: string | null
  nextStage: StageInfo | null
  nextStageFirstContentId: string | null
}

/**
 * 阶段进度条区域组件
 * 显示当前阶段进度、上一阶段和下一阶段导航
 */
export const StageProgressSection = memo(function StageProgressSection({
  currentStage,
  stageProgress,
  isUnlocked,
  showUnlockAnimation,
  systemKey,
  prevStage,
  prevStageFirstContentId,
  nextStage,
  nextStageFirstContentId
}: StageProgressSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 mb-8"
    >
      {/* 阶段标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {currentStage.stage_name}
        </h3>
        <span className="text-lg font-semibold text-green-400">
          {stageProgress}%
        </span>
      </div>

      {/* 进度条 */}
      <div className="progress-ethereal relative h-3 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stageProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full progress-ethereal-bar relative"
        >
          {/* 进度条光效 */}
          <motion.div
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>

      {/* 阶段导航 - 左右布局 */}
      <div className="flex items-stretch gap-4 mt-6">
        {/* 左侧：上一阶段 */}
        {prevStage && prevStageFirstContentId ? (
          <Link href={`/courses/${systemKey}/${prevStageFirstContentId}`} className="flex-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full px-6 py-4 bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">回顾上一阶段</div>
                  <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {prevStage.stage_name}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {/* 右侧：下一阶段 */}
        {nextStage && (
          isUnlocked && nextStageFirstContentId ? (
            // 解锁状态 - 可点击
            <Link href={`/courses/${systemKey}/${nextStageFirstContentId}`} className="flex-1">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative h-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl cursor-pointer group overflow-hidden"
              >
                {/* 解锁动画背景 */}
                {showUnlockAnimation && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-yellow-400 rounded-xl"
                  />
                )}

                <div className="relative flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-white/80">下一阶段已解锁</div>
                    <div className="text-sm font-bold text-white">
                      {nextStage.stage_name}
                    </div>
                  </div>
                  <Unlock className="w-5 h-5 text-white flex-shrink-0" />
                </div>

                {/* 光效 */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </motion.div>
            </Link>
          ) : (
            // 锁定状态 - 点击显示友好提示
            <div className="flex-1">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  globalToast.info(
                    `🔒 下一阶段还没解锁哦～\n\n` +
                    `💡 试试这些方法来增加进度：\n` +
                    `   📖 完成当前阶段的课程内容\n` +
                    `   💬 和盖亚聊聊你的想法\n` +
                    `   ✍️ 认真回答课后问题\n\n` +
                    `加油，很快就能解锁啦！🌟`,
                    8000
                  )
                }}
                className="relative h-full px-6 py-4 bg-gray-800/30 border-2 border-gray-700/50 rounded-xl cursor-pointer hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-center gap-3 opacity-50">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">
                      {stageProgress >= 60 ? '即将解锁...' : `完成${Math.ceil(60 - stageProgress)}%后解锁`}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {nextStage.stage_name}
                    </div>
                  </div>
                  <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </div>

                {/* 锁定粒子效果 */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                      className="absolute w-1 h-1 bg-gray-600 rounded-full"
                      style={{ left: `${30 + i * 20}%`, top: '50%' }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          )
        )}
      </div>
    </motion.div>
  )
})
