'use client'

import { useEffect, useRef, useMemo } from 'react'
import {
  generateConsciousnessTree,
  TreeParams,
  TreeGrowthData,
} from '@/lib/utils/consciousnessTreeGenerator'
import { TreeTechParams } from './ConsciousnessTreeView'

interface ConsciousnessTreeCanvasProps {
  growthData: TreeGrowthData
  params?: Partial<TreeParams>
  techParams?: TreeTechParams
}

// 默认参数（经典红色能量树）
const DEFAULT_PARAMS: TreeParams = {
  depth: 10,
  branchAngle: 25,
  lengthDecay: 0.75,
  trunkLength: 120,
  trunkWidth: 12,
  rootDepth: 6,
  rootSpread: 30,
  particleSize: 2,
  glowIntensity: 0.5,
  leafDensity: 0.5,
  fruitProbability: 0.08,
}

export function ConsciousnessTreeCanvas({ growthData, params, techParams }: ConsciousnessTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // 使用useMemo缓存合并后的参数，避免不必要的重渲染
  const mergedParams = useMemo(() => {
    return { ...DEFAULT_PARAMS, ...params, ...techParams }
  }, [params, techParams])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', {
      alpha: false, // 禁用alpha通道，提升性能
      willReadFrequently: false
    })
    if (!ctx) return

    let isDrawing = false

    const draw = () => {
      if (isDrawing) return
      isDrawing = true

      // 使用requestAnimationFrame确保平滑渲染
      animationFrameRef.current = requestAnimationFrame(() => {
        // 清空画布（纯黑背景）
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 设置发光效果
        ctx.globalCompositeOperation = 'lighter'

        // 生成并绘制树
        const particles = generateConsciousnessTree(
          mergedParams,
          growthData,
          canvas.width,
          canvas.height
        )

        // 绘制每个粒子
        particles.forEach((p) => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()

          // 增强发光效果（高明度粒子）
          if (p.color.includes('70%') || p.color.includes('72%')) {
            ctx.shadowBlur = 15
            ctx.shadowColor = p.color
            ctx.fill()
            ctx.shadowBlur = 0
          }
        })

        isDrawing = false
      })
    }

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
      draw()
    }

    window.addEventListener('resize', resize)
    resize()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [growthData, mergedParams])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block', background: '#000' }}
    />
  )
}
