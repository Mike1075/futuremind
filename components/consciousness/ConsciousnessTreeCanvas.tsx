'use client'

import { useEffect, useRef } from 'react'
import {
  generateConsciousnessTree,
  TreeParams,
  TreeGrowthData,
} from '@/lib/utils/consciousnessTreeGenerator'

interface ConsciousnessTreeCanvasProps {
  growthData: TreeGrowthData
  params?: Partial<TreeParams>
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
  leafDensity: 0.5,
  fruitProbability: 0.08,
}

export function ConsciousnessTreeCanvas({ growthData, params }: ConsciousnessTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800
      canvas.height = canvas.parentElement?.clientHeight || 600
      draw()
    }

    const draw = () => {
      // 清空画布（纯黑背景）
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 设置发光效果
      ctx.globalCompositeOperation = 'lighter'

      // 合并参数
      const mergedParams = { ...DEFAULT_PARAMS, ...params }

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
    }

    window.addEventListener('resize', resize)
    resize()

    return () => window.removeEventListener('resize', resize)
  }, [growthData, params])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block', background: '#000' }}
    />
  )
}
