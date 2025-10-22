'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import consciousnessTreeAPI from '@/lib/api/consciousness-tree'

interface Vector2D {
  x: number
  y: number
}

interface Branch {
  position: Vector2D
  stw: number          // 粗细
  gen: number          // 代数
  alive: boolean       // 是否存活
  age: number          // 年龄
  angle: number        // 角度
  speed: Vector2D      // 速度向量
  maxlife: number      // 最大生命
  proba1: number       // 分支概率1
  proba2: number       // 分支概率2
  proba3: number       // 分支概率3
  proba4: number       // 分支概率4
  domainColor?: number // 领域颜色索引
}

interface EmotionRing {
  radius: number
  color: string
  emotion: string
  thickness: number
}

interface TrunkState {
  thickness: number
  emotionRings: EmotionRing[]
  dominantEmotion: string
  meditationCount: number
}

// 五个意识领域配置（对应数据库的五个领域）
const CONSCIOUSNESS_DOMAINS = {
  self_awareness: {
    name: '自我觉知',
    color: '#FF6B6B',
    angle: -90,
    description: '对内在世界的觉察与理解'
  },
  life_sciences: {
    name: '生命科学',
    color: '#4ECDC4',
    angle: -45,
    description: '对生命本质的探索与理解'
  },
  universal_laws: {
    name: '宇宙法则',
    color: '#45B7D1',
    angle: 0,
    description: '对宇宙运行规律的认知'
  },
  creative_expression: {
    name: '创意表达',
    color: '#96CEB4',
    angle: 45,
    description: '创造力与艺术表达的发展'
  },
  social_connection: {
    name: '社交连接',
    color: '#FECA57',
    angle: 90,
    description: '与他人和社会的连接能力'
  }
}

export default function ConsciousnessTreeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [isGrowing, setIsGrowing] = useState(false)
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 0, y: 0 })
  const [domainScores, setDomainScores] = useState<Record<string, number>>({
    self_awareness: 0,
    life_sciences: 0,
    universal_laws: 0,
    creative_expression: 0,
    social_connection: 0
  })

  // 根分支系统
  const [branches, setBranches] = useState<Branch[]>([])

  // 树干状态
  const [trunkState, setTrunkState] = useState<TrunkState>({
    thickness: 20,
    emotionRings: [],
    dominantEmotion: 'peaceful',
    meditationCount: 0
  })

  // 域点击深度计数器
  const [domainDepths, setDomainDepths] = useState<Record<string, number>>({
    self_awareness: 0,
    life_sciences: 0,
    universal_laws: 0,
    creative_expression: 0,
    social_connection: 0
  })

  // 获取用户的意识领域数据
  const loadConsciousnessData = useCallback(async () => {
    try {
      const result = await consciousnessTreeAPI.getDomainExploration()
      if (result.success && result.data) {
        const scores: Record<string, number> = {}
        Object.entries(result.data.domain_scores).forEach(([domain, data]) => {
          scores[domain] = (data as { depth_score: number }).depth_score
        })
        setDomainScores(scores)
      }
    } catch (error) {
      console.error('加载意识领域数据失败:', error)
    }
  }, [])

  // HSB 转 RGB 颜色转换
  const hsbToRgb = useCallback((h: number, s: number, b: number) => {
    const c = b * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = b - c

    let r = 0, g = 0, blue = 0

    if (h >= 0 && h < 1/6) {
      r = c; g = x; blue = 0
    } else if (h >= 1/6 && h < 2/6) {
      r = x; g = c; blue = 0
    } else if (h >= 2/6 && h < 3/6) {
      r = 0; g = c; blue = x
    } else if (h >= 3/6 && h < 4/6) {
      r = 0; g = x; blue = c
    } else if (h >= 4/6 && h < 5/6) {
      r = x; g = 0; blue = c
    } else {
      r = c; g = 0; blue = x
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((blue + m) * 255)
    ]
  }, [])

  // 创建根分支
  const createRootBranch = useCallback((startX: number, startY: number, domain?: string): Branch => {
    const domainKeys = Object.keys(CONSCIOUSNESS_DOMAINS)
    const randomDomain = domain || domainKeys[Math.floor(Math.random() * domainKeys.length)]
    const domainIndex = domainKeys.indexOf(randomDomain)

    return {
      position: { x: startX, y: startY },
      stw: 8,
      gen: 1,
      alive: true,
      age: 0,
      angle: Math.random() * Math.PI * 2,
      speed: { x: 0, y: 3.2 }, // 向下生长
      maxlife: Math.random() * 150 + 50,
      proba1: 0.014,
      proba2: 0.08,
      proba3: 0.09,
      proba4: 0.18,
      domainColor: domainIndex
    }
  }, [])

  // 绘制分支
  const drawBranch = useCallback((ctx: CanvasRenderingContext2D, branch: Branch) => {
    const { position, stw, domainColor } = branch

    // 根据领域设置颜色
    if (domainColor !== undefined) {
      const domainKey = Object.keys(CONSCIOUSNESS_DOMAINS)[domainColor]
      const domain = CONSCIOUSNESS_DOMAINS[domainKey as keyof typeof CONSCIOUSNESS_DOMAINS]
      ctx.fillStyle = domain?.color || '#8B4513'
    } else {
      // 默认根色
      const [r, g, b] = hsbToRgb(0.08, 0.7, 0.8)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    }

    ctx.beginPath()
    ctx.arc(position.x, position.y, stw / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [hsbToRgb])

  // 绘制树干
  const drawTrunk = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    const { thickness, emotionRings } = trunkState

    // 绘制主干
    ctx.fillStyle = '#8B4513' // 棕色树干
    ctx.fillRect(centerX - thickness / 2, centerY, thickness, -200)

    // 绘制年轮（如果有冥想记录）
    emotionRings.forEach((ring, index) => {
      ctx.fillStyle = ring.color
      ctx.beginPath()
      ctx.ellipse(centerX, centerY - 50 - index * 10, ring.radius, ring.thickness, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [trunkState])

  // 更新分支状态
  const updateBranches = useCallback(() => {
    setBranches(prevBranches => {
      const newBranches = [...prevBranches]

      for (let i = 0; i < newBranches.length; i++) {
        const branch = newBranches[i]

        if (!branch.alive) continue

        // 更新位置
        branch.position.x += branch.speed.x
        branch.position.y += branch.speed.y

        // 添加自然摆动
        branch.angle += (Math.random() - 0.5) * 0.16
        branch.speed.x = Math.sin(branch.angle) * 0.5

        // 年龄增长和衰老
        branch.age++
        if (branch.age > branch.maxlife) {
          branch.alive = false
          continue
        }

        // 生成新分支（基于数据库的领域深度）
        const shouldCreateBranch = Math.random() < branch.proba1 * (1 - branch.gen * 0.1)
        if (shouldCreateBranch && branch.gen < 5) {
          // 选择生长最活跃的领域
          const activeDomain = Object.entries(domainScores).reduce((a, b) =>
            domainScores[a[0]] > domainScores[b[0]] ? a : b
          )[0]

          const domainIndex = Object.keys(CONSCIOUSNESS_DOMAINS).indexOf(activeDomain)

          newBranches.push({
            position: { ...branch.position },
            stw: branch.stw * 0.7,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle + (Math.random() - 0.5) * 0.8,
            speed: { x: branch.speed.x, y: branch.speed.y },
            maxlife: branch.maxlife * 0.8,
            proba1: branch.proba1 * 0.85,
            proba2: branch.proba2 * 0.85,
            proba3: branch.proba3 * 0.85,
            proba4: branch.proba4 * 0.85,
            domainColor: domainIndex
          })
        }
      }

      return newBranches.filter(branch => branch.alive)
    })
  }, [domainScores])

  // 主渲染循环
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 50

    // 不清除画布以产生累积效果，但添加轻微的衰减
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制树干
    drawTrunk(ctx, centerX, centerY)

    // 绘制所有分支
    branches.forEach(branch => {
      drawBranch(ctx, branch)
    })

    // 更新分支状态
    if (isGrowing) {
      updateBranches()
    }
  }, [branches, isGrowing, drawTrunk, drawBranch, updateBranches])

  // 动画循环
  useEffect(() => {
    const animate = () => {
      render()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // 加载意识数据
  useEffect(() => {
    loadConsciousnessData()
  }, [loadConsciousnessData])

  // 处理领域生长
  const handleDomainGrowth = useCallback((domainKey: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 50

    // 根据领域角度创建分支
    const domain = CONSCIOUSNESS_DOMAINS[domainKey as keyof typeof CONSCIOUSNESS_DOMAINS]
    const angle = (domain.angle * Math.PI) / 180

    const startX = centerX + Math.cos(angle) * 50
    const startY = centerY + Math.sin(angle) * 50

    const newBranch = createRootBranch(startX, startY, domainKey)
    setBranches(prev => [...prev, newBranch])

    // 更新深度计数
    setDomainDepths(prev => ({
      ...prev,
      [domainKey]: prev[domainKey] + 1
    }))
  }, [createRootBranch])

  // 处理树干冥想生长
  const handleTrunkMeditation = useCallback(() => {
    const emotions = ['peaceful', 'joyful', 'focused', 'grateful', 'energetic']
    const colors = ['#E8F5E8', '#FFF2CC', '#E1F5FE', '#F3E5F5', '#FFEBEE']

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    setTrunkState(prev => ({
      ...prev,
      thickness: prev.thickness + 0.5,
      meditationCount: prev.meditationCount + 1,
      emotionRings: [
        ...prev.emotionRings,
        {
          radius: 15 + prev.emotionRings.length * 2,
          color: randomColor,
          emotion: randomEmotion,
          thickness: 3
        }
      ].slice(-10) // 只保留最近10个年轮
    }))
  }, [])

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [])

  return (
    <div className="w-full h-screen relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 bg-black cursor-crosshair"
        onMouseMove={handleMouseMove}
      />

      {/* 控制面板 */}
      <div className="absolute top-6 right-6 space-y-3 z-10">
        <button
          onClick={() => setIsGrowing(!isGrowing)}
          className="block w-40 px-4 py-2 bg-white/90 hover:bg-white text-black rounded-lg font-medium transition-colors"
        >
          {isGrowing ? '暂停生长' : '开始生长'}
        </button>

        <div className="space-y-2">
          <h3 className="text-white text-sm font-medium">意识领域</h3>
          {Object.entries(CONSCIOUSNESS_DOMAINS).map(([key, domain]) => (
            <button
              key={key}
              onClick={() => handleDomainGrowth(key)}
              onMouseEnter={() => setHoveredDomain(key)}
              onMouseLeave={() => setHoveredDomain(null)}
              className="block w-40 px-3 py-2 text-sm bg-white/80 hover:bg-white text-black rounded transition-colors"
              style={{ borderLeft: `4px solid ${domain.color}` }}
            >
              {domain.name} ({domainScores[key] || 0})
            </button>
          ))}
        </div>

        <button
          onClick={handleTrunkMeditation}
          className="block w-40 px-4 py-2 bg-green-500/90 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
        >
          冥想记录 ({trunkState.meditationCount})
        </button>
      </div>

      {/* 工具提示 */}
      {hoveredDomain && (
        <div
          className="absolute pointer-events-none bg-black/80 text-white p-3 rounded-lg text-sm max-w-xs z-20"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 50
          }}
        >
          <div className="font-medium" style={{ color: CONSCIOUSNESS_DOMAINS[hoveredDomain as keyof typeof CONSCIOUSNESS_DOMAINS].color }}>
            {CONSCIOUSNESS_DOMAINS[hoveredDomain as keyof typeof CONSCIOUSNESS_DOMAINS].name}
          </div>
          <div className="text-gray-300 mt-1">
            {CONSCIOUSNESS_DOMAINS[hoveredDomain as keyof typeof CONSCIOUSNESS_DOMAINS].description}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            深度分数: {domainScores[hoveredDomain] || 0}
          </div>
        </div>
      )}
    </div>
  )
}