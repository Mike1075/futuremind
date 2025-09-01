'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TreePine, Sparkles, Star, Leaf, Play, RotateCcw } from 'lucide-react'
import { useMobileGestures, useHapticFeedback } from '@/hooks/useMobileGestures'
import { getOptimalAnimationConfig } from '@/utils/mobilePerformance'

interface TreeStage {
  stage: number
  name: string
  branches: number
  leaves: number
  height: number
  color: string
  description: string
}

interface TreeNode {
  id: string
  level: number
  type: 'awareness' | 'wisdom' | 'creativity' | 'connection'
  title: string
  unlocked: boolean
  progress: number
}

interface ConsciousnessTreeProps {
  currentDay?: number
  completedTasks?: string[]
  className?: string
  onClick?: () => void
}

const treeStages: TreeStage[] = [
  { stage: 1, name: "萌芽", branches: 0, leaves: 0, height: 30, color: "from-green-300 to-green-400", description: "意识的种子开始发芽" },
  { stage: 2, name: "幼苗", branches: 2, leaves: 3, height: 80, color: "from-green-400 to-green-500", description: "觉察力初现嫩芽" },
  { stage: 3, name: "成长", branches: 5, leaves: 12, height: 140, color: "from-green-500 to-green-600", description: "智慧枝条开始延展" },
  { stage: 4, name: "茂盛", branches: 8, leaves: 30, height: 200, color: "from-green-600 to-emerald-500", description: "意识之树枝繁叶茂" },
  { stage: 5, name: "觉醒", branches: 12, leaves: 50, height: 260, color: "from-emerald-500 to-blue-400", description: "与宇宙意识完全连接" }
]

export default function ConsciousnessTree({
  currentDay = 1,
  // completedTasks = [],
  className = '',
  onClick
}: ConsciousnessTreeProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)
  const [animationConfig, setAnimationConfig] = useState(getOptimalAnimationConfig(false))

  const haptic = useHapticFeedback()

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setAnimationConfig(getOptimalAnimationConfig(mobile))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 根据学习进度自动设置阶段
  useEffect(() => {
    const calculatedStage = Math.min(Math.floor(currentDay / 6), treeStages.length - 1)
    setCurrentStage(calculatedStage)
  }, [currentDay])

  const handleStageChange = (stage: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentStage(stage)
    haptic.medium() // 触觉反馈
    setTimeout(() => setIsAnimating(false), 1000)
  }

  // 手势处理函数
  const handlePinch = (newScale: number) => {
    setScale(Math.max(0.5, Math.min(2, newScale)))
  }

  const handleDoubleTap = () => {
    haptic.light()
    setScale(scale === 1 ? 1.5 : 1)
  }

  const handleLongPress = () => {
    haptic.heavy()
    setShowControls(!showControls)
  }

  const handleSwipeUp = () => {
    if (currentStage < treeStages.length - 1) {
      handleStageChange(currentStage + 1)
    }
  }

  const handleSwipeDown = () => {
    if (currentStage > 0) {
      handleStageChange(currentStage - 1)
    }
  }

  // 手势支持
  const gestureRef = useMobileGestures({
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onPinch: handlePinch
  })

  const startTimeAcceleration = () => {
    if (isAnimating) return
    setIsAnimating(true)
    haptic.success() // 触觉反馈

    let stage = 0
    const interval = setInterval(() => {
      setCurrentStage(stage)
      haptic.light() // 每个阶段的轻微反馈
      stage++

      if (stage >= treeStages.length) {
        clearInterval(interval)
        setIsAnimating(false)
        haptic.success() // 完成反馈
      }
    }, 1500)
  }

  const resetTree = () => {
    if (isAnimating) return
    setCurrentStage(0)
  }

  const currentData = treeStages[currentStage]

  // 生成树节点
  const generateTreeNodes = (): TreeNode[] => {
    const nodes: TreeNode[] = []
    const maxNodes = Math.min(currentData.branches, 8) // 移动端限制节点数量
    
    for (let i = 0; i < maxNodes; i++) {
      const level = Math.floor(i / 2) + 1
      const types: Array<'awareness' | 'wisdom' | 'creativity' | 'connection'> = ['awareness', 'wisdom', 'creativity', 'connection']
      const type = types[i % types.length]
      
      nodes.push({
        id: `node-${i}`,
        level,
        type,
        title: `${type === 'awareness' ? '觉察' : type === 'wisdom' ? '智慧' : type === 'creativity' ? '创造' : '连接'} ${level}`,
        unlocked: true,
        progress: Math.random() * 100
      })
    }
    
    return nodes
  }

  const treeNodes = generateTreeNodes()

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'awareness': return Sparkles
      case 'wisdom': return Star
      case 'creativity': return Leaf
      case 'connection': return TreePine
      default: return Sparkles
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'awareness': return 'from-yellow-400 to-orange-400'
      case 'wisdom': return 'from-blue-400 to-purple-400'
      case 'creativity': return 'from-green-400 to-emerald-400'
      case 'connection': return 'from-pink-400 to-rose-400'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      ref={gestureRef}
      className={`relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      {/* 移动端控制面板 */}
      {isMobile && showControls && (
        <div className="mb-4 p-3 bg-black/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-sm">意识进化树演示</h3>
            <button
              onClick={() => setShowControls(false)}
              className="text-white/60 text-xs"
            >
              隐藏
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={startTimeAcceleration}
              disabled={isAnimating}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              时间加速
            </button>
            <button
              onClick={resetTree}
              disabled={isAnimating}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          </div>
          <div className="flex gap-1">
            {treeStages.map((stage, index) => (
              <button
                key={index}
                onClick={() => handleStageChange(index)}
                disabled={isAnimating}
                className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                  currentStage === index
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60'
                } disabled:opacity-50`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 桌面端控制面板 */}
      {!isMobile && (
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={startTimeAcceleration}
            disabled={isAnimating}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            时间加速演示
          </button>
          <button
            onClick={resetTree}
            disabled={isAnimating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <div className="flex gap-2">
            {treeStages.map((stage, index) => (
              <button
                key={index}
                onClick={() => handleStageChange(index)}
                disabled={isAnimating}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentStage === index
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 树容器 */}
      <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/10 ${
        isMobile ? 'h-80' : 'h-96'
      }`}>
        
        {/* 土壤基础 */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-800 to-amber-700 rounded-b-2xl"></div>
        
        {/* 真实树结构 SVG */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 400 300" 
          preserveAspectRatio="xMidYEnd"
        >
          {/* 树根 (隐约可见) */}
          {currentStage >= 1 && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
            >
              <path
                d={`M200,290 C180,285 160,280 150,275 M200,290 C220,285 240,280 250,275 M200,290 C200,285 195,280 190,275`}
                stroke="#8B4513"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
              />
            </motion.g>
          )}
          
          {/* 主干 */}
          <motion.path
            d={`M200,290 L200,${290 - currentData.height} ${currentData.height > 50 ? `C195,${290 - currentData.height * 0.7} 205,${290 - currentData.height * 0.3} 200,${290 - currentData.height}` : ''}`}
            stroke="#8B4513"
            strokeWidth={Math.max(2, currentData.height / 20)}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          {/* 树枝系统 */}
          {Array.from({ length: currentData.branches }).map((_, i) => {
            const branchHeight = 290 - (currentData.height * (0.3 + (i * 0.6) / currentData.branches))
            const branchDirection = i % 2 === 0 ? -1 : 1
            const branchLength = 20 + (currentData.height / 8)
            const branchAngle = 20 + (i * 10)
            
            return (
              <motion.path
                key={`branch-${i}`}
                d={`M200,${branchHeight} L${200 + branchDirection * branchLength},${branchHeight - branchAngle}`}
                stroke="#654321"
                strokeWidth={Math.max(1, (currentData.height - i * 10) / 40)}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
              />
            )
          })}
          
          {/* 叶子系统 */}
          {Array.from({ length: currentData.leaves }).map((_, i) => {
            const leafX = 180 + Math.random() * 40
            const leafY = 290 - currentData.height * (0.2 + Math.random() * 0.6)
            const leafSize = 2 + Math.random() * 3
            
            return (
              <motion.circle
                key={`leaf-${i}`}
                cx={leafX}
                cy={leafY}
                r={leafSize}
                fill={currentData.color.includes('blue') ? '#10B981' : '#22C55E'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 1 + i * 0.1,
                  type: "spring",
                  stiffness: 200 
                }}
              />
            )
          })}
          
          {/* 特殊效果：花朵或果实 (高级阶段) */}
          {currentStage >= 4 && Array.from({ length: Math.floor(currentData.leaves / 10) }).map((_, i) => {
            const flowerX = 180 + Math.random() * 40
            const flowerY = 290 - currentData.height * (0.1 + Math.random() * 0.4)
            
            return (
              <motion.g key={`flower-${i}`}>
                <motion.circle
                  cx={flowerX}
                  cy={flowerY}
                  r="4"
                  fill={currentStage === 5 ? "#F59E0B" : "#EF4444"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 2 + i * 0.3 }}
                />
                <motion.circle
                  cx={flowerX}
                  cy={flowerY}
                  r="2"
                  fill="#FCD34D"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.2 + i * 0.3 }}
                />
              </motion.g>
            )
          })}
        </svg>

        {/* 动态粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(isMobile ? 10 : 20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              animate={{
                x: [0, Math.random() * 50 - 25],
                y: [0, Math.random() * 50 - 25],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* 智慧节点：在树枝末端显示成就点 */}
        <div className="absolute inset-0 pointer-events-none">
          {currentStage >= 2 && Array.from({ length: Math.min(currentStage, 5) }).map((_, i) => {
            const nodeX = 50 + i * 15 + Math.random() * 10
            const nodeY = 30 + Math.random() * 40
            
            return (
              <motion.div
                key={`wisdom-${i}`}
                className="absolute pointer-events-auto cursor-pointer"
                style={{ left: `${nodeX}%`, top: `${nodeY}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 2 + i * 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.2 }}
              >
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg">
                  <div className="w-full h-full bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 状态信息 */}
        <div className={`absolute top-4 left-4 bg-black/50 rounded-lg p-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <div className="text-white">
            <div className="font-semibold mb-1">{currentData.name}阶段</div>
            <div className="text-gray-300 mb-1">{currentData.description}</div>
            <div className="text-gray-400">
              分支: {currentData.branches} • 叶子: {currentData.leaves}
            </div>
          </div>
        </div>

        {/* 生长动画指示器 */}
        {isAnimating && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* 生长光效 */}
        {isAnimating && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-t from-green-400/50 to-transparent animate-pulse"></div>
          </motion.div>
        )}
      </div>

      {/* 移动端隐藏控制面板按钮 */}
      {isMobile && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="mt-2 w-full py-2 bg-white/10 text-white/60 rounded-lg text-xs"
        >
          显示控制面板
        </button>
      )}

      {/* 图例 */}
      <div className={`mt-4 grid grid-cols-2 gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 mr-2"></div>
          <span className="text-gray-300">觉察</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mr-2"></div>
          <span className="text-gray-300">智慧</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 mr-2"></div>
          <span className="text-gray-300">创造</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 mr-2"></div>
          <span className="text-gray-300">连接</span>
        </div>
      </div>
    </div>
  )
}