/**
 * 意识树生成算法 V2 - 累积生长制
 * 完全数据驱动的生成逻辑，不再依赖递归深度
 * 颜色方案：纯红色系（暗红→亮红带金边感）
 * 虚实线：通过粒子间距控制
 */

// ============ 新的数据接口 ============
export interface TreeGrowthData {
  roots: {
    count: number;          // 决定生成多少条主根
    depth_level: number;    // 决定根的长度 (0-10)
    is_solid: boolean;      // 决定绘制风格
  };
  trunk: {
    thickness: number;      // 决定树干的基础宽度 (0-50)
    height_level: number;   // 决定树干的总长度 (0-100)
    is_solid: boolean;
  };
  branches: {
    count: number;          // 决定主分叉的数量
    avg_length: number;     // 决定枝条长度 (0-10)
    is_solid: boolean;
  };
  leaves: {
    count: number;          // 决定叶子粒子的总数
    is_solid: boolean;
  };
  fruits: {
    count: number;          // 决定果实粒子的总数
    is_solid: boolean;
  };
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
  particleSize: number        // 基础粒子大小
  glowIntensity: number       // 发光强度 (0-1)
}

// 工具函数：随机数
const random = (min: number, max: number) => Math.random() * (max - min) + min

/**
 * 颜色生成函数
 * 纯红色系：H=0-8°，根据数值控制明度和饱和度
 */
const getColor = (
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
  value: number,    // 归一化值 0-1
  isSolid: boolean,
  glowIntensity: number = 0.5
): string => {
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

  // 根据数值提升明度和饱和度
  const lightness = baseLightness + value * (72 - baseLightness)
  const saturation = baseSaturation + value * (100 - baseSaturation)

  // 虚实状态控制透明度
  const baseAlpha = isSolid ? 0.6 : 0.25
  const alpha = baseAlpha * glowIntensity

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

/**
 * 核心：虚实线绘制
 * 实线：粒子间距小（连续）
 * 虚线：粒子间距大（稀疏）
 */
const drawLine = (
  particles: Particle[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  type: 'root' | 'trunk' | 'branch',
  color: string,
  isSolid: boolean,
  particleSize: number
) => {
  const dist = Math.hypot(x2 - x1, y2 - y1)

  // 关键：虚实线的粒子间距差异
  const stepSize = isSolid ? (particleSize * 0.4) : (particleSize * 3.0)
  const steps = Math.max(Math.floor(dist / stepSize), 1)

  // 根据宽度计算并列层数
  const layers = Math.max(1, Math.floor(width / (particleSize * 0.8)))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const baseX = x1 + (x2 - x1) * t
    const baseY = y1 + (y2 - y1) * t

    // 在宽度范围内并列分布粒子
    for (let layer = 0; layer < layers; layer++) {
      const offset = (layer / Math.max(layers - 1, 1) - 0.5) * width
      const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2
      const px = baseX + offset * Math.cos(angle) + (Math.random() - 0.5) * 1
      const py = baseY + offset * Math.sin(angle) + (Math.random() - 0.5) * 1

      particles.push({ x: px, y: py, size: particleSize, color })
    }
  }
}

/**
 * 生成意识树 V2 - 数据驱动
 */
export const generateConsciousnessTree = (
  params: TreeParams,
  growthData: TreeGrowthData,
  width: number,
  height: number
): Particle[] => {
  const particles: Particle[] = []
  const { particleSize, glowIntensity } = params

  // 画布中心点
  const centerX = width / 2
  const baseY = height * 0.65

  // ========== 第一步：生成树干 ==========
  const trunkThickness = Math.max(growthData.trunk.thickness * 0.8, 1) // 映射到像素宽度
  const trunkHeight = Math.max(growthData.trunk.height_level * 2, 10) // 映射到像素高度
  const trunkTopY = baseY - trunkHeight

  const trunkColor = getColor(
    'trunk',
    growthData.trunk.height_level / 100,
    growthData.trunk.is_solid,
    glowIntensity
  )

  drawLine(
    particles,
    centerX, baseY,
    centerX, trunkTopY,
    trunkThickness,
    'trunk',
    trunkColor,
    growthData.trunk.is_solid,
    particleSize
  )

  // ========== 第二步：生成根系 ==========
  const rootCount = Math.max(growthData.roots.count, 0)
  if (rootCount > 0) {
    const rootLength = Math.max(growthData.roots.depth_level * 15, 5)
    const rootColor = getColor(
      'root',
      growthData.roots.depth_level / 10,
      growthData.roots.is_solid,
      glowIntensity
    )

    // 在180度扇形区域均匀分布
    const angleStart = 210
    const angleEnd = 330
    const angleStep = rootCount > 1 ? (angleEnd - angleStart) / (rootCount - 1) : 0

    for (let i = 0; i < rootCount; i++) {
      const angle = angleStart + angleStep * i + random(-5, 5)
      const rad = (angle * Math.PI) / 180
      const endX = centerX + rootLength * Math.cos(rad)
      const endY = baseY + rootLength * Math.sin(rad)
      const rootWidth = Math.max(trunkThickness * 0.5, 0.5)

      drawLine(
        particles,
        centerX, baseY,
        endX, endY,
        rootWidth,
        'root',
        rootColor,
        growthData.roots.is_solid,
        particleSize
      )

      // 二级根（可选，增加美观度）
      if (growthData.roots.depth_level > 3) {
        const subRootLength = rootLength * 0.5
        const subAngle1 = angle + random(15, 30)
        const subAngle2 = angle - random(15, 30)
        const rad1 = (subAngle1 * Math.PI) / 180
        const rad2 = (subAngle2 * Math.PI) / 180

        drawLine(
          particles,
          endX, endY,
          endX + subRootLength * Math.cos(rad1),
          endY + subRootLength * Math.sin(rad1),
          rootWidth * 0.7,
          'root',
          rootColor,
          growthData.roots.is_solid,
          particleSize
        )

        drawLine(
          particles,
          endX, endY,
          endX + subRootLength * Math.cos(rad2),
          endY + subRootLength * Math.sin(rad2),
          rootWidth * 0.7,
          'root',
          rootColor,
          growthData.roots.is_solid,
          particleSize
        )
      }
    }
  }

  // ========== 第三步：生成枝干 ==========
  const branchCount = Math.max(growthData.branches.count, 0)
  const branchEndpoints: { x: number; y: number }[] = [] // 收集枝条末端，用于挂载叶果

  if (branchCount > 0) {
    const branchLength = Math.max(growthData.branches.avg_length * 8, 5)
    const branchColor = getColor(
      'branch',
      growthData.branches.avg_length / 10,
      growthData.branches.is_solid,
      glowIntensity
    )

    // 在树干顶部30%区域随机生成生长点
    const branchZoneStart = trunkTopY
    const branchZoneEnd = trunkTopY + trunkHeight * 0.3

    for (let i = 0; i < branchCount; i++) {
      const startY = random(branchZoneStart, branchZoneEnd)
      const startX = centerX + random(-trunkThickness * 0.5, trunkThickness * 0.5)

      // 随机角度（左右展开）
      const angle = random(-75, -105) + (i % 2 === 0 ? -30 : 30) + random(-15, 15)
      const rad = (angle * Math.PI) / 180
      const endX = startX + branchLength * Math.cos(rad)
      const endY = startY + branchLength * Math.sin(rad)
      const branchWidth = Math.max(trunkThickness * 0.4, 0.5)

      drawLine(
        particles,
        startX, startY,
        endX, endY,
        branchWidth,
        'branch',
        branchColor,
        growthData.branches.is_solid,
        particleSize
      )

      branchEndpoints.push({ x: endX, y: endY })

      // 二级枝（增加美观度）
      if (growthData.branches.avg_length > 2) {
        const subBranchLength = branchLength * 0.6
        const subAngle = angle + random(-35, 35)
        const subRad = (subAngle * Math.PI) / 180
        const subEndX = endX + subBranchLength * Math.cos(subRad)
        const subEndY = endY + subBranchLength * Math.sin(subRad)

        drawLine(
          particles,
          endX, endY,
          subEndX, subEndY,
          branchWidth * 0.6,
          'branch',
          branchColor,
          growthData.branches.is_solid,
          particleSize
        )

        branchEndpoints.push({ x: subEndX, y: subEndY })
      }
    }
  }

  // ========== 第四步：生成叶与果 ==========

  // 叶子
  const leafCount = Math.max(growthData.leaves.count, 0)
  if (leafCount > 0 && branchEndpoints.length > 0) {
    const leafColor = getColor(
      'leaf',
      leafCount > 5 ? 0.7 : 0.4,
      growthData.leaves.is_solid,
      glowIntensity
    )
    const leafSize = particleSize * 1.5

    for (let i = 0; i < leafCount; i++) {
      const endpoint = branchEndpoints[Math.floor(Math.random() * branchEndpoints.length)]
      const offsetX = random(-8, 8)
      const offsetY = random(-8, 8)

      particles.push({
        x: endpoint.x + offsetX,
        y: endpoint.y + offsetY,
        size: leafSize,
        color: leafColor
      })
    }
  }

  // 果实
  const fruitCount = Math.max(growthData.fruits.count, 0)
  if (fruitCount > 0 && branchEndpoints.length > 0) {
    const fruitColor = getColor(
      'fruit',
      fruitCount > 3 ? 0.8 : 0.5,
      growthData.fruits.is_solid,
      glowIntensity
    )
    const fruitSize = particleSize * 3

    for (let i = 0; i < fruitCount; i++) {
      const endpoint = branchEndpoints[Math.floor(Math.random() * branchEndpoints.length)]
      const offsetX = random(-5, 5)
      const offsetY = random(-5, 5)

      particles.push({
        x: endpoint.x + offsetX,
        y: endpoint.y + offsetY,
        size: fruitSize,
        color: fruitColor
      })
    }
  }

  // ========== 种子状态处理 ==========
  // 如果所有数值都是0，绘制一颗"种子"
  if (
    rootCount === 0 &&
    trunkHeight <= 10 &&
    branchCount === 0 &&
    leafCount === 0 &&
    fruitCount === 0
  ) {
    const seedColor = `hsla(0, 40%, 30%, 0.6)`
    particles.push({
      x: centerX,
      y: baseY,
      size: particleSize * 4,
      color: seedColor
    })
  }

  return particles
}
