// @ts-nocheck
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

// localStorage缓存key
const STAGE_PROGRESS_CACHE_KEY = 'earth_stage_progress'

export function EarthStageCircle({
  stages,
  completionMap,
  systemKey
}: EarthStageCircleProps) {
  const [containerSize, setContainerSize] = useState({ width: 600, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算初始进度（基于服务端的completionMap，立即显示，优先使用缓存）
  const calculateInitialProgress = () => {
    // 先计算服务端进度作为后备
    const serverProgressMap = new Map<number, number>()
    for (const stage of stages) {
      if (stage.contents.length === 0) {
        serverProgressMap.set(stage.stageNumber, 0)
        continue
      }
      const completed = stage.contents.filter(c => completionMap.get(c.id)).length
      const progress = Math.round((completed / stage.contents.length) * 100)
      serverProgressMap.set(stage.stageNumber, progress)
    }

    // 尝试从localStorage获取缓存
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STAGE_PROGRESS_CACHE_KEY)
        if (cached) {
          const cacheData = JSON.parse(cached)
          // 检查是否是同一个课程系统的缓存
          if (cacheData.systemKey === systemKey && cacheData.stages) {
            const cachedMap = new Map<number, number>()
            // 使用缓存的进度值
            for (const [stageNum, progress] of Object.entries(cacheData.stages)) {
              cachedMap.set(Number(stageNum), progress as number)
            }
            // 确保所有阶段都有值（新阶段可能没有缓存）
            for (const stage of stages) {
              if (!cachedMap.has(stage.stageNumber)) {
                cachedMap.set(stage.stageNumber, serverProgressMap.get(stage.stageNumber) ?? 0)
              }
            }
            return cachedMap
          }
        }
      } catch {
        // localStorage不可用或解析失败，使用服务端值
      }
    }
    return serverProgressMap
  }

  const [stageProgressMap, setStageProgressMap] = useState<Map<number, number>>(calculateInitialProgress)

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

  // 异步获取真实进度（后台更新）
  useEffect(() => {
    const fetchRealProgress = async () => {
      const progressMap = new Map<number, number>()

      for (const stage of stages) {
        if (stage.contents.length === 0) {
          progressMap.set(stage.stageNumber, 0)
          continue
        }

        try {
          const contentIds = stage.contents.map(c => c.id)
          const progressPromises = contentIds.map(id => getEarthProgress(id))
          const progressResults = await Promise.all(progressPromises)

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
          // 保留当前值，不覆盖
          const currentValue = stageProgressMap.get(stage.stageNumber) ?? 0
          progressMap.set(stage.stageNumber, currentValue)
        }
      }

      // 保存到localStorage缓存
      try {
        const stagesObj: Record<number, number> = {}
        progressMap.forEach((value, key) => {
          stagesObj[key] = value
        })
        localStorage.setItem(STAGE_PROGRESS_CACHE_KEY, JSON.stringify({
          systemKey,
          stages: stagesObj,
          timestamp: Date.now()
        }))
      } catch {
        // localStorage不可用，忽略
      }

      setStageProgressMap(progressMap)
    }

    fetchRealProgress()
  }, [stages, systemKey])

  const radius = containerSize.width * 0.35
  const centerX = containerSize.width / 2
  const centerY = containerSize.height / 2

  // 获取阶段的图标 - 地球课程6个感官探索阶段
  const getStageIcon = (stageNumber: number) => {
    const icons = ['👁️', '👂', '🧠', '🤝', '🌍', '✨']
    // 第1阶段：视觉感知、第2阶段：听觉感知、第3阶段：思维认知
    // 第4阶段：社交互动、第5阶段：全球视野、第6阶段：觉醒升华
    return icons[stageNumber - 1] || '✨'
  }

  // 获取阶段颜色 - 脉轮七色（红橙黄绿青蓝紫）
  const getChakraColor = (stageNumber: number) => {
    const chakraColors = [
      { from: '#DC2626', to: '#EF4444' }, // 第1脉轮：红色 - 根轮
      { from: '#EA580C', to: '#F97316' }, // 第2脉轮：橙色 - 骶轮
      { from: '#EAB308', to: '#FACC15' }, // 第3脉轮：黄色 - 太阳神经丛
      { from: '#16A34A', to: '#22C55E' }, // 第4脉轮：绿色 - 心轮
      { from: '#06B6D4', to: '#22D3EE' }, // 第5脉轮：青色 - 喉轮
      { from: '#2563EB', to: '#3B82F6' }, // 第6脉轮：蓝色 - 眉心轮
      { from: '#9333EA', to: '#A855F7' }  // 第7脉轮：紫色 - 顶轮
    ]
    return chakraColors[stageNumber - 1] || chakraColors[0]
  }
  
  // 炫彩闪烁色（用于正在学习的阶段）
  const activeColors = [
    '#FFD700', '#FF6B6B', '#9D00FF', '#00FFFF', '#00FF88', '#FFD700'
  ]

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
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#9D00FF" />
              <stop offset="100%" stopColor="#00FFFF" />
            </linearGradient>
            <linearGradient id="gradient-unlocked" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
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
              color={getChakraColor(stage.stageNumber)}
              progress={stageProgress}
              delay={index * 0.1}
              firstContentId={firstContentId}
              systemKey={systemKey}
              isCurrentlyLearning={stage.isUnlocked && stageProgress > 0 && stageProgress < 100}
            />
          )
        })}
      </div>
    </div>
  )
}
