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

// 曲线路径节点位置（百分比）- 完整耳朵轮廓（包含内部凹陷）
// 参考真实耳朵形状，形成更自然的轮廓
const PATH_POINTS = [
  { x: 38, y: 18 },   // Day 1 - 耳朵顶部起点
  { x: 50, y: 12 },   // Day 2 - 外耳轮顶端（最高点）
  { x: 64, y: 14 },   // Day 3 - 开始向外弯曲
  { x: 76, y: 20 },   // Day 4 - 外耳轮向外扩展
  { x: 84, y: 32 },   // Day 5 - 外耳轮中上部（最外侧点）
  { x: 86, y: 48 },   // Day 6 - 外耳轮中部
  { x: 82, y: 62 },   // Day 7 - 外耳轮中下部，开始向内收
  { x: 74, y: 72 },   // Day 8 - 向耳垂过渡
  { x: 62, y: 80 },   // Day 9 - 耳垂上部
  { x: 48, y: 86 },   // Day 10 - 耳垂中部（最低点）
  { x: 36, y: 84 },   // Day 11 - 耳垂内侧底部
  { x: 28, y: 76 },   // Day 12 - 开始向内勾（耳甲腔入口）
  { x: 24, y: 62 },   // Day 13 - 耳窝内部凹陷（向左内勾）
  { x: 26, y: 48 },   // Day 14 - 耳窝顶部回勾（形成内耳轮，向回勾）
]

export function ListeningCourseView({ courseSystem, contents, completionMap, scoreMap }: ListeningCourseViewProps) {
  // 生成SVG曲线路径
  const generatePath = () => {
    if (PATH_POINTS.length < 2) return ''

    let path = `M ${PATH_POINTS[0].x} ${PATH_POINTS[0].y}`

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const current = PATH_POINTS[i]
      const next = PATH_POINTS[i + 1]

      // 使用贝塞尔曲线创建平滑路径
      const controlX1 = current.x + (next.x - current.x) * 0.5
      const controlY1 = current.y
      const controlX2 = current.x + (next.x - current.x) * 0.5
      const controlY2 = next.y

      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`
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

        {/* 曲线路径地图 */}
        <div className="relative">
          {/* SVG路径 */}
          <svg
            className="w-full h-auto"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{ minHeight: '800px' }}
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
              const isCompleted = completionMap.get(content.id) === true
              const isUnlocked = index === 0 || completionMap.get(contents[index - 1]?.id) === true
              const point = PATH_POINTS[index]
              const color = COURSE_COLORS[index]

              // 如果前面的节点已完成，绘制到当前节点的路径
              if (index > 0 && completionMap.get(contents[index - 1]?.id)) {
                const prevPoint = PATH_POINTS[index - 1]
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
                      d={`M ${prevPoint.x} ${prevPoint.y} C ${prevPoint.x + (point.x - prevPoint.x) * 0.5} ${prevPoint.y}, ${prevPoint.x + (point.x - prevPoint.x) * 0.5} ${point.y}, ${point.x} ${point.y}`}
                      fill="none"
                      stroke={`url(#grad-${index})`}
                      strokeWidth="0.5"
                      className="animate-pulse"
                    />
                  </g>
                )
              }
              return null
            })}
          </svg>

          {/* 节点 */}
          <div className="absolute inset-0">
            {contents.map((content, index) => {
              const isCompleted = completionMap.get(content.id) === true
              const isUnlocked = index === 0 || completionMap.get(contents[index - 1]?.id) === true
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

                        {/* 主节点 */}
                        <div
                          className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl transition-all"
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${color.from}, ${color.to})`
                              : `linear-gradient(135deg, ${color.from}AA, ${color.to}AA)`,
                            border: isPassed
                              ? '4px solid rgba(255,255,255,0.5)'
                              : isCompleted
                                ? '4px solid rgba(255,255,255,0.3)'
                                : '4px solid rgba(255,255,255,0.1)',
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
                      {/* 未解锁节点 */}
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #374151, #1F2937)',
                          border: '3px solid rgba(75, 85, 99, 0.3)',
                          filter: 'grayscale(100%)',
                        }}
                      >
                        <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>

                      {/* 未解锁提示 */}
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded px-2 py-1 text-xs text-gray-500">
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
