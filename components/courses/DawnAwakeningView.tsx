// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
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
  { from: '#1e1b4b', to: '#312e81', glow: '#4338ca' },      // Day 1 - 深邃靛蓝
  { from: '#1e3a5f', to: '#1e40af', glow: '#3b82f6' },      // Day 2 - 夜幕蓝
  { from: '#1e3a8a', to: '#2563eb', glow: '#60a5fa' },      // Day 3 - 拂晓蓝
  { from: '#3730a3', to: '#4f46e5', glow: '#818cf8' },      // Day 4 - 晨星紫
  { from: '#4c1d95', to: '#6d28d9', glow: '#a78bfa' },      // Day 5 - 紫罗兰
  { from: '#5b21b6', to: '#7c3aed', glow: '#a78bfa' },      // Day 6 - 紫曦
  { from: '#6d28d9', to: '#8b5cf6', glow: '#c4b5fd' },      // Day 7 - 幽紫
  { from: '#7c3aed', to: '#a855f7', glow: '#d8b4fe' },      // Day 8 - 淡紫
  { from: '#9333ea', to: '#c026d3', glow: '#e879f9' },      // Day 9 - 霞紫
  { from: '#a21caf', to: '#db2777', glow: '#f472b6' },      // Day 10 - 玫红
  { from: '#be185d', to: '#e11d48', glow: '#fb7185' },      // Day 11 - 绯红
  { from: '#be123c', to: '#f43f5e', glow: '#fda4af' },      // Day 12 - 玫瑰
  { from: '#dc2626', to: '#f97316', glow: '#fdba74' },      // Day 13 - 橙红
  { from: '#ea580c', to: '#f97316', glow: '#fdba74' },      // Day 14 - 橙霞
  { from: '#d97706', to: '#f59e0b', glow: '#fcd34d' },      // Day 15 - 金橙
  { from: '#ca8a04', to: '#eab308', glow: '#fde047' },      // Day 16 - 明黄
  { from: '#a16207', to: '#facc15', glow: '#fef08a' },      // Day 17 - 柠黄
  { from: '#ca8a04', to: '#fbbf24', glow: '#fef3c7' },      // Day 18 - 暖阳
  { from: '#d97706', to: '#fcd34d', glow: '#fef9c3' },      // Day 19 - 晨光
  { from: '#f59e0b', to: '#fde047', glow: '#fffbeb' },      // Day 20 - 金辉
  { from: '#fbbf24', to: '#fef08a', glow: '#ffffff' },      // Day 21 - 璀璨
  { from: '#f59e0b', to: '#fcd34d', glow: '#fef9c3' },      // Day 22 - 灿烂
  { from: '#ea580c', to: '#f97316', glow: '#fdba74' },      // Day 23 - 凤凰重生
]

// 计算23个光芒的位置（半圆弧形排列）
const calculateRayPositions = () => {
  const centerX = 50
  const centerY = 58
  const radius = 38
  const startAngle = -165
  const endAngle = -15
  const totalAngle = endAngle - startAngle

  const positions = []
  for (let i = 0; i < 23; i++) {
    const angle = startAngle + (totalAngle / 22) * i
    const radian = (angle * Math.PI) / 180
    const x = centerX + radius * Math.cos(radian)
    const y = centerY + radius * Math.sin(radian)

    positions.push({ x, y, angle })
  }
  return positions
}

const RAY_POSITIONS = calculateRayPositions()

// 星星组件
function Stars() {
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

  useEffect(() => {
    const newStars = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 3
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export function DawnAwakeningView({ courseSystem, contents, completionMap, scoreMap }: DawnAwakeningViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

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
      {/* 宇宙背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a1f] via-[#1a1035] to-[#2d1f4a] pointer-events-none" />

      {/* 星星背景 */}
      <Stars />

      {/* 地平线光晕效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-amber-600/20 via-orange-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-rose-500/15 via-transparent to-transparent pointer-events-none" />

      {/* 统一导航栏 */}
      <UnifiedNavbar
        transparent
        onOpenProfile={() => setShowProfileModal(true)}
        rightButton={{
          label: '返回学习中心',
          href: '/portal'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* 课程头部 */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent drop-shadow-lg"
          >
            {courseSystem.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 mb-6 max-w-2xl mx-auto text-sm md:text-base"
          >
            {courseSystem.description}
          </motion.p>

          {/* 进度显示 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md border border-amber-500/20 rounded-full px-6 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              </div>
              <span className="text-white font-semibold">{completedCount} / {contents.length}</span>
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="text-amber-300 font-bold text-lg">{progressPercentage}%</div>
          </motion.div>
        </div>

        {/* 日出可视化地图 */}
        <div className="relative mx-auto" style={{
          width: 'min(100%, calc(100vh - 300px))',
          maxWidth: '650px',
          aspectRatio: '1 / 0.85'
        }}>
          <svg
            className="w-full h-full"
            viewBox="0 0 100 85"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 定义渐变和滤镜 */}
            <defs>
              {/* 太阳主体渐变 */}
              <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fefce8" />
                <stop offset="40%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>

              {/* 太阳光晕渐变 */}
              <radialGradient id="sunGlow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="sunGlow2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
              </radialGradient>

              {/* 发光滤镜 */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 地平线装饰 */}
            <line x1="5" y1="72" x2="95" y2="72" stroke="url(#sunGlow1)" strokeWidth="0.5" opacity="0.5" />

            {/* 山脉剪影 */}
            <path
              d="M0 72 L10 67 L18 70 L28 63 L38 68 L50 58 L62 65 L72 62 L82 67 L90 64 L100 72 L100 85 L0 85 Z"
              fill="rgba(15, 10, 31, 0.95)"
            />
            <path
              d="M0 72 L10 67 L18 70 L28 63 L38 68 L50 58 L62 65 L72 62 L82 67 L90 64 L100 72"
              fill="none"
              stroke="rgba(251, 191, 36, 0.3)"
              strokeWidth="0.3"
            />

            {/* 太阳外层光晕 - 脉动动画 */}
            <motion.circle
              cx="50"
              cy="58"
              r="22"
              fill="url(#sunGlow1)"
              animate={{
                r: [22, 24, 22],
                opacity: [0.6, 0.8, 0.6]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* 太阳中层光晕 */}
            <motion.circle
              cx="50"
              cy="58"
              r="16"
              fill="url(#sunGlow2)"
              animate={{
                r: [16, 17, 16],
                opacity: [0.7, 0.9, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* 节点和数字 */}
            {contents.map((content, index) => {
              const pos = RAY_POSITIONS[index]
              if (!pos) return null

              const isUnlocked = unlockMap.get(content.id) === true
              const isCompleted = completionMap.get(content.id) === true
              const color = COURSE_COLORS[index] || COURSE_COLORS[0]
              const isHovered = hoveredDay === index

              const nodeRadius = isHovered ? 4 : 3.2
              const numberY = pos.y - 6

              return (
                <g key={content.id}>
                  {/* 连接线 - 从太阳到节点 */}
                  <line
                    x1="50"
                    y1="58"
                    x2={pos.x}
                    y2={pos.y}
                    stroke={isUnlocked ? color.to : 'rgba(100, 100, 120, 0.2)'}
                    strokeWidth={isUnlocked ? (isHovered ? 1.2 : 0.6) : 0.3}
                    strokeLinecap="round"
                    opacity={isUnlocked ? (isHovered ? 1 : 0.6) : 0.3}
                    style={{
                      filter: isUnlocked && isCompleted ? 'url(#glow)' : 'none',
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
                      {/* 节点外发光 */}
                      {isUnlocked && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeRadius + 2}
                          fill={color.glow}
                          opacity={0.3}
                          animate={{
                            r: [nodeRadius + 2, nodeRadius + 3, nodeRadius + 2],
                            opacity: [0.2, 0.4, 0.2]
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
                        r={nodeRadius}
                        fill={isUnlocked
                          ? (isCompleted
                            ? `url(#nodeGrad-${index})`
                            : color.from)
                          : '#374151'}
                        stroke={isUnlocked ? color.to : '#4b5563'}
                        strokeWidth={isHovered ? 0.8 : 0.4}
                        whileHover={isUnlocked ? { scale: 1.2 } : {}}
                        style={{
                          filter: isCompleted ? 'url(#strongGlow)' : (isUnlocked ? 'url(#glow)' : 'none'),
                          transition: 'all 0.2s ease'
                        }}
                      />

                      {/* 锁定图标 - SVG */}
                      {!isUnlocked && (
                        <g transform={`translate(${pos.x - 1.5}, ${pos.y - 1.5})`}>
                          <rect x="0.3" y="1.2" width="2.4" height="1.6" rx="0.2" fill="#6b7280" />
                          <path d="M0.8 1.2 V0.8 A0.7 0.7 0 0 1 2.2 0.8 V1.2" fill="none" stroke="#6b7280" strokeWidth="0.35" />
                        </g>
                      )}

                      {/* 完成标记 */}
                      {isCompleted && (
                        <g transform={`translate(${pos.x - 1.2}, ${pos.y - 1.2})`}>
                          <path
                            d="M0.3 1.2 L1 1.9 L2.1 0.5"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      )}

                      {/* 天数数字 - 更大更清晰 */}
                      <text
                        x={pos.x}
                        y={numberY}
                        textAnchor="middle"
                        fill={isUnlocked ? (isHovered ? '#ffffff' : color.to) : '#6b7280'}
                        fontSize={isHovered ? "3.5" : "3"}
                        fontWeight="600"
                        style={{
                          transition: 'all 0.2s ease',
                          textShadow: isUnlocked ? '0 0 4px rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        {index + 1}
                      </text>
                    </g>
                  </Link>

                  {/* 每个节点的渐变定义 */}
                  <defs>
                    <linearGradient id={`nodeGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={color.from} />
                      <stop offset="100%" stopColor={color.to} />
                    </linearGradient>
                  </defs>
                </g>
              )
            })}

            {/* 太阳核心 */}
            <circle cx="50" cy="58" r="10" fill="url(#sunCore)" filter="url(#glow)" />

            {/* 太阳中心高光 */}
            <circle cx="48" cy="56" r="3" fill="rgba(255,255,255,0.4)" />

            {/* 太阳中心文字 */}
            <text x="50" y="56.5" textAnchor="middle" fill="#92400e" fontSize="2.8" fontWeight="bold" opacity="0.9">破晓</text>
            <text x="50" y="60" textAnchor="middle" fill="#92400e" fontSize="2.8" fontWeight="bold" opacity="0.9">觉醒</text>
          </svg>

          {/* 悬停提示卡片 - 毛玻璃效果 */}
          {hoveredDay !== null && contents[hoveredDay] && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-amber-400/30 rounded-xl px-5 py-3 text-center shadow-xl shadow-amber-500/10"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(249,115,22,0.05) 100%)',
              }}
            >
              <p className="text-amber-300 font-medium text-sm mb-0.5">
                第 {hoveredDay + 1} 天
              </p>
              <p className="text-white font-bold text-base">{contents[hoveredDay].title}</p>
              {scoreMap.get(contents[hoveredDay].id) !== undefined && (
                <p className="text-gray-400 text-xs mt-1">
                  得分: <span className={scoreMap.get(contents[hoveredDay].id)! >= 60 ? 'text-green-400' : 'text-red-400'}>
                    {scoreMap.get(contents[hoveredDay].id)} 分
                  </span>
                </p>
              )}
              {!unlockMap.get(contents[hoveredDay].id) && (
                <p className="text-gray-500 text-xs mt-1 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  完成前一天解锁
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* 课程列表（移动端备用） */}
        <div className="mt-6 md:hidden">
          <h2 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            课程列表
          </h2>
          <div className="space-y-2">
            {contents.map((content, index) => {
              const isUnlocked = unlockMap.get(content.id) === true
              const isCompleted = completionMap.get(content.id) === true
              const score = scoreMap.get(content.id)
              const color = COURSE_COLORS[index] || COURSE_COLORS[0]

              return (
                <Link
                  key={content.id}
                  href={isUnlocked ? `/courses/dawn_awakening/${content.id}` : '#'}
                  className={`block p-4 rounded-xl border backdrop-blur-sm transition-all ${
                    isUnlocked
                      ? 'bg-white/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-white/10'
                      : 'bg-white/[0.02] border-gray-800/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                          isCompleted
                            ? 'text-white border-transparent'
                            : isUnlocked
                            ? 'bg-white/10 text-white border-white/20'
                            : 'bg-gray-800 text-gray-500 border-gray-700'
                        }`}
                        style={{
                          background: isCompleted ? `linear-gradient(135deg, ${color.from}, ${color.to})` : undefined
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
                        <p className="text-white font-medium text-sm">{content.title}</p>
                        <p className="text-gray-500 text-xs">第 {index + 1} 天</p>
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
