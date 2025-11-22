/**
 * 意识树生成算法 V4 - 数字植物学生长系统 (Digital Botany Growth System)
 *
 * 核心理念：
 * - 阶梯式分形消耗逻辑（根系）
 * - 生物力学比例（树干对数增长）
 * - 预算消耗与形态学（枝条侧枝/分叉）
 * - 形态多样性（叶子/果实/旋转）
 * - 伪随机种子系统（稳定生成）
 */

// ============ 数据接口 ============
export interface TreeGrowthData {
  roots: {
    count: number          // 领域数量 (0-∞)，驱动溢出升级
    depth_level: number    // 探索深度 (0-10)
    is_solid: boolean
  }
  trunk: {
    thickness: number      // 粗度 (0-50)
    height_level: number   // 生长进度 (0-100)
    is_solid: boolean
  }
  branches: {
    count: number          // 生长预算 (0-∞)
    avg_length: number     // 平均长度 (0-10)
    is_solid: boolean
  }
  leaves: {
    count: number          // 叶子数量 (0-∞)
    is_solid: boolean
  }
  fruits: {
    count: number          // 果实数量 (0-∞)
    is_solid: boolean
  }
}

// 粒子定义（增强版，支持形状和旋转）
export interface Particle {
  x: number
  y: number
  size: number
  color: string
  shape?: 'circle' | 'leaf' | 'apple'  // 形状类型
  rotation?: number                      // 旋转角度（度）
}

// 树生成参数
export interface TreeParams {
  particleSize: number        // 基础粒子大小
  glowIntensity: number       // 发光强度 (0-1)
}

// 根节点（用于多级生长）
interface RootNode {
  x: number
  y: number
  level: number  // 当前级别 (1-5)
  angle: number  // 生长角度
  length: number // 当前长度
  width: number  // 当前粗度
}

// 枝条节点（用于预算消耗）
interface BranchNode {
  x: number
  y: number
  level: number      // 递归深度
  angle: number      // 生长角度
  length: number     // 剩余长度
  width: number      // 粗度
  isOpen: boolean    // 是否可以继续生长
  sideShootCount: number  // 已有侧枝数量
}

// ============ 伪随机系统 ============
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

// ============ 颜色系统：暗红到亮红 ============
const getColor = (
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
  depth: number,     // 深度/成熟度 (0-1)，0=内部暗，1=外部亮
  isSolid: boolean,
  glowIntensity: number = 0.5
): string => {
  const hue = 0  // 全部使用红色
  let saturation = 70
  let lightness = 20  // 默认暗红

  switch (type) {
    case 'root':
      // 根部：暗红 20% → 30%
      lightness = 20 + depth * 10
      break
    case 'trunk':
      // 树干：20% → 40%
      lightness = 20 + depth * 20
      break
    case 'branch':
      // 枝条：30% → 55%
      lightness = 30 + depth * 25
      break
    case 'leaf':
      // 叶子：40% → 60%（较亮）
      lightness = 40 + depth * 20
      saturation = 80
      break
    case 'fruit':
      // 果实：55% → 60%（最亮，仅成熟部分发光）
      lightness = Math.min(55 + depth * 5, 60)
      saturation = 90
      break
  }

  const alpha = isSolid ? 0.9 : 0.4

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

// ============ 绘制直线（粒子化） ============
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
): void => {
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  const steps = isSolid ? Math.ceil(distance / (particleSize * 0.8)) : Math.ceil(distance / (particleSize * 3))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t

    // 🔥 使用粗粒子而非多层填充，避免发光叠加过强
    const size = Math.max(width / 2, 1) * (isSolid ? 1 : 0.5)

    particles.push({ x, y, size, color, shape: 'circle' })
  }
}

// ============ 辅助函数：平滑的主根数量增长 ============
const calculateMainRootCount = (count: number): number => {
  // 🔥 更平滑的增长曲线（每3-5个count增加1个主根）
  // 避免突然从2个主根跳到3个主根带来大量分叉
  if (count <= 3) return 1
  if (count <= 6) return 2
  if (count <= 10) return 3
  if (count <= 15) return 4
  if (count <= 20) return 5   // count=16时5个主根，避免突变
  if (count <= 30) return 6
  if (count <= 45) return 7
  if (count <= 60) return 8
  if (count <= 70) return 9
  return Math.min(10, Math.ceil(count / 8))
}

// ============ 辅助函数：根据count计算平均递归深度 ============
const calculateAverageDepth = (count: number): number => {
  // 🔥 平均深度（基础值），每个主根会在此基础上±1浮动
  // 这样总末端数 ≈ mainRootCount × 2^avgDepth
  if (count <= 6) return 2   // 4个末端/根
  if (count <= 15) return 3  // 8个末端/根
  if (count <= 30) return 4  // 16个末端/根
  if (count <= 60) return 5  // 32个末端/根
  return 6                   // 64个末端/根
}

// ============ 纯递归函数：生成对称二叉树根系 ============
const drawRootRecursive = (
  particles: Particle[],
  x: number,              // 起点x
  y: number,              // 起点y
  angle: number,          // 生长角度（度）
  length: number,         // 当前段长度
  width: number,          // 当前段粗度
  level: number,          // 当前层级（从1开始）
  maxLevel: number,       // 最大层级
  isSolid: boolean,       // 是否实线
  particleSize: number,
  glowIntensity: number
): void => {
  // 递归终止条件
  if (level > maxLevel || length < 5) return

  // 1. 计算终点
  const endX = x + Math.cos((angle * Math.PI) / 180) * length
  const endY = y + Math.sin((angle * Math.PI) / 180) * length

  // 2. 计算颜色深度（根据层级）
  const depth = Math.min((level - 1) * 0.05, 0.25)  // 0.0 → 0.25
  const color = getColor('root', depth, isSolid, glowIntensity)

  // 3. 绘制当前线段
  drawLine(particles, x, y, endX, endY, width, color, isSolid, particleSize)

  // 4. 递归生成左右子树（强制对称分叉）
  const newLength = length * 0.75  // 🔥 统一衰减比例
  const newWidth = Math.max(width * 0.7, 0.8)  // 🔥 统一粗度衰减，最小0.8px
  const spread = 40  // 🔥 统一分叉角度

  // 左分支
  drawRootRecursive(
    particles,
    endX,
    endY,
    angle - spread,
    newLength,
    newWidth,
    level + 1,
    maxLevel,
    isSolid,
    particleSize,
    glowIntensity
  )

  // 右分支
  drawRootRecursive(
    particles,
    endX,
    endY,
    angle + spread,
    newLength,
    newWidth,
    level + 1,
    maxLevel,
    isSolid,
    particleSize,
    glowIntensity
  )
}

// ============ 1. 根系：混合深度策略 + 扇形分布（方案E） ============
const generateRoots = (
  particles: Particle[],
  centerX: number,
  baseY: number,
  trunkWidth: number,
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): RootNode[] => {
  const totalCount = growthData.roots.count
  const isSolid = growthData.roots.is_solid
  const rootNodes: RootNode[] = []

  if (totalCount === 0) return rootNodes

  // 🔥 方案E-步骤1：计算主根数量（更平滑的增长）
  const mainRootCount = calculateMainRootCount(totalCount)

  // 🔥 方案E-步骤2：计算平均深度（基础值）
  const avgDepth = calculateAverageDepth(totalCount)

  // 🔥 方案E-步骤3：计算基础参数
  const baseLength = 50 + growthData.roots.depth_level * 15  // 基础长度
  const baseWidth = Math.max(growthData.roots.depth_level * 2, 3)  // 基础粗度

  // 🔥 方案E-步骤4：生成主根（150°扇形分布）
  const totalSpread = 150  // 扇形总角度
  const startAngle = 90 - totalSpread / 2  // 起始角度 15°
  const angleStep = totalSpread / (mainRootCount + 1)  // 均匀间隔

  for (let i = 0; i < mainRootCount; i++) {
    // 计算主根角度
    const angle = startAngle + (i + 1) * angleStep

    // 起点：从树干底部发出（稍微偏离中心）
    const radiusOffset = Math.max(trunkWidth / 4, 5)
    const offsetAngle = angle - 90
    const startX = centerX + Math.cos((offsetAngle * Math.PI) / 180) * radiusOffset
    const startY = baseY

    // 🔥 方案E-步骤5：每个主根深度略有不同（±1浮动）
    // 这样视觉上有层次感，总末端数更接近count
    const depthVariation = Math.floor(random(-1, 2))  // -1, 0, 1
    const rootDepth = Math.max(2, avgDepth + depthVariation)

    // 为每个主根调用纯递归函数生成子树
    drawRootRecursive(
      particles,
      startX,
      startY,
      angle,
      baseLength * random(0.9, 1.1),  // 稍微随机化初始长度
      baseWidth,
      1,  // 从第1层开始
      rootDepth,  // 🔥 每个主根深度不同！
      isSolid,
      particleSize,
      glowIntensity
    )

    // 记录主根末端（保留接口兼容性）
    const endX = startX + Math.cos((angle * Math.PI) / 180) * baseLength
    const endY = startY + Math.sin((angle * Math.PI) / 180) * baseLength
    rootNodes.push({ x: endX, y: endY, level: 1, angle, length: baseLength, width: baseWidth })
  }

  return rootNodes
}

// ============ 2. 树干：生物力学比例（对数增长，体积填充） ============
const generateTrunk = (
  particles: Particle[],
  centerX: number,
  baseY: number,
  growthData: TreeGrowthData,
  totalRootCount: number,
  particleSize: number,
  glowIntensity: number
): { topX: number; topY: number; trunkWidth: number } => {
  const thickness = growthData.trunk.thickness
  const isSolid = growthData.trunk.is_solid

  // 生物力学公式
  const BaseHeight = 100
  const GrowthFactor = Math.log(totalRootCount + 1) * 50
  const UserProgress = growthData.trunk.height_level / 100
  const FinalHeight = (BaseHeight + GrowthFactor) * UserProgress

  const topX = centerX
  const topY = baseY - FinalHeight

  // 🔥 核心修复：直接使用thickness值作为像素宽度，不再除以10！
  const BaseTrunkWidth = Math.max(thickness, 2)

  // 关键：thickness > 0 绘制实线，thickness == 0 绘制虚线
  const drawSolid = thickness > 0 && isSolid

  const color = getColor('trunk', UserProgress, drawSolid, glowIntensity)

  // 使用粗粒子绘制树干
  drawLine(
    particles,
    centerX,
    baseY,
    topX,
    topY,
    BaseTrunkWidth,
    color,
    drawSolid,
    particleSize
  )

  return { topX, topY, trunkWidth: BaseTrunkWidth }
}

// ============ 3. 枝条：预算消耗与形态学（横截面分布） ============
const generateBranches = (
  particles: Particle[],
  trunkTopX: number,
  trunkTopY: number,
  trunkWidth: number,  // 新增：树干宽度，用于横截面分布
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): BranchNode[] => {
  let budget = growthData.branches.count
  const baseLength = growthData.branches.avg_length * 10
  const isSolid = growthData.branches.is_solid

  const branchNodes: BranchNode[] = []

  // 阶段1：三主枝（预算1-3点）
  const mainBranches = [
    { angle: -130, name: '左' },
    { angle: -50, name: '右' },
    { angle: -90, name: '中' },
  ]

  for (let i = 0; i < Math.min(3, budget); i++) {
    const branch = mainBranches[i]
    const length = baseLength * random(0.8, 1.2)
    const width = Math.max(trunkWidth * 0.6, 2)  // 粗度为树干的60%

    // 横截面分布：起点在树干顶部圆形范围内随机
    const originOffsetX = random(-trunkWidth / 2, trunkWidth / 2)
    const startX = trunkTopX + originOffsetX
    const startY = trunkTopY

    const endX = startX + Math.cos((branch.angle * Math.PI) / 180) * length
    const endY = startY + Math.sin((branch.angle * Math.PI) / 180) * length

    const color = getColor('branch', 0.3, isSolid, glowIntensity)
    drawLine(particles, startX, startY, endX, endY, width, color, isSolid, particleSize)

    branchNodes.push({
      x: endX,
      y: endY,
      level: 1,
      angle: branch.angle,
      length,
      width,
      isOpen: true,
      sideShootCount: 0,
    })

    budget--
  }

  // 阶段2：侧枝与分叉（粗度递减）
  while (budget > 0) {
    // 优先填满侧枝
    const openNodes = branchNodes.filter(n => n.isOpen && n.sideShootCount < 2)

    if (openNodes.length === 0) break

    const parentNode = openNodes[Math.floor(random(0, openNodes.length))]

    // 规则A：侧枝（消耗1点）
    if (parentNode.sideShootCount < 2 && budget >= 1) {
      const sideAngle = parentNode.angle + random(-45, 45)
      const sideLength = parentNode.length * 0.6 * random(0.7, 1.0)
      const sideWidth = Math.max(parentNode.width * 0.6, 1)  // 粗度递减60%，最小1px

      // 在中段生成侧枝
      const midX = parentNode.x - Math.cos((parentNode.angle * Math.PI) / 180) * (parentNode.length * 0.5)
      const midY = parentNode.y - Math.sin((parentNode.angle * Math.PI) / 180) * (parentNode.length * 0.5)

      const endX = midX + Math.cos((sideAngle * Math.PI) / 180) * sideLength
      const endY = midY + Math.sin((sideAngle * Math.PI) / 180) * sideLength

      const depth = Math.min((parentNode.level + 1) / 6, 1)
      const color = getColor('branch', depth, isSolid, glowIntensity)
      drawLine(particles, midX, midY, endX, endY, sideWidth, color, isSolid, particleSize)

      branchNodes.push({
        x: endX,
        y: endY,
        level: parentNode.level + 1,
        angle: sideAngle,
        length: sideLength,
        width: sideWidth,
        isOpen: true,
        sideShootCount: 0,
      })

      parentNode.sideShootCount++
      budget--
    }
    // 规则B：分叉（消耗2点）
    else if (parentNode.sideShootCount >= 2 && budget >= 2) {
      const fork1Angle = parentNode.angle + random(-25, -10)
      const fork2Angle = parentNode.angle + random(10, 25)
      const forkLength = parentNode.length * 0.5
      const forkWidth = Math.max(parentNode.width * 0.6, 1)  // 粗度递减60%，最小1px

      for (const angle of [fork1Angle, fork2Angle]) {
        const endX = parentNode.x + Math.cos((angle * Math.PI) / 180) * forkLength
        const endY = parentNode.y + Math.sin((angle * Math.PI) / 180) * forkLength

        const depth = Math.min((parentNode.level + 1) / 6, 1)
        const color = getColor('branch', depth, isSolid, glowIntensity)
        drawLine(particles, parentNode.x, parentNode.y, endX, endY, forkWidth, color, isSolid, particleSize)

        branchNodes.push({
          x: endX,
          y: endY,
          level: parentNode.level + 1,
          angle,
          length: forkLength,
          width: forkWidth,
          isOpen: true,
          sideShootCount: 0,
        })
      }

      parentNode.isOpen = false
      budget -= 2
    } else {
      // 无法继续，退出循环
      break
    }
  }

  return branchNodes
}

// ============ 4. 树叶：随机附着在实线枝条上 ============
const generateLeaves = (
  particles: Particle[],
  branchNodes: BranchNode[],
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): void => {
  const leafCount = growthData.leaves.count
  const isSolid = growthData.leaves.is_solid

  if (leafCount === 0 || branchNodes.length === 0) return

  // 只附着在实线枝条上
  const solidNodes = isSolid ? branchNodes : branchNodes.filter(() => random(0, 1) > 0.5)

  for (let i = 0; i < leafCount; i++) {
    if (solidNodes.length === 0) break

    const node = solidNodes[Math.floor(random(0, solidNodes.length))]
    const offsetX = random(-10, 10)
    const offsetY = random(-10, 10)

    const depth = Math.min(node.level / 6, 1)
    const color = getColor('leaf', depth, isSolid, glowIntensity)
    const size = particleSize * random(1.5, 2.5)
    const rotation = random(0, 360)

    particles.push({
      x: node.x + offsetX,
      y: node.y + offsetY,
      size,
      color,
      shape: 'leaf',
      rotation,
    })
  }
}

// ============ 5. 果实：附着在叶子附近或枝条节点上 ============
const generateFruits = (
  particles: Particle[],
  branchNodes: BranchNode[],
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): void => {
  const fruitCount = growthData.fruits.count
  const isSolid = growthData.fruits.is_solid

  if (fruitCount === 0 || branchNodes.length === 0) return

  const matureNodes = branchNodes.filter(n => n.level >= 2)

  for (let i = 0; i < fruitCount; i++) {
    if (matureNodes.length === 0) break

    const node = matureNodes[Math.floor(random(0, matureNodes.length))]
    const offsetX = random(-8, 8)
    const offsetY = random(5, 15)  // 果实垂挂在下方

    const depth = Math.min(node.level / 6, 1)
    const color = getColor('fruit', depth, isSolid, glowIntensity)
    const size = particleSize * random(2.5, 3.5)

    particles.push({
      x: node.x + offsetX,
      y: node.y + offsetY,
      size,
      color,
      shape: 'apple',
    })
  }
}

// ============ 主函数：生成意识树 ============
export function generateConsciousnessTree(
  params: TreeParams,
  growthData: TreeGrowthData,
  canvasWidth: number,
  canvasHeight: number
): Particle[] {
  const particles: Particle[] = []

  // 🔥 修复：使用固定种子，确保相同配置下树的形态稳定
  // 不使用count等可变参数，避免调整参数时已有部分跳动
  const seed = 12345
  initSeed(seed)

  const centerX = canvasWidth / 2
  const baseY = canvasHeight * 0.65

  // 🔥 新顺序：先生成树干（获取宽度），再用宽度生成根系和枝条

  // 1. 预计算根系数量（用于对数增长公式）
  const estimatedRootCount = growthData.roots.count

  // 2. 生成树干（对数增长，返回宽度）
  const { topX, topY, trunkWidth } = generateTrunk(
    particles,
    centerX,
    baseY,
    growthData,
    estimatedRootCount,
    params.particleSize,
    params.glowIntensity
  )

  // 3. 生成根系（使用树干宽度进行横截面分布）
  const rootNodes = generateRoots(
    particles,
    centerX,
    baseY,
    trunkWidth,  // 传入树干宽度
    growthData,
    params.particleSize,
    params.glowIntensity
  )

  // 4. 生成枝条（使用树干宽度进行横截面分布）
  const branchNodes = generateBranches(
    particles,
    topX,
    topY,
    trunkWidth,  // 传入树干宽度
    growthData,
    params.particleSize,
    params.glowIntensity
  )

  // 4. 生成树叶
  generateLeaves(particles, branchNodes, growthData, params.particleSize, params.glowIntensity)

  // 5. 生成果实
  generateFruits(particles, branchNodes, growthData, params.particleSize, params.glowIntensity)

  return particles
}
