'use client'

import { useRef, useEffect, useCallback } from 'react'
import { ConsciousnessState } from '@/types/consciousness'

interface Vector2D {
  x: number
  y: number
}

interface Branch {
  position: Vector2D
  stw: number // strokeWidth
  gen: number // generation
  alive: boolean
  age: number
  angle: number
  speed: Vector2D
  index: number
  maxlife: number
  proba1: number
  proba2: number
  proba3: number
  proba4: number
  deviation: number
  taskType?: string // 关联的任务类型
}

interface ConsciousnessTreeData {
  branches: Branch[]
  start: Vector2D
  coeff: number
  teinte: number // base hue
  index: number
  proba1: number
  proba2: number
  proba3: number
  proba4: number
  completedTasks: number // 已完成任务数
  currentLevel: number // 当前等级
}

interface DynamicConsciousnessTreeProps {
  consciousnessState?: ConsciousnessState
  width?: number
  height?: number
  onGrowthComplete?: () => void
}

export function DynamicConsciousnessTree({
  consciousnessState,
  width = 400,
  height = 350,
  onGrowthComplete
}: DynamicConsciousnessTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const treeRef = useRef<ConsciousnessTreeData | null>(null)
  const lastTaskCountRef = useRef(0)

  // 根据意识状态调整生长参数 - 更一致的参数设置
  const getGrowthParameters = () => {
    const totalTasks = consciousnessState?.stats?.totalTasksCompleted || 0
    const level = consciousnessState?.currentLevel || 1
    const progress = Math.min(1, totalTasks / 20) // 假设20个任务为满进度
    
    return {
      maxlife: Math.floor(15 + progress * 15), // 15-30，根据进度线性增长
      growthSpeed: 2.5, // 固定生长速度，保持一致性
      branchingProb: 0.7 + progress * 0.25, // 0.7-0.95，茂盛程度根据进度变化
      maxGenerations: Math.floor(4 + progress * 3), // 4-7代分支
      colorIntensity: Math.floor(120 + progress * 80), // 颜色强度根据进度变化
      trunkThickness: 8 + level * 1.5 // 主干粗细
    }
  }

  // 根据任务类型获取颜色
  const getTaskTypeColor = (taskType?: string): number => {
    switch (taskType) {
      case 'meditation': return 280 // 紫色 - 冥想
      case 'listening': return 120 // 绿色 - 声音探索
      case 'reflection': return 200 // 蓝色 - 内观反思
      case 'awareness': return 45  // 橙色 - 觉察
      case 'wisdom': return 240    // 蓝紫色 - 智慧
      case 'creativity': return 60 // 黄色 - 创造
      case 'connection': return 300 // 品红色 - 连接
      default: return 30 // 默认暖色
    }
  }

  const createVector = (x: number, y: number): Vector2D => ({ x, y })

  // 使用固定种子的伪随机函数，确保相同进度下形态一致
  const seedRef = useRef<number>(0)
  
  const seededRandom = (min?: number, max?: number): number => {
    // 简单的线性同余生成器
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280
    const rnd = seedRef.current / 233280
    
    if (min === undefined) return rnd
    if (max === undefined) return rnd * min
    return min + rnd * (max - min)
  }

  const createTree = (canvasWidth: number, canvasHeight: number): ConsciousnessTreeData => {
    const params = getGrowthParameters()
    
    // 根据完成任务数设置固定种子，确保相同进度生成相同的树
    const completedTasks = consciousnessState?.stats?.totalTasksCompleted || 0
    seedRef.current = 12345 + completedTasks * 999 // 固定种子基数
    
    // 树的位置 - 稍微靠下一点
    const x = canvasWidth / 2
    const y = canvasHeight * 0.85
    const start = createVector(x, y)

    const tree: ConsciousnessTreeData = {
      branches: [],
      start,
      coeff: start.y / (canvasHeight - 50),
      teinte: getTaskTypeColor(), // 基础色调
      index: 0,
      // 根据意识状态调整分支概率
      proba1: params.branchingProb,
      proba2: params.branchingProb,
      proba3: params.branchingProb * 0.7,
      proba4: params.branchingProb * 0.7,
      completedTasks: consciousnessState?.stats?.totalTasksCompleted || 0,
      currentLevel: consciousnessState?.currentLevel || 1
    }

    // 创建主干 - 使用参数中的粗细设置
    const trunkWidth = params.trunkThickness
    const trunk: Branch = {
      position: { ...start },
      stw: trunkWidth,
      gen: 1,
      alive: true,
      age: 0,
      angle: 0,
      speed: createVector(0, -params.growthSpeed),
      index: 0,
      maxlife: params.maxlife * seededRandom(0.8, 1.2),
      proba1: tree.proba1,
      proba2: tree.proba2,
      proba3: tree.proba3,
      proba4: tree.proba4,
      deviation: 0.75, // 固定偏差值，确保一致性
      taskType: 'root'
    }

    tree.branches.push(trunk)
    return tree
  }

  const createBranch = (
    start: Vector2D,
    stw: number,
    angle: number,
    gen: number,
    index: number,
    tree: ConsciousnessTreeData,
    taskType?: string
  ): Branch => {
    const params = getGrowthParameters()
    
    return {
      position: { ...start },
      stw,
      gen,
      alive: true,
      age: 0,
      angle,
      speed: createVector(0, -params.growthSpeed),
      index,
      maxlife: params.maxlife * seededRandom(0.6, 1.0),
      proba1: tree.proba1,
      proba2: tree.proba2,
      proba3: tree.proba3,
      proba4: tree.proba4,
      deviation: 0.65 + seededRandom() * 0.2, // 0.65-0.85的范围
      taskType
    }
  }

  const hsbToRgb = (h: number, s: number, b: number, a = 1): string => {
    h = Math.max(0, Math.min(360, h)) / 360
    s = Math.max(0, Math.min(255, s)) / 255
    b = Math.max(0, Math.min(255, b)) / 255

    const c = b * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = b - c

    let r = 0, g = 0, bl = 0

    if (0 <= h && h < 1 / 6) {
      r = c; g = x; bl = 0
    } else if (1 / 6 <= h && h < 2 / 6) {
      r = x; g = c; bl = 0
    } else if (2 / 6 <= h && h < 3 / 6) {
      r = 0; g = c; bl = x
    } else if (3 / 6 <= h && h < 4 / 6) {
      r = 0; g = x; bl = c
    } else if (4 / 6 <= h && h < 5 / 6) {
      r = x; g = 0; bl = c
    } else if (5 / 6 <= h && h < 1) {
      r = c; g = 0; bl = x
    }

    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    bl = Math.round((bl + m) * 255)

    return `rgba(${r}, ${g}, ${bl}, ${a})`
  }

  const growBranch = (branch: Branch, tree: ConsciousnessTreeData) => {
    if (!branch.alive) return

    branch.age++

    // 根据意识状态调整死亡概率
    const deathProb = 0.02 * branch.gen * (1 / Math.max(1, tree.currentLevel * 0.5))

    if (branch.age >= Math.floor(branch.maxlife / branch.gen) || seededRandom(1) < deathProb) {
      branch.alive = false

      // 创建分支 - 使用参数控制最大世代数
      const params = getGrowthParameters()
      if (branch.stw > 0.5 && branch.gen < params.maxGenerations) {
        const brs = tree.branches
        const pos = createVector(branch.position.x, branch.position.y)

        // 根据任务类型选择分支的任务类型
        const getChildTaskType = (): string => {
          if (!consciousnessState?.tasks) return 'awareness'
          
          const completedTaskTypes = Object.values(consciousnessState.tasks)
            .filter(task => task.status === 'completed')
            .map(task => task.taskId)
          
          const index = Math.floor(seededRandom() * completedTaskTypes.length)
          return completedTaskTypes[index] || 'awareness'
        }

        const childTaskType = getChildTaskType()

        // 主分支 - 固定的对称生长模式
        const baseAngle = 0.7 // 固定的基础角度
        const generationFactor = Math.min(0.8, 0.4 + branch.gen * 0.1) // 根据世代调整角度
        
        // 左分支
        if (seededRandom(1) < branch.proba1 / Math.pow(branch.gen, 0.8)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * 0.72, // 固定缩放比例
              branch.angle - baseAngle * generationFactor, // 左倾
              branch.gen + 0.15,
              branch.index,
              tree,
              childTaskType
            )
          )
        }

        // 右分支 - 与左分支对称
        if (seededRandom(1) < branch.proba2 / Math.pow(branch.gen, 0.8)) {
          brs.push(
            createBranch(
              pos,
              branch.stw * 0.72, // 固定缩放比例
              branch.angle + baseAngle * generationFactor, // 右倾
              branch.gen + 0.15,
              branch.index,
              tree,
              childTaskType
            )
          )
        }

        // 副分支 - 更细密的对称分支
        if (tree.completedTasks > 1 && branch.gen < params.maxGenerations - 1) {
          const smallAngle = 0.4 // 固定的小角度
          const smallGenerationFactor = Math.min(0.6, 0.2 + branch.gen * 0.08)
          
          // 左侧小分支
          if (seededRandom(1) < branch.proba3 / Math.pow(branch.gen, 1.0)) {
            brs.push(
              createBranch(
                pos,
                branch.stw * 0.58, // 固定缩放
                branch.angle - smallAngle * smallGenerationFactor,
                branch.gen + 0.2,
                branch.index,
                tree,
                childTaskType
              )
            )
          }

          // 右侧小分支
          if (seededRandom(1) < branch.proba4 / Math.pow(branch.gen, 1.0)) {
            brs.push(
              createBranch(
                pos,
                branch.stw * 0.58, // 固定缩放
                branch.angle + smallAngle * smallGenerationFactor,
                branch.gen + 0.2,
                branch.index,
                tree,
                childTaskType
              )
            )
          }
        }
      }
    } else {
      // 减少摆动，保持稳定向上生长
      branch.speed.x += seededRandom(-0.05, 0.05) * 0.5 // 减少摆动幅度
    }
  }

  const displayBranch = (branch: Branch, tree: ConsciousnessTreeData, ctx: CanvasRenderingContext2D) => {
    const params = getGrowthParameters()
    const c = tree.coeff
    const st = tree.start
    const x0 = branch.position.x
    const y0 = branch.position.y

    // 更新位置
    branch.position.x += -branch.speed.x * Math.cos(branch.angle) + branch.speed.y * Math.sin(branch.angle)
    branch.position.y += branch.speed.x * Math.sin(branch.angle) + branch.speed.y * Math.cos(branch.angle)

    // 获取分支颜色
    const branchHue = getTaskTypeColor(branch.taskType)
    
    // 阴影
    const shadowColor = hsbToRgb(branchHue + 20, 30, 20, 0.1)
    ctx.strokeStyle = shadowColor
    const shadowWidth = branch.stw * 1.1
    ctx.lineWidth = Math.max(0.5, shadowWidth)

    ctx.beginPath()
    ctx.moveTo(x0 + 1, y0 + 1)
    ctx.lineTo(branch.position.x + 1, branch.position.y + 1)
    ctx.stroke()

    // 主分支 - 使用任务类型颜色
    const mainHue = branchHue + branch.age * 0.5
    const mainSat = Math.min(200, params.colorIntensity + 30)
    const mainBright = Math.min(180, 80 + tree.currentLevel * 15)
    const mainColor = hsbToRgb(mainHue, mainSat, mainBright, 0.8)
    
    ctx.strokeStyle = mainColor
    const mainWidth = branch.stw - (branch.age / branch.maxlife) * (branch.stw * 0.3)
    ctx.lineWidth = Math.max(0.3, mainWidth)

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(branch.position.x, branch.position.y)
    ctx.stroke()

    // 高光 - 主要分支添加发光效果
    if (branch.gen < 3) {
      const highlightColor = hsbToRgb(mainHue + 10, mainSat * 0.6, mainBright + 40, 0.6)
      ctx.strokeStyle = highlightColor
      ctx.lineWidth = Math.max(0.2, mainWidth * 0.3)

      ctx.beginPath()
      ctx.moveTo(x0 - 0.5, y0)
      ctx.lineTo(branch.position.x - 0.5, branch.position.y)
      ctx.stroke()
    }
  }

  const setup = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = width
    canvas.height = height

    // 清空画布 - 使用深色背景匹配Dashboard
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)' // 半透明深色
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 创建意识树
    treeRef.current = createTree(canvas.width, canvas.height)
    lastTaskCountRef.current = consciousnessState?.stats?.totalTasksCompleted || 0
  }, [width, height, consciousnessState])

  const draw = useCallback(() => {
    if (!canvasRef.current || !treeRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tree = treeRef.current
    let hasAliveBranches = false

    tree.branches.forEach((branch) => {
      if (branch.alive) {
        hasAliveBranches = true
        growBranch(branch, tree)
        displayBranch(branch, tree, ctx)
      }
    })

    // 继续动画
    if (hasAliveBranches) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(draw)
      }, 1000 / 60) // 60fps
    } else if (onGrowthComplete) {
      onGrowthComplete()
    }
  }, [onGrowthComplete])

  // 监听任务完成，触发新的生长
  useEffect(() => {
    const currentTaskCount = consciousnessState?.stats?.totalTasksCompleted || 0
    
    // 如果任务数量增加，重新生长树
    if (currentTaskCount > lastTaskCountRef.current) {
      console.log('🌱 意识树检测到新任务完成，开始生长！', {
        previousTasks: lastTaskCountRef.current,
        currentTasks: currentTaskCount
      })
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      setup()
      draw()
    }
  }, [consciousnessState?.stats?.totalTasksCompleted, setup, draw])

  const handleClick = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setup()
    draw()
  }

  useEffect(() => {
    setup()
    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [setup, draw])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-lg"
        onClick={handleClick}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      
      {/* 信息覆盖层 */}
      {consciousnessState && (
        <div className="absolute top-2 left-2 text-xs text-white/60">
          <div>等级 {consciousnessState.currentLevel}</div>
          <div>任务 {consciousnessState.stats?.totalTasksCompleted || 0}</div>
        </div>
      )}
      
      {/* 点击提示 */}
      <div className="absolute bottom-2 right-2 text-xs text-white/40">
        点击重新生长
      </div>
    </div>
  )
}