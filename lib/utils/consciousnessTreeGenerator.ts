/**
 * 意识树生成算法 V3 - 递归分形 (Recursive Fractals)
 * 仿生学自然生长效果，完全数据驱动
 *
 * 核心改进：
 * - 5级根系分形结构
 * - 树干动态比例（与根系关联）
 * - 三主枝 + 递归树冠
 * - 优化叶果可见度（增大尺寸、云朵分布）
 * - 伪随机种子（避免闪烁）
 */

// ============ 数据接口 ============
export interface TreeGrowthData {
  roots: {
    count: number;          // 主根数量 (0-20)
    depth_level: number;    // 探索深度 (0-10)，决定递归层级
    is_solid: boolean;
  };
  trunk: {
    thickness: number;      // 基础粗度 (0-50)
    height_level: number;   // 生长高度 (0-100)
    is_solid: boolean;
  };
  branches: {
    count: number;          // 主枝数量 (0-20)，>=3时启用三主枝
    avg_length: number;     // 平均长度 (0-10)
    is_solid: boolean;
  };
  leaves: {
    count: number;          // 叶子数量 (0-50)
    is_solid: boolean;
  };
  fruits: {
    count: number;          // 果实数量 (0-20)
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

// 枝条节点（用于收集叶果挂载点）
interface BranchNode {
  x: number
  y: number
  level: number  // 递归层级
  angle: number  // 生长角度
}

// ============ 伪随机函数 ============
let randomSeed = 0

function seededRandom(): number {
  randomSeed = (randomSeed * 9301 + 49297) % 233280
  return randomSeed / 233280
}

function initSeed(seed: number): void {
  randomSeed = seed
}

function random(min: number, max: number): number {
  return seededRandom() * (max - min) + min
}

// ============ 颜色生成函数 ============
const getColor = (
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
  value: number,    // 归一化值 0-1
  isSolid: boolean,
  glowIntensity: number = 0.5
): string => {
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
      hue = 5
      baseLightness = 45
      baseSaturation = 75
      break
    case 'fruit':
      hue = 8
      baseLightness = 50
      baseSaturation = 80
      break
  }

  // 修复：分类控制最大明度，避免发白
  const maxLightness = type === 'root' ? 55 :
                       type === 'trunk' ? 60 :
                       type === 'branch' ? 65 :
                       type === 'leaf' ? 70 :
                       85  // 果实特别亮

  const lightness = baseLightness + value * (maxLightness - baseLightness)
  const saturation = baseSaturation + value * (100 - baseSaturation)

  // 虚实状态控制透明度
  const baseAlpha = isSolid ? 0.6 : 0.25
  const alpha = baseAlpha * glowIntensity

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

// ============ 虚实线绘制（保持不变）============
const drawLine = (
  particles: Particle[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  isSolid: boolean,
  particleSize: number
) => {
  const dist = Math.hypot(x2 - x1, y2 - y1)

  // 虚实线的粒子间距差异
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

// ============ 通用递归分支函数 ============
const recursiveBranch = (
  particles: Particle[],
  nodes: BranchNode[],
  startX: number,
  startY: number,
  angle: number,         // 角度（度数）
  length: number,        // 长度
  width: number,         // 宽度
  currentDepth: number,  // 当前递归深度
  maxDepth: number,      // 最大递归深度
  color: string,
  isSolid: boolean,
  particleSize: number,
  branchType: 'root' | 'branch',  // 分支类型
  particleLimit: { count: number, max: number }  // 粒子数量控制
) => {
  // 熔断：超出递归深度或粒子数量
  if (currentDepth > maxDepth || length < 3 || particleLimit.count > particleLimit.max) {
    return
  }

  // 计算终点坐标
  const rad = (angle * Math.PI) / 180
  const endX = startX + length * Math.cos(rad)
  const endY = startY + length * Math.sin(rad)

  // 绘制当前分支
  drawLine(particles, startX, startY, endX, endY, width, color, isSolid, particleSize)

  // 估算增加的粒子数
  const dist = Math.hypot(endX - startX, endY - startY)
  const steps = Math.floor(dist / (particleSize * (isSolid ? 0.4 : 3.0)))
  const layers = Math.floor(width / (particleSize * 0.8))
  particleLimit.count += steps * layers

  // 收集节点（用于挂载叶果）
  nodes.push({ x: endX, y: endY, level: currentDepth, angle })

  // 递归生成子分支
  const newLength = length * 0.7
  const newWidth = Math.max(width * 0.6, 0.5)

  if (branchType === 'root') {
    // 根系：每级分2叉
    const angleOffset1 = random(15, 30)
    const angleOffset2 = random(15, 30)

    recursiveBranch(
      particles, nodes, endX, endY,
      angle + angleOffset1, newLength, newWidth,
      currentDepth + 1, maxDepth,
      color, isSolid, particleSize, 'root', particleLimit
    )

    recursiveBranch(
      particles, nodes, endX, endY,
      angle - angleOffset2, newLength, newWidth,
      currentDepth + 1, maxDepth,
      color, isSolid, particleSize, 'root', particleLimit
    )
  } else {
    // 树枝：每级分2-3叉（更自然）
    const numSubBranches = currentDepth < maxDepth - 1 ? 2 : 1

    for (let i = 0; i < numSubBranches; i++) {
      const angleOffset = i === 0 ? random(20, 35) : random(-35, -20)

      recursiveBranch(
        particles, nodes, endX, endY,
        angle + angleOffset, newLength, newWidth,
        currentDepth + 1, maxDepth,
        color, isSolid, particleSize, 'branch', particleLimit
      )
    }
  }
}

// ============ 主生成函数 ============
export const generateConsciousnessTree = (
  params: TreeParams,
  growthData: TreeGrowthData,
  width: number,
  height: number
): Particle[] => {
  const particles: Particle[] = []
  const { particleSize, glowIntensity } = params
  const branchNodes: BranchNode[] = []

  // 初始化伪随机种子（基于数据计算，确保稳定）
  const seed = growthData.roots.count * 1000 +
               growthData.trunk.thickness * 100 +
               growthData.trunk.height_level * 10 +
               growthData.branches.count
  initSeed(seed)

  // 画布中心点
  const centerX = width / 2
  const baseY = height * 0.65

  // 粒子数量熔断控制
  const particleLimit = { count: 0, max: 50000 }

  // ========== 第一步：生成树干 ==========
  const baseHeight = growthData.roots.count * 10  // 有根就有干
  const growHeight = growthData.trunk.height_level * 2.5
  const totalTrunkHeight = Math.max(baseHeight + growHeight, 10)
  const trunkTopY = baseY - totalTrunkHeight

  // 动态粗度：根系越深，树干越稳
  const visualThickness = growthData.trunk.thickness + (growthData.roots.depth_level * 2)
  const trunkWidth = Math.max(visualThickness * 0.8, 1)

  const trunkColor = getColor(
    'trunk',
    Math.min(growthData.trunk.height_level / 100, 1),
    growthData.trunk.is_solid,
    glowIntensity
  )

  // 绘制树干（多层粒子堆叠，确保扎实）
  drawLine(
    particles,
    centerX, baseY,
    centerX, trunkTopY,
    trunkWidth,
    trunkColor,
    growthData.trunk.is_solid,
    particleSize
  )

  // ========== 第二步：生成5级根系分形 ==========
  const rootCount = Math.max(growthData.roots.count, 0)

  if (rootCount > 0) {
    const rootDepth = growthData.roots.depth_level

    // 计算根系递归深度
    let rootMaxDepth = 1
    if (rootDepth > 2) rootMaxDepth = 2
    if (rootDepth > 4) rootMaxDepth = 3
    if (rootDepth > 6) rootMaxDepth = 4
    if (rootDepth > 8) rootMaxDepth = 5

    const rootLength = Math.max(rootDepth * 15, 5)
    const rootColor = getColor(
      'root',
      Math.min(rootDepth / 10, 1),
      growthData.roots.is_solid,
      glowIntensity
    )

    // 在30°-150°扇形区域均匀分布主根
    const angleStart = 30
    const angleEnd = 150
    const angleStep = rootCount > 1 ? (angleEnd - angleStart) / (rootCount - 1) : 0

    const rootNodes: BranchNode[] = []

    for (let i = 0; i < rootCount; i++) {
      const angle = angleStart + angleStep * i + random(-5, 5)
      const rootWidth = Math.max(trunkWidth * 0.5, 0.5)

      recursiveBranch(
        particles, rootNodes,
        centerX, baseY,
        angle, rootLength, rootWidth,
        1, rootMaxDepth,
        rootColor, growthData.roots.is_solid, particleSize,
        'root', particleLimit
      )
    }
  }

  // ========== 第三步：生成"三主枝"树冠 ==========
  const branchCount = Math.max(growthData.branches.count, 0)

  if (branchCount > 0 && totalTrunkHeight > 10) {
    const branchLength = Math.max(growthData.branches.avg_length * 10, 5)

    // 计算树枝递归深度（基于count）
    let branchMaxDepth = 2
    if (branchCount > 3) branchMaxDepth = 3
    if (branchCount > 6) branchMaxDepth = 4
    if (branchCount > 12) branchMaxDepth = 5

    const branchColor = getColor(
      'branch',
      Math.min(growthData.branches.avg_length / 10, 1),
      growthData.branches.is_solid,
      glowIntensity
    )

    const branchWidth = Math.max(trunkWidth * 0.4, 0.5)

    // 三主枝结构
    const mainBranches = [
      { angle: -130, active: branchCount >= 1 },  // 左主枝
      { angle: -50, active: branchCount >= 2 },   // 右主枝
      { angle: -90, active: branchCount >= 3 },   // 中主枝
    ]

    mainBranches.forEach(branch => {
      if (branch.active) {
        recursiveBranch(
          particles, branchNodes,
          centerX, trunkTopY,
          branch.angle, branchLength, branchWidth,
          1, branchMaxDepth,
          branchColor, growthData.branches.is_solid, particleSize,
          'branch', particleLimit
        )
      }
    })
  }

  // ========== 第四步：生成叶子（云朵状分布）==========
  const leafCount = Math.max(growthData.leaves.count, 0)

  if (leafCount > 0 && branchNodes.length > 0) {
    // 增大叶子尺寸（3倍）
    const leafSize = particleSize * 3

    // 叶子颜色
    const leafColor = getColor(
      'leaf',
      leafCount > 10 ? 0.8 : 0.5,
      growthData.leaves.is_solid,
      glowIntensity
    )

    // 只在Level 2+的节点上生成叶子
    const leafNodes = branchNodes.filter(node => node.level >= 2)

    if (leafNodes.length > 0) {
      for (let i = 0; i < leafCount; i++) {
        const node = leafNodes[Math.floor(seededRandom() * leafNodes.length)]

        // 在节点周围生成叶子簇（云朵效果）
        const offsetX = random(-12, 12)
        const offsetY = random(-12, 12)

        // 叶子大小随机差异（增加自然感）
        const sizeVariation = leafSize * random(0.8, 1.2)

        particles.push({
          x: node.x + offsetX,
          y: node.y + offsetY,
          size: sizeVariation,
          color: leafColor
        })
      }
    }
  }

  // ========== 第五步：生成果实（悬挂+高亮）==========
  const fruitCount = Math.max(growthData.fruits.count, 0)

  if (fruitCount > 0 && branchNodes.length > 0) {
    // 增大果实尺寸（4倍）
    const fruitSize = particleSize * 4

    // 果实颜色（高亮）
    const fruitColor = getColor(
      'fruit',
      1.0,  // 最大亮度
      growthData.fruits.is_solid,
      glowIntensity
    )

    // 果实随机悬挂在节点或末梢
    const fruitNodes = branchNodes.filter(node => node.level >= 1)

    if (fruitNodes.length > 0) {
      for (let i = 0; i < fruitCount; i++) {
        const node = fruitNodes[Math.floor(seededRandom() * fruitNodes.length)]

        // 垂挂在枝条下方
        const offsetX = random(-8, 8)
        const offsetY = random(5, 15)  // 向下偏移

        // 果实主粒子
        particles.push({
          x: node.x + offsetX,
          y: node.y + offsetY,
          size: fruitSize,
          color: fruitColor
        })

        // 增加光晕粒子（使其醒目）
        for (let j = 0; j < 3; j++) {
          const haloOffset = random(-fruitSize, fruitSize)
          particles.push({
            x: node.x + offsetX + haloOffset,
            y: node.y + offsetY + haloOffset,
            size: fruitSize * 0.6,
            color: fruitColor.replace(/[\d.]+\)$/, '0.3)')  // 降低光晕透明度
          })
        }
      }
    }
  }

  // ========== 种子状态处理 ==========
  if (
    rootCount === 0 &&
    totalTrunkHeight <= 10 &&
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
