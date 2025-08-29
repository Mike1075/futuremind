'use client'

import { motion } from 'framer-motion'
import { TreePine, Sparkles, Star, Leaf } from 'lucide-react'

interface TreeNode {
  id: string
  level: number
  type: 'awareness' | 'wisdom' | 'creativity' | 'connection'
  title: string
  unlocked: boolean
  progress: number
}

interface ConsciousnessTreeProps {
  currentDay: number
  completedTasks: string[]
  className?: string
}

export default function ConsciousnessTree({
  currentDay,
  completedTasks,
  className = ''
}: ConsciousnessTreeProps) {
  // completedTasks will be used for future functionality
  console.log('Completed tasks:', completedTasks.length);
  
  // Generate tree nodes based on progress
  const generateTreeNodes = (): TreeNode[] => {
    const nodes: TreeNode[] = []
    
    // Root level - always unlocked
    nodes.push({
      id: 'root',
      level: 0,
      type: 'awareness',
      title: '觉醒的种子',
      unlocked: true,
      progress: 100
    })

    // Level 1 - Basic awareness (unlocked after day 3)
    if (currentDay >= 3) {
      nodes.push({
        id: 'awareness-1',
        level: 1,
        type: 'awareness',
        title: '初始觉察',
        unlocked: true,
        progress: Math.min(100, ((currentDay - 3) / 4) * 100)
      })
    }

    // Level 2 - Deeper understanding (unlocked after day 7)
    if (currentDay >= 7) {
      nodes.push({
        id: 'wisdom-1',
        level: 2,
        type: 'wisdom',
        title: '智慧萌芽',
        unlocked: true,
        progress: Math.min(100, ((currentDay - 7) / 7) * 100)
      })
    }

    // Level 3 - Creative expression (unlocked after day 14)
    if (currentDay >= 14) {
      nodes.push({
        id: 'creativity-1',
        level: 3,
        type: 'creativity',
        title: '创造之花',
        unlocked: true,
        progress: Math.min(100, ((currentDay - 14) / 7) * 100)
      })
    }

    // Level 4 - Connection with others (unlocked after day 21)
    if (currentDay >= 21) {
      nodes.push({
        id: 'connection-1',
        level: 4,
        type: 'connection',
        title: '共振之果',
        unlocked: true,
        progress: Math.min(100, ((currentDay - 21) / 9) * 100)
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

  return (
    <div className={`relative ${className}`}>
      {/* Tree Container */}
      <div className="relative w-full h-96 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/10">
        
        {/* Background Tree Silhouette */}
        <div className="absolute inset-0 flex items-end justify-center opacity-10">
          <TreePine className="w-64 h-80 text-green-400" />
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
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

        {/* Tree Nodes */}
        <div className="relative w-full h-full flex flex-col items-center justify-end p-6">
          {treeNodes.map((node, index) => {
            const Icon = getNodeIcon(node.type)
            const yPosition = 100 - (node.level * 20) - 10
            const xOffset = (index % 2 === 0 ? -1 : 1) * (node.level * 15)
            
            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="absolute"
                style={{
                  bottom: `${yPosition}%`,
                  left: `calc(50% + ${xOffset}px)`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Connection Line to Previous Node */}
                {index > 0 && (
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.3 + 0.2, duration: 0.5 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2"
                  >
                    <svg width="2" height="40" className="text-green-400">
                      <motion.line
                        x1="1" y1="0" x2="1" y2="40"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: index * 0.3 + 0.2, duration: 0.5 }}
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Node */}
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${getNodeColor(node.type)} flex items-center justify-center shadow-lg ${
                      node.unlocked ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Progress Ring */}
                  {node.unlocked && node.progress < 100 && (
                    <svg className="absolute inset-0 w-12 h-12 transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-white/20"
                      />
                      <motion.circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-white"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                        animate={{ 
                          strokeDashoffset: 2 * Math.PI * 22 * (1 - node.progress / 100)
                        }}
                        transition={{ duration: 1, delay: index * 0.3 + 0.5 }}
                      />
                    </svg>
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-black/80 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                      <div className="font-semibold">{node.title}</div>
                      {node.unlocked && (
                        <div className="text-gray-300">
                          进度: {Math.round(node.progress)}%
                        </div>
                      )}
                      {!node.unlocked && (
                        <div className="text-gray-400">尚未解锁</div>
                      )}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Tree Stats */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-3">
          <div className="text-white text-sm">
            <div className="font-semibold mb-1">意识进化</div>
            <div className="text-gray-300">
              第 {currentDay} 天 • Level {Math.floor(currentDay / 7) + 1}
            </div>
            <div className="text-gray-300">
              已解锁: {treeNodes.filter(n => n.unlocked).length} 个节点
            </div>
          </div>
        </div>

        {/* Growth Animation */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-2 h-8 bg-gradient-to-t from-green-600 to-green-400 rounded-full"></div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
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
