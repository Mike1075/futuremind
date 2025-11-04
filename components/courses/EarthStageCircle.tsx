'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CourseContent } from '@/lib/supabase/database.types'
import { StageNode } from './StageNode'
import Link from 'next/link'

interface Stage {
  stageNumber: number
  contents: CourseContent[]
  completedCount: number
  totalCount: number
  isUnlocked: boolean
}

interface EarthStageCircleProps {
  stages: Stage[]
  completionMap: Map<string, boolean>
  systemKey: string
}

const UNLOCK_THRESHOLD = 0.8

export function EarthStageCircle({
  stages,
  completionMap,
  systemKey
}: EarthStageCircleProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 600, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 响应式容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, 600)
        setContainerSize({ width, height: width })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const radius = containerSize.width * 0.35
  const centerX = containerSize.width / 2
  const centerY = containerSize.height / 2

  // 获取阶段的图标
  const getStageIcon = (stageNumber: number) => {
    const icons = ['🎧', '🌊', '🧠', '👥', '🌌', '🚀']
    return icons[stageNumber - 1] || '✨'
  }

  // 获取阶段颜色
  const getStageColor = (stageNumber: number) => {
    const colors = [
      { from: '#10b981', to: '#059669' }, // green
      { from: '#3b82f6', to: '#0ea5e9' }, // blue
      { from: '#a855f7', to: '#ec4899' }, // purple
      { from: '#f97316', to: '#ef4444' }, // orange
      { from: '#6366f1', to: '#8b5cf6' }, // indigo
      { from: '#eab308', to: '#f59e0b' }  // yellow
    ]
    return colors[stageNumber - 1] || { from: '#6b7280', to: '#4b5563' }
  }

  // 计算节点位置（从12点钟位置开始，顺时针排列）
  const getNodePosition = (index: number, total: number) => {
    // 从-90度开始（12点钟位置），顺时针旋转
    const angle = (-90 + (360 / total) * index) * (Math.PI / 180)
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle: angle * (180 / Math.PI) + 90 // 用于旋转节点
    }
  }

  // 绘制连接线
  const renderConnections = () => {
    const connections = []
    for (let i = 0; i < stages.length; i++) {
      const currentPos = getNodePosition(i, stages.length)
      const nextPos = getNodePosition((i + 1) % stages.length, stages.length)

      const stage = stages[i]
      const nextStage = stages[(i + 1) % stages.length]

      // 确定连线状态
      const isCompleted = stage.completedCount === stage.totalCount
      const isUnlocked = nextStage.isUnlocked

      connections.push(
        <motion.line
          key={`connection-${i}`}
          x1={currentPos.x}
          y1={currentPos.y}
          x2={nextPos.x}
          y2={nextPos.y}
          stroke={isCompleted ? 'url(#gradient-active)' : isUnlocked ? 'url(#gradient-unlocked)' : '#374151'}
          strokeWidth={isCompleted ? 3 : 2}
          strokeDasharray={isUnlocked ? '0' : '5,5'}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        />
      )
    }
    return connections
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative mx-auto" style={{ width: containerSize.width, height: containerSize.height }}>
        {/* SVG Canvas */}
        <svg
          width={containerSize.width}
          height={containerSize.height}
          className="absolute inset-0"
        >
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="gradient-unlocked" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#4b5563" />
            </linearGradient>
          </defs>

          {/* 背景圆圈 */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={2}
            strokeDasharray="5,5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.5 }}
          />

          {/* 连接线 */}
          {renderConnections()}
        </svg>

        {/* 中心文字 */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-6xl mb-2">🌍</div>
          <h3 className="text-xl font-bold text-white mb-1">欢迎来到地球</h3>
          <p className="text-sm text-gray-400">6个阶段认知之旅</p>
        </motion.div>

        {/* 阶段节点 */}
        {stages.map((stage, index) => {
          const position = getNodePosition(index, stages.length)
          const stageProgress = stage.totalCount > 0
            ? Math.round((stage.completedCount / stage.totalCount) * 100)
            : 0

          return (
            <StageNode
              key={stage.stageNumber}
              stage={stage}
              position={position}
              icon={getStageIcon(stage.stageNumber)}
              color={getStageColor(stage.stageNumber)}
              progress={stageProgress}
              isSelected={selectedStage === stage.stageNumber}
              onSelect={() => setSelectedStage(stage.stageNumber === selectedStage ? null : stage.stageNumber)}
              delay={index * 0.1}
            />
          )
        })}
      </div>

      {/* 阶段详情面板 */}
      <AnimatePresence>
        {selectedStage !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
          >
            {stages
              .filter(s => s.stageNumber === selectedStage)
              .map(stage => {
                const stageProgress = stage.totalCount > 0
                  ? Math.round((stage.completedCount / stage.totalCount) * 100)
                  : 0

                return (
                  <div key={stage.stageNumber}>
                    {/* 阶段头部 */}
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-full text-2xl`}
                          style={{
                            background: `linear-gradient(135deg, ${getStageColor(stage.stageNumber).from}, ${getStageColor(stage.stageNumber).to})`
                          }}
                        >
                          {getStageIcon(stage.stageNumber)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">
                            {stage.contents[0]?.title || `第${stage.stageNumber}阶段`}
                          </h3>
                          {stage.contents[0]?.subtitle && (
                            <p className="text-gray-400 text-sm mt-1">{stage.contents[0].subtitle}</p>
                          )}
                        </div>
                        {stageProgress === 100 && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
                            ✓ 已完成
                          </span>
                        )}
                      </div>

                      {/* 进度条 */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${stageProgress}%`,
                              background: `linear-gradient(90deg, ${getStageColor(stage.stageNumber).from}, ${getStageColor(stage.stageNumber).to})`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 font-medium w-12 text-right">
                          {stageProgress}%
                        </span>
                      </div>
                    </div>

                    {/* 内容列表 */}
                    {stage.isUnlocked ? (
                      <div className="p-6 space-y-3">
                        {stage.contents.map((content, contentIndex) => {
                          const isCompleted = completionMap.get(content.id) === true
                          const isContentUnlocked = contentIndex === 0 || completionMap.get(stage.contents[contentIndex - 1].id) === true

                          return (
                            <Link
                              key={content.id}
                              href={isContentUnlocked ? `/courses/${systemKey}/${content.id}` : '#'}
                              className={`block p-4 rounded-lg transition-all ${
                                isContentUnlocked
                                  ? 'bg-gray-900/30 hover:bg-gray-900/50 border border-gray-800 hover:border-gray-700'
                                  : 'bg-gray-900/10 border border-gray-800/30 cursor-not-allowed opacity-50'
                              }`}
                              onClick={(e) => {
                                if (!isContentUnlocked) e.preventDefault()
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                    isCompleted
                                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                      : isContentUnlocked
                                      ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-white'
                                      : 'bg-gray-800 text-gray-600'
                                  }`}>
                                    {isCompleted ? (
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      contentIndex + 1
                                    )}
                                  </div>

                                  <div>
                                    <h4 className={`font-medium ${isContentUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                      {content.title.replace(/第[一二三四五六七八九十]+阶段[：:]\s*/, '')}
                                    </h4>
                                    {content.subtitle && (
                                      <p className={`text-sm mt-0.5 ${isContentUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {content.subtitle}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {isCompleted && (
                                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">
                                    已完成
                                  </span>
                                )}
                                {!isContentUnlocked && (
                                  <span className="px-2 py-1 bg-gray-700/50 text-gray-500 text-xs rounded-full font-medium">
                                    🔒 锁定
                                  </span>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <p className="text-gray-300 font-medium mb-2">🔒 阶段未解锁</p>
                        <p className="text-gray-500 text-sm">
                          完成前一阶段 {Math.round(UNLOCK_THRESHOLD * 100)}% 的内容后解锁
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
