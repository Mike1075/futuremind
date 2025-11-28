// @ts-nocheck
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { VideoPromptModal } from './VideoPromptModal'

interface Stage {
  stageNumber: number
  contents: any[]
  completedCount: number
  totalCount: number
  isUnlocked: boolean
}

interface StageNodeProps {
  stage: Stage
  position: { x: number; y: number; angle: number }
  icon: string
  color: { from: string; to: string }
  progress: number
  delay: number
  firstContentId: string | null
  systemKey: string
}

export function StageNode({
  stage,
  position,
  icon,
  color,
  progress,
  delay,
  firstContentId,
  systemKey
}: StageNodeProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const isCompleted = progress === 100
  const isUnlocked = stage.isUnlocked

  // 节点尺寸
  const nodeSize = 60
  const iconSize = 24

  // 获取第一个内容的视频信息
  const firstContent = stage.contents.length > 0 ? stage.contents[0] : null
  const videoLink = firstContent?.documentary_url || ''
  const preWatchGuide = firstContent?.pre_watch_guide || ''
  const stageTitle = firstContent?.title || `第${stage.stageNumber}阶段`
  const subtitle = firstContent?.subtitle || ''

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isUnlocked || !firstContentId) return

    // 如果有视频链接或观看前思考内容，显示模态框
    if (videoLink || preWatchGuide) {
      setShowModal(true)
    } else {
      // 否则直接跳转
      router.push(`/courses/${systemKey}/${firstContentId}`)
    }
  }

  // 处理继续学习
  const handleProceed = () => {
    setShowModal(false)
    if (firstContentId) {
      router.push(`/courses/${systemKey}/${firstContentId}`)
    }
  }

  const NodeContent = (
    <motion.div
      className={`absolute ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      style={{
        left: position.x,
        top: position.y,
        x: '-50%',
        y: '-50%'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: isUnlocked ? 1.1 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.95 : 1 }}
    >
      {/* 外圈进度环 */}
      <svg
        width={nodeSize + 12}
        height={nodeSize + 12}
        className="absolute -left-1.5 -top-1.5"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* 背景圈 */}
        <circle
          cx={(nodeSize + 12) / 2}
          cy={(nodeSize + 12) / 2}
          r={(nodeSize + 12) / 2 - 3}
          fill="none"
          stroke="#374151"
          strokeWidth={3}
        />

        {/* 进度圈 */}
        {isUnlocked && (
          <motion.circle
            cx={(nodeSize + 12) / 2}
            cy={(nodeSize + 12) / 2}
            r={(nodeSize + 12) / 2 - 3}
            fill="none"
            stroke={`url(#gradient-node-${stage.stageNumber})`}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * ((nodeSize + 12) / 2 - 3)}`}
            initial={{ strokeDashoffset: 2 * Math.PI * ((nodeSize + 12) / 2 - 3) }}
            animate={{
              strokeDashoffset: 2 * Math.PI * ((nodeSize + 12) / 2 - 3) * (1 - progress / 100)
            }}
            transition={{ duration: 1, delay: delay + 0.3 }}
          />
        )}

        {/* 节点颜色渐变定义 */}
        <defs>
          <linearGradient id={`gradient-node-${stage.stageNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color.from} />
            <stop offset="100%" stopColor={color.to} />
          </linearGradient>
        </defs>
      </svg>

      {/* 主节点 */}
      <motion.div
        className={`relative rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
          isUnlocked ? '' : 'opacity-40'
        }`}
        style={{
          width: nodeSize,
          height: nodeSize,
          background: isUnlocked
            ? `linear-gradient(135deg, ${color.from}, ${color.to})`
            : 'linear-gradient(135deg, #4b5563, #374151)',
          boxShadow: isCompleted
            ? `0 0 20px ${color.from}40`
            : '0 4px 12px rgba(0,0,0,0.3)'
        }}
        animate={{
          width: nodeSize,
          height: nodeSize
        }}
      >
        {/* 图标 */}
        <span
          className="transition-all duration-300"
          style={{ fontSize: iconSize }}
        >
          {icon}
        </span>

        {/* 完成标识 */}
        {isCompleted && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: delay + 0.5 }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}

        {/* 锁定图标 */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </motion.div>

      {/* 阶段标签 */}
      <motion.div
        className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-center ${
          isUnlocked ? 'text-white' : 'text-gray-600'
        }`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.2 }}
      >
        <div className="text-xs font-medium">
          第{stage.stageNumber}阶段
        </div>
        {isUnlocked && (
          <div className="text-[10px] text-gray-400 mt-0.5">
            {progress}%
          </div>
        )}
      </motion.div>
    </motion.div>
  )

  return (
    <>
      {/* 节点内容 - 添加点击事件 */}
      <div onClick={handleClick}>
        {NodeContent}
      </div>

      {/* 视频提示框 */}
      <VideoPromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProceed={handleProceed}
        videoLink={videoLink}
        preWatchGuide={preWatchGuide}
        stageTitle={stageTitle}
        subtitle={subtitle}
      />
    </>
  )
}
