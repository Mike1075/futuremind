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

// 23天课程的色彩配置（从深夜到黎明的渐变）
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

// 日出弧形路径 - 23个节点沿着从左地平线到右地平线的弧线分布
// 形成一个优雅的上升弧形，象征日出的轨迹
const PATH_POINTS = (() => {
  const points = []
  const totalPoints = 23

  // 弧形参数
  const centerX = 50
  const centerY = 85  // 圆心在下方
  const radius = 55   // 半径
  const startAngle = 175  // 从左侧开始（度）
  const endAngle = 5      // 到右侧结束（度）

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1)
    const angle = startAngle - progress * (startAngle - endAngle)
    const radian = (angle * Math.PI) / 180

    const x = centerX + radius * Math.cos(radian)
    const y = centerY + radius * Math.sin(radian)

    points.push({ x, y })
  }

  return points
})()

export function DawnAwakeningView({ courseSystem, contents, completionMap, scoreMap }: DawnAwakeningViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // 生成SVG曲线路径
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

      {/* 地平线光晕 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/30 via-orange-800/15 to-transparent pointer-events-none" />

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
        <div className="text-center mb-8">
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
          maxWidth: '700px',
          aspectRatio: '1 / 0.7'
        }}>
          {/* SVG路径 */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 70"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 背景路径（灰色虚线） */}
            <path
              d={generatePath()}
              fill="none"
              stroke="rgba(251, 191, 36, 0.2)"
              strokeWidth="0.4"
              strokeDasharray="2 2"
              strokeLinecap="round"
            />

            {/* 渐变定义 */}
            <defs>
              <linearGradient id="sunriseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4c1d95" />
                <stop offset="30%" stopColor="#db2777" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>

            {/* 已解锁路径 */}
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
              const point = PATH_POINTS[index]
              const color = COURSE_COLORS[index]
              const dayNumber = index + 1
              const isHovered = hoveredIndex === index

              // 调整坐标映射到 viewBox
              const xPercent = point.x
              const yPercent = point.y * (100 / 70)

              return (
                <motion.div
                  key={content.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {isUnlocked ? (
                    <Link href={`/courses/dawn_awakening/${content.id}`} className="block group">
                      {/* 节点容器 */}
                      <div className="relative">
                        {/* 外发光 */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-sm"
                          style={{
                            background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                            transform: 'scale(1.5)',
                            opacity: isCompleted ? 0.6 : 0.3
                          }}
                          animate={isCompleted ? {
                            scale: [1.5, 1.8, 1.5],
                            opacity: [0.6, 0.8, 0.6]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* 节点主体 */}
                        <div
                          className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-125 ${
                            isCompleted ? 'text-white' : 'text-white/90'
                          }`}
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                              : `linear-gradient(135deg, ${color.from}80, ${color.to}80)`,
                            boxShadow: isCompleted
                              ? `0 0 12px ${color.to}60`
                              : 'none'
                          }}
                        >
                          {isCompleted ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            dayNumber
                          )}
                        </div>

                        {/* 天数标签 - 显示在节点上方 */}
                        {!isCompleted && (
                          <div
                            className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap"
                            style={{ color: color.to }}
                          >
                            {dayNumber}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    // 锁定节点
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gray-700/60 flex items-center justify-center border border-gray-600/50">
                        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {/* 天数标签 */}
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {dayNumber}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* 悬停提示卡片 */}
          {hoveredIndex !== null && contents[hoveredIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-3 text-center max-w-xs"
            >
              <p className="text-amber-400 font-medium text-sm">第 {hoveredIndex + 1} 天</p>
              <p className="text-white font-bold">{contents[hoveredIndex].title}</p>
              {scoreMap.get(contents[hoveredIndex].id) !== undefined && (
                <p className="text-gray-400 text-xs mt-1">
                  得分: <span className={scoreMap.get(contents[hoveredIndex].id)! >= 60 ? 'text-green-400' : 'text-red-400'}>
                    {scoreMap.get(contents[hoveredIndex].id)} 分
                  </span>
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* 课程列表（移动端备用） */}
        <div className="mt-8 md:hidden">
          <h2 className="text-xl font-bold text-amber-400 mb-4">课程列表</h2>
          <div className="space-y-2">
            {contents.map((content, index) => {
              const isUnlocked = unlockMap.get(content.id) === true
              const isCompleted = completionMap.get(content.id) === true
              const score = scoreMap.get(content.id)
              const color = COURSE_COLORS[index]

              return (
                <Link
                  key={content.id}
                  href={isUnlocked ? `/courses/dawn_awakening/${content.id}` : '#'}
                  className={`block p-4 rounded-lg border transition-all ${
                    isUnlocked
                      ? 'bg-gray-900/50 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-gray-900/30 border-gray-800 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCompleted ? 'text-white' : isUnlocked ? 'text-white' : 'text-gray-500'
                        }`}
                        style={{
                          background: isUnlocked
                            ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                            : '#374151'
                        }}
                      >
                        {!isUnlocked ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        ) : isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div>
                        <p className="text-white font-medium">{content.title}</p>
                        <p className="text-gray-500 text-sm">第 {index + 1} 天</p>
                      </div>
                    </div>
                    {score !== undefined && (
                      <span className={`text-sm font-bold ${score >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {score}分
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* 用户资料弹窗 */}
      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
