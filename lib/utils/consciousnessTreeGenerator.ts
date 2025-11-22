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
    const size = (width / 2) * (isSolid ? 1 : 0.5)

    particles.push({ x, y, size, color, shape: 'circle' })
  }
}

// ============ 1. 根系：阶梯式分形消耗逻辑 ============
const generateRoots = (
  particles: Particle[],
  centerX: number,
  baseY: number,
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): RootNode[] => {
  const totalCount = growthData.roots.count
  const isSolid = growthData.roots.is_solid
  const rootNodes: RootNode[] = []

  if (totalCount === 0) return rootNodes

  // 阶梯式消耗逻辑
  let remainingBudget = totalCount
  let currentLevel = 1

  // Level 1: 主根（前5个点，每1点生成1根）
  const level1Count = Math.min(remainingBudget, 5)
  const level1BaseLength = growthData.roots.depth_level * 15
  const level1BaseWidth = 3

  for (let i = 0; i < level1Count; i++) {
    const angle = 90 + random(-30, 30)  // 向下生长，±30度随机
    const length = level1BaseLength * random(0.8, 1.2)
    const width = level1BaseWidth

    const endX = centerX + Math.cos((angle * Math.PI) / 180) * length
    const endY = baseY + Math.sin((angle * Math.PI) / 180) * length

    const color = getColor('root', 0.2, isSolid, glowIntensity)
    drawLine(particles, centerX, baseY, endX, endY, width, color, isSolid, particleSize)

    rootNodes.push({ x: endX, y: endY, level: 1, angle, length, width })
  }

  remainingBudget -= level1Count

  // Level 2: 二级根（点数>5，每2点生成1根）
  if (remainingBudget > 0) {
    const level2Count = Math.floor(remainingBudget / 2)
    const level2Length = level1BaseLength * 0.7
    const level2Width = level1BaseWidth * 0.7

    for (let i = 0; i < level2Count; i++) {
      // 随机附着在主根上
      if (rootNodes.length === 0) break
      const parentNode = rootNodes[Math.floor(random(0, Math.min(rootNodes.length, level1Count)))]

      const angle = parentNode.angle + random(-40, 40)
      const length = level2Length * random(0.7, 1.0)

      const endX = parentNode.x + Math.cos((angle * Math.PI) / 180) * length
      const endY = parentNode.y + Math.sin((angle * Math.PI) / 180) * length

      const color = getColor('root', 0.3, isSolid, glowIntensity)
      drawLine(particles, parentNode.x, parentNode.y, endX, endY, level2Width, color, isSolid, particleSize)

      rootNodes.push({ x: endX, y: endY, level: 2, angle, length, width: level2Width })
    }

    remainingBudget -= level2Count * 2
  }

  // Level 3: 三级根（点数>15，每1点生成1根）
  if (remainingBudget > 0 && totalCount > 15) {
    const level3Count = Math.min(remainingBudget, totalCount - 15)
    const level3Length = level1BaseLength * 0.5
    const level3Width = level1BaseWidth * 0.5

    const level2Nodes = rootNodes.filter(n => n.level === 2)

    for (let i = 0; i < level3Count; i++) {
      if (level2Nodes.length === 0) break
      const parentNode = level2Nodes[Math.floor(random(0, level2Nodes.length))]

      const angle = parentNode.angle + random(-50, 50)
      const length = level3Length * random(0.6, 1.0)

      const endX = parentNode.x + Math.cos((angle * Math.PI) / 180) * length
      const endY = parentNode.y + Math.sin((angle * Math.PI) / 180) * length

      const color = getColor('root', 0.4, isSolid, glowIntensity)
      drawLine(particles, parentNode.x, parentNode.y, endX, endY, level3Width, color, isSolid, particleSize)

      rootNodes.push({ x: endX, y: endY, level: 3, angle, length, width: level3Width })
    }

    remainingBudget -= level3Count
  }

  // Level 4: 四级根（点数>25）
  if (remainingBudget > 0 && totalCount > 25) {
    const level4Count = Math.min(remainingBudget, totalCount - 25)
    const level4Length = level1BaseLength * 0.35
    const level4Width = level1BaseWidth * 0.35

    const level3Nodes = rootNodes.filter(n => n.level === 3)

    for (let i = 0; i < level4Count; i++) {
      if (level3Nodes.length === 0) break
      const parentNode = level3Nodes[Math.floor(random(0, level3Nodes.length))]

      const angle = parentNode.angle + random(-60, 60)
      const length = level4Length * random(0.5, 1.0)

      const endX = parentNode.x + Math.cos((angle * Math.PI) / 180) * length
      const endY = parentNode.y + Math.sin((angle * Math.PI) / 180) * length

      const color = getColor('root', 0.5, isSolid, glowIntensity)
      drawLine(particles, parentNode.x, parentNode.y, endX, endY, level4Width, color, isSolid, particleSize)

      rootNodes.push({ x: endX, y: endY, level: 4, angle, length, width: level4Width })
    }

    remainingBudget -= level4Count
  }

  // Level 5: 五级根（点数>45）
  if (remainingBudget > 0 && totalCount > 45) {
    const level5Count = Math.min(remainingBudget, totalCount - 45)
    const level5Length = level1BaseLength * 0.25
    const level5Width = level1BaseWidth * 0.25

    const level4Nodes = rootNodes.filter(n => n.level === 4)

    for (let i = 0; i < level5Count; i++) {
      if (level4Nodes.length === 0) break
      const parentNode = level4Nodes[Math.floor(random(0, level4Nodes.length))]

      const angle = parentNode.angle + random(-70, 70)
      const length = level5Length * random(0.4, 1.0)

      const endX = parentNode.x + Math.cos((angle * Math.PI) / 180) * length
      const endY = parentNode.y + Math.sin((angle * Math.PI) / 180) * length

      const color = getColor('root', 0.6, isSolid, glowIntensity)
      drawLine(particles, parentNode.x, parentNode.y, endX, endY, level5Width, color, isSolid, particleSize)

      rootNodes.push({ x: endX, y: endY, level: 5, angle, length, width: level5Width })
    }
  }

  return rootNodes
}

// ============ 2. 树干：生物力学比例（对数增长） ============
const generateTrunk = (
  particles: Particle[],
  centerX: number,
  baseY: number,
  growthData: TreeGrowthData,
  totalRootCount: number,
  particleSize: number,
  glowIntensity: number
): { topX: number; topY: number } => {
  const thickness = growthData.trunk.thickness
  const isSolid = growthData.trunk.is_solid

  // 生物力学公式
  const BaseHeight = 100
  const GrowthFactor = Math.log(totalRootCount + 1) * 50
  const UserProgress = growthData.trunk.height_level / 100
  const FinalHeight = (BaseHeight + GrowthFactor) * UserProgress

  const topX = centerX
  const topY = baseY - FinalHeight

  // 关键：thickness > 0 绘制实线，thickness == 0 绘制虚线
  const drawSolid = thickness > 0 && isSolid
  const visualWidth = Math.max(thickness / 10, 0.5)

  const color = getColor('trunk', UserProgress, drawSolid, glowIntensity)
  drawLine(particles, centerX, baseY, topX, topY, visualWidth, color, drawSolid, particleSize)

  return { topX, topY }
}

// ============ 3. 枝条：预算消耗与形态学 ============
const generateBranches = (
  particles: Particle[],
  trunkTopX: number,
  trunkTopY: number,
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
    const width = 4

    const endX = trunkTopX + Math.cos((branch.angle * Math.PI) / 180) * length
    const endY = trunkTopY + Math.sin((branch.angle * Math.PI) / 180) * length

    const color = getColor('branch', 0.3, isSolid, glowIntensity)
    drawLine(particles, trunkTopX, trunkTopY, endX, endY, width, color, isSolid, particleSize)

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

  // 阶段2：侧枝与分叉
  while (budget > 0) {
    // 优先填满侧枝
    const openNodes = branchNodes.filter(n => n.isOpen && n.sideShootCount < 2)

    if (openNodes.length === 0) break

    const parentNode = openNodes[Math.floor(random(0, openNodes.length))]

    // 规则A：侧枝（消耗1点）
    if (parentNode.sideShootCount < 2 && budget >= 1) {
      const sideAngle = parentNode.angle + random(-45, 45)
      const sideLength = parentNode.length * 0.6 * random(0.7, 1.0)
      const sideWidth = parentNode.width * 0.7

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
      const forkWidth = parentNode.width * 0.6

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

  // 初始化伪随机种子
  const seed =
    growthData.roots.count * 1000 +
    growthData.trunk.thickness * 100 +
    growthData.trunk.height_level * 10 +
    growthData.branches.count
  initSeed(seed)

  const centerX = canvasWidth / 2
  const baseY = canvasHeight * 0.65

  // 1. 生成根系（阶梯式分形）
  const rootNodes = generateRoots(
    particles,
    centerX,
    baseY,
    growthData,
    params.particleSize,
    params.glowIntensity
  )

  // 2. 生成树干（对数增长）
  const { topX, topY } = generateTrunk(
    particles,
    centerX,
    baseY,
    growthData,
    rootNodes.length,
    params.particleSize,
    params.glowIntensity
  )

  // 3. 生成枝条（预算消耗）
  const branchNodes = generateBranches(
    particles,
    topX,
    topY,
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
