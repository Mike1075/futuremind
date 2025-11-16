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

  // 绘制种子（使用渐变增加立体感）
  ctx.save()
  const seedGradient = ctx.createRadialGradient(x - 3, y - 8, 2, x, y, 15)
  seedGradient.addColorStop(0, '#9B7653')
  seedGradient.addColorStop(0.5, '#6B4423')
  seedGradient.addColorStop(1, '#4A2511')
  ctx.fillStyle = seedGradient
  ctx.beginPath()
  ctx.ellipse(x, y, 12, 18, 0, 0, Math.PI * 2)
  ctx.fill()

  // 种子裂纹细节
  ctx.strokeStyle = 'rgba(80, 50, 30, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x - 2, y - 10)
  ctx.lineTo(x + 1, y + 5)
  ctx.stroke()
  ctx.restore()

  // 绘制根须（渐变粗细 + 分叉）
  const rootLength = 40 + progressInStage * 50
  const rootCount = Math.max(1, Math.floor(progressInStage * 2.5 + 1))

  for (let i = 0; i < rootCount; i++) {
    const angle = (i / (rootCount - 1 || 1) - 0.5) * Math.PI * 0.5
    const endX = x + Math.sin(angle) * rootLength * 0.7
    const endY = y + rootLength

    // 主根（渐变线宽）
    ctx.save()
    const rootGradient = ctx.createLinearGradient(x, y + 15, endX, endY)
    rootGradient.addColorStop(0, 'rgba(230, 200, 170, 0.9)')
    rootGradient.addColorStop(1, 'rgba(200, 170, 140, 0.6)')

    for (let t = 0; t <= 1; t += 0.1) {
      const cx = x + (endX - x) * t
      const cy = (y + 15) + (endY - (y + 15)) * t
      const width = 4 * (1 - t * 0.7) // 根部粗4px，末端细1.2px

      ctx.beginPath()
      ctx.arc(cx, cy, width / 2, 0, Math.PI * 2)
      ctx.fillStyle = rootGradient
      ctx.fill()
    }

    // 侧根（细小分叉）
    if (progressInStage > 0.3) {
      const branchCount = Math.floor(progressInStage * 2)
      for (let j = 0; j < branchCount; j++) {
        const branchT = 0.4 + j * 0.3
        const branchX = x + (endX - x) * branchT
        const branchY = (y + 15) + (endY - (y + 15)) * branchT
        const branchAngle = angle + (j % 2 === 0 ? 0.3 : -0.3)
        const branchLen = rootLength * 0.2
        const branchEndX = branchX + Math.sin(branchAngle) * branchLen
        const branchEndY = branchY + Math.cos(branchAngle) * branchLen

        ctx.strokeStyle = 'rgba(200, 170, 140, 0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(branchX, branchY)
        ctx.quadraticCurveTo(
          branchX + Math.sin(branchAngle) * branchLen * 0.5,
          branchY + branchLen * 0.3,
          branchEndX,
          branchEndY
        )
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  // 柔和的生命光晕
  const glowSize = 60 + progressInStage * 30
  const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
  glowGradient.addColorStop(0, `rgba(140, 200, 120, ${0.2 * progressInStage})`)
  glowGradient.addColorStop(0.5, `rgba(100, 180, 100, ${0.1 * progressInStage})`)
  glowGradient.addColorStop(1, 'rgba(80, 150, 80, 0)')
  ctx.fillStyle = glowGradient
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

  // 绘制根系（渐变粗细 + 分叉）
  const rootLength = 170
  const rootColors = ['#B8860B', '#CD853F', '#D2691E', '#8B4513', '#A0522D']
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4 - 0.5) * Math.PI * 0.85
    const endX = x + Math.sin(angle) * rootLength
    const endY = y + rootLength * 0.9

    // 主根（渐变线宽）
    for (let t = 0; t <= 1; t += 0.05) {
      const cx = x + (endX - x) * t
      const cy = y + (endY - y) * t
      const width = 12 * (1 - t * 0.6) // 根部12px，末端4.8px

      ctx.beginPath()
      ctx.arc(cx, cy, width / 2, 0, Math.PI * 2)
      const rootGrad = ctx.createRadialGradient(cx - width/4, cy - width/4, 0, cx, cy, width)
      rootGrad.addColorStop(0, rootColors[i])
      rootGrad.addColorStop(1, '#4A2511')
      ctx.fillStyle = rootGrad
      ctx.fill()
    }

    // 侧根分叉
    for (let j = 1; j <= 2; j++) {
      const branchT = j * 0.4
      const branchX = x + (endX - x) * branchT
      const branchY = y + (endY - y) * branchT
      const branchAngle = angle + (j % 2 === 0 ? 0.4 : -0.4)
      const branchLen = rootLength * 0.3
      const branchEndX = branchX + Math.sin(branchAngle) * branchLen
      const branchEndY = branchY + Math.cos(branchAngle) * branchLen

      ctx.strokeStyle = `${rootColors[i]}AA`
      ctx.lineWidth = 4 * (1 - branchT * 0.5)
      ctx.beginPath()
      ctx.moveTo(branchX, branchY)
      ctx.quadraticCurveTo(
        branchX + Math.sin(branchAngle) * branchLen * 0.6,
        branchY + branchLen * 0.4,
        branchEndX,
        branchEndY
      )
      ctx.stroke()
    }
  }

  // 绘制树干（渐变 + 树皮纹理）
  const trunkHeight = 160
  const trunkWidth = 25

  // 树干主体（梯形，渐变色）
  ctx.save()
  const trunkGradient = ctx.createLinearGradient(x - trunkWidth/2, 0, x + trunkWidth/2, 0)
  trunkGradient.addColorStop(0, '#3D2817')
  trunkGradient.addColorStop(0.3, '#6B4423')
  trunkGradient.addColorStop(0.7, '#5C3A1F')
  trunkGradient.addColorStop(1, '#2D1810')
  ctx.fillStyle = trunkGradient
  ctx.beginPath()
  ctx.moveTo(x - trunkWidth / 2, y)
  ctx.lineTo(x + trunkWidth / 2, y)
  ctx.lineTo(x + trunkWidth / 3, y - trunkHeight)
  ctx.lineTo(x - trunkWidth / 3, y - trunkHeight)
  ctx.closePath()
  ctx.fill()

  // 树皮纹理（竖条纹）
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 8; i++) {
    const tx = x - trunkWidth/2 + (trunkWidth * i / 8)
    const topTx = x - trunkWidth/3 + ((trunkWidth * 2/3) * i / 8)
    ctx.beginPath()
    ctx.moveTo(tx, y)
    ctx.quadraticCurveTo(
      tx + (topTx - tx) * 0.5 + Math.sin(i) * 2,
      y - trunkHeight * 0.5,
      topTx,
      y - trunkHeight
    )
    ctx.stroke()
  }

  // 树干高光
  ctx.fillStyle = 'rgba(180, 140, 100, 0.15)'
  ctx.beginPath()
  ctx.moveTo(x - trunkWidth / 4, y)
  ctx.lineTo(x - trunkWidth / 6, y)
  ctx.lineTo(x - trunkWidth / 8, y - trunkHeight)
  ctx.lineTo(x - trunkWidth / 6, y - trunkHeight)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // 绘制树冠（多层次渐变圆形营造蓬松感）
  const canopyCenterY = y - trunkHeight - 40
  const baseSize = 110 + progressInStage * 30

  // 后层（较暗）
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + layer * 0.5
      const dist = baseSize * 0.3
      const cx = x + Math.cos(angle) * dist
      const cy = canopyCenterY + Math.sin(angle) * dist * 0.5
      const size = baseSize * (0.5 + layer * 0.15)

      const canopyGrad = ctx.createRadialGradient(cx - size*0.2, cy - size*0.2, 0, cx, cy, size)
      canopyGrad.addColorStop(0, `rgba(${80 + layer * 20}, ${140 + layer * 10}, ${70 + layer * 10}, 0.${7 - layer})`)
      canopyGrad.addColorStop(0.7, `rgba(${50 + layer * 15}, ${110 + layer * 10}, ${50 + layer * 10}, 0.${6 - layer})`)
      canopyGrad.addColorStop(1, `rgba(${30 + layer * 10}, ${80 + layer * 10}, ${40 + layer * 10}, 0)`)

      ctx.fillStyle = canopyGrad
      ctx.beginPath()
      ctx.arc(cx, cy, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 主树冠中心
  const mainCanopyGrad = ctx.createRadialGradient(x - baseSize*0.2, canopyCenterY - baseSize*0.2, 0, x, canopyCenterY, baseSize)
  mainCanopyGrad.addColorStop(0, 'rgba(120, 180, 100, 0.9)')
  mainCanopyGrad.addColorStop(0.5, 'rgba(80, 150, 70, 0.85)')
  mainCanopyGrad.addColorStop(1, 'rgba(50, 120, 50, 0)')
  ctx.fillStyle = mainCanopyGrad
  ctx.beginPath()
  ctx.arc(x, canopyCenterY, baseSize, 0, Math.PI * 2)
  ctx.fill()

  // 绘制叶子簇（分层，有深浅变化）
  const leafLayers = [
    { count: 15, dist: 0.7, size: 14, alpha: 0.6 },  // 后层
    { count: 18, dist: 0.5, size: 16, alpha: 0.8 },  // 中层
    { count: 12, dist: 0.3, size: 18, alpha: 1.0 }   // 前层
  ]

  leafLayers.forEach((layer, layerIdx) => {
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 + layerIdx * 0.3
      const dist = baseSize * layer.dist
      const leafX = x + Math.cos(angle) * dist
      const leafY = canopyCenterY + Math.sin(angle) * dist * 0.8

      const leafGrad = ctx.createRadialGradient(leafX - layer.size*0.3, leafY - layer.size*0.3, 0, leafX, leafY, layer.size)
      leafGrad.addColorStop(0, `rgba(${140 - layerIdx * 20}, ${200 - layerIdx * 10}, ${110 - layerIdx * 20}, ${layer.alpha})`)
      leafGrad.addColorStop(1, `rgba(${70 - layerIdx * 10}, ${140 - layerIdx * 10}, ${60 - layerIdx * 10}, ${layer.alpha * 0.4})`)

      ctx.fillStyle = leafGrad
      ctx.beginPath()
      ctx.ellipse(leafX, leafY, layer.size * 0.8, layer.size * 0.5, angle + Math.PI/4, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // 绘制成熟果实（渐变光泽感）
  const fruitCount = 6 + Math.floor(progressInStage * 3)
  for (let i = 0; i < fruitCount; i++) {
    const angle = (i / fruitCount) * Math.PI * 2 + Math.PI / 3
    const dist = baseSize * (0.4 + (i % 2) * 0.2)
    const fruitX = x + Math.cos(angle) * dist
    const fruitY = canopyCenterY + Math.sin(angle) * dist * 0.7

    // 果实阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(fruitX + 2, fruitY + 2, 8, 0, Math.PI * 2)
    ctx.fill()

    // 果实主体（渐变）
    const fruitGrad = ctx.createRadialGradient(fruitX - 3, fruitY - 3, 0, fruitX, fruitY, 8)
    fruitGrad.addColorStop(0, '#FF6B6B')
    fruitGrad.addColorStop(0.6, '#DC3545')
    fruitGrad.addColorStop(1, '#8B1E2F')
    ctx.fillStyle = fruitGrad
    ctx.beginPath()
    ctx.arc(fruitX, fruitY, 8, 0, Math.PI * 2)
    ctx.fill()

    // 果实高光
    const highlightGrad = ctx.createRadialGradient(fruitX - 2.5, fruitY - 2.5, 0, fruitX - 2, fruitY - 2, 3.5)
    highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    highlightGrad.addColorStop(1, 'rgba(255, 200, 200, 0)')
    ctx.fillStyle = highlightGrad
    ctx.beginPath()
    ctx.arc(fruitX - 2, fruitY - 2, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}
