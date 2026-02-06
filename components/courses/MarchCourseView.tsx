// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

interface MarchCourseViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
  bypassScoreCheck?: boolean  // 管理员特权：跳过分数限制
}

// 9天课程的色彩配置（9种渐变）
const COURSE_COLORS = [
  { from: '#FF6B6B', to: '#FF8E53', name: '温暖红橙' },      // Day 1
  { from: '#FFB347', to: '#FFCC70', name: '阳光橙黄' },      // Day 2
  { from: '#9CCC65', to: '#66BB6A', name: '自然绿' },        // Day 3
  { from: '#26C6DA', to: '#4DD0E1', name: '清澈青' },        // Day 4
  { from: '#5C6BC0', to: '#7E57C2', name: '靛蓝紫' },        // Day 5
  { from: '#AB47BC', to: '#BA68C8', name: '神秘紫' },        // Day 6
  { from: '#EC407A', to: '#F06292', name: '温柔粉' },        // Day 7
  { from: '#78909C', to: '#90A4AE', name: '沉静灰蓝' },      // Day 8
  { from: '#FFD54F', to: '#FFF176', name: '金色光明' },      // Day 9
]

export function MarchCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: MarchCourseViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  // 预先计算解锁状态映射
  // 解锁条件：1. 第一天永远解锁 2. 后续天需前一天分数>=60
  const unlockMap = useMemo(() => {
    const map = new Map<string, boolean>()

    contents.forEach((content, index) => {
      // 管理员直接解锁所有课程
      if (bypassScoreCheck) {
        map.set(content.id, true)
        return
      }

      if (index === 0) {
        // 第一天永远解锁
        map.set(content.id, true)
      } else {
        // 后续天需要：前一天分数>=60
        const prevContent = contents[index - 1]
        const prevUnlocked = map.get(prevContent.id) === true
        const prevScore = scoreMap.get(prevContent.id) || 0
        map.set(content.id, prevUnlocked && prevScore >= 60)
      }
    })

    return map
  }, [contents, scoreMap, bypassScoreCheck])

  // 计算进度
  const completedCount = Array.from(completionMap.values()).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / contents.length) * 100)

  // 获取悬停内容
  const hoveredContent = hoveredDay !== null && contents[hoveredDay] ? contents[hoveredDay] : null

  return (
    <div className="min-h-screen text-starlight relative overflow-hidden">
      {/* 宇宙背景渐变 */}
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

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* 课程头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-rose-300 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {courseSystem.title}
          </h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">{courseSystem.description}</p>

          {/* 进度显示 */}
          <div className="inline-flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-semibold">{completedCount} / {contents.length}</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="text-purple-400 font-bold">{progressPercentage}%</div>
          </div>
        </div>

        {/* 九宫格 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">克里希那穆提 · 三月</h2>
            <p className="text-gray-400 text-sm mt-1">依赖 · 执著 · 关系 · 恐惧</p>
          </div>

          {/* 3x3 网格 */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {contents.slice(0, 9).map((content, index) => {
              const color = COURSE_COLORS[index] || COURSE_COLORS[0]
              const isUnlocked = unlockMap.get(content.id) === true
              const isCompleted = completionMap.get(content.id) === true
              const score = scoreMap.get(content.id) || 0
              const isPassed = score >= 60

              return (
                <motion.div
                  key={content.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: 'spring' }}
                  className="aspect-square relative"
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {isUnlocked ? (
                    <Link
                      href={`/courses/dependency_freedom/${content.id}`}
                      className="block w-full h-full"
                    >
                      <motion.div
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group"
                        style={{
                          background: isCompleted
                            ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                            : `linear-gradient(135deg, ${color.from}60, ${color.to}60)`,
                          border: isPassed
                            ? '3px solid rgba(255,255,255,0.6)'
                            : '2px solid rgba(255,255,255,0.2)',
                          boxShadow: isCompleted ? `0 0 30px ${color.from}50` : 'none',
                        }}
                      >
                        {/* 光晕效果 - 悬停时显示 */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `radial-gradient(circle at center, ${color.to}50, transparent 70%)`,
                          }}
                        />

                        {/* 天数 */}
                        <span className="text-3xl font-bold text-white relative z-10 drop-shadow-lg">
                          {index + 1}
                        </span>

                        {/* 完成标记 */}
                        {isCompleted && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* 分数标记 */}
                        {score > 0 && (
                          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${
                            isPassed ? 'bg-white/30 text-white' : 'bg-black/30 text-white/80'
                          }`}>
                            {score}分
                          </div>
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    // 未解锁的格子
                    <div
                      className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-gray-800/40 border border-gray-700/40"
                    >
                      {/* 天数（暗淡） */}
                      <span className="text-2xl font-bold text-gray-600">
                        {index + 1}
                      </span>

                      {/* 锁定图标 */}
                      <svg className="w-4 h-4 text-gray-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* 悬停详情 - 固定高度容器防止页面闪动 */}
          <div className="mt-6 h-[72px]">
            {hoveredContent ? (
              <div className="p-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">
                      第{hoveredDay! + 1}天
                    </p>
                    <p className="text-white font-bold mt-1">{hoveredContent.title}</p>
                  </div>
                  {scoreMap.get(hoveredContent.id) !== undefined && (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      scoreMap.get(hoveredContent.id)! >= 60
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {scoreMap.get(hoveredContent.id)} 分
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-transparent rounded-xl">
                <p className="text-gray-500 text-sm text-center">悬停格子查看详情</p>
              </div>
            )}
          </div>
        </div>

        {/* 图例说明 */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-purple-400 border-2 border-white/50"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500/60 to-purple-400/60 border border-white/20"></div>
            <span>可进入</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-800/40 border border-gray-700/40 flex items-center justify-center">
              <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span>需完成前一天</span>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>完成每天的课程并获得60分以上，解锁下一天的内容</p>
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
