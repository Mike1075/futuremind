'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  subtitle: string | null
  project_intro: string | null
  difficulty_level: string | null
  sequence_number: number
  progress?: number  // 项目进度百分比 (0-100)
  is_completed?: boolean  // 已完成状态
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

// 固定颜色方案 - 每个模块一种颜色
const MODULE_COLORS = [
  ['#10B981', '#14B8A6'],  // 模块1: emerald to teal
  ['#3B82F6', '#06B6D4'],  // 模块2: blue to cyan
  ['#8B5CF6', '#EC4899'],  // 模块3: purple to pink
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
    // 正方形：从右上角开始，顺时针，对角线顶点（45°, 135°, 225°, 315°）
    for (let i = 0; i < 4; i++) {
      const angle = (45 + i * 90) * (Math.PI / 180) // A=45°(右上), B=135°(左上), C=225°(左下), D=315°(右下)
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

  // 全局旋转控制 - 控制所有模块的公转和自转
  const shouldPause = activeModule !== null || selectedProject !== null

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
  const radius = 38 // 扩大半径到38%，让圆圈更大

  return (
    <div className="min-h-screen bg-black text-white relative overflow-y-auto">
      {/* 星空背景 - 优化性能，减少星星数量 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => {
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
                boxShadow: `0 0 ${size * 3}px ${size * 2}px ${randomColor}40`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1],
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

        {/* 圆形布局区域 */}
        <div className="relative w-full pb-20" style={{ minHeight: '100vh' }}>
          {/* 圆心标题 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ zIndex: 5 }}>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              伊卡洛斯计划
            </h1>
            <p className="text-gray-400 text-lg">探索现实的边界 · PBL项目体系</p>
          </div>

          {/* 圆形轨道 - 完整的圆 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ zIndex: 0 }}>
            <defs>
              {/* 轨道渐变 */}
              <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
              </linearGradient>
              {/* 发光滤镜 */}
              <filter id="orbitGlow">
                <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 完整圆形轨道 */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="0.3"
              strokeDasharray="0"
              filter="url(#orbitGlow)"
              opacity="0.8"
            />
            {/* 内圈轨道装饰 */}
            <motion.circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth="0.1"
              strokeDasharray="0.8 0.4"
              opacity="0.4"
              animate={{
                strokeDashoffset: [0, -10]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>

          {/* 主节点 - 3个模块在圆周上公转和自转 */}
          {modules.map((module, index) => {
            const isActive = activeModule === module.id
            const subRadiusVmin = 10  // 子节点距离父节点中心的半径（vmin单位，约100px）
            const angle = index * 120 // 三等分：0度、120度、240度
            const currentColors = MODULE_COLORS[index] || MODULE_COLORS[0]
            const gradientString = `${currentColors[0]}, ${currentColors[1]}`

            // 计算节点在圆周上的精确位置（使用vmin单位，与SVG viewBox对应）
            const radiusVmin = 38  // 圆的半径（vmin），对应SVG viewBox中的r="38"
            const angleRad = (angle - 90) * Math.PI / 180
            const nodeX = radiusVmin * Math.cos(angleRad)
            const nodeY = radiusVmin * Math.sin(angleRad)

            return (
              <div key={module.id}>
                {/* 公转容器 - 定位在屏幕中心 */}
                <motion.div
                  initial={{ scale: 1, opacity: 1, rotate: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    ...(!shouldPause && { rotate: 360 })  // 暂停时不设置rotate，保持当前位置
                  }}
                  transition={{
                    scale: { duration: 0 },
                    opacity: { duration: 0 },
                    rotate: { duration: 120, repeat: Infinity, ease: "linear" }
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 0,
                    height: 0,
                    zIndex: isActive ? 20 : 10,
                  }}
                >
                  {/* 节点 - 从中心向外延伸，圆心在圆周上 */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: `${nodeX}vmin`,
                      top: `${nodeY}vmin`,
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
                          opacity: hoveredModule === module.id ? 0.9 : isActive ? 0.8 : 0.5,
                          scale: hoveredModule === module.id ? 1.6 : isActive ? 1.4 : 1.2,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                      />

                      {/* 主圆形 - 自转 */}
                      <motion.div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${gradientString})`,
                          border: isActive ? '3px solid rgba(255,255,255,0.8)' : '3px solid rgba(255,255,255,0.4)',
                          boxShadow: `0 0 ${isActive ? '30px' : '20px'} ${currentColors[0]}80`,
                        }}
                        animate={{
                          scale: isActive ? 0.7 : 1,  // 点击后缩小，让线条更清晰
                          ...(!shouldPause && { rotate: -360 })  // 自转（反方向抵消公转），暂停时保持当前位置
                        }}
                        transition={{
                          scale: { duration: 0.3, type: 'spring', stiffness: 300, damping: 25 },
                          rotate: { duration: 120, repeat: Infinity, ease: "linear" }
                        }}
                        whileHover={{
                          scale: isActive ? 0.85 : 1.3,  // hover时稍微放大一点
                          boxShadow: `0 0 50px ${currentColors[0]}`,
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className="text-4xl font-bold">{module.id}</div>
                      </motion.div>

                      {/* 模块名称标签 - 仅在hover时显示，沿径向延伸 */}
                      <AnimatePresence>
                        {hoveredModule === module.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute pointer-events-none"
                            style={{
                              left: '50%',  // 节点中心
                              top: '50%',
                              width: 0,
                              height: 0,
                            }}
                          >
                            {/* 径向延伸容器 - 旋转到节点实际角度（angle - 90） */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: 0,
                                height: 0,
                                transform: `rotate(${angle - 90}deg)`,  // 使用实际节点角度
                                transformOrigin: '0 0',
                              }}
                            >
                              {/* 标签 - 头部固定在节点外侧，沿径向向外延伸 */}
                              <motion.div
                                animate={{
                                  // 反向旋转抵消公转，保持标签水平
                                  ...(!shouldPause && { rotate: -360 })
                                }}
                                transition={{
                                  rotate: { duration: 120, repeat: Infinity, ease: "linear" }
                                }}
                                style={{
                                  position: 'absolute',
                                  left: '5.5vmin',  // 节点半径约4vmin(40px) + 间隔1.5vmin
                                  top: 0,
                                  transform: `rotate(-${angle - 90}deg) translateY(-50%)`,  // 反向旋转让内容水平，并垂直居中
                                  transformOrigin: 'left center',  // 以左边（头部）为固定点
                                }}
                              >
                                <div
                                  className="bg-gray-900/95 backdrop-blur-sm border-2 rounded-lg px-3 py-1 text-xs font-medium shadow-xl whitespace-nowrap"
                                  style={{
                                    borderColor: currentColors[0],
                                  }}
                                >
                                  {module.name}
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                  {/* 子节点容器 - 以父节点为中心，跟随公转 */}
                  {isActive && (
                  <motion.div
                    initial={false}  // 不使用initial动画，直接继承当前状态
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3, type: 'spring', stiffness: 300, damping: 25 },
                    }}
                    className="absolute"
                    style={{
                      left: `${nodeX}vmin`,
                      top: `${nodeY}vmin`,
                      width: 0,
                      height: 0,
                      zIndex: 15,
                    }}
                  >
                      {/* 子节点定位容器 - 不旋转，保持坐标系正常 */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 0,
                          height: 0,
                        }}
                      >
                        {/* SVG - 绘制连接线 */}
                        <svg
                          className="absolute pointer-events-none"
                          style={{
                            left: `${-subRadiusVmin * 1.5}vmin`,
                            top: `${-subRadiusVmin * 1.5}vmin`,
                            width: `${subRadiusVmin * 3}vmin`,
                            height: `${subRadiusVmin * 3}vmin`,
                            overflow: 'visible',
                          }}
                          viewBox={`0 0 ${subRadiusVmin * 3} ${subRadiusVmin * 3}`}
                        >
                        <defs>
                          <filter id={`glow-${module.id}`}>
                            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <linearGradient id={`gradient-${module.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={currentColors[0]} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={currentColors[1]} stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        {module.projects.map((project, projectIndex) => {
                          // 计算当前节点和下一个节点的位置，绘制它们之间的连接线
                          const count = module.projects.length
                          const nextIndex = (projectIndex + 1) % count

                          // 当前节点角度
                          let subAngle1
                          if (count === 3) {
                            subAngle1 = projectIndex * 120 - 90
                          } else if (count === 4) {
                            subAngle1 = 45 + projectIndex * 90  // 对角线顶点：45°, 135°, 225°, 315°
                          } else {
                            subAngle1 = (projectIndex * 360 / count) - 90
                          }

                          // 下一个节点角度
                          let subAngle2
                          if (count === 3) {
                            subAngle2 = nextIndex * 120 - 90
                          } else if (count === 4) {
                            subAngle2 = 45 + nextIndex * 90  // 对角线顶点：45°, 135°, 225°, 315°
                          } else {
                            subAngle2 = (nextIndex * 360 / count) - 90
                          }

                          // SVG 中心点和半径（使用 viewBox 单位）
                          const centerX = subRadiusVmin * 1.5
                          const centerY = subRadiusVmin * 1.5

                          // 当前节点坐标
                          const x1 = centerX + subRadiusVmin * Math.cos(subAngle1 * Math.PI / 180)
                          const y1 = centerY + subRadiusVmin * Math.sin(subAngle1 * Math.PI / 180)

                          // 下一个节点坐标
                          const x2 = centerX + subRadiusVmin * Math.cos(subAngle2 * Math.PI / 180)
                          const y2 = centerY + subRadiusVmin * Math.sin(subAngle2 * Math.PI / 180)

                          // 根据边连接的两个项目的完成状态判断线型：两个都完成=实线，否则=虚线
                          const currentProject = module.projects[projectIndex]
                          const nextProject = module.projects[nextIndex]
                          const bothCompleted = currentProject.is_completed && nextProject.is_completed
                          // 虚线样式：1 0.5 表示 1单位实线 + 0.5单位间隔
                          const strokeDasharray = bothCompleted ? "0" : "1 0.5"

                          return (
                            <motion.line
                              key={`line-${project.id}`}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={`url(#gradient-${module.id})`}
                              strokeWidth="0.3"
                              strokeDasharray={strokeDasharray}
                              filter={`url(#glow-${module.id})`}
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

                      {/* 子节点 */}
                      {module.projects.map((project, projectIndex) => {
                        const letter = String.fromCharCode(65 + projectIndex)

                        // 计算子节点位置
                        const count = module.projects.length
                        let subAngle
                        if (count === 3) {
                          subAngle = projectIndex * 120 - 90
                        } else if (count === 4) {
                          subAngle = 45 + projectIndex * 90  // 对角线顶点：45°, 135°, 225°, 315°
                        } else {
                          subAngle = (projectIndex * 360 / count) - 90
                        }

                        // 使用 vmin 单位计算偏移，确保与容器坐标系统一致
                        const xOffset = subRadiusVmin * Math.cos(subAngle * Math.PI / 180)
                        const yOffset = subRadiusVmin * Math.sin(subAngle * Math.PI / 180)

                        return (
                          <motion.div
                            key={project.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: selectedProject?.id === project.id ? [1, 0.7, 1] : 1,  // 被选中时闪烁
                              ...(!shouldPause && { rotate: -360 })  // 反向旋转保持正立，暂停时保持当前位置
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              delay: projectIndex * 0.1,
                              scale: { type: 'spring', stiffness: 300, damping: 20 },
                              opacity: selectedProject?.id === project.id
                                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }  // 慢速闪烁
                                : { duration: 0.3 },
                              rotate: { duration: 120, repeat: Infinity, ease: "linear" }
                            }}
                            style={{
                              position: 'absolute',
                              left: `${xOffset}vmin`,
                              top: `${yOffset}vmin`,
                            }}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProject(project)
                            }}
                          >
                            {/* 子圆形节点容器 - 使用 translate 居中 */}
                            <div
                              style={{
                                position: 'relative',
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
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
                                <div
                                  className="relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl"
                                  style={{
                                    background: `linear-gradient(135deg, ${gradientString})`,
                                    border: selectedProject?.id === project.id
                                      ? '2px solid rgba(255,255,255,1)'
                                      : '2px solid rgba(255,255,255,0.5)',
                                    boxShadow: `0 0 15px ${currentColors[0]}80`,
                                  }}
                                >
                                  <span className="text-xl font-bold">{letter}</span>
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>
                        )
                      })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
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
