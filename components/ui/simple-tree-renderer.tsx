'use client'

import { useRef, useEffect } from 'react'
import { getTreeStage, getTreeScaling, type TreeStage } from '@/lib/consciousness/tree-stage-config'

interface SimpleTreeRendererProps {
  levelProgress: number
  consciousnessLevel: number
  domainDepths: {
    self_awareness: number
    life_sciences: number
    universal_laws: number
    creative_expression: number
    social_connection: number
  }
}

export function SimpleTreeRenderer({
  levelProgress,
  consciousnessLevel,
  domainDepths
}: SimpleTreeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 清空画布
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 获取当前阶段和缩放参数
    const stage = getTreeStage(levelProgress)
    const scaling = getTreeScaling(levelProgress)

    // 画布中心点
    const centerX = canvas.width / 2
    const groundY = canvas.height * 0.6 // 地面线（60%位置）

    // 绘制地平线
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(canvas.width, groundY)
    ctx.stroke()

    // 根据阶段绘制不同的树形态
    switch (stage) {
      case 'seed':
        drawSeedStage(ctx, centerX, groundY, levelProgress, scaling)
        break
      case 'sprout':
        drawSproutStage(ctx, centerX, groundY, levelProgress, scaling)
        break
      case 'seedling':
        drawSeedlingStage(ctx, centerX, groundY, levelProgress, scaling)
        break
      case 'young':
        drawYoungStage(ctx, centerX, groundY, levelProgress, scaling, domainDepths)
        break
      case 'mature':
        drawMatureStage(ctx, centerX, groundY, levelProgress, scaling, domainDepths)
        break
    }
  }, [levelProgress, consciousnessLevel, domainDepths])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
    />
  )
}

// ========== 种子期 (0-20%) ==========
function drawSeedStage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  scaling: any
) {
  const progressInStage = progress / 20 // 0-1

  // 绘制种子
  ctx.save()
  ctx.fillStyle = 'rgba(139, 90, 43, 0.95)' // 棕色种子
  ctx.beginPath()
  ctx.ellipse(x, y - 5, 10, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  // 种子高光
  ctx.fillStyle = 'rgba(180, 140, 100, 0.6)'
  ctx.beginPath()
  ctx.ellipse(x - 3, y - 8, 4, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 绘制根须（随进度生长）
  // 基础长度15px + 进度增长45px，确保0%时也能看到根须
  const rootLength = 15 + progressInStage * 45 // 15px-60px
  const rootCount = Math.max(1, Math.floor(progressInStage * 2.5 + 1)) // 1-3根

  for (let i = 0; i < rootCount; i++) {
    const angle = (i / (rootCount - 1 || 1) - 0.5) * Math.PI * 0.4 // 分散角度
    const endX = x + Math.sin(angle) * rootLength * 0.5
    const endY = y + rootLength

    ctx.save()
    ctx.strokeStyle = `rgba(150, 100, 50, ${0.5 + progressInStage * 0.4})` // 提高可见度
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y + 5)
    // 使用二次贝塞尔曲线画弯曲的根
    ctx.quadraticCurveTo(
      x + Math.sin(angle) * 10,
      y + 20,
      endX,
      endY
    )
    ctx.stroke()
    ctx.restore()
  }

  // 生命光晕
  const glowSize = 40 + progressInStage * 20
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
  gradient.addColorStop(0, `rgba(100, 200, 100, ${0.15 * progressInStage})`)
  gradient.addColorStop(1, 'rgba(100, 200, 100, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2)
}

// ========== 发芽期 (20-40%) ==========
function drawSproutStage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  scaling: any
) {
  const progressInStage = (progress - 20) / 20 // 0-1

  // 绘制根系（更发达）
  const rootLength = 60 + progressInStage * 30
  for (let i = 0; i < 3; i++) {
    const angle = (i / 2 - 0.5) * Math.PI * 0.5
    const endX = x + Math.sin(angle) * rootLength * 0.6
    const endY = y + rootLength

    ctx.save()
    ctx.strokeStyle = `rgba(139, 90, 43, ${0.6 + progressInStage * 0.2})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.sin(angle) * 15,
      y + 30,
      endX,
      endY
    )
    ctx.stroke()
    ctx.restore()
  }

  // 绘制极细的茎（向上生长）
  const stemHeight = progressInStage * 40 // 最高40px
  ctx.save()
  ctx.strokeStyle = `rgba(150, 200, 100, ${0.7 + progressInStage * 0.3})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - stemHeight)
  ctx.stroke()
  ctx.restore()

  // 绘制2片子叶（圆形）
  if (progressInStage > 0.3) {
    const cotyledonSize = (progressInStage - 0.3) / 0.7 * 15 // 最大15px
    const cotyledonY = y - stemHeight

    // 左边子叶
    ctx.save()
    ctx.fillStyle = `rgba(180, 220, 140, ${0.7 + progressInStage * 0.3})`
    ctx.beginPath()
    ctx.ellipse(x - 10, cotyledonY - 5, cotyledonSize * 0.8, cotyledonSize * 0.5, -Math.PI / 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 右边子叶
    ctx.save()
    ctx.fillStyle = `rgba(180, 220, 140, ${0.7 + progressInStage * 0.3})`
    ctx.beginPath()
    ctx.ellipse(x + 10, cotyledonY - 5, cotyledonSize * 0.8, cotyledonSize * 0.5, Math.PI / 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ========== 幼苗期 (40-60%) ==========
function drawSeedlingStage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  scaling: any
) {
  const progressInStage = (progress - 40) / 20 // 0-1

  // 绘制根系
  const rootLength = 90 + progressInStage * 40
  for (let i = 0; i < 4; i++) {
    const angle = (i / 3 - 0.5) * Math.PI * 0.6
    const endX = x + Math.sin(angle) * rootLength * 0.7
    const endY = y + rootLength

    ctx.save()
    ctx.strokeStyle = `rgba(139, 90, 43, ${0.7 + progressInStage * 0.15})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.sin(angle) * 20,
      y + 40,
      endX,
      endY
    )
    ctx.stroke()
    ctx.restore()
  }

  // 绘制茎（变粗）
  const stemHeight = 40 + progressInStage * 60
  ctx.save()
  ctx.strokeStyle = `rgba(120, 160, 80, 0.9)`
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - stemHeight)
  ctx.stroke()
  ctx.restore()

  // 子叶（开始枯萎 - 透明度降低，颜色变灰黄）
  const cotyledonOpacity = 1 - progressInStage * 0.7 // 逐渐透明
  const cotyledonY = y - 40

  ctx.save()
  // 左边子叶（枯萎）
  ctx.fillStyle = `rgba(180, 180, 100, ${cotyledonOpacity * 0.6})`
  ctx.beginPath()
  ctx.ellipse(x - 10, cotyledonY, 12, 6, -Math.PI / 6, 0, Math.PI * 2)
  ctx.fill()

  // 右边子叶（枯萎）
  ctx.fillStyle = `rgba(180, 180, 100, ${cotyledonOpacity * 0.6})`
  ctx.beginPath()
  ctx.ellipse(x + 10, cotyledonY, 12, 6, Math.PI / 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 真叶（一对对长出）
  const trueLeafCount = Math.floor(progressInStage * 4) * 2 // 2,4,6,8片
  for (let i = 0; i < trueLeafCount; i++) {
    const pairIndex = Math.floor(i / 2)
    const leafY = y - 50 - pairIndex * 20
    const leafX = x + (i % 2 === 0 ? -15 : 15)
    const leafSize = 8 + pairIndex * 2

    ctx.save()
    ctx.fillStyle = `rgba(100, 180, 80, 0.85)`
    ctx.beginPath()
    ctx.ellipse(leafX, leafY, leafSize, leafSize * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ========== 小树期 (60-80%) ==========
function drawYoungStage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  scaling: any,
  domains: any
) {
  const progressInStage = (progress - 60) / 20 // 0-1

  // 绘制根系（5根主根）
  const rootLength = 130
  const rootColors = ['#B8860B', '#CD853F', '#D2691E', '#8B4513', '#A0522D']
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4 - 0.5) * Math.PI * 0.7
    const endX = x + Math.sin(angle) * rootLength * 0.8
    const endY = y + rootLength

    ctx.save()
    ctx.strokeStyle = rootColors[i]
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.sin(angle) * 30,
      y + 50,
      endX,
      endY
    )
    ctx.stroke()
    ctx.restore()
  }

  // 绘制树干（明显变粗）
  const trunkHeight = 100 + progressInStage * 50
  const trunkWidth = 12
  ctx.save()
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight)
  ctx.restore()

  // 绘制树冠（圆形 + 真叶）
  const canopySize = 60 + progressInStage * 40
  ctx.save()
  ctx.fillStyle = 'rgba(80, 150, 60, 0.7)'
  ctx.beginPath()
  ctx.arc(x, y - trunkHeight - 20, canopySize, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 在树冠上绘制多个叶子
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const leafDist = canopySize * 0.7
    const leafX = x + Math.cos(angle) * leafDist
    const leafY = y - trunkHeight - 20 + Math.sin(angle) * leafDist

    ctx.save()
    ctx.fillStyle = 'rgba(100, 180, 80, 0.9)'
    ctx.beginPath()
    ctx.ellipse(leafX, leafY, 10, 6, angle, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 绘制花蕾（小圆点）
  if (progressInStage > 0.5) {
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      const budX = x + Math.cos(angle) * canopySize * 0.5
      const budY = y - trunkHeight - 20 + Math.sin(angle) * canopySize * 0.5

      ctx.save()
      ctx.fillStyle = 'rgba(255, 200, 200, 0.8)'
      ctx.beginPath()
      ctx.arc(budX, budY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
}

// ========== 大树期 (80-100%) ==========
function drawMatureStage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  scaling: any,
  domains: any
) {
  const progressInStage = (progress - 80) / 20 // 0-1

  // 绘制根系（粗壮的5根主根）
  const rootLength = 160
  const rootColors = ['#B8860B', '#CD853F', '#D2691E', '#8B4513', '#A0522D']
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4 - 0.5) * Math.PI * 0.8
    const endX = x + Math.sin(angle) * rootLength * 0.9
    const endY = y + rootLength

    ctx.save()
    ctx.strokeStyle = rootColors[i]
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.sin(angle) * 40,
      y + 60,
      endX,
      endY
    )
    ctx.stroke()
    ctx.restore()
  }

  // 绘制粗壮树干
  const trunkHeight = 150
  const trunkWidth = 20
  ctx.save()
  ctx.fillStyle = '#654321'
  // 梯形树干（下宽上窄）
  ctx.beginPath()
  ctx.moveTo(x - trunkWidth / 2, y)
  ctx.lineTo(x + trunkWidth / 2, y)
  ctx.lineTo(x + trunkWidth / 3, y - trunkHeight)
  ctx.lineTo(x - trunkWidth / 3, y - trunkHeight)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // 绘制树冠（大圆形）
  const canopySize = 100 + progressInStage * 30
  ctx.save()
  ctx.fillStyle = 'rgba(60, 130, 50, 0.8)'
  ctx.beginPath()
  ctx.arc(x, y - trunkHeight - 30, canopySize, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 绘制大量叶子
  for (let i = 0; i < 25; i++) {
    const angle = (i / 25) * Math.PI * 2
    const leafDist = canopySize * (0.5 + Math.random() * 0.4)
    const leafX = x + Math.cos(angle) * leafDist
    const leafY = y - trunkHeight - 30 + Math.sin(angle) * leafDist

    ctx.save()
    ctx.fillStyle = `rgba(80, ${150 + Math.random() * 40}, 60, 0.9)`
    ctx.beginPath()
    ctx.ellipse(leafX, leafY, 12, 7, angle, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 绘制成熟果实（红色圆形）
  const fruitCount = 5 + Math.floor(progressInStage * 3)
  for (let i = 0; i < fruitCount; i++) {
    const angle = (i / fruitCount) * Math.PI * 2 + Math.PI / 4
    const fruitDist = canopySize * 0.6
    const fruitX = x + Math.cos(angle) * fruitDist
    const fruitY = y - trunkHeight - 30 + Math.sin(angle) * fruitDist

    ctx.save()
    ctx.fillStyle = 'rgba(220, 50, 50, 0.9)'
    ctx.beginPath()
    ctx.arc(fruitX, fruitY, 6, 0, Math.PI * 2)
    ctx.fill()
    // 果实高光
    ctx.fillStyle = 'rgba(255, 150, 150, 0.6)'
    ctx.beginPath()
    ctx.arc(fruitX - 2, fruitY - 2, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
