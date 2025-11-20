/**
 * 意识树生成算法
 * 基于分形递归生成能量树
 * 颜色方案：纯红色系（暗红→亮红带金边感）
 */

// 意识树5个部位的生长数据
export interface TreeGrowthData {
  roots: { growth_value: number; is_solid: boolean }
  trunk: { growth_value: number; is_solid: boolean }
  branches: { growth_value: number; is_solid: boolean }
  leaves: { growth_value: number; is_solid: boolean }
  fruits: { growth_value: number; is_solid: boolean }
}

// 粒子定义
interface Particle {
  x: number
  y: number
  size: number
  color: string
}

// 树生成参数
export interface TreeParams {
  depth: number // 递归深度
  branchAngle: number // 分支角度
  lengthDecay: number // 长度衰减
  trunkLength: number // 主干长度
  trunkWidth: number // 主干宽度
  rootDepth: number // 根深度
  rootSpread: number // 根展开角度
  particleSize: number // 粒子大小
  glowIntensity: number // 发光强度 (0-1)
  leafDensity: number // 叶子密度
  fruitProbability: number // 果实概率
}

// 工具函数：随机数
const random = (min: number, max: number) => Math.random() * (max - min) + min

/**
 * 颜色生成函数
 * 纯红色系：H=0-8°，通过growth_value控制明度和饱和度
 * @param type 部位类型
 * @param growthValue 成长值 0-100
 * @param isSolid 是否实体
 */
const getColor = (
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
  growthValue: number,
  isSolid: boolean,
  glowIntensity: number = 0.5
): string => {
  // 归一化成长值 0-1
  const normalized = Math.min(100, Math.max(0, growthValue)) / 100

  // 基础色相：红色范围
  let hue = 0
  let baseLightness = 25
  let baseSaturation = 60

  switch (type) {
    case 'root':
      hue = 0
      baseLightness = 25
      baseSaturation = 60
      break
    case 'trunk':
      hue = 0
      baseLightness = 30
      baseSaturation = 65
      break
    case 'branch':
      hue = 0
      baseLightness = 40
      baseSaturation = 70
      break
    case 'leaf':
      hue = 5 // 稍带金感
      baseLightness = 45
      baseSaturation = 75
      break
    case 'fruit':
      hue = 8 // 金边红
      baseLightness = 50
      baseSaturation = 80
      break
  }

  // 根据成长值提升明度和饱和度
  const lightness = baseLightness + normalized * (72 - baseLightness)
  const saturation = baseSaturation + normalized * (100 - baseSaturation)

  // 虚实状态和发光强度共同控制透明度
  const baseAlpha = isSolid ? 0.9 : 0.3
  const alpha = baseAlpha * glowIntensity

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

/**
 * 生成意识树
 */
export const generateConsciousnessTree = (
  params: TreeParams,
  growthData: TreeGrowthData,
  width: number,
  height: number
): Particle[] => {
  const particles: Particle[] = []

  const {
    depth,
    branchAngle,
    lengthDecay,
    trunkLength,
    trunkWidth,
    rootDepth,
    rootSpread,
    particleSize,
    glowIntensity,
    leafDensity,
    fruitProbability,
  } = params

  // 添加粒子
  const addParticle = (
    x: number,
    y: number,
    type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
    sizeMultiplier: number = 1
  ) => {
    let color = ''
    let size = particleSize * sizeMultiplier

    switch (type) {
      case 'root':
        color = getColor('root', growthData.roots.growth_value, growthData.roots.is_solid, glowIntensity)
        break
      case 'trunk':
        color = getColor('trunk', growthData.trunk.growth_value, growthData.trunk.is_solid, glowIntensity)
        break
      case 'branch':
        color = getColor('branch', growthData.branches.growth_value, growthData.branches.is_solid, glowIntensity)
        break
      case 'leaf':
        color = getColor('leaf', growthData.leaves.growth_value, growthData.leaves.is_solid, glowIntensity)
        size *= 1.5
        break
      case 'fruit':
        color = getColor('fruit', growthData.fruits.growth_value, growthData.fruits.is_solid, glowIntensity)
        size *= 3
        break
    }

    particles.push({ x, y, size, color })
  }

  // 绘制线条（粒子组成）- 对标网站简单实现
  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    type: 'root' | 'trunk' | 'branch'
  ) => {
    const dist = Math.hypot(x2 - x1, y2 - y1)
    const steps = Math.max(dist / (particleSize * 0.8), 5) // 对标网站的参数

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const jitter = (Math.random() - 0.5) * width
      const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 2
      const py = y1 + (y2 - y1) * t + jitter

      // 通过增大粒子尺寸实现主干粗壮，而不是增加粒子数量
      addParticle(px, py, type, width / 1.2) // 从width/3改为width/1.2，让主干更粗
    }
  }

  // 递归分支函数
  const branch = (
    x: number,
    y: number,
    len: number,
    angle: number,
    currentDepth: number,
    maxDepth: number,
    isRoot: boolean = false
  ) => {
    if (currentDepth > maxDepth) return

    const endX = x + len * Math.sin((angle * Math.PI) / 180)
    const endY = y - len * Math.cos((angle * Math.PI) / 180)

    const type = isRoot ? 'root' : currentDepth === 1 ? 'trunk' : 'branch'
    const currentWidth = Math.max(trunkWidth * Math.pow(0.7, currentDepth - 1), 0.5)

    drawLine(x, y, endX, endY, currentWidth, type)

    // 叶子和果实（仅外层分支）
    if (!isRoot && currentDepth > maxDepth * 0.6) {
      if (Math.random() < leafDensity) {
        addParticle(endX, endY, 'leaf')
      }
      if (currentDepth === maxDepth && Math.random() < fruitProbability) {
        addParticle(endX, endY, 'fruit')
      }
    }

    // 递归生成子分支
    const newLen = len * lengthDecay

    if (isRoot) {
      const spread = rootSpread * (1 + Math.random() * 0.5)
      branch(endX, endY, newLen, angle + spread, currentDepth + 1, maxDepth, true)
      branch(endX, endY, newLen, angle - spread, currentDepth + 1, maxDepth, true)
    } else {
      const spread = branchAngle
      branch(endX, endY, newLen, angle + spread, currentDepth + 1, maxDepth, false)
      branch(endX, endY, newLen, angle - spread, currentDepth + 1, maxDepth, false)
    }
  }

  // 生成树干（调整起始位置让根部完整显示）
  const startX = width / 2
  const startY = height * 0.65  // 从0.8改为0.65，向上移动让根部有足够空间

  branch(startX, startY, trunkLength, 0, 1, depth, false)

  // 生成根系
  if (rootDepth > 0) {
    branch(startX, startY, trunkLength * 0.6, 180, 1, rootDepth, true)
  }

  return particles
}
