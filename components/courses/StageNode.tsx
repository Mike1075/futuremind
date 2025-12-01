// @ts-nocheck
'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Eye, Ear, Brain, Users, Globe, Sparkles } from 'lucide-react'

// 获取阶段对应的矢量图标
const getStageIconComponent = (stageNumber: number) => {
  const iconProps = { className: "w-6 h-6", strokeWidth: 2 }
  switch(stageNumber) {
    case 1: return <Eye {...iconProps} />
    case 2: return <Ear {...iconProps} />
    case 3: return <Brain {...iconProps} />
    case 4: return <Users {...iconProps} />
    case 5: return <Globe {...iconProps} />
    case 6: return <Sparkles {...iconProps} />
    default: return <Sparkles {...iconProps} />
  }
}

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
  isCurrentlyLearning?: boolean  // 是否正在学习此阶段
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

  const isCompleted = progress === 100
  const isUnlocked = stage.isUnlocked
  const isLearning = isUnlocked && !isCompleted && progress > 0  // 正在学习中

  // 节点尺寸
  const nodeSize = 60
  const iconSize = 24

  // 处理点击事件 - 直接跳转到课程页面，不显示弹窗
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isUnlocked || !firstContentId) return
    router.push(`/courses/${systemKey}/${firstContentId}`)
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

      {/* 主节点 - 透明背景 + 彩色边框 */}
      <motion.div
        className={`relative rounded-full flex items-center justify-center font-bold ${
          isUnlocked ? '' : 'opacity-40'
        } ${isLearning ? 'stage-node-learning' : ''}`}
        style={{
          width: nodeSize,
          height: nodeSize,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          border: `3px solid ${isUnlocked ? color.from : '#4b5563'}`,
          boxShadow: isLearning
            ? `0 0 25px ${color.from}60, 0 0 50px ${color.from}30`
            : isCompleted
            ? `0 0 20px ${color.from}40`
            : '0 4px 12px rgba(0,0,0,0.3)'
        }}
        animate={isLearning ? {
          borderColor: ['#FFD700', '#FF6B6B', '#9D00FF', '#00FFFF', '#00FF88', '#FFD700'],
          boxShadow: [
            `0 0 20px #FFD70060, 0 0 40px #FFD70030`,
            `0 0 25px #FF6B6B60, 0 0 50px #FF6B6B30`,
            `0 0 25px #9D00FF60, 0 0 50px #9D00FF30`,
            `0 0 25px #00FFFF60, 0 0 50px #00FFFF30`,
            `0 0 25px #00FF8860, 0 0 50px #00FF8830`,
            `0 0 20px #FFD70060, 0 0 40px #FFD70030`,
          ],
        } : {}}
        transition={isLearning ? {
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      >
        {/* 矢量图标 */}
        <div
          className="transition-all duration-300"
          style={{ color: isUnlocked ? color.from : '#6b7280' }}
        >
          {getStageIconComponent(stage.stageNumber)}
        </div>

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
    <div onClick={handleClick}>
      {NodeContent}
    </div>
  )
}
