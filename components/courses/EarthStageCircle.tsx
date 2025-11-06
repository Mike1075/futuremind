'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { CourseContent } from '@/lib/supabase/database.types'
import { StageNode } from './StageNode'
import { getEarthProgress } from '@/lib/utils/interaction-tracker'

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
  const [containerSize, setContainerSize] = useState({ width: 600, height: 600 })
  const [stageProgressMap, setStageProgressMap] = useState<Map<number, number>>(new Map())
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

  // 获取各阶段的学习进度（使用新的进度系统）
  useEffect(() => {
    const fetchStageProgress = async () => {
      const progressMap = new Map<number, number>()

      for (const stage of stages) {
        if (stage.contents.length === 0) {
          progressMap.set(stage.stageNumber, 0)
          continue
        }

        try {
          // 批量查询每个内容的进度
          const contentIds = stage.contents.map(c => c.id)
          const progressPromises = contentIds.map(id => getEarthProgress(id))
          const progressResults = await Promise.all(progressPromises)

          // 过滤掉null结果，计算平均进度
          const validResults = progressResults.filter(r => r !== null)
          if (validResults.length === 0) {
            progressMap.set(stage.stageNumber, 0)
            continue
          }

          const totalProgress = validResults.reduce((sum, r) => sum + (r?.progress || 0), 0)
          const avgProgress = totalProgress / validResults.length
          progressMap.set(stage.stageNumber, Math.round(avgProgress))
        } catch (error) {
          console.error(`Failed to fetch progress for stage ${stage.stageNumber}:`, error)
          progressMap.set(stage.stageNumber, 0)
        }
      }

      setStageProgressMap(progressMap)
    }

    fetchStageProgress()
  }, [stages])

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
          // 使用新的进度计算系统
          const stageProgress = stageProgressMap.get(stage.stageNumber) || 0

          // 获取阶段的第一个内容ID用于导航
          const firstContentId = stage.contents.length > 0 ? stage.contents[0].id : null

          return (
            <StageNode
              key={stage.stageNumber}
              stage={stage}
              position={position}
              icon={getStageIcon(stage.stageNumber)}
              color={getStageColor(stage.stageNumber)}
              progress={stageProgress}
              delay={index * 0.1}
              firstContentId={firstContentId}
              systemKey={systemKey}
            />
          )
        })}
      </div>
    </div>
  )
}
