'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    })
    if (!ctx) return

    // 直接合并参数（对标参考网站的简单方式）
    const params = { ...DEFAULT_PARAMS, ...techParams }

    const draw = () => {
      // 清空画布
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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
        if (p.color.includes('70%') || p.color.includes('72%')) {
          ctx.shadowBlur = 15
          ctx.shadowColor = p.color
          ctx.fill()
          ctx.shadowBlur = 0
        }
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
    }
  }, [growthData, techParams])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block', background: '#000' }}
    />
  )
}
