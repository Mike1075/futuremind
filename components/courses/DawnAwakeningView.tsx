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

// 日出弧形路径 - 23个节点形成从左下到顶部再到右下的弧线
// 模拟太阳升起又落下的轨迹，与"破晓觉醒"主题呼应
const PATH_POINTS = [
  // 左侧 - 黎明前的黑暗（从左下角开始上升）
  { x: 8, y: 85 },    // Day 1 - 起点，地平线左侧
  { x: 12, y: 72 },   // Day 2 - 开始上升
  { x: 17, y: 60 },   // Day 3 - 继续上升
  { x: 23, y: 48 },   // Day 4 - 天际线
  { x: 30, y: 38 },   // Day 5 - 破晓
  { x: 37, y: 28 },   // Day 6 - 初阳
  { x: 44, y: 20 },   // Day 7 - 朝霞

  // 顶部 - 太阳升至最高点
  { x: 50, y: 15 },   // Day 8 - 日升
  { x: 56, y: 12 },   // Day 9 - 光芒
  { x: 62, y: 10 },   // Day 10 - 顶点附近
  { x: 68, y: 10 },   // Day 11 - 正午（最高点）
  { x: 74, y: 12 },   // Day 12 - 开始下降

  // 右侧 - 太阳西沉，象征内化与安住
  { x: 80, y: 16 },   // Day 13 - 午后
  { x: 85, y: 22 },   // Day 14 - 黄昏前
  { x: 89, y: 30 },   // Day 15 - 傍晚
  { x: 92, y: 40 },   // Day 16 - 暮光
  { x: 94, y: 52 },   // Day 17 - 余晖
  { x: 95, y: 64 },   // Day 18 - 晚霞
  { x: 94, y: 75 },   // Day 19 - 地平线

  // 最后几天 - 内在的光（向内收敛）
  { x: 88, y: 82 },   // Day 20 - 内化
  { x: 78, y: 86 },   // Day 21 - 安住
  { x: 65, y: 88 },   // Day 22 - 圆满
  { x: 50, y: 90 },   // Day 23 - 重生（回到中心）
]

export function DawnAwakeningView({ courseSystem, contents, completionMap, scoreMap }: DawnAwakeningViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 生成SVG曲线路径（使用Catmull-Rom样条算法）
  const generatePath = () => {
    if (PATH_POINTS.length < 2) return ''

    let path = `M ${PATH_POINTS[0].x} ${PATH_POINTS[0].y}`

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p0 = i > 0 ? PATH_POINTS[i - 1] : PATH_POINTS[i]
      const p1 = PATH_POINTS[i]
      const p2 = PATH_POINTS[i + 1]
      const p3 = i < PATH_POINTS.length - 2 ? PATH_POINTS[i + 2] : PATH_POINTS[i + 1]

      const controlX1 = p1.x + (p2.x - p0.x) / 6
      const controlY1 = p1.y + (p2.y - p0.y) / 6
      const controlX2 = p2.x - (p3.x - p1.x) / 6
      const controlY2 = p2.y - (p3.y - p1.y) / 6

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${p2.x} ${p2.y}`
    }

    return path
  }

  // 预先计算解锁状态映射
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
      {/* 宇宙背景渐变 - 日出天空 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a1f] via-[#1a1035] to-[#3d2055] pointer-events-none" />

      {/* 地平线光晕效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-amber-900/20 via-orange-800/10 to-transparent pointer-events-none" />

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
          <div className="inline-flex items-center gap-4 bg-gray-900/50 border border-amber-800/30 rounded-full px-6 py-3">
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

        {/* 日出弧形路径地图 */}
        <div className="relative mx-auto" style={{
          width: 'min(100%, calc(100vh - 280px))',
          maxWidth: '800px',
          aspectRatio: '1 / 1'
        }}>
          {/* SVG路径 */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 背景路径（金色虚线） */}
            <path
              d={generatePath()}
              fill="none"
              stroke="rgba(251, 191, 36, 0.15)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              strokeLinecap="round"
            />

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
                    strokeWidth="1"
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
                  transition={{ delay: index * 0.05, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {isUnlocked ? (
                    <Link href={`/courses/dawn_awakening/${content.id}`} className="block">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer flex items-center justify-center group/node"
                      >
                        {/* 光晕效果 - 悬停时显示 */}
                        <motion.div
                          className="absolute rounded-full pointer-events-none opacity-0 group-hover/node:opacity-80 transition-opacity duration-300"
                          style={{
                            width: '150%',
                            height: '150%',
                            background: `conic-gradient(from 0deg, ${color.from}, ${color.to}, ${COURSE_COLORS[(index + 1) % COURSE_COLORS.length].from}, ${color.from})`,
                            filter: 'blur(4px)',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                          }}
                        />

                        {/* 主节点 */}
                        <div
                          className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold text-white shadow-lg transition-all"
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                              : `linear-gradient(135deg, ${color.from}99, ${color.to}99)`,
                            border: isPassed
                              ? '2px solid rgba(255,255,255,0.6)'
                              : isCompleted
                                ? '2px solid rgba(255,255,255,0.4)'
                                : '2px solid rgba(255,255,255,0.2)',
                            boxShadow: `0 0 12px ${color.from}50`,
                          }}
                        >
                          {dayNumber}
                        </div>

                        {/* 标题悬停提示 */}
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
                          <div className="bg-gray-900/95 backdrop-blur-md border border-amber-500/30 rounded-lg px-3 py-1.5 text-sm font-medium opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 shadow-xl">
                            <span className="text-amber-300">第{dayNumber}天</span>
                            <span className="text-white ml-2">{content.title}</span>
                            {isPassed && <span className="ml-2 text-green-400">✓ {score}分</span>}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center">
                      {/* 未解锁节点 */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-gray-500 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #374151, #1F2937)',
                          border: '2px solid rgba(75, 85, 99, 0.4)',
                        }}
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="text-center mt-12 text-gray-400 text-sm">
          <p>🌅 完成每天的冥想练习，开启内在觉醒之旅</p>
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
