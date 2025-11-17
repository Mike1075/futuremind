'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import consciousnessTreeAPI from '@/lib/api/consciousness-tree'

// ============================================================================
// 类型定义
// ============================================================================

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
  domainColor: number  // 领域颜色索引
  isRoot: boolean      // 是否是根
}

// 五个意识领域配置
const CONSCIOUSNESS_DOMAINS = {
  self_awareness: {
    name: '自我觉察',
    color: '#9B59B6',
  },
  life_sciences: {
    name: '生命科学',
    color: '#27AE60',
  },
  universal_laws: {
    name: '宇宙法则',
    color: '#3498DB',
  },
  creative_expression: {
    name: '创意表达',
    color: '#E74C3C',
  },
  social_connection: {
    name: '社会连接',
    color: '#F39C12',
  }
}

// ============================================================================
// 组件属性
// ============================================================================

interface DynamicConsciousnessTreeV3Props {
  levelProgress?: number
  consciousnessLevel?: number
  domainDepths?: Record<string, number>
  loadFromDatabase?: boolean
  className?: string
}

// ============================================================================
// 主组件
// ============================================================================

export function DynamicConsciousnessTreeV3({
  levelProgress: propLevelProgress,
  consciousnessLevel: propLevel,
  domainDepths: propDomainDepths,
  loadFromDatabase = false,
  className = ''
}: DynamicConsciousnessTreeV3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const branchesRef = useRef<Branch[]>([])
  const frameCountRef = useRef(0)

  // 状态
  const [levelProgress, setLevelProgress] = useState(propLevelProgress || 0)
  const [consciousnessLevel, setConsciousnessLevel] = useState(propLevel || 1)
  const [domainDepths, setDomainDepths] = useState<Record<string, number>>(
    propDomainDepths || {
      self_awareness: 0,
      life_sciences: 0,
      universal_laws: 0,
      creative_expression: 0,
      social_connection: 0
    }
  )
  const [loading, setLoading] = useState(loadFromDatabase)
  const [isGrowing, setIsGrowing] = useState(true)

  // 从数据库加载
  useEffect(() => {
    if (loadFromDatabase) {
      async function loadData() {
        setLoading(true)
        const result = await consciousnessTreeAPI.getTreeGrowthData()
        if (result.success && result.data) {
          setLevelProgress(result.data.levelProgress)
          setConsciousnessLevel(result.data.consciousnessLevel)
          setDomainDepths(result.data.domainDepths)
        }
        setLoading(false)
      }
      loadData()
    }
  }, [loadFromDatabase])

  // 当prop改变时更新
  useEffect(() => {
    if (propLevelProgress !== undefined) setLevelProgress(propLevelProgress)
  }, [propLevelProgress])

  useEffect(() => {
    if (propLevel !== undefined) setConsciousnessLevel(propLevel)
  }, [propLevel])

  useEffect(() => {
    if (propDomainDepths !== undefined) setDomainDepths(propDomainDepths)
  }, [propDomainDepths])

  // HSB to RGB转换
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

  // 绘制单个分支
  const drawBranch = useCallback((ctx: CanvasRenderingContext2D, branch: Branch) => {
    const { position, stw, domainColor } = branch

    // 根据领域设置颜色
    const domainKeys = Object.keys(CONSCIOUSNESS_DOMAINS)
    if (domainColor !== undefined && domainColor < domainKeys.length) {
      const domainKey = domainKeys[domainColor]
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

  // 更新分支状态 - 直接修改ref,不触发重渲染
  const updateBranches = useCallback(() => {
    const totalDepth = Object.values(domainDepths).reduce((a, b) => a + b, 0)

    // 计算最大代数限制
    let maxGen = 3
    if (levelProgress >= 40) maxGen = 4
    if (levelProgress >= 60) maxGen = 5
    if (levelProgress >= 80) maxGen = 6

    const branches = branchesRef.current
    const newBranches: Branch[] = []

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i]

      if (!branch.alive) continue

      // 更新位置
      branch.position.x += branch.speed.x
      branch.position.y += branch.speed.y

      // 添加自然摆动
      branch.angle += (Math.random() - 0.5) * 0.16

      // 根据是否是根来设置摆动幅度
      if (branch.isRoot) {
        branch.speed.x = Math.sin(branch.angle) * 0.5
        // 保持向下
        if (Math.abs(branch.speed.y) < 2) branch.speed.y = 3.2
      } else {
        branch.speed.x = Math.sin(branch.angle) * 0.4
        // 保持向上
        if (Math.abs(branch.speed.y) < 1.5) branch.speed.y = -2.5
      }

      // 年龄增长
      branch.age++
      if (branch.age > branch.maxlife) {
        branch.alive = false
        continue
      }

      // 生成新分支
      const shouldCreateBranch = Math.random() < branch.proba1 * (1 - branch.gen * 0.1)
      if (shouldCreateBranch && branch.gen < maxGen && totalDepth > 0) {
        // 随机选择一个有深度的领域
        const activeDomainsKeys = Object.keys(domainDepths).filter(
          key => domainDepths[key] > 0
        )

        if (activeDomainsKeys.length > 0) {
          const randomDomain = activeDomainsKeys[Math.floor(Math.random() * activeDomainsKeys.length)]
          const domainIndex = Object.keys(CONSCIOUSNESS_DOMAINS).indexOf(randomDomain)

          const childBranch: Branch = {
            position: { ...branch.position },
            stw: branch.stw * 0.7,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle + (Math.random() - 0.5) * 0.8,
            speed: { x: branch.speed.x * 0.9, y: branch.speed.y * 0.95 },
            maxlife: branch.maxlife * 0.8,
            proba1: branch.proba1 * 0.85,
            proba2: branch.proba2 * 0.85,
            proba3: branch.proba3 * 0.85,
            proba4: branch.proba4 * 0.85,
            domainColor: domainIndex,
            isRoot: branch.isRoot
          }

          // 确保子分支保持父分支的方向
          if (branch.isRoot && childBranch.speed.y < 2) {
            childBranch.speed.y = 3.0
          } else if (!branch.isRoot && childBranch.speed.y > -1.5) {
            childBranch.speed.y = -2.0
          }

          newBranches.push(childBranch)
        }
      }
    }

    // 添加新分支并移除死亡分支
    branchesRef.current = [...branches.filter(b => b.alive), ...newBranches]
  }, [domainDepths, levelProgress])

  // 主渲染循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80

    const animate = () => {
      // 不清除画布以产生累积效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制种子
      const [r, g, b] = hsbToRgb(0.08, 0.7, 0.8)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 12, 16, 0, 0, Math.PI * 2)
      ctx.fill()

      // 绘制所有分支
      branchesRef.current.forEach(branch => {
        drawBranch(ctx, branch)
      })

      // 更新分支状态
      if (isGrowing) {
        updateBranches()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isGrowing, drawBranch, updateBranches, hsbToRgb])

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 初始清空
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // 初始化分支
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80

    // 根据domainDepths生成初始分支
    const initialBranches: Branch[] = []
    const totalDepth = Object.values(domainDepths).reduce((a, b) => a + b, 0)

    if (totalDepth > 0) {
      Object.entries(domainDepths).forEach(([domain, depth]) => {
        if (depth === 0) return

        const domainIndex = Object.keys(CONSCIOUSNESS_DOMAINS).indexOf(domain)

        // 创建根系(向下)
        const rootCount = Math.min(Math.floor(depth / 8) + 1, 2)
        for (let i = 0; i < rootCount; i++) {
          initialBranches.push({
            position: { x: centerX + (Math.random() - 0.5) * 40, y: centerY },
            stw: 8,
            gen: 1,
            alive: true,
            age: 0,
            angle: Math.random() * Math.PI * 2,
            speed: { x: 0, y: 3.2 },
            maxlife: Math.random() * 150 + 50,
            proba1: 0.014,
            proba2: 0.08,
            proba3: 0.09,
            proba4: 0.18,
            domainColor: domainIndex,
            isRoot: true
          })
        }

        // 创建向上分支(树干和枝叶) - 只要有一定深度就创建
        if (depth >= 2) {
          const upwardCount = Math.min(Math.floor(depth / 5) + 1, 3)
          for (let i = 0; i < upwardCount; i++) {
            initialBranches.push({
              position: { x: centerX + (Math.random() - 0.5) * 25, y: centerY },
              stw: 6,
              gen: 1,
              alive: true,
              age: 0,
              angle: Math.random() * Math.PI * 2,
              speed: { x: 0, y: -2.5 },
              maxlife: Math.random() * 120 + 60,
              proba1: 0.016,
              proba2: 0.09,
              proba3: 0.1,
              proba4: 0.2,
              domainColor: domainIndex,
              isRoot: false
            })
          }
        }
      })
    }

    branchesRef.current = initialBranches
  }, [domainDepths, levelProgress])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* 控制按钮 */}
      <button
        onClick={() => setIsGrowing(!isGrowing)}
        className="absolute top-4 right-4 px-3 py-1.5 bg-green-600/80 hover:bg-green-700 text-white rounded text-xs transition-colors"
      >
        {isGrowing ? '暂停' : '继续'}
      </button>

      {/* 调试信息 */}
      <div className="absolute top-4 left-4 bg-black/70 text-white text-xs p-2 rounded space-y-1">
        <div>进度: {levelProgress}%</div>
        <div>总深度: {Object.values(domainDepths).reduce((a, b) => a + b, 0)}</div>
      </div>
    </div>
  )
}
