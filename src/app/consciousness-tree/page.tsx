'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

interface TreeNode {
  id: string
  name: string
  description: string
  level: number
  x: number
  y: number
  unlocked: boolean
  completed: boolean
  progress: number
  children: string[]
  parent?: string
  category: 'foundation' | 'awareness' | 'integration' | 'transcendence' | 'mastery'
}

const treeData: TreeNode[] = [
  {
    id: 'root',
    name: '意识觉醒起点',
    description: '开始你的意识进化之旅',
    level: 0,
    x: 400,
    y: 500,
    unlocked: true,
    completed: true,
    progress: 100,
    children: ['self-awareness', 'mindfulness'],
    category: 'foundation'
  },
  {
    id: 'self-awareness',
    name: '自我觉察',
    description: '认识真实的自己，观察内在的思维模式',
    level: 1,
    x: 300,
    y: 400,
    unlocked: true,
    completed: true,
    progress: 100,
    children: ['emotional-intelligence', 'thought-observation'],
    parent: 'root',
    category: 'foundation'
  },
  {
    id: 'mindfulness',
    name: '正念觉知',
    description: '培养当下的觉知力，观察而不评判',
    level: 1,
    x: 500,
    y: 400,
    unlocked: true,
    completed: false,
    progress: 60,
    children: ['meditation', 'breath-awareness'],
    parent: 'root',
    category: 'foundation'
  },
  {
    id: 'emotional-intelligence',
    name: '情绪智慧',
    description: '理解和管理情绪，培养情感觉知',
    level: 2,
    x: 250,
    y: 300,
    unlocked: true,
    completed: false,
    progress: 40,
    children: ['empathy', 'emotional-regulation'],
    parent: 'self-awareness',
    category: 'awareness'
  },
  {
    id: 'thought-observation',
    name: '思维观察',
    description: '观察思维的运作模式，不被思维所困',
    level: 2,
    x: 350,
    y: 300,
    unlocked: true,
    completed: false,
    progress: 30,
    children: ['meta-cognition'],
    parent: 'self-awareness',
    category: 'awareness'
  },
  {
    id: 'meditation',
    name: '冥想修习',
    description: '通过冥想深化内在觉知',
    level: 2,
    x: 450,
    y: 300,
    unlocked: true,
    completed: false,
    progress: 50,
    children: ['deep-meditation'],
    parent: 'mindfulness',
    category: 'awareness'
  }
]

// 模拟数据
const mockCourses = [
  {
    id: 'course-1',
    title: '声音的奥秘',
    description: '探索声音与意识的深层连接，理解声音如何影响我们的内在状态',
    icon: '🎵',
    level: '初级',
    duration: '4周'
  },
  {
    id: 'course-2', 
    title: '寂静的智慧',
    description: '在寂静中发现内在的声音，学会倾听内心的智慧',
    icon: '🤫',
    level: '中级',
    duration: '6周'
  },
  {
    id: 'course-3',
    title: '实相的本质',
    description: '探索现实的真实面貌，超越表象看到本质',
    icon: '🔍',
    level: '高级',
    duration: '8周'
  },
  {
    id: 'course-4',
    title: '意识的层次',
    description: '了解意识的不同层次和状态',
    icon: '🧠',
    level: '中级',
    duration: '5周'
  }
]

const mockGroups = [
  {
    id: 'group-1',
    name: '声音探索者',
    description: '一起探索声音与意识的奥秘，分享声音体验',
    icon: '🎧',
    members: 12,
    activity: '活跃'
  },
  {
    id: 'group-2',
    name: '冥想修行者',
    description: '共同深化冥想体验，互相支持修行路径',
    icon: '🧘',
    members: 8,
    activity: '中等'
  },
  {
    id: 'group-3',
    name: '哲学思辨社',
    description: '探讨意识与实相的哲学问题，深度思辨',
    icon: '💭',
    members: 15,
    activity: '活跃'
  },
  {
    id: 'group-4',
    name: '实践应用组',
    description: '将意识觉知应用到日常生活中',
    icon: '🌱',
    members: 10,
    activity: '中等'
  }
]

const mockProjects = [
  {
    id: 'project-1',
    title: '无形的纽带',
    description: '量子纠缠与意识连接实验，探索意识间的神秘联系',
    icon: '🔗',
    status: '进行中',
    difficulty: '高级'
  },
  {
    id: 'project-2',
    title: '声音疗愈研究',
    description: '探索声音对意识状态的影响，开发声音疗愈方法',
    icon: '🎼',
    status: '筹备中',
    difficulty: '中级'
  },
  {
    id: 'project-3',
    title: '集体意识实验',
    description: '研究群体冥想对集体意识的影响',
    icon: '🌐',
    status: '规划中',
    difficulty: '高级'
  },
  {
    id: 'project-4',
    title: '意识测量工具',
    description: '开发测量意识状态的科学工具',
    icon: '📊',
    status: '进行中',
    difficulty: '中级'
  }
]

const categoryColors = {
  foundation: '#10B981',
  awareness: '#3B82F6', 
  integration: '#8B5CF6',
  transcendence: '#F59E0B',
  mastery: '#EF4444'
}

export default function ConsciousnessTreePage() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showDetails, setShowDetails] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNodeClick = (node: TreeNode) => {
    if (node.unlocked) {
      setSelectedNode(node)
      setShowDetails(true)
    }
  }

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.3, Math.min(2, prev + delta)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* 背景粒子效果 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* 头部导航 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            ← 返回主页
          </button>
          <h1 className="text-white font-bold text-lg">意识进化中心</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleZoom(0.1)}
              className="text-white/80 hover:text-white transition-colors px-2 py-1 bg-white/10 rounded"
            >
              +
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="text-white/80 hover:text-white transition-colors px-2 py-1 bg-white/10 rounded"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 左右分栏布局 */}
      <div className="absolute inset-0 pt-20 flex">
        {/* 左侧：进化树 (1/3) */}
        <div className="w-1/3 h-full flex items-center justify-center p-4">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'center center'
            }}
          >
            {/* 树容器 */}
            <div className="relative w-80 h-80 bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              {/* 土壤基础 */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-800 to-amber-700"></div>

              {/* 真实树结构 SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYEnd"
              >
                {/* 树根 */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 2 }}
                >
                  <path
                    d="M200,380 C180,375 160,370 140,365 M200,380 C220,375 240,370 260,365 M200,380 C200,375 195,370 185,365 M200,380 C205,375 210,370 215,365"
                    stroke="#8B4513"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.6"
                  />
                </motion.g>

                {/* 主干 */}
                <motion.path
                  d={`M200,380 L200,${380 - (treeData.filter(n => n.unlocked).length * 25)}`}
                  stroke="#8B4513"
                  strokeWidth={Math.max(4, treeData.filter(n => n.unlocked).length * 2)}
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeOut" }}
                />

                {/* 动态树枝 */}
                {treeData.filter(n => n.unlocked && n.level > 0).map((node, i) => {
                  const branchHeight = 380 - (node.level * 50)
                  const branchDirection = i % 2 === 0 ? -1 : 1
                  const branchLength = 30 + (node.level * 10)
                  const branchAngle = 15 + (i * 8)

                  return (
                    <motion.g key={`branch-${node.id}`}>
                      <motion.path
                        d={`M200,${branchHeight} L${200 + branchDirection * branchLength},${branchHeight - branchAngle}`}
                        stroke="#654321"
                        strokeWidth={Math.max(2, 6 - node.level)}
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 + i * 0.3 }}
                      />
                    </motion.g>
                  )
                })}

                {/* 交互节点 */}
                {treeData.filter(n => n.unlocked).map((node, i) => {
                  const nodeX = 180 + (i % 2 === 0 ? -20 : 20) + Math.random() * 20
                  const nodeY = 380 - (node.level * 50) - 15

                  return (
                    <motion.g
                      key={`node-${node.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNodeClick(node)}
                    >
                      <motion.circle
                        cx={nodeX}
                        cy={nodeY}
                        r="8"
                        fill={categoryColors[node.category]}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 3.5 + i * 0.2 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                      <motion.circle
                        cx={nodeX}
                        cy={nodeY}
                        r="4"
                        fill="white"
                        opacity={node.completed ? 1 : 0.3}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 3.7 + i * 0.2 }}
                      />
                      {node.completed && (
                        <motion.text
                          x={nodeX}
                          y={nodeY + 3}
                          textAnchor="middle"
                          fill="#22C55E"
                          fontSize="8"
                          fontWeight="bold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 4 + i * 0.2 }}
                        >
                          ✓
                        </motion.text>
                      )}
                    </motion.g>
                  )
                })}
              </svg>

              {/* 树的信息显示 */}
              <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3 text-white">
                <div className="text-sm font-semibold mb-1">
                  意识之树 ({treeData.filter(n => n.unlocked).length}/{treeData.length})
                </div>
                <div className="text-xs text-gray-300">
                  已解锁 {treeData.filter(n => n.completed).length} 个节点
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：内容卡片 (2/3) */}
        <div className="w-2/3 h-full overflow-y-auto p-6">
          <div className="space-y-8">
            {/* 课程部分 */}
            <section>
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                📚 课程
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockCourses.map(course => (
                  <div
                    key={course.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <div className="text-xl mb-2">{course.icon}</div>
                    <h3 className="text-white font-bold text-base mb-2 group-hover:text-blue-300 transition-colors">{course.title}</h3>
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">{course.level}</span>
                      <span className="text-white/60">{course.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 小组部分 */}
            <section>
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                👥 小组
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockGroups.map(group => (
                  <div
                    key={group.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <div className="text-xl mb-2">{group.icon}</div>
                    <h3 className="text-white font-bold text-base mb-2 group-hover:text-green-300 transition-colors">{group.name}</h3>
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">{group.members} 成员</span>
                      <span className="text-white/60">{group.activity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 项目部分 */}
            <section>
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                🚀 项目
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockProjects.map(project => (
                  <div
                    key={project.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="text-xl mb-2">{project.icon}</div>
                    <h3 className="text-white font-bold text-base mb-2 group-hover:text-purple-300 transition-colors">{project.title}</h3>
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">{project.status}</span>
                      <span className="text-white/60">{project.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 节点详情弹窗 */}
      <AnimatePresence>
        {showDetails && selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: categoryColors[selectedNode.category] }}
                />
                <h2 className="text-white text-xl font-bold">{selectedNode.name}</h2>
              </div>

              <p className="text-gray-300 mb-4">{selectedNode.description}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>学习进度</span>
                  <span>{selectedNode.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: categoryColors[selectedNode.category] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedNode.progress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  关闭
                </button>
                {selectedNode.unlocked && (
                  <button
                    onClick={() => {
                      setShowDetails(false)
                    }}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    开始学习
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动端手势提示 */}
      {isMobile && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-3 text-center">
          <p className="text-white/80 text-sm">
            点击节点查看详情 • 双指缩放查看全貌
          </p>
        </div>
      )}
    </div>
  )
}