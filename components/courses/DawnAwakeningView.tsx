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

// 23天课程的色彩配置（从深夜到破晓的渐变）
const COURSE_COLORS = [
  { from: '#1a1a2e', to: '#16213e', name: '深夜' },      // Day 1
  { from: '#1f2937', to: '#1e3a5f', name: '夜幕' },      // Day 2
  { from: '#2d3748', to: '#2c5282', name: '拂晓前' },    // Day 3
  { from: '#3d4f7c', to: '#3b5998', name: '晨星' },      // Day 4
  { from: '#4a5568', to: '#4c6085', name: '朦胧' },      // Day 5
  { from: '#553c9a', to: '#6b46c1', name: '紫曦' },      // Day 6
  { from: '#5b21b6', to: '#7c3aed', name: '幽蓝' },      // Day 7
  { from: '#6366f1', to: '#818cf8', name: '蓝调' },      // Day 8
  { from: '#7c3aed', to: '#a78bfa', name: '淡紫' },      // Day 9
  { from: '#8b5cf6', to: '#a855f7', name: '薰衣草' },    // Day 10
  { from: '#ec4899', to: '#f472b6', name: '粉霞' },      // Day 11
  { from: '#db2777', to: '#f43f5e', name: '玫瑰' },      // Day 12
  { from: '#e11d48', to: '#f97316', name: '绯红' },      // Day 13
  { from: '#ea580c', to: '#f97316', name: '橙霞' },      // Day 14
  { from: '#f59e0b', to: '#fbbf24', name: '金橙' },      // Day 15
  { from: '#eab308', to: '#facc15', name: '明黄' },      // Day 16
  { from: '#fcd34d', to: '#fde047', name: '柠檬' },      // Day 17
  { from: '#fef08a', to: '#fef9c3', name: '暖阳' },      // Day 18
  { from: '#fef3c7', to: '#fffbeb', name: '晨光' },      // Day 19
  { from: '#fef9c3', to: '#ffffff', name: '金辉' },      // Day 20
  { from: '#fde68a', to: '#fcd34d', name: '璀璨' },      // Day 21
  { from: '#fbbf24', to: '#f59e0b', name: '灿烂' },      // Day 22
  { from: '#f97316', to: '#ea580c', name: '重生' },      // Day 23 - 凤凰重生
]

// 计算23个光芒的位置（从太阳中心向外辐射）
const calculateRayPositions = () => {
  const centerX = 50
  const centerY = 55  // 稍微偏下，给太阳主体留空间
  const innerRadius = 15  // 内圈半径
  const outerRadius = 42  // 外圈半径
  const startAngle = -180  // 从左边开始（日出从地平线升起）
  const endAngle = 0       // 到右边结束
  const totalAngle = endAngle - startAngle

  const positions = []
  for (let i = 0; i < 23; i++) {
    const angle = startAngle + (totalAngle / 22) * i
    const radian = (angle * Math.PI) / 180

    // 计算光芒的起点（靠近中心）和终点（外围）
    const innerX = centerX + innerRadius * Math.cos(radian)
    const innerY = centerY + innerRadius * Math.sin(radian)
    const outerX = centerX + outerRadius * Math.cos(radian)
    const outerY = centerY + outerRadius * Math.sin(radian)

    // 节点位置在光芒末端
    positions.push({
      x: outerX,
      y: outerY,
      innerX,
      innerY,
      angle
    })
  }
  return positions
}

const RAY_POSITIONS = calculateRayPositions()

export function DawnAwakeningView({ courseSystem, contents, completionMap, scoreMap }: DawnAwakeningViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

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
      {/* 宇宙背景渐变 - 日出主题 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#2a1a4a] pointer-events-none" />

      {/* 地平线光晕效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/30 via-orange-800/10 to-transparent pointer-events-none" />

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

        {/* 日出可视化地图 */}
        <div className="relative mx-auto" style={{
          width: 'min(100%, calc(100vh - 280px))',
          maxWidth: '700px',
          aspectRatio: '1 / 1'
        }}>
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 定义渐变 */}
            <defs>
              {/* 太阳中心渐变 */}
              <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>

              {/* 光晕效果 */}
              <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>

              {/* 每条光芒的渐变 */}
              {COURSE_COLORS.map((color, i) => (
                <linearGradient key={`rayGrad-${i}`} id={`rayGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color.from} />
                  <stop offset="100%" stopColor={color.to} />
                </linearGradient>
              ))}
            </defs>

            {/* 地平线 */}
            <line x1="5" y1="75" x2="95" y2="75" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="0.3" />

            {/* 山脉剪影 */}
            <path
              d="M5 75 L15 68 L25 72 L35 65 L45 70 L55 62 L65 68 L75 64 L85 70 L95 75"
              fill="none"
              stroke="rgba(251, 191, 36, 0.2)"
              strokeWidth="0.5"
            />
            <path
              d="M5 75 L15 68 L25 72 L35 65 L45 70 L55 62 L65 68 L75 64 L85 70 L95 75 L95 100 L5 100 Z"
              fill="rgba(10, 10, 26, 0.8)"
            />

            {/* 太阳光晕 */}
            <circle cx="50" cy="55" r="25" fill="url(#glowGradient)" />

            {/* 光芒射线和节点 */}
            {contents.map((content, index) => {
              const pos = RAY_POSITIONS[index]
              if (!pos) return null

              const isUnlocked = unlockMap.get(content.id) === true
              const isCompleted = completionMap.get(content.id) === true
              const score = scoreMap.get(content.id) || 0
              const color = COURSE_COLORS[index] || COURSE_COLORS[0]
              const isHovered = hoveredDay === index

              return (
                <g key={content.id}>
                  {/* 光芒射线 */}
                  <line
                    x1={pos.innerX}
                    y1={pos.innerY}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={isUnlocked ? color.to : 'rgba(75, 85, 99, 0.3)'}
                    strokeWidth={isUnlocked ? (isHovered ? 1.5 : 0.8) : 0.4}
                    strokeLinecap="round"
                    style={{
                      filter: isUnlocked && isCompleted ? `drop-shadow(0 0 3px ${color.to})` : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />

                  {/* 节点 */}
                  <Link href={isUnlocked ? `/courses/dawn_awakening/${content.id}` : '#'}>
                    <g
                      onMouseEnter={() => setHoveredDay(index)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{ cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
                    >
                      {/* 节点光晕 */}
                      {isUnlocked && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isHovered ? 4 : 3}
                          fill={color.to}
                          opacity={0.3}
                          animate={{
                            r: isHovered ? [4, 5, 4] : [3, 3.5, 3],
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}

                      {/* 节点主体 */}
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 2.5 : 2}
                        fill={isUnlocked ? (isCompleted ? color.to : color.from) : '#374151'}
                        stroke={isUnlocked ? color.to : '#4b5563'}
                        strokeWidth={0.3}
                        whileHover={isUnlocked ? { scale: 1.3 } : {}}
                        style={{
                          filter: isCompleted ? `drop-shadow(0 0 4px ${color.to})` : 'none'
                        }}
                      />

                      {/* 锁定图标 */}
                      {!isUnlocked && (
                        <text
                          x={pos.x}
                          y={pos.y + 0.5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#9ca3af"
                          fontSize="2"
                        >
                          🔒
                        </text>
                      )}

                      {/* 完成标记 */}
                      {isCompleted && (
                        <text
                          x={pos.x}
                          y={pos.y + 0.5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize="1.5"
                          fontWeight="bold"
                        >
                          ✓
                        </text>
                      )}

                      {/* 天数标签 */}
                      <text
                        x={pos.x}
                        y={pos.y - 4}
                        textAnchor="middle"
                        fill={isUnlocked ? color.to : '#6b7280'}
                        fontSize="2"
                        fontWeight="500"
                        opacity={isHovered ? 1 : 0.7}
                      >
                        {index + 1}
                      </text>
                    </g>
                  </Link>
                </g>
              )
            })}

            {/* 太阳中心 */}
            <circle cx="50" cy="55" r="12" fill="url(#sunGradient)" />
            <circle cx="50" cy="55" r="10" fill="#fef3c7" opacity="0.8" />

            {/* 太阳中心文字 */}
            <text x="50" y="53" textAnchor="middle" fill="#92400e" fontSize="2.5" fontWeight="bold">破晓</text>
            <text x="50" y="57" textAnchor="middle" fill="#92400e" fontSize="2.5" fontWeight="bold">觉醒</text>
          </svg>

          {/* 悬停提示 */}
          {hoveredDay !== null && contents[hoveredDay] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-amber-500/30 rounded-lg px-4 py-3 text-center max-w-xs"
            >
              <p className="text-amber-400 font-medium text-sm">第 {hoveredDay + 1} 天</p>
              <p className="text-white font-bold">{contents[hoveredDay].title}</p>
              {scoreMap.get(contents[hoveredDay].id) !== undefined && (
                <p className="text-gray-400 text-xs mt-1">
                  得分: {scoreMap.get(contents[hoveredDay].id)} 分
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
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCompleted ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {isUnlocked ? (isCompleted ? '✓' : index + 1) : '🔒'}
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
