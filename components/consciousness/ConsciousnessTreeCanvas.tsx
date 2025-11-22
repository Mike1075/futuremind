'use client'

import { useEffect, useRef, useState } from 'react'
import {
  generateConsciousnessTree,
  TreeParams,
  TreeGrowthData,
} from '@/lib/utils/consciousnessTreeGenerator'

interface ConsciousnessTreeCanvasProps {
  growthData: TreeGrowthData
  techParams?: Partial<TreeParams>
}

// 默认参数（经典红色能量树 V2）
const DEFAULT_PARAMS: TreeParams = {
  particleSize: 2,
  glowIntensity: 0.5,
}

export function ConsciousnessTreeCanvas({ growthData, techParams }: ConsciousnessTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [seedOpacity, setSeedOpacity] = useState(0.3)
  const animationRef = useRef<number | undefined>(undefined)

  // 检测是否为空树（种子状态）
  const isEmptyTree =
    growthData.roots.count === 0 &&
    growthData.trunk.thickness === 0 &&
    growthData.trunk.height_level === 0 &&
    growthData.branches.count === 0 &&
    growthData.leaves.count === 0 &&
    growthData.fruits.count === 0

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    })
    if (!ctx) return

    // 直接合并参数
    const params = { ...DEFAULT_PARAMS, ...techParams }

    // 计算树实际需要的空间（根据growthData动态计算）
    const calculateTreeDimensions = () => {
      // 基础宽度（视口宽度或最小800px）
      const baseWidth = Math.max(container.clientWidth || 800, 800)

      // 计算树干高度
      const baseHeight = growthData.roots.count * 10
      const growHeight = growthData.trunk.height_level * 2.5
      const trunkHeight = Math.max(baseHeight + growHeight, 10)

      // 计算根系深度（考虑递归层级）
      const rootDepth = growthData.roots.depth_level
      let rootMaxDepth = 1
      if (rootDepth > 2) rootMaxDepth = 2
      if (rootDepth > 4) rootMaxDepth = 3
      if (rootDepth > 6) rootMaxDepth = 4
      if (rootDepth > 8) rootMaxDepth = 5

      const rootLength = Math.max(rootDepth * 15, 5)
      // 根系总延伸 = 主根 + 递归分支（每级0.7倍）
      const rootTotalExtent = rootLength * (1 + 0.7 + 0.49 + 0.343 + 0.24) * (rootMaxDepth / 5)

      // 计算枝条延伸（考虑递归层级）
      const branchLength = Math.max(growthData.branches.avg_length * 10, 5)
      let branchMaxDepth = 2
      if (growthData.branches.count > 3) branchMaxDepth = 3
      if (growthData.branches.count > 6) branchMaxDepth = 4
      if (growthData.branches.count > 12) branchMaxDepth = 5

      // 枝条总延伸 = 主枝 + 递归分支
      const branchTotalExtent = branchLength * (1 + 0.7 + 0.49 + 0.343 + 0.24) * (branchMaxDepth / 5)

      // 总高度 = 上边距 + 树冠延伸 + 树干 + 根系延伸 + 下边距
      const totalHeight = Math.max(
        200 + branchTotalExtent + trunkHeight + rootTotalExtent + 200,
        container.clientHeight || 600
      )

      // 总宽度 = 基础宽度 + 枝条左右延伸
      const totalWidth = Math.max(
        baseWidth + branchTotalExtent * 2,
        baseWidth
      )

      return { width: totalWidth, height: totalHeight }
    }

    const draw = () => {
      const dimensions = calculateTreeDimensions()

      // 设置Canvas尺寸为足够大
      canvas.width = dimensions.width
      canvas.height = dimensions.height

      // 清空画布
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 如果是空树，绘制闪烁的种子
      if (isEmptyTree) {
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        // 绘制种子（椭圆形）
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'

        // 外层发光
        ctx.shadowBlur = 30
        ctx.shadowColor = `rgba(220, 38, 38, ${seedOpacity})`

        // 种子主体
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, 15, 20, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 38, 38, ${seedOpacity})`
        ctx.fill()

        // 内部高光
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.ellipse(centerX - 3, centerY - 5, 5, 7, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(248, 113, 113, ${seedOpacity * 0.8})`
        ctx.fill()

        ctx.restore()
        return
      }

      // 设置发光效果
      ctx.globalCompositeOperation = 'lighter'

      // 生成并绘制树
      const particles = generateConsciousnessTree(
        params,
        growthData,
        canvas.width,
        canvas.height
      )

      // 绘制粒子
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        // 增强发光效果
        if (p.color.includes('70%') || p.color.includes('72%') || p.color.includes('85%')) {
          ctx.shadowBlur = 15
          ctx.shadowColor = p.color
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
    }

    const resize = () => {
      draw()
    }

    window.addEventListener('resize', resize)
    draw()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [growthData, techParams, seedOpacity, isEmptyTree])

  // 种子闪烁动画
  useEffect(() => {
    if (!isEmptyTree) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    let increasing = true
    const animate = () => {
      setSeedOpacity((prev) => {
        if (increasing) {
          if (prev >= 0.9) {
            increasing = false
            return prev - 0.02
          }
          return prev + 0.02
        } else {
          if (prev <= 0.3) {
            increasing = true
            return prev + 0.02
          }
          return prev - 0.02
        }
      })
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isEmptyTree])

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{ background: '#000' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', background: '#000', minWidth: '100%' }}
      />
    </div>
  )
}
