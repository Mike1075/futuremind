'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'

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
const PATH_POINTS = [
  { x: 30, y: 25 },   // Day 1 - 左上起点
  { x: 42, y: 15 },   // Day 2 - 向上弯曲
  { x: 56, y: 10 },   // Day 3 - 外耳轮顶部（最高点）
  { x: 70, y: 15 },   // Day 4 - 开始向右外侧
  { x: 80, y: 25 },   // Day 5 - 外耳轮右上部
  { x: 85, y: 40 },   // Day 6 - 外耳轮右中部（最右点）
  { x: 84, y: 55 },   // Day 7 - 外耳轮右下部
  { x: 78, y: 68 },   // Day 8 - 开始向耳垂过渡
  { x: 68, y: 78 },   // Day 9 - 耳垂右侧
  { x: 54, y: 85 },   // Day 10 - 耳垂底部（最低点）
  { x: 40, y: 82 },   // Day 11 - 耳垂左侧
  { x: 32, y: 72 },   // Day 12 - 耳垂向上，准备向右内勾
  { x: 40, y: 56 },   // Day 13 - 向右内勾（耳洞深处，x从32增加到40）
  { x: 45, y: 38 },   // Day 14 - 耳洞上部，继续向右上形成内凹轮廓
]

export function ListeningCourseView({ courseSystem, contents, completionMap, scoreMap }: ListeningCourseViewProps) {
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

  // 计算进度
  const completedCount = Array.from(completionMap.values()).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / contents.length) * 100)

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => {
          const randomColors = () => {
            const colors = ['#FFFFFF', '#E0E7FF', '#DBEAFE', '#FCE7F3', '#FEF3C7', '#D1FAE5']
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
                opacity: [Math.random() * 0.3 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.3 + 0.2],
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
        {/* 彩色星星 - 颜色随机变化 */}
        {[...Array(20)].map((_, i) => {
          const randomCourseColor = () => {
            return COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)].from
          }

          return (
            <motion.div
              key={`color-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.8, 1],
                background: [randomCourseColor(), randomCourseColor(), randomCourseColor()],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
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

              const isCompleted = completionMap.get(content.id) === true
              const prevCompleted = completionMap.get(contents[index - 1]?.id) === true
              // 🔥 修复：路径显示也要检查前一个课程的分数>=60
              const prevScore = scoreMap.get(contents[index - 1]?.id) || 0
              const isUnlocked = prevScore >= 60
              const point = PATH_POINTS[index]
              const prevPoint = PATH_POINTS[index - 1]
              const color = COURSE_COLORS[index]
              const prevColor = COURSE_COLORS[index - 1]

              // 只要前一个节点得分>=60（当前节点自动解锁），就绘制实线路径
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
              // 🔥 修复：解锁条件改为前一个课程的分数>=60
              const prevScore = index > 0 ? (scoreMap.get(contents[index - 1]?.id) || 0) : 0
              const isUnlocked = index === 0 || prevScore >= 60
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
                  }}
                  className="group"
                >
                  {isUnlocked ? (
                    <Link href={`/courses/listening/${content.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer"
                      >
                        {/* 旋转彩色圆环（仅及格节点） */}
                        {isPassed && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(from 0deg, ${color.from}, ${color.to}, ${COURSE_COLORS[(index + 1) % COURSE_COLORS.length].from}, ${color.from})`,
                              transform: 'scale(1.3)',
                              filter: 'blur(2px)',
                            }}
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}

                        {/* 光晕效果 */}
                        <div
                          className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                            transform: 'scale(1.5)',
                          }}
                        />

                        {/* 主节点 - 响应式大小 */}
                        <div
                          className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-white shadow-2xl transition-all"
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                              : `linear-gradient(135deg, ${color.from}AA, ${color.to}AA)`,
                            border: isPassed
                              ? '3px solid rgba(255,255,255,0.5)'
                              : isCompleted
                                ? '3px solid rgba(255,255,255,0.3)'
                                : '3px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {/* 始终显示数字 */}
                          <span>{dayNumber}</span>
                        </div>

                        {/* 标题 */}
                        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                            {content.title}
                            {isPassed && <span className="ml-2 text-green-400">✓ {score}分</span>}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ) : (
                    <div className="relative">
                      {/* 未解锁节点 - 响应式大小 */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl font-bold text-gray-600 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #374151, #1F2937)',
                          border: '2px solid rgba(75, 85, 99, 0.3)',
                          filter: 'grayscale(100%)',
                        }}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>

                      {/* 未解锁提示 - 响应式 */}
                      <div className="absolute top-full mt-1 sm:mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-gray-500">
                          🔒 未解锁
                        </div>
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
    </div>
  )
}
