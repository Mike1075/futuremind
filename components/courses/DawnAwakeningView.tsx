// @ts-nocheck
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

interface DawnAwakeningViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
}

// 23天课程的色彩配置（从深夜紫蓝到金色黎明的渐变）
const COURSE_COLORS = [
  { from: '#1e1b4b', to: '#312e81' },      // Day 1 - 深邃靛蓝
  { from: '#1e3a5f', to: '#1e40af' },      // Day 2 - 夜幕蓝
  { from: '#1e3a8a', to: '#2563eb' },      // Day 3 - 拂晓蓝
  { from: '#3730a3', to: '#4f46e5' },      // Day 4 - 晨星紫
  { from: '#4c1d95', to: '#6d28d9' },      // Day 5 - 紫罗兰
  { from: '#5b21b6', to: '#7c3aed' },      // Day 6 - 紫曦
  { from: '#6d28d9', to: '#8b5cf6' },      // Day 7 - 幽紫
  { from: '#7c3aed', to: '#a855f7' },      // Day 8 - 淡紫
  { from: '#9333ea', to: '#c026d3' },      // Day 9 - 霞紫
  { from: '#a21caf', to: '#db2777' },      // Day 10 - 玫红
  { from: '#be185d', to: '#e11d48' },      // Day 11 - 绯红
  { from: '#dc2626', to: '#f97316' },      // Day 12 - 橙红
  { from: '#ea580c', to: '#f97316' },      // Day 13 - 橙霞
  { from: '#d97706', to: '#f59e0b' },      // Day 14 - 金橙
  { from: '#ca8a04', to: '#eab308' },      // Day 15 - 明黄
  { from: '#a16207', to: '#facc15' },      // Day 16 - 柠黄
  { from: '#ca8a04', to: '#fbbf24' },      // Day 17 - 暖阳
  { from: '#d97706', to: '#fcd34d' },      // Day 18 - 晨光
  { from: '#f59e0b', to: '#fde047' },      // Day 19 - 金辉
  { from: '#fbbf24', to: '#fef08a' },      // Day 20 - 璀璨
  { from: '#f59e0b', to: '#fcd34d' },      // Day 21 - 灿烂
  { from: '#ea580c', to: '#f97316' },      // Day 22 - 凤凰
  { from: '#dc2626', to: '#f59e0b' },      // Day 23 - 重生
]

// 凤凰简笔画路径 - 23个节点沿着凤凰轮廓分布
// 象征"凤凰重生"与"破晓觉醒"的主题
// 从左翼尖开始，经过头部，到右翼，再到尾羽
const PATH_POINTS = [
  // 左翼 - 从翼尖向上
  { x: 8, y: 55 },    // Day 1 - 左翼尖端
  { x: 15, y: 42 },   // Day 2 - 左翼上缘
  { x: 24, y: 32 },   // Day 3 - 左翼内侧
  { x: 33, y: 25 },   // Day 4 - 左肩

  // 头部 - 凤凰仰首向上
  { x: 42, y: 18 },   // Day 5 - 左颈
  { x: 48, y: 10 },   // Day 6 - 头顶左侧
  { x: 52, y: 8 },    // Day 7 - 头顶（最高点）
  { x: 56, y: 10 },   // Day 8 - 头顶右侧
  { x: 62, y: 18 },   // Day 9 - 右颈

  // 右翼 - 向下延伸
  { x: 70, y: 25 },   // Day 10 - 右肩
  { x: 78, y: 32 },   // Day 11 - 右翼内侧
  { x: 86, y: 42 },   // Day 12 - 右翼上缘
  { x: 92, y: 55 },   // Day 13 - 右翼尖端

  // 右侧身体 - 向下
  { x: 82, y: 58 },   // Day 14 - 右翼下缘
  { x: 72, y: 62 },   // Day 15 - 右身侧
  { x: 65, y: 68 },   // Day 16 - 右腰

  // 尾羽 - 向下流动
  { x: 58, y: 75 },   // Day 17 - 尾羽开始
  { x: 52, y: 82 },   // Day 18 - 尾羽中段
  { x: 48, y: 88 },   // Day 19 - 尾羽尖端

  // 左侧身体 - 向上回到起点
  { x: 42, y: 82 },   // Day 20 - 尾羽左侧
  { x: 35, y: 75 },   // Day 21 - 左身下
  { x: 28, y: 68 },   // Day 22 - 左腰
  { x: 18, y: 60 },   // Day 23 - 回归（重生）
]

export function DawnAwakeningView({ courseSystem, contents, completionMap, scoreMap }: DawnAwakeningViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 生成SVG曲线路径（使用Catmull-Rom样条算法，确保平滑曲线）
  const generatePath = () => {
    if (PATH_POINTS.length < 2) return ''

    let path = `M ${PATH_POINTS[0].x} ${PATH_POINTS[0].y}`

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p0 = i > 0 ? PATH_POINTS[i - 1] : PATH_POINTS[i]
      const p1 = PATH_POINTS[i]
      const p2 = PATH_POINTS[i + 1]
      const p3 = i < PATH_POINTS.length - 2 ? PATH_POINTS[i + 2] : PATH_POINTS[i + 1]

      // Catmull-Rom转贝塞尔曲线控制点
      const controlX1 = p1.x + (p2.x - p0.x) / 6
      const controlY1 = p1.y + (p2.y - p0.y) / 6
      const controlX2 = p2.x - (p3.x - p1.x) / 6
      const controlY2 = p2.y - (p3.y - p1.y) / 6

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${p2.x} ${p2.y}`
    }

    return path
  }

  // 预先计算解锁状态映射（链式检查：必须前面所有课程都>=60分）
  const unlockMap = new Map<string, boolean>()
  contents.forEach((content, index) => {
    if (index === 0) {
      unlockMap.set(content.id, true)
    } else {
      const prevContent = contents[index - 1]
      const prevUnlocked = unlockMap.get(prevContent.id) === true
      const prevScore = scoreMap.get(prevContent.id) || 0
      unlockMap.set(content.id, prevUnlocked && prevScore >= 60)
    }
  })

  // 计算进度
  const completedCount = Array.from(completionMap.values()).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / contents.length) * 100)

  return (
    <div className="min-h-screen text-starlight relative overflow-hidden">
      {/* 宇宙背景渐变 - 与 ListeningCourseView 相同的半透明背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-cosmic-deep/60 to-mystic-purple/20 pointer-events-none" />

      {/* 统一导航栏 */}
      <UnifiedNavbar
        transparent
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回学习中心',
          href: '/portal'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* 课程头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            {courseSystem.title}
          </h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">{courseSystem.description}</p>

          {/* 进度显示 */}
          <div className="inline-flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              <span className="text-white font-semibold">{completedCount} / {contents.length}</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="text-amber-400 font-bold">{progressPercentage}%</div>
          </div>
        </div>

        {/* 凤凰路径地图 - 与 ListeningCourseView 相同的布局 */}
        <div className="relative mx-auto" style={{
          width: 'min(100%, calc(100vh - 280px))',
          maxWidth: '700px',
          aspectRatio: '1 / 1'
        }}>
          {/* SVG路径 */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 背景路径（灰色虚线） */}
            <path
              d={generatePath()}
              fill="none"
              stroke="rgba(75, 85, 99, 0.4)"
              strokeWidth="0.4"
              strokeDasharray="2 2"
              strokeLinecap="round"
            />

            {/* 渐变定义 */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>

            {/* 已解锁路径（渐变色） */}
            {contents.map((content, index) => {
              if (index === 0) return null
              const isUnlocked = unlockMap.get(content.id) === true
              if (!isUnlocked) return null

              const point = PATH_POINTS[index]
              const prevPoint = PATH_POINTS[index - 1]
              const color = COURSE_COLORS[index]
              const prevColor = COURSE_COLORS[index - 1]

              return (
                <g key={`path-${index}`}>
                  <defs>
                    <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={prevColor.to} />
                      <stop offset="100%" stopColor={color.from} />
                    </linearGradient>
                  </defs>
                  <path
                    d={(() => {
                      const p0 = index > 1 ? PATH_POINTS[index - 2] : PATH_POINTS[index - 1]
                      const p1 = prevPoint
                      const p2 = point
                      const p3 = index < PATH_POINTS.length - 1 ? PATH_POINTS[index + 1] : point

                      const cx1 = p1.x + (p2.x - p0.x) / 6
                      const cy1 = p1.y + (p2.y - p0.y) / 6
                      const cx2 = p2.x - (p3.x - p1.x) / 6
                      const cy2 = p2.y - (p3.y - p1.y) / 6

                      return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`
                    })()}
                    fill="none"
                    stroke={`url(#grad-${index})`}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
          </svg>

          {/* 节点 */}
          <div className="absolute inset-0">
            {contents.map((content, index) => {
              const isCompleted = completionMap.get(content.id) === true
              const isUnlocked = unlockMap.get(content.id) === true
              const score = scoreMap.get(content.id) || 0
              const isPassed = score >= 60
              const point = PATH_POINTS[index]
              const color = COURSE_COLORS[index]
              const dayNumber = index + 1

              return (
                <motion.div
                  key={content.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  {isUnlocked ? (
                    <Link href={`/courses/dawn_awakening/${content.id}`} className="block">
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer flex items-center justify-center group/node"
                      >
                        {/* 光晕效果 - 默认隐藏，悬停时显示旋转动画 */}
                        <motion.div
                          className="absolute rounded-full pointer-events-none opacity-0 group-hover/node:opacity-80 transition-opacity duration-300"
                          style={{
                            width: '140%',
                            height: '140%',
                            background: `conic-gradient(from 0deg, ${color.from}, ${color.to}, ${COURSE_COLORS[(index + 1) % COURSE_COLORS.length].from}, ${color.from})`,
                            filter: 'blur(3px)',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                          }}
                        />

                        {/* 主节点 */}
                        <div
                          className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-bold text-white shadow-2xl transition-all"
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                              : `linear-gradient(135deg, ${color.from}AA, ${color.to}AA)`,
                            border: isPassed
                              ? '2px solid rgba(255,255,255,0.5)'
                              : isCompleted
                                ? '2px solid rgba(255,255,255,0.3)'
                                : '2px solid rgba(255,255,255,0.1)',
                            boxShadow: `0 0 15px ${color.from}40`,
                          }}
                        >
                          <span>{dayNumber}</span>
                        </div>

                        {/* 标题悬停提示 */}
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
                          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 shadow-2xl">
                            {content.title}
                            {isPassed && <span className="ml-2 text-green-400">✓ {score}分</span>}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center">
                      {/* 未解锁节点 - 锁图标 */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-gray-600 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #374151, #1F2937)',
                          border: '2px solid rgba(75, 85, 99, 0.3)',
                        }}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-16 text-gray-400 text-sm">
          <p>🔥 依次完成每天的练习，开启凤凰重生之旅</p>
        </div>
      </div>

      {/* 用户资料弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
