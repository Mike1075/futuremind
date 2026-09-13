// @ts-nocheck
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { UnifiedNavbar } from '@/components/common/UnifiedNavbar'
import UserProfileModal from '@/components/UserProfileModal'

interface ListeningCourseViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>  // 新增：存储每个课程的得分
}

// 14天课程的色彩配置（基于七脉轮+彩虹色谱）
const COURSE_COLORS = [
  { from: '#FF0000', to: '#FF4444', name: '红' },      // Day 1 - 红色（海底轮）
  { from: '#FF5722', to: '#FF7043', name: '橙红' },   // Day 2 - 橙红
  { from: '#FF9800', to: '#FFB74D', name: '橙' },      // Day 3 - 橙色（脐轮）
  { from: '#FFC107', to: '#FFD54F', name: '金橙' },   // Day 4 - 金橙
  { from: '#FFEB3B', to: '#FFF176', name: '黄' },      // Day 5 - 黄色（太阳轮）
  { from: '#8BC34A', to: '#AED581', name: '黄绿' },   // Day 6 - 黄绿
  { from: '#4CAF50', to: '#81C784', name: '绿' },      // Day 7 - 绿色（心轮）
  { from: '#00BCD4', to: '#4DD0E1', name: '青' },      // Day 8 - 青色
  { from: '#2196F3', to: '#64B5F6', name: '蓝' },      // Day 9 - 蓝色（喉轮）
  { from: '#3F51B5', to: '#7986CB', name: '深蓝' },   // Day 10 - 深蓝（眉心轮）
  { from: '#673AB7', to: '#9575CD', name: '靛' },      // Day 11 - 靛色
  { from: '#9C27B0', to: '#BA68C8', name: '紫' },      // Day 12 - 紫色（顶轮）
  { from: '#E91E63', to: '#F06292', name: '品红' },   // Day 13 - 品红
  { from: '#FF69B4', to: '#FFB6D9', name: '粉' },      // Day 14 - 粉色（回归爱）
]

// 曲线路径节点位置（百分比）- 根据手绘参考图设计的耳朵轮廓
// 完整的耳朵形状：外耳轮 + 耳垂 + 内耳凹陷（耳洞 - 向右内勾）
// 扩大路径使节点穿过耳朵轮廓线
const PATH_POINTS = [
  { x: 25, y: 28 },   // Day 1 - 左上起点（向外扩展）
  { x: 38, y: 12 },   // Day 2 - 向上弯曲（更高更外）
  { x: 54, y: 5 },    // Day 3 - 外耳轮顶部（最高点，更高）
  { x: 72, y: 10 },   // Day 4 - 开始向右外侧（更外）
  { x: 85, y: 22 },   // Day 5 - 外耳轮右上部（更外）
  { x: 92, y: 40 },   // Day 6 - 外耳轮右中部（最右点，更外）
  { x: 90, y: 58 },   // Day 7 - 外耳轮右下部（更外）
  { x: 82, y: 72 },   // Day 8 - 开始向耳垂过渡（更外）
  { x: 70, y: 82 },   // Day 9 - 耳垂右侧（更外）
  { x: 54, y: 90 },   // Day 10 - 耳垂底部（最低点，更低）
  { x: 38, y: 86 },   // Day 11 - 耳垂左侧（更外）
  { x: 28, y: 74 },   // Day 12 - 耳垂向上，准备向右内勾（更外）
  { x: 40, y: 58 },   // Day 13 - 向右内勾
  { x: 56, y: 46 },   // Day 14 - 耳洞内部，向右上延伸
]

export function ListeningCourseView({ courseSystem, contents, completionMap, scoreMap }: ListeningCourseViewProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 生成SVG曲线路径（使用Catmull-Rom样条算法，确保所有转弯都是平滑曲线）
  const generatePath = () => {
    if (PATH_POINTS.length < 2) return ''

    let path = `M ${PATH_POINTS[0].x} ${PATH_POINTS[0].y}`

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p0 = i > 0 ? PATH_POINTS[i - 1] : PATH_POINTS[i]
      const p1 = PATH_POINTS[i]
      const p2 = PATH_POINTS[i + 1]
      const p3 = i < PATH_POINTS.length - 2 ? PATH_POINTS[i + 2] : PATH_POINTS[i + 1]

      // Catmull-Rom转贝塞尔曲线控制点（张力系数0.5，更平滑）
      // 第一个控制点：从p1出发，沿着p0->p2的切线方向
      const controlX1 = p1.x + (p2.x - p0.x) / 6
      const controlY1 = p1.y + (p2.y - p0.y) / 6

      // 第二个控制点：到达p2前，沿着p1->p3的切线方向
      const controlX2 = p2.x - (p3.x - p1.x) / 6
      const controlY2 = p2.y - (p3.y - p1.y) / 6

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${p2.x} ${p2.y}`
    }

    return path
  }

  // 🔒 预先计算解锁状态映射（链式检查：必须前面所有课程都>=60分）
  const unlockMap = new Map<string, boolean>()
  contents.forEach((content, index) => {
    if (index === 0) {
      // 第一天永远解锁
      unlockMap.set(content.id, true)
    } else {
      // 检查前一天是否解锁 AND 前一天分数>=60
      const prevContent = contents[index - 1]
      const prevUnlocked = unlockMap.get(prevContent.id) === true
      const prevScore = scoreMap.get(prevContent.id) || 0
      // 链式解锁：前一天必须已解锁且>=60分
      unlockMap.set(content.id, prevUnlocked && prevScore >= 60)
    }
  })

  // 计算进度
  const completedCount = Array.from(completionMap.values()).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / contents.length) * 100)

  return (
    <div className="min-h-screen text-starlight relative overflow-hidden">
      {/* 宇宙背景渐变 - 半透明以显示星空 */}
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            {courseSystem.title}
          </h1>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">{courseSystem.description}</p>

          {/* 进度显示 */}
          <div className="inline-flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-semibold">{completedCount} / {contents.length}</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="text-purple-400 font-bold">{progressPercentage}%</div>
          </div>
        </div>

        {/* 曲线路径地图 - 自适应屏幕大小，保持宽高比 */}
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

            {/* 已完成路径（渐变色） */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>

            {contents.map((content, index) => {
              if (index === 0) return null // 第一个节点前面没有路径

              // 使用预计算的解锁状态
              const isUnlocked = unlockMap.get(content.id) === true
              const point = PATH_POINTS[index]
              const prevPoint = PATH_POINTS[index - 1]
              const color = COURSE_COLORS[index]
              const prevColor = COURSE_COLORS[index - 1]

              // 只有当前节点解锁时才绘制实线路径
              if (!isUnlocked) return null

              return (
                <g key={`path-${index}`}>
                  <defs>
                    <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={prevColor.to} />
                      <stop offset="100%" stopColor={color.from} />
                    </linearGradient>
                  </defs>
                  {/* 实线路径 - 使用Catmull-Rom算法确保平滑曲线 */}
                  <path
                    d={(() => {
                      // 计算Catmull-Rom控制点
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
              // 使用预计算的解锁状态（链式检查）
              const isUnlocked = unlockMap.get(content.id) === true
              const score = scoreMap.get(content.id) || 0
              const isPassed = score >= 60  // 及格标准
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
                    // 限制容器大小，防止悬停范围过大
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  {isUnlocked ? (
                    <Link href={`/courses/listening/${content.id}`} className="block">
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

                        {/* 标题 - 提高z-index确保显示在最前 */}
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
                      {/* 未解锁节点 - 锁图标已足够说明状态 */}
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
          <p>💡 依次完成每天的课程，解锁全新的聆听之旅</p>
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
