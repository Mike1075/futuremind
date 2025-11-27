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

// 默认参数（神经元生物发光树 V3 - Ethereal Bioluminescence）
const DEFAULT_PARAMS: TreeParams = {
  particleSize: 6,  // 粒子基础尺寸
  glowIntensity: 0.6,  // 增强发光强度
}

export function ConsciousnessTreeCanvas({ growthData, techParams, zoom = 1, isPreview = false }: ConsciousnessTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [seedOpacity, setSeedOpacity] = useState(0.3)
  const animationRef = useRef<number | undefined>(undefined)
  const drawTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)  // 🔥 防抖定时器

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

    if (!canvas || !container) {
      return
    }

    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false
    })
    if (!ctx) {
      return
    }

    // 直接合并参数
    const params = { ...DEFAULT_PARAMS, ...techParams }

    // 计算树实际需要的空间（根据growthData动态计算）
    const calculateTreeDimensions = () => {
      // 🔥 种子状态：使用固定合理尺寸，避免容器尺寸未就绪问题
      if (isEmptyTree) {
        const width = container.clientWidth || 800
        const height = container.clientHeight || 800
        return { width, height }
      }

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
      const rootDepthLevel = growthData.roots.depth_level

      // 🔥 修复：长度由depth_level决定，递归深度由count决定
      const baseRootLength = 30 + rootDepthLevel * 10  // 🔥 整体放大一倍，与generator一致
      const recursiveDepth = Math.floor(1 + rootCount * 0.15)  // count控制递归深度

      // 考虑递归衰减（0.70）+ depthBonus增益，估算总延伸
      const estimatedRootLength = rootCount > 0 ? baseRootLength * (1 + recursiveDepth * 0.8) : 0
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

      // 清空画布
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 如果是空树，绘制闪烁的种子（金紫色灵性种子）
      if (isEmptyTree) {
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        // 绘制种子（椭圆形）
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'

        // 最外层光环（金色光晕）
        const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80)
        gradient1.addColorStop(0, `rgba(255, 215, 0, ${seedOpacity * 0.4})`)
        gradient1.addColorStop(0.3, `rgba(157, 0, 255, ${seedOpacity * 0.2})`)
        gradient1.addColorStop(0.6, `rgba(0, 255, 255, ${seedOpacity * 0.1})`)
        gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient1
        ctx.beginPath()
        ctx.arc(centerX, centerY, 80, 0, Math.PI * 2)
        ctx.fill()

        // 中层光环（紫色）
        const gradient2 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 45)
        gradient2.addColorStop(0, `rgba(157, 0, 255, ${seedOpacity * 0.6})`)
        gradient2.addColorStop(0.5, `rgba(255, 215, 0, ${seedOpacity * 0.3})`)
        gradient2.addColorStop(1, 'rgba(157, 0, 255, 0)')
        ctx.fillStyle = gradient2
        ctx.beginPath()
        ctx.arc(centerX, centerY, 45, 0, Math.PI * 2)
        ctx.fill()

        // 外层发光（金紫渐变）
        ctx.shadowBlur = 50
        ctx.shadowColor = `rgba(255, 215, 0, ${seedOpacity * 0.9})`

        // 种子主体（金色核心）
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, 18, 24, 0, 0, Math.PI * 2)
        const seedGradient = ctx.createRadialGradient(centerX - 5, centerY - 5, 0, centerX, centerY, 24)
        seedGradient.addColorStop(0, `rgba(255, 255, 200, ${seedOpacity})`)
        seedGradient.addColorStop(0.3, `rgba(255, 215, 0, ${seedOpacity})`)
        seedGradient.addColorStop(0.7, `rgba(157, 0, 255, ${seedOpacity * 0.8})`)
        seedGradient.addColorStop(1, `rgba(0, 255, 255, ${seedOpacity * 0.6})`)
        ctx.fillStyle = seedGradient
        ctx.fill()

        // 内部高光（白金色）
        ctx.shadowBlur = 25
        ctx.shadowColor = `rgba(255, 255, 200, ${seedOpacity * 0.8})`
        ctx.beginPath()
        ctx.ellipse(centerX - 5, centerY - 7, 7, 10, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 220, ${seedOpacity * 0.9})`
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

      // 🔥 神经元风格：分组绘制
      const normalParticles = particles.filter(p => !p.shape || p.shape === 'circle')
      const leafParticles = particles.filter(p => p.shape === 'leaf')
      const appleParticles = particles.filter(p => p.shape === 'apple')

      // 🌟 背景氛围光：根据树的总粒子数创建柔和光晕
      const totalParticles = particles.length
      if (totalParticles > 10) {
        const ambientIntensity = Math.min(totalParticles / 500, 0.3)
        const centerX = canvas.width / 2
        const centerY = canvas.height * 0.45  // 稍微偏上，树冠位置
        const ambientGlow = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, Math.min(canvas.width, canvas.height) * 0.6
        )
        ambientGlow.addColorStop(0, `rgba(157, 0, 255, ${ambientIntensity * 0.15})`)
        ambientGlow.addColorStop(0.3, `rgba(0, 255, 255, ${ambientIntensity * 0.1})`)
        ambientGlow.addColorStop(0.6, `rgba(255, 215, 0, ${ambientIntensity * 0.05})`)
        ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = ambientGlow
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // 🌿 神经元发光粒子（所有普通粒子都发光）
      // 第一遍：绘制柔和光晕底层
      ctx.shadowBlur = 20
      normalParticles.forEach((p) => {
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // 第二遍：绘制明亮核心
      ctx.shadowBlur = 8
      ctx.globalAlpha = 1
      normalParticles.forEach((p) => {
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // ✨ 能量光点（叶子 → 发光能量球）
      leafParticles.forEach((p) => {
        ctx.save()

        // 外层柔和光晕
        ctx.shadowBlur = 25
        ctx.shadowColor = p.color
        const outerGlow = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 3
        )
        outerGlow.addColorStop(0, p.color.replace(')', ', 0.6)').replace('hsla', 'hsla').replace('hsl', 'hsla'))
        outerGlow.addColorStop(0.4, p.color.replace(')', ', 0.2)').replace('hsla', 'hsla').replace('hsl', 'hsla'))
        outerGlow.addColorStop(1, 'rgba(0, 255, 255, 0)')
        ctx.fillStyle = outerGlow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()

        // 中间层能量环
        const midGlow = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 1.8
        )
        midGlow.addColorStop(0, 'rgba(200, 255, 255, 0.9)')
        midGlow.addColorStop(0.5, p.color)
        midGlow.addColorStop(1, 'rgba(0, 255, 200, 0)')
        ctx.fillStyle = midGlow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2)
        ctx.fill()

        // 核心亮点
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
        ctx.fillStyle = 'rgba(220, 255, 255, 0.95)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      // 💎 灵魂宝石（果实 → 水晶）
      appleParticles.forEach((p) => {
        ctx.save()

        // 最外层辉光
        ctx.shadowBlur = 35
        ctx.shadowColor = p.color
        const outerAura = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 4
        )
        outerAura.addColorStop(0, p.color.replace(')', ', 0.5)').replace('hsla', 'hsla').replace('hsl', 'hsla'))
        outerAura.addColorStop(0.5, p.color.replace(')', ', 0.15)').replace('hsla', 'hsla').replace('hsl', 'hsla'))
        outerAura.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = outerAura
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        ctx.fill()

        // 宝石主体（多层渐变模拟切面）
        const gemGradient = ctx.createRadialGradient(
          p.x - p.size * 0.3, p.y - p.size * 0.3, 0,
          p.x, p.y, p.size * 1.2
        )
        gemGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        gemGradient.addColorStop(0.2, p.color)
        gemGradient.addColorStop(0.6, p.color.replace('60%', '40%').replace('50%', '35%'))
        gemGradient.addColorStop(1, p.color.replace('60%', '25%').replace('50%', '20%'))
        ctx.fillStyle = gemGradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2)
        ctx.fill()

        // 宝石高光（模拟切面反光）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.beginPath()
        ctx.ellipse(p.x - p.size * 0.25, p.y - p.size * 0.3, p.size * 0.35, p.size * 0.25, -Math.PI / 4, 0, Math.PI * 2)
        ctx.fill()

        // 次高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.beginPath()
        ctx.ellipse(p.x + p.size * 0.3, p.y + p.size * 0.2, p.size * 0.2, p.size * 0.15, Math.PI / 3, 0, Math.PI * 2)
        ctx.fill()

        // 彩虹光边
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.restore()
      })
    }

    const resize = () => {
      draw()
    }

    window.addEventListener('resize', resize)

    // 🔥 防抖优化：延迟绘制，避免频繁调整参数时卡死
    // 清除之前的定时器
    if (drawTimerRef.current) {
      clearTimeout(drawTimerRef.current)
    }

    // 🔥 确保容器尺寸已就绪再绘制（使用RAF确保DOM渲染完成）
    let retryCount = 0
    const maxRetries = 20  // 最多重试20次（1秒）

    const ensureContainerReady = () => {
      if (!container.clientWidth || !container.clientHeight) {
        retryCount++
        if (retryCount > maxRetries) {
          // 强制使用默认尺寸绘制
          canvas.width = 800
          canvas.height = 800
          draw()
          return
        }

        drawTimerRef.current = setTimeout(() => {
          requestAnimationFrame(ensureContainerReady)
        }, 50)
        return
      }

      retryCount = 0
      draw()
    }

    // 设置新的定时器（使用RAF确保DOM渲染完成）
    if (isPreview || isEmptyTree) {
      // 预览模式和种子状态：立即检查，使用RAF确保容器就绪
      requestAnimationFrame(() => {
        ensureContainerReady()
      })
    } else {
      // 非预览模式延迟300ms（给用户更多调整时间，减少无效计算）
      drawTimerRef.current = setTimeout(() => {
        requestAnimationFrame(ensureContainerReady)
      }, 300)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (drawTimerRef.current) {
        clearTimeout(drawTimerRef.current)
      }
    }
  }, [growthData, techParams, seedOpacity, isEmptyTree, isPreview])

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
