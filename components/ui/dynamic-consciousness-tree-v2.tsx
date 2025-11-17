'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import consciousnessTreeAPI from '@/lib/api/consciousness-tree'
import type { DomainScores } from '@/lib/api/consciousness-tree'

// ============================================================================
// 类型定义（完全基于旧代码）
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
  domainColor: string  // 领域颜色
  isRoot: boolean      // 是否是根
}

interface Tree {
  branches: Branch[]
}

// 五个意识领域配置
const CONSCIOUSNESS_DOMAINS = {
  self_awareness: {
    name: '自我觉察',
    color: '#9B59B6',
    hue: 0.8,
  },
  life_sciences: {
    name: '生命科学',
    color: '#27AE60',
    hue: 0.33,
  },
  universal_laws: {
    name: '宇宙法则',
    color: '#3498DB',
    hue: 0.6,
  },
  creative_expression: {
    name: '创意表达',
    color: '#E74C3C',
    hue: 0.0,
  },
  social_connection: {
    name: '社会连接',
    color: '#F39C12',
    hue: 0.12,
  }
}

// ============================================================================
// 双重控制系统
// ============================================================================

function getGrowthLimits(
  levelProgress: number,
  domainDepths: Record<string, number>
) {
  const totalDepth = Object.values(domainDepths).reduce((a, b) => a + b, 0)

  // 根据levelProgress确定上限
  let maxRootGen = 1
  let maxUpwardGen = 0
  let allowUpward = false
  let allowFruits = false

  if (levelProgress >= 20) {
    maxRootGen = 2
  }
  if (levelProgress >= 40) {
    maxRootGen = 3
    maxUpwardGen = 1
    allowUpward = totalDepth >= 8
  }
  if (levelProgress >= 60) {
    maxRootGen = 4
    maxUpwardGen = 2
    allowUpward = true
  }
  if (levelProgress >= 80) {
    maxRootGen = 5
    maxUpwardGen = 4
    allowUpward = true
    allowFruits = totalDepth >= 35
  }

  return {
    maxRootGen,
    maxUpwardGen,
    allowUpward,
    allowFruits,
    totalDepth
  }
}

// ============================================================================
// 组件属性
// ============================================================================

interface DynamicConsciousnessTreeV2Props {
  levelProgress?: number
  consciousnessLevel?: number
  domainDepths?: Record<string, number>
  loadFromDatabase?: boolean
  className?: string
}

// ============================================================================
// 主组件
// ============================================================================

export function DynamicConsciousnessTreeV2({
  levelProgress: propLevelProgress,
  consciousnessLevel: propLevel,
  domainDepths: propDomainDepths,
  loadFromDatabase = false,
  className = ''
}: DynamicConsciousnessTreeV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const treeRef = useRef<Tree>({ branches: [] })

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

  // 计算生长限制
  const growthLimits = useMemo(
    () => getGrowthLimits(levelProgress, domainDepths),
    [levelProgress, domainDepths]
  )

  // HSB to RGB转换（从旧代码复制）
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
  const createRootBranch = useCallback((
    centerX: number,
    centerY: number,
    domain: string,
    angleOffset: number
  ): Branch => {
    const domainConfig = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS]
    const baseAngle = Math.random() * Math.PI * 2

    return {
      position: { x: centerX + (Math.random() - 0.5) * 30, y: centerY },
      stw: 8,
      gen: 1,
      alive: true,
      age: 0,
      angle: baseAngle,
      speed: {
        x: 0,
        y: 3.2  // 向下生长
      },
      maxlife: Math.random() * 150 + 50,
      proba1: 0.014,
      proba2: 0.08,
      proba3: 0.09,
      proba4: 0.18,
      domainColor: domainConfig.color,
      isRoot: true
    }
  }, [])

  // 创建向上分支
  const createUpwardBranch = useCallback((
    centerX: number,
    startY: number,
    domain: string,
    angleOffset: number
  ): Branch => {
    const domainConfig = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS]
    const baseAngle = Math.random() * Math.PI * 2

    return {
      position: { x: centerX + (Math.random() - 0.5) * 40, y: startY },
      stw: 6,
      gen: 1,
      alive: true,
      age: 0,
      angle: baseAngle,
      speed: {
        x: 0,
        y: -2  // 向上生长
      },
      maxlife: Math.random() * 120 + 60,
      proba1: 0.012,
      proba2: 0.07,
      proba3: 0.08,
      proba4: 0.15,
      domainColor: domainConfig.color,
      isRoot: false
    }
  }, [])

  // 分支生长逻辑（从旧代码改编）
  const growBranch = useCallback((branch: Branch, tree: Tree) => {
    if (!branch.alive) return

    branch.age++

    // 根据是否是根来调整生长行为
    if (branch.isRoot) {
      // 根向下生长，逐渐变细
      branch.stw *= 0.985

      // 添加自然摆动
      branch.angle += (Math.random() - 0.5) * 0.16

      // 根据角度更新速度，产生摆动效果
      branch.speed.x = Math.sin(branch.angle) * 0.5
      branch.speed.y = 3.2  // 保持向下生长
    } else {
      // 向上分支
      branch.stw *= 0.99

      // 添加自然摆动
      branch.angle += (Math.random() - 0.5) * 0.12

      // 根据角度更新速度
      branch.speed.x = Math.sin(branch.angle) * 0.3
      branch.speed.y = -2  // 保持向上生长
    }

    // 更新位置
    branch.position.x += branch.speed.x
    branch.position.y += branch.speed.y

    // 检查是否该死亡
    if (branch.age >= Math.floor(branch.maxlife / branch.gen)) {
      branch.alive = false

      // 尝试生成子分支
      if (branch.stw > 0.4 && branch.gen < growthLimits.maxRootGen && branch.isRoot) {
        // 根分支
        if (Math.random() < branch.proba1) {
          tree.branches.push({
            ...branch,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle - (Math.random() * 0.5 + 0.2),
            stw: branch.stw * 0.7,
            maxlife: branch.maxlife * 0.8,
            proba1: branch.proba1 * 0.85
          })
        }
        if (Math.random() < branch.proba2) {
          tree.branches.push({
            ...branch,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle + (Math.random() * 0.5 + 0.2),
            stw: branch.stw * 0.7,
            maxlife: branch.maxlife * 0.8,
            proba2: branch.proba2 * 0.85
          })
        }
      } else if (branch.stw > 0.4 && branch.gen < growthLimits.maxUpwardGen && !branch.isRoot) {
        // 向上分支
        if (Math.random() < branch.proba3) {
          tree.branches.push({
            ...branch,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle - (Math.random() * 0.4 + 0.15),
            stw: branch.stw * 0.75,
            maxlife: branch.maxlife * 0.85,
            proba3: branch.proba3 * 0.9
          })
        }
        if (Math.random() < branch.proba4) {
          tree.branches.push({
            ...branch,
            gen: branch.gen + 1,
            alive: true,
            age: 0,
            angle: branch.angle + (Math.random() * 0.4 + 0.15),
            stw: branch.stw * 0.75,
            maxlife: branch.maxlife * 0.85,
            proba4: branch.proba4 * 0.9
          })
        }
      }
    }
  }, [growthLimits])

  // 初始化树
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80

    // 重置树
    treeRef.current = { branches: [] }

    // 根据domainDepths生成初始根系
    Object.entries(domainDepths).forEach(([domain, depth]) => {
      if (depth === 0) return

      const rootCount = Math.min(Math.floor(depth / 5), 3)
      for (let i = 0; i < rootCount; i++) {
        const angleOffset = (i - rootCount / 2) * 30
        treeRef.current.branches.push(
          createRootBranch(centerX, centerY, domain, angleOffset)
        )
      }
    })

    // 如果允许向上分支，添加一些
    if (growthLimits.allowUpward) {
      Object.entries(domainDepths).forEach(([domain, depth]) => {
        if (depth < 8) return

        const branchCount = Math.min(Math.floor(depth / 8), 2)
        const startY = centerY - 60

        for (let i = 0; i < branchCount; i++) {
          const angleOffset = (i - branchCount / 2) * 40
          treeRef.current.branches.push(
            createUpwardBranch(centerX, startY, domain, angleOffset)
          )
        }
      })
    }
  }, [domainDepths, growthLimits, createRootBranch, createUpwardBranch])

  // 渲染和动画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80

    const animate = () => {
      // 不清空画布，使用半透明覆盖产生轨迹淡化效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制种子
      const [r, g, b] = hsbToRgb(0.08, 0.7, 0.8)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 12, 16, 0, 0, Math.PI * 2)
      ctx.fill()

      // 绘制所有分支
      treeRef.current.branches.forEach(branch => {
        if (branch.alive) {
          ctx.fillStyle = branch.domainColor
          ctx.beginPath()
          ctx.arc(branch.position.x, branch.position.y, branch.stw / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // 更新分支状态
      if (isGrowing) {
        treeRef.current.branches.forEach(branch => {
          growBranch(branch, treeRef.current)
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // 初始清空
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isGrowing, growBranch, hsbToRgb])

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

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

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
        <div>总深度: {growthLimits.totalDepth}</div>
        <div>分支: {treeRef.current.branches.length}</div>
        <div>存活: {treeRef.current.branches.filter(b => b.alive).length}</div>
      </div>
    </div>
  )
}
