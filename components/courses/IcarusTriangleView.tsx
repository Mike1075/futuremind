'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  subtitle: string | null
  project_intro: string | null
  difficulty_level: string | null
  sequence_number: number
  is_completed?: boolean  // 添加完成状态
}

interface Module {
  id: number
  name: string
  projectCount: number
  projects: Project[]
  gradient: string
  icon: string
}

interface IcarusTriangleViewProps {
  modules: Module[]
}

// 彩色颜色池
const COLORS = [
  ['#10B981', '#14B8A6'],  // emerald to teal
  ['#3B82F6', '#06B6D4'],  // blue to cyan
  ['#8B5CF6', '#EC4899'],  // purple to pink
  ['#F59E0B', '#EF4444'],  // amber to red
  ['#10B981', '#3B82F6'],  // emerald to blue
  ['#EC4899', '#F59E0B'],  // pink to amber
]

// 计算圆周上的点位置
const getCirclePosition = (angle: number, centerX: number, centerY: number, radius: number) => {
  const radians = (angle - 90) * (Math.PI / 180) // -90度让0度从顶部开始
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  }
}

// 根据项目数量计算子节点位置 - 等边三角形或正方形
const getSubNodePositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions = []

  if (count === 3) {
    // 等边三角形：从顶部开始，顺时针
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 - 90) * (Math.PI / 180) // -90度让第一个点在顶部
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }
  } else if (count === 4) {
    // 正方形：从顶部开始，顺时针
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 - 90) * (Math.PI / 180) // -90度让第一个点在顶部
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }
  } else {
    // 默认圆形分布
    const angleStep = 360 / count
    for (let i = 0; i < count; i++) {
      const angle = (i * angleStep - 90) * (Math.PI / 180)
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }
  }

  return positions
}

// 生成直线路径
const generateLinePath = (x1: number, y1: number, x2: number, y2: number) => {
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

export function IcarusTriangleView({ modules }: IcarusTriangleViewProps) {
  const [activeModule, setActiveModule] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hoveredModule, setHoveredModule] = useState<number | null>(null)
  const [moduleColors, setModuleColors] = useState<Map<number, string[]>>(new Map())

  // 初始化模块颜色
  useEffect(() => {
    const initialColors = new Map<number, string[]>()
    modules.forEach(module => {
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
      initialColors.set(module.id, randomColor)
    })
    setModuleColors(initialColors)

    // 每10秒更换一次颜色
    const interval = setInterval(() => {
      const newColors = new Map<number, string[]>()
      modules.forEach(module => {
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
        newColors.set(module.id, randomColor)
      })
      setModuleColors(newColors)
    }, 10000) // 10秒一圈，每圈换一次颜色

    return () => clearInterval(interval)
  }, [modules])

  const handleModuleClick = (moduleId: number) => {
    if (activeModule === moduleId) {
      setActiveModule(null)
    } else {
      setActiveModule(moduleId)
      setSelectedProject(null)
    }
  }

  // 计算圆心和半径
  const centerX = 50
  const centerY = 50
  const radius = 30 // 半径为容器的30%

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 星空背景 - 彩色随机，光芒明显 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => {
          // 为每颗星星生成随机彩色
          const starColors = ['#FF6B9D', '#C44569', '#00D2FF', '#3A7BD5', '#FFA751', '#FFE259', '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5']
          const randomColor = starColors[Math.floor(Math.random() * starColors.length)]
          const size = Math.random() * 3 + 1 // 1-4px

          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: randomColor,
                boxShadow: `0 0 ${size * 3}px ${size * 2}px ${randomColor}40`, // 增强光芒
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.8, 1],
                boxShadow: [
                  `0 0 ${size * 3}px ${size * 2}px ${randomColor}40`,
                  `0 0 ${size * 8}px ${size * 4}px ${randomColor}80`,
                  `0 0 ${size * 3}px ${size * 2}px ${randomColor}40`,
                ],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )
        })}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* 返回按钮 */}
        <Link
          href="/portal"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回学习中心
        </Link>

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            伊卡洛斯计划
          </h1>
          <p className="text-gray-400 text-lg">探索现实的边界 · PBL项目体系</p>
        </div>

        {/* 圆形布局区域 */}
        <div className="relative w-full" style={{ height: '70vh', minHeight: '600px' }}>
          {/* 圆形轨道 - 完整的圆 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              {/* 轨道渐变 */}
              <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
              </linearGradient>
              {/* 发光滤镜 */}
              <filter id="orbitGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 完整圆形轨道 */}
            <circle
              cx={`${centerX}%`}
              cy={`${centerY}%`}
              r={`${radius}%`}
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="3"
              strokeDasharray="0"
              filter="url(#orbitGlow)"
              opacity="0.8"
            />
            {/* 内圈轨道装饰 */}
            <motion.circle
              cx={`${centerX}%`}
              cy={`${centerY}%`}
              r={`${radius * 0.95}%`}
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="1"
              strokeDasharray="8 4"
              opacity="0.4"
              animate={{
                strokeDashoffset: [0, -100]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>

          {/* 主节点 - 3个模块在圆周上运动 */}
          {modules.map((module, index) => {
            const isActive = activeModule === module.id
            const subRadius = 18  // 子节点距离中心的半径（百分比）
            const angle = index * 120 // 三等分：0度、120度、240度
            const currentColors = moduleColors.get(module.id) || [module.gradient.split(', ')[0], module.gradient.split(', ')[1]]
            const gradientString = `${currentColors[0]}, ${currentColors[1]}`

            return (
              <div key={module.id}>
                {/* 主圆形节点 - 在圆周上旋转 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{ delay: index * 0.2, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    zIndex: isActive ? 20 : 10,
                  }}
                >
                  <motion.div
                    animate={{
                      x: `${radius * Math.cos((angle - 90) * Math.PI / 180) * 2}vh`,
                      y: `${radius * Math.sin((angle - 90) * Math.PI / 180) * 2}vh`,
                      rotate: 360,
                    }}
                    transition={{
                      x: { duration: 0 },
                      y: { duration: 0 },
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                    }}
                    style={{
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="cursor-pointer group"
                    onClick={() => handleModuleClick(module.id)}
                    onMouseEnter={() => setHoveredModule(module.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                  >
                    {/* 光晕效果 */}
                    <motion.div
                      className="absolute inset-0 rounded-full blur-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${gradientString})`,
                      }}
                      animate={{
                        opacity: hoveredModule === module.id ? [0.8, 1, 0.8] : isActive ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4],
                        scale: hoveredModule === module.id ? [1.5, 1.8, 1.5] : isActive ? [1.3, 1.5, 1.3] : [1.1, 1.2, 1.1],
                      }}
                      transition={{
                        duration: hoveredModule === module.id ? 1 : 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* 主圆形 */}
                    <motion.div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${gradientString})`,
                        border: isActive ? '3px solid rgba(255,255,255,0.8)' : '3px solid rgba(255,255,255,0.4)',
                        boxShadow: `0 0 ${isActive ? '30px' : '20px'} ${currentColors[0]}80`,
                      }}
                      whileHover={{
                        scale: 1.3,
                        boxShadow: `0 0 50px ${currentColors[0]}`,
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-4xl font-bold">{module.id}</div>
                    </motion.div>

                    {/* 悬停时显示模块名称标签 */}
                    <AnimatePresence>
                      {hoveredModule === module.id && (
                        <motion.div
                          initial={{ opacity: 0, x: 10, y: 10 }}
                          animate={{ opacity: 1, x: 20, y: 20 }}
                          exit={{ opacity: 0, x: 10, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-0 left-full ml-4 pointer-events-none whitespace-nowrap"
                          style={{ zIndex: 50 }}
                        >
                          <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-purple-500/50 rounded-lg px-4 py-2 text-sm font-medium shadow-xl">
                            {module.name}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>

                {/* 子节点 - 项目阶段 */}
                <AnimatePresence>
                  {isActive && (
                    <>
                      {/* SVG容器 - 用于绘制直线（虚线/实线） */}
                      <svg
                        className="absolute pointer-events-none"
                        style={{
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 5,
                        }}
                      >
                        <defs>
                          {/* 发光滤镜 */}
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          {/* 渐变定义 */}
                          <linearGradient id={`gradient-${module.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={currentColors[0]} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={currentColors[1]} stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        {module.projects.map((project, projectIndex) => {
                          // 计算主节点的屏幕位置
                          const mainNodeX = 50 + radius * Math.cos((angle - 90) * Math.PI / 180) * 2
                          const mainNodeY = 50 + radius * Math.sin((angle - 90) * Math.PI / 180) * 2

                          // 计算子节点的相对位置
                          const positions = getSubNodePositions(module.projects.length, mainNodeX, mainNodeY, subRadius)
                          const pos = positions[projectIndex]
                          const pathData = generateLinePath(mainNodeX, mainNodeY, pos.x, pos.y)

                          // 判断是否已完成（实线）或未完成（虚线）
                          const isCompleted = project.is_completed || false
                          const strokeDasharray = isCompleted ? "0" : "5 5"

                          return (
                            <motion.path
                              key={`line-${project.id}`}
                              d={pathData}
                              fill="none"
                              stroke={`url(#gradient-${module.id})`}
                              strokeWidth="2"
                              strokeDasharray={strokeDasharray}
                              filter="url(#glow)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.8 }}
                              exit={{ pathLength: 0, opacity: 0 }}
                              transition={{
                                delay: projectIndex * 0.1,
                                duration: 0.6,
                              }}
                            />
                          )
                        })}
                      </svg>

                      {module.projects.map((project, projectIndex) => {
                        const letter = String.fromCharCode(65 + projectIndex)  // A, B, C, D

                        // 计算主节点的屏幕位置
                        const mainNodeX = 50 + radius * Math.cos((angle - 90) * Math.PI / 180) * 2
                        const mainNodeY = 50 + radius * Math.sin((angle - 90) * Math.PI / 180) * 2

                        // 计算子节点的位置
                        const positions = getSubNodePositions(module.projects.length, mainNodeX, mainNodeY, subRadius)
                        const pos = positions[projectIndex]

                        return (
                          <motion.div
                            key={project.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              delay: projectIndex * 0.1,
                              type: 'spring',
                              stiffness: 300,
                              damping: 20,
                            }}
                            style={{
                              position: 'absolute',
                              left: `${pos.x}%`,
                              top: `${pos.y}%`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 15,
                            }}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProject(project)
                            }}
                          >
                            {/* 子圆形节点 */}
                            <motion.div
                              className="relative"
                              whileHover={{ scale: 1.3 }}
                              whileTap={{ scale: 0.85 }}
                            >
                              {/* 外层发光圆环 */}
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: `linear-gradient(135deg, ${gradientString})`,
                                  filter: 'blur(10px)',
                                }}
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />

                              {/* 主节点 */}
                              <motion.div
                                className="relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl"
                                style={{
                                  background: `linear-gradient(135deg, ${gradientString})`,
                                  border: selectedProject?.id === project.id
                                    ? '3px solid rgba(255,255,255,1)'
                                    : '3px solid rgba(255,255,255,0.5)',
                                  boxShadow: `0 0 20px ${currentColors[0]}80`,
                                }}
                                whileHover={{
                                  boxShadow: `0 0 30px ${currentColors[0]}`,
                                  rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                  rotate: {
                                    duration: 0.5,
                                    ease: "easeInOut",
                                  }
                                }}
                              >
                                <span className="text-2xl font-bold">{letter}</span>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* 项目简介卡片 */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-4"
            >
              <div className="max-w-3xl mx-auto bg-gray-900/95 backdrop-blur-lg border-2 border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                  {/* 关闭按钮 */}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* 项目标题 */}
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pr-12">
                    {selectedProject.title}
                  </h3>

                  {selectedProject.subtitle &&
                   selectedProject.subtitle !== 'option_a' &&
                   selectedProject.subtitle !== 'option_b' &&
                   selectedProject.subtitle !== 'option_c' &&
                   selectedProject.subtitle !== 'option_d' && (
                    <p className="text-gray-400 mb-4">{selectedProject.subtitle}</p>
                  )}

                  {/* 项目简介 */}
                  <div className="mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      {selectedProject.project_intro || '探索未知的领域，挑战自我的边界。'}
                    </p>
                  </div>

                  {/* 难度等级 */}
                  {selectedProject.difficulty_level && (
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                      <span className="text-purple-400 text-sm font-medium">
                        {selectedProject.difficulty_level}
                      </span>
                    </div>
                  )}

                  {/* 查看详情按钮 */}
                  <Link
                    href={`/courses/icarus/${selectedProject.id}`}
                    className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-medium text-center hover:opacity-90 transition-opacity text-white"
                  >
                    查看详情 →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
