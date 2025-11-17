'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
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
  proba: number        // 分支概率
  domainColor: string  // 领域颜色
  isRoot: boolean      // 是否是根
}

interface TreeGrowthState {
  stage: 'seed' | 'sprout' | 'seedling' | 'young' | 'mature'
  maxRootGen: number
  maxRootCount: number
  showTrunk: boolean
  trunkHeight: number
  trunkWidth: number
  showUpwardBranches: boolean
  maxUpwardGen: number
  showLeaves: boolean
  leafType: 'cotyledon' | 'true_leaf' | 'mature'
  showFruits: boolean
  canopySize: number
}

// 五个意识领域配置
const CONSCIOUSNESS_DOMAINS = {
  self_awareness: {
    name: '自我觉察',
    color: '#9B59B6',      // 紫色
    rootAngle: -30,        // 根的角度
    branchAngle: -60,      // 向上分支的角度
  },
  life_sciences: {
    name: '生命科学',
    color: '#27AE60',      // 绿色
    rootAngle: 30,
    branchAngle: -30,
  },
  universal_laws: {
    name: '宇宙法则',
    color: '#3498DB',      // 蓝色
    rootAngle: 90,
    branchAngle: 0,
  },
  creative_expression: {
    name: '创意表达',
    color: '#E74C3C',      // 红色
    rootAngle: 150,
    branchAngle: 30,
  },
  social_connection: {
    name: '社会连接',
    color: '#F39C12',      // 橙色
    rootAngle: -150,
    branchAngle: 60,
  }
}

// ============================================================================
// 双重控制系统：核心算法
// ============================================================================

function getTreeGrowthState(
  levelProgress: number,
  domainDepths: Record<string, number>
): TreeGrowthState {
  const totalDepth = Object.values(domainDepths).reduce((a, b) => a + b, 0)

  // 种子期 (0-20%)
  if (levelProgress < 20) {
    return {
      stage: 'seed',
      maxRootGen: 1,
      maxRootCount: Math.min(3, Math.floor(totalDepth / 3)),
      showTrunk: false,
      trunkHeight: 0,
      trunkWidth: 0,
      showUpwardBranches: false,
      maxUpwardGen: 0,
      showLeaves: false,
      leafType: 'cotyledon',
      showFruits: false,
      canopySize: 0
    }
  }

  // 发芽期 (20-40%)
  if (levelProgress < 40) {
    return {
      stage: 'sprout',
      maxRootGen: 2,
      maxRootCount: Math.min(3, Math.floor(totalDepth / 4)),
      showTrunk: totalDepth >= 5,
      trunkHeight: Math.min(60, totalDepth * 3),
      trunkWidth: 4,
      showUpwardBranches: totalDepth >= 8,
      maxUpwardGen: 1,
      showLeaves: totalDepth >= 10,
      leafType: 'cotyledon',
      showFruits: false,
      canopySize: 0
    }
  }

  // 幼苗期 (40-60%)
  if (levelProgress < 60) {
    return {
      stage: 'seedling',
      maxRootGen: 3,
      maxRootCount: Math.min(4, Math.floor(totalDepth / 5)),
      showTrunk: true,
      trunkHeight: Math.min(100, totalDepth * 3.5),
      trunkWidth: 6 + totalDepth * 0.15,
      showUpwardBranches: true,
      maxUpwardGen: 2,
      showLeaves: true,
      leafType: 'true_leaf',
      showFruits: false,
      canopySize: totalDepth * 0.5
    }
  }

  // 小树期 (60-80%)
  if (levelProgress < 80) {
    return {
      stage: 'young',
      maxRootGen: 4,
      maxRootCount: 5,
      showTrunk: true,
      trunkHeight: Math.min(140, totalDepth * 4),
      trunkWidth: 10 + totalDepth * 0.2,
      showUpwardBranches: true,
      maxUpwardGen: 3,
      showLeaves: true,
      leafType: 'mature',
      showFruits: totalDepth >= 35,
      canopySize: totalDepth * 1.2
    }
  }

  // 大树期 (80-100%)
  return {
    stage: 'mature',
    maxRootGen: 5,
    maxRootCount: 5,
    showTrunk: true,
    trunkHeight: Math.min(180, totalDepth * 4.5),
    trunkWidth: 15 + totalDepth * 0.25,
    showUpwardBranches: true,
    maxUpwardGen: 5,
    showLeaves: true,
    leafType: 'mature',
    showFruits: true,
    canopySize: totalDepth * 1.5
  }
}

// ============================================================================
// 组件属性
// ============================================================================

interface DynamicConsciousnessTreeProps {
  // 如果提供这些prop，则使用prop数据（测试模式）
  levelProgress?: number
  consciousnessLevel?: number
  domainDepths?: Record<string, number>
  // 如果不提供，则从数据库加载（真实模式）
  loadFromDatabase?: boolean
  className?: string
}

// ============================================================================
// 主组件
// ============================================================================

export function DynamicConsciousnessTree({
  levelProgress: propLevelProgress,
  consciousnessLevel: propLevel,
  domainDepths: propDomainDepths,
  loadFromDatabase = false,
  className = ''
}: DynamicConsciousnessTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

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

  // 使用ref存储分支，避免状态更新导致的重新渲染
  const branchesRef = useRef<Branch[]>([])

  // 从数据库加载数据
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

  // 当prop改变时更新状态
  useEffect(() => {
    if (propLevelProgress !== undefined) setLevelProgress(propLevelProgress)
  }, [propLevelProgress])

  useEffect(() => {
    if (propLevel !== undefined) setConsciousnessLevel(propLevel)
  }, [propLevel])

  useEffect(() => {
    if (propDomainDepths !== undefined) setDomainDepths(propDomainDepths)
  }, [propDomainDepths])

  // 获取生长状态 - 使用useMemo避免重复计算
  const growthState = useMemo(
    () => getTreeGrowthState(levelProgress, domainDepths),
    [levelProgress, domainDepths]
  )

  // 创建根分支
  const createRootBranch = useCallback((
    domain: string,
    color: string,
    angleOffset: number,
    generation: number,
    centerX: number,
    centerY: number
  ): Branch => {
    const baseAngle = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS].rootAngle
    const angleRad = ((baseAngle + angleOffset) * Math.PI) / 180

    return {
      position: { x: centerX, y: centerY },
      stw: 6 - generation * 1,
      gen: generation,
      alive: true,
      age: 0,
      angle: angleRad,
      speed: {
        x: Math.cos(angleRad) * 2,
        y: Math.sin(angleRad) * 2
      },
      maxlife: 80 + Math.random() * 40,
      proba: 0.08 / generation,
      domainColor: color,
      isRoot: true
    }
  }, [])

  // 创建向上分支
  const createUpwardBranch = useCallback((
    domain: string,
    color: string,
    angleOffset: number,
    generation: number,
    startX: number,
    startY: number
  ): Branch => {
    const baseAngle = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS].branchAngle
    const angleRad = ((baseAngle + angleOffset) * Math.PI) / 180

    return {
      position: { x: startX, y: startY },
      stw: 5 - generation * 0.8,
      gen: generation,
      alive: true,
      age: 0,
      angle: angleRad,
      speed: {
        x: Math.cos(angleRad) * 1.5,
        y: Math.sin(angleRad) * 1.5
      },
      maxlife: 100 + Math.random() * 50,
      proba: 0.05 / generation,
      domainColor: color,
      isRoot: false
    }
  }, [])

  // 生成所有分支
  const generateBranches = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return []

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80
    const newBranches: Branch[] = []

    // 为每个领域生成根系
    Object.entries(domainDepths).forEach(([domain, depth]) => {
      if (depth === 0) return

      const domainConfig = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS]
      const rootCount = Math.min(
        Math.floor(depth / 5),
        growthState.maxRootCount
      )

      for (let i = 0; i < rootCount; i++) {
        for (let gen = 1; gen <= growthState.maxRootGen; gen++) {
          const angleOffset = (i - rootCount / 2) * 20 + (Math.random() - 0.5) * 10
          newBranches.push(
            createRootBranch(domain, domainConfig.color, angleOffset, gen, centerX, centerY)
          )
        }
      }
    })

    // 为每个领域生成向上分支
    if (growthState.showUpwardBranches) {
      Object.entries(domainDepths).forEach(([domain, depth]) => {
        if (depth === 0) return

        const domainConfig = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS]
        const branchCount = Math.floor(depth / 4)
        const startY = centerY - growthState.trunkHeight * 0.6

        for (let i = 0; i < branchCount; i++) {
          for (let gen = 1; gen <= growthState.maxUpwardGen; gen++) {
            const angleOffset = (i - branchCount / 2) * 15 + (Math.random() - 0.5) * 10
            newBranches.push(
              createUpwardBranch(domain, domainConfig.color, angleOffset, gen, centerX, startY)
            )
          }
        }
      })
    }

    return newBranches
  }, [domainDepths, growthState, createRootBranch, createUpwardBranch])

  // 初始化分支 - 只在关键参数变化时重新生成
  useEffect(() => {
    branchesRef.current = generateBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelProgress, JSON.stringify(domainDepths), growthState.stage])

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height - 80

    // 清空画布
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制种子
    if (growthState.stage === 'seed' || levelProgress < 40) {
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 12, 16, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制根系
    branchesRef.current.filter(b => b.isRoot).forEach(branch => {
      ctx.fillStyle = branch.domainColor
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(branch.position.x, branch.position.y, branch.stw / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 绘制树干
    if (growthState.showTrunk && growthState.trunkHeight > 0) {
      const gradient = ctx.createLinearGradient(
        centerX - growthState.trunkWidth / 2,
        0,
        centerX + growthState.trunkWidth / 2,
        0
      )
      gradient.addColorStop(0, '#5C3A1F')
      gradient.addColorStop(0.5, '#6B4423')
      gradient.addColorStop(1, '#5C3A1F')

      ctx.fillStyle = gradient
      ctx.fillRect(
        centerX - growthState.trunkWidth / 2,
        centerY - growthState.trunkHeight,
        growthState.trunkWidth,
        growthState.trunkHeight
      )
    }

    // 绘制向上分支
    branchesRef.current.filter(b => !b.isRoot).forEach(branch => {
      ctx.fillStyle = branch.domainColor
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(branch.position.x, branch.position.y, branch.stw / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // 绘制果实
    if (growthState.showFruits) {
      Object.entries(domainDepths).forEach(([domain, depth]) => {
        if (depth >= 10) {
          const domainConfig = CONSCIOUSNESS_DOMAINS[domain as keyof typeof CONSCIOUSNESS_DOMAINS]
          const fruitCount = Math.floor((depth - 10) / 5)

          for (let i = 0; i < fruitCount; i++) {
            const angle = (Math.PI / 5) * Object.keys(domainDepths).indexOf(domain) + i * 0.3
            const radius = 40 + i * 20
            const fx = centerX + Math.cos(angle) * radius
            const fy = centerY - growthState.trunkHeight - 20 - i * 15

            // 果实阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.beginPath()
            ctx.arc(fx + 2, fy + 2, 6, 0, Math.PI * 2)
            ctx.fill()

            // 果实
            ctx.fillStyle = domainConfig.color
            ctx.beginPath()
            ctx.arc(fx, fy, 6, 0, Math.PI * 2)
            ctx.fill()

            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.beginPath()
            ctx.arc(fx - 2, fy - 2, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })
    }

    // 绘制调试信息
    ctx.fillStyle = 'white'
    ctx.font = '12px monospace'
    ctx.fillText(`Stage: ${growthState.stage}`, 10, 20)
    ctx.fillText(`Progress: ${levelProgress}%`, 10, 35)
    ctx.fillText(`Total Depth: ${Object.values(domainDepths).reduce((a, b) => a + b, 0)}`, 10, 50)
  }, [growthState, levelProgress, domainDepths])

  // 动画循环 - 简化为只绘制，不更新状态
  useEffect(() => {
    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

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
    </div>
  )
}
