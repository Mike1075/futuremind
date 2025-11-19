'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  subtitle: string | null
  project_intro: string | null
  difficulty_level: string | null
  sequence_number: number
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

// 等边三角形顶点位置（百分比）
const TRIANGLE_POINTS = [
  { x: 50, y: 15 },   // 顶部
  { x: 15, y: 75 },   // 左下
  { x: 85, y: 75 },   // 右下
]

// 根据项目数量计算子节点位置 - 围绕主节点等距离圆形分布
const getSubNodePositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions = []
  const angleStep = 360 / count  // 等分圆周

  for (let i = 0; i < count; i++) {
    // 从顶部（-90度）开始，顺时针分布
    const angle = (i * angleStep - 90) * (Math.PI / 180)
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    })
  }

  return positions
}

// 生成波浪路径
const generateWavePath = (x1: number, y1: number, x2: number, y2: number) => {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const waveHeight = distance * 0.1  // 波浪高度为距离的10%

  // 垂直于连线的方向
  const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2
  const controlX = midX + waveHeight * Math.cos(angle)
  const controlY = midY + waveHeight * Math.sin(angle)

  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`
}

export function IcarusTriangleView({ modules }: IcarusTriangleViewProps) {
  const [activeModule, setActiveModule] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hoveredModule, setHoveredModule] = useState<number | null>(null)

  const handleModuleClick = (moduleId: number) => {
    if (activeModule === moduleId) {
      setActiveModule(null)
    } else {
      setActiveModule(moduleId)
      setSelectedProject(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 星空背景 - 随机变色 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => {
          const randomColors = () => {
            const colors = ['#FFFFFF', '#E0E7FF', '#DBEAFE', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#F3E8FF']
            return colors[Math.floor(Math.random() * colors.length)]
          }

          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
              animate={{
                opacity: [Math.random() * 0.3, Math.random() * 0.8, Math.random() * 0.3],
                scale: [1, 1.5, 1],
                background: [randomColors(), randomColors(), randomColors()],
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

        {/* 三角形布局区域 */}
        <div className="relative w-full" style={{ height: '70vh', minHeight: '600px' }}>
          {/* 圆形轨道 - 连接三个模块 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              {/* 轨道渐变 */}
              <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
              </linearGradient>
              {/* 发光滤镜 */}
              <filter id="orbitGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 计算圆心和半径 - 基于三个顶点 */}
            {(() => {
              // 三角形重心作为圆心
              const centerX = (TRIANGLE_POINTS[0].x + TRIANGLE_POINTS[1].x + TRIANGLE_POINTS[2].x) / 3
              const centerY = (TRIANGLE_POINTS[0].y + TRIANGLE_POINTS[1].y + TRIANGLE_POINTS[2].y) / 3
              // 计算半径（到第一个点的距离）
              const radius = Math.sqrt(
                Math.pow((TRIANGLE_POINTS[0].x - centerX), 2) +
                Math.pow((TRIANGLE_POINTS[0].y - centerY), 2)
              )

              return (
                <>
                  {/* 圆形轨道 */}
                  <motion.circle
                    cx={`${centerX}%`}
                    cy={`${centerY}%`}
                    r={`${radius}%`}
                    fill="none"
                    stroke="url(#orbitGradient)"
                    strokeWidth="2"
                    strokeDasharray="10 5"
                    filter="url(#orbitGlow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: [0.4, 0.7, 0.4],
                      rotate: 360
                    }}
                    transition={{
                      pathLength: { duration: 2 },
                      opacity: { duration: 3, repeat: Infinity },
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                    }}
                    style={{ transformOrigin: `${centerX}% ${centerY}%` }}
                  />
                  {/* 内圈轨道 */}
                  <motion.circle
                    cx={`${centerX}%`}
                    cy={`${centerY}%`}
                    r={`${radius * 0.95}%`}
                    fill="none"
                    stroke="url(#orbitGradient)"
                    strokeWidth="1"
                    strokeDasharray="5 3"
                    opacity="0.2"
                    animate={{
                      rotate: -360
                    }}
                    transition={{
                      rotate: { duration: 30, repeat: Infinity, ease: "linear" }
                    }}
                    style={{ transformOrigin: `${centerX}% ${centerY}%` }}
                  />
                </>
              )
            })()}
          </svg>

          {/* 主节点 - 3个模块 */}
          {modules.map((module, index) => {
            const point = TRIANGLE_POINTS[index]
            const isActive = activeModule === module.id
            const subRadius = 18  // 子节点距离中心的半径（百分比）

            return (
              <div key={module.id}>
                {/* 主圆形节点 - 缩小并移除图标 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                  className="cursor-pointer group"
                  onClick={() => handleModuleClick(module.id)}
                  onMouseEnter={() => setHoveredModule(module.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  {/* 光晕效果 - 增强 */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${module.gradient})`,
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

                  {/* 主圆形 - 缩小到80px */}
                  <motion.div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${module.gradient})`,
                      border: isActive ? '3px solid rgba(255,255,255,0.8)' : '3px solid rgba(255,255,255,0.4)',
                      boxShadow: `0 0 ${isActive ? '30px' : '20px'} rgba(99, 102, 241, 0.5)`,
                    }}
                    whileHover={{
                      scale: 1.3,
                      rotate: 360,
                      boxShadow: '0 0 50px rgba(99, 102, 241, 1)',
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

                {/* 子节点 - 项目阶段 */}
                <AnimatePresence>
                  {isActive && (
                    <>
                      {/* SVG容器 - 用于绘制波浪线 */}
                      <svg
                        className="absolute pointer-events-none"
                        style={{
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        <defs>
                          {/* 发光滤镜 */}
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        {module.projects.map((project, projectIndex) => {
                          const positions = getSubNodePositions(module.projects.length, point.x, point.y, subRadius)
                          const pos = positions[projectIndex]
                          const pathData = generateWavePath(point.x, point.y, pos.x, pos.y)

                          return (
                            <motion.path
                              key={`line-${project.id}`}
                              d={pathData}
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="2"
                              filter="url(#glow)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              exit={{ pathLength: 0, opacity: 0 }}
                              transition={{
                                delay: projectIndex * 0.1,
                                duration: 0.6,
                              }}
                            />
                          )
                        })}
                        {/* 渐变定义 */}
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={module.gradient.split(', ')[0]} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={module.gradient.split(', ')[1]} stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {module.projects.map((project, projectIndex) => {
                        const letter = String.fromCharCode(65 + projectIndex)  // A, B, C, D
                        const positions = getSubNodePositions(module.projects.length, point.x, point.y, subRadius)
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
                            }}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProject(project)
                            }}
                          >
                            {/* 子圆形节点 - 炫酷效果 */}
                            <motion.div
                              className="relative"
                              whileHover={{ scale: 1.3 }}
                              whileTap={{ scale: 0.85 }}
                            >
                              {/* 外层发光圆环 */}
                              <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: `linear-gradient(135deg, ${module.gradient})`,
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
                                  background: `linear-gradient(135deg, ${module.gradient})`,
                                  border: selectedProject?.id === project.id
                                    ? '3px solid rgba(255,255,255,1)'
                                    : '3px solid rgba(255,255,255,0.5)',
                                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
                                }}
                                whileHover={{
                                  boxShadow: '0 0 30px rgba(99, 102, 241, 1)',
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
