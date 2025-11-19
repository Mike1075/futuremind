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

// 根据项目数量计算子节点位置
const getSubNodePositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions = []

  if (count === 3) {
    // 三角形布局
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 - 90) * (Math.PI / 180)  // 从顶部开始
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }
  } else if (count === 4) {
    // 正方形布局
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 - 135) * (Math.PI / 180)  // 从左上开始
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      })
    }
  }

  return positions
}

export function IcarusTriangleView({ modules }: IcarusTriangleViewProps) {
  const [activeModule, setActiveModule] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

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
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
            animate={{
              opacity: [Math.random() * 0.3, Math.random() * 0.8, Math.random() * 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
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
          {/* 主节点 - 3个模块 */}
          {modules.map((module, index) => {
            const point = TRIANGLE_POINTS[index]
            const isActive = activeModule === module.id
            const subRadius = 20  // 子节点距离中心的半径（百分比）

            return (
              <div key={module.id}>
                {/* 主圆形节点 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="cursor-pointer group"
                  onClick={() => handleModuleClick(module.id)}
                >
                  {/* 光晕效果 */}
                  <div
                    className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                      isActive ? 'opacity-100 scale-150' : 'opacity-60 scale-125 group-hover:opacity-100 group-hover:scale-150'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${module.gradient})`,
                    }}
                  />

                  {/* 主圆形 */}
                  <motion.div
                    className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${module.gradient})`,
                      border: isActive ? '4px solid rgba(255,255,255,0.6)' : '4px solid rgba(255,255,255,0.3)',
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-5xl mb-2">{module.icon}</div>
                    <div className="text-4xl font-bold">{module.id}</div>
                  </motion.div>

                  {/* 模块名称 */}
                  <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 text-sm font-medium">
                      {module.name}
                    </div>
                  </div>
                </motion.div>

                {/* 子节点 - 项目阶段 */}
                <AnimatePresence>
                  {isActive && (
                    <>
                      {module.projects.map((project, projectIndex) => {
                        const letter = String.fromCharCode(65 + projectIndex)  // A, B, C, D
                        const positions = getSubNodePositions(module.projects.length, point.x, point.y, subRadius)
                        const pos = positions[projectIndex]

                        return (
                          <motion.div
                            key={project.id}
                            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              x: (pos.x - point.x) + '%',
                              y: (pos.y - point.y) + '%',
                            }}
                            exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                            transition={{
                              delay: projectIndex * 0.1,
                              type: 'spring',
                              stiffness: 300,
                              damping: 20,
                            }}
                            style={{
                              position: 'absolute',
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className="cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProject(project)
                            }}
                          >
                            {/* 连接线 */}
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: projectIndex * 0.1 + 0.2, duration: 0.5 }}
                            >
                              <svg
                                className="absolute"
                                style={{
                                  width: '200%',
                                  height: '200%',
                                  left: '-50%',
                                  top: '-50%',
                                }}
                              >
                                <motion.line
                                  x1="50%"
                                  y1="50%"
                                  x2={`${50 - (pos.x - point.x) / subRadius * 50}%`}
                                  y2={`${50 - (pos.y - point.y) / subRadius * 50}%`}
                                  stroke="rgba(99, 102, 241, 0.5)"
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                />
                              </svg>
                            </motion.div>

                            {/* 子圆形节点 */}
                            <motion.div
                              className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all"
                              style={{
                                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                border: selectedProject?.id === project.id
                                  ? '3px solid rgba(255,255,255,0.8)'
                                  : '3px solid rgba(255,255,255,0.4)',
                              }}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <span className="text-3xl font-bold">{letter}</span>
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
