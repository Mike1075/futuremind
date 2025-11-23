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
  zoom?: number  // 缩放比例（0.5-3.0）
  isPreview?: boolean  // 预览模式（隐藏拖拽提示）
}

// 默认参数（经典红色能量树 V2）
const DEFAULT_PARAMS: TreeParams = {
  particleSize: 3,  // 🔥 整体放大50%：2 → 3
  glowIntensity: 0.5,
}

export function ConsciousnessTreeCanvas({ growthData, techParams, zoom = 1, isPreview = false }: ConsciousnessTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [seedOpacity, setSeedOpacity] = useState(0.3)
  const animationRef = useRef<number | undefined>(undefined)

  // 🖱️ 拖拽状态
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

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
      // 🔥 预览模式：直接使用容器尺寸，不需要大Canvas
      if (isPreview) {
        return {
          width: container.clientWidth || 400,
          height: container.clientHeight || 400
        }
      }

      // 详情页模式：根据实际参数动态计算足够大的Canvas
      const minWidth = 800
      const baseWidth = Math.max(container.clientWidth || minWidth, minWidth)

      // 🔥 动态计算树干高度（基于height_level）
      const trunkHeight = 50 + growthData.trunk.height_level * 2  // 50-250px范围

      // 🔥 动态计算根系延伸（基于count和depth_level）
      const rootCount = growthData.roots.count
      const rootDepth = growthData.roots.depth_level
      // 根系基础长度 + 深度加成（×1.5整体放大）
      const baseRootLength = (40 + rootDepth * 8) * 1.5  // 与generator一致
      // 考虑递归衰减（0.70）+ depthBonus增益，估算总延伸 ≈ baseLength × 3.5
      const estimatedRootLength = rootCount > 0 ? baseRootLength * 3.5 : 0
      const rootTotalExtent = estimatedRootLength

      // 🔥 动态计算枝条延伸（基于count和avg_length）
      const branchCount = growthData.branches.count
      const branchLength = growthData.branches.avg_length
      // 枝条递归深度估算：log2(count)
      const branchDepth = Math.log2(branchCount + 1)
      // 总延伸 = (基础长度 × 深度) × 2倍安全系数（考虑×1.5放大）
      const branchTotalExtent = branchCount > 0 ? (30 + branchLength * 10) * branchDepth * 2 : 0

      // 总高度 = 上边距 + 树冠延伸 + 树干 + 根系延伸 + 下边距
      const verticalPadding = 100  // 减小padding，让树更充分显示
      const minHeight = 600
      const totalHeight = Math.max(
        verticalPadding + branchTotalExtent + trunkHeight + rootTotalExtent + verticalPadding,
        container.clientHeight || minHeight
      )

      // 总宽度 = 基础宽度 + 枝条左右延伸
      const totalWidth = Math.max(
        baseWidth + branchTotalExtent * 2,  // 🔥 左右各延伸（2倍安全系数）
        baseWidth
      )

      return { width: totalWidth, height: totalHeight }
    }

    const draw = () => {
      const dimensions = calculateTreeDimensions()

      // 设置Canvas尺寸为足够大
      canvas.width = dimensions.width
      canvas.height = dimensions.height

      console.log('[Canvas Debug]', {
        isPreview,
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        growthData
      })

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

        // 最外层光环（淡淡的光晕）
        const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60)
        gradient1.addColorStop(0, `rgba(220, 38, 38, ${seedOpacity * 0.3})`)
        gradient1.addColorStop(0.5, `rgba(220, 38, 38, ${seedOpacity * 0.15})`)
        gradient1.addColorStop(1, 'rgba(220, 38, 38, 0)')
        ctx.fillStyle = gradient1
        ctx.beginPath()
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2)
        ctx.fill()

        // 中层光环
        const gradient2 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35)
        gradient2.addColorStop(0, `rgba(239, 68, 68, ${seedOpacity * 0.5})`)
        gradient2.addColorStop(0.6, `rgba(220, 38, 38, ${seedOpacity * 0.3})`)
        gradient2.addColorStop(1, 'rgba(220, 38, 38, 0)')
        ctx.fillStyle = gradient2
        ctx.beginPath()
        ctx.arc(centerX, centerY, 35, 0, Math.PI * 2)
        ctx.fill()

        // 外层发光
        ctx.shadowBlur = 40
        ctx.shadowColor = `rgba(220, 38, 38, ${seedOpacity * 0.8})`

        // 种子主体
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, 15, 20, 0, 0, Math.PI * 2)
        const seedGradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, 20)
        seedGradient.addColorStop(0, `rgba(248, 113, 113, ${seedOpacity})`)
        seedGradient.addColorStop(0.5, `rgba(220, 38, 38, ${seedOpacity})`)
        seedGradient.addColorStop(1, `rgba(185, 28, 28, ${seedOpacity * 0.9})`)
        ctx.fillStyle = seedGradient
        ctx.fill()

        // 内部高光
        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(252, 165, 165, ${seedOpacity * 0.6})`
        ctx.beginPath()
        ctx.ellipse(centerX - 4, centerY - 6, 6, 8, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(252, 165, 165, ${seedOpacity * 0.7})`
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

      // 绘制粒子（根据形状绘制不同图案）
      particles.forEach((p) => {
        ctx.fillStyle = p.color

        // 根据shape绘制不同形状
        if (p.shape === 'leaf') {
          // 🍃 叶子：用线条绘制尖椭圆形
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation || 0) * Math.PI / 180)

          // 叶子轮廓（尖椭圆）
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 1.5)  // 顶端尖点
          ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.6, 0)  // 右上
          ctx.quadraticCurveTo(p.size * 0.8, p.size * 0.5, 0, p.size)  // 右下
          ctx.quadraticCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.6, 0)  // 左下
          ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.5, 0, -p.size * 1.5)  // 左上回到顶点
          ctx.closePath()
          ctx.strokeStyle = p.color
          ctx.lineWidth = 1
          ctx.stroke()
          // 🔥 增加叶子填充透明度，让叶子更明显
          ctx.globalAlpha = 0.6
          ctx.fill()
          ctx.globalAlpha = 1

          // 叶脉（中线）
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 1.5)
          ctx.lineTo(0, p.size)
          ctx.strokeStyle = p.color
          ctx.lineWidth = 0.5
          ctx.stroke()

          ctx.restore()
        } else if (p.shape === 'apple') {
          // 🍎 果实：圆形（比叶子大）+ 彩色勾边
          ctx.save()

          // 填充红色果实主体
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()

          // 🔥 添加彩色渐变勾边（更明显的果实标识）
          const gradient = ctx.createLinearGradient(
            p.x - p.size, p.y - p.size,
            p.x + p.size, p.y + p.size
          )
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)')    // 金色
          gradient.addColorStop(0.25, 'rgba(255, 165, 0, 0.9)') // 橙色
          gradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.9)') // 粉色
          gradient.addColorStop(0.75, 'rgba(138, 43, 226, 0.9)') // 紫色
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)')     // 金色

          ctx.strokeStyle = gradient
          ctx.lineWidth = 2.5
          ctx.stroke()

          // 果实发光效果
          ctx.shadowBlur = 12
          ctx.shadowColor = p.color
          ctx.fill()
          ctx.shadowBlur = 0

          ctx.restore()
        } else {
          // 默认：圆形粒子
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()

          // 增强发光效果
          if (p.color.includes('70%') || p.color.includes('72%') || p.color.includes('85%')) {
            ctx.shadowBlur = 15
            ctx.shadowColor = p.color
            ctx.fill()
            ctx.shadowBlur = 0
          }
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

  // 种子闪烁动画（更慢更优雅）
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
        // 再次减慢速度：从0.008改为0.004，呼吸更加缓慢优雅
        if (increasing) {
          if (prev >= 0.85) {
            increasing = false
            return prev - 0.004
          }
          return prev + 0.004
        } else {
          if (prev <= 0.35) {
            increasing = true
            return prev + 0.004
          }
          return prev - 0.004
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

  // 🖱️ 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab'
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ background: '#000' }}
    >
      {/* 🖱️ 拖拽提示层（仅在非预览模式显示） */}
      {!isPreview && (
        <div className="absolute top-2 left-2 text-xs text-white/50 pointer-events-none z-10">
          拖拽查看 | 滚轮缩放
        </div>
      )}

      {/* 🔥 Canvas包装器：预览模式固定位置，详情页可拖拽 */}
      <div
        style={{
          position: 'absolute',
          left: isPreview ? 0 : offset.x,
          top: isPreview ? 0 : offset.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          cursor: isPreview ? 'default' : (isDragging ? 'grabbing' : 'grab')
        }}
        {...(!isPreview && {
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
          onMouseUp: handleMouseUp,
          onMouseLeave: handleMouseLeave
        })}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', background: '#000' }}
        />
      </div>
    </div>
  )
}
