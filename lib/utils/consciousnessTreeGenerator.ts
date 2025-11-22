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
      // 树干：15% → 22%（进一步降低亮度，避免粒子叠加过曝）
      lightness = 15 + depth * 7
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

// ============ 绘制渐变粗度线段（用于喇叭口过渡） ============
const drawTaperLine = (
  particles: Particle[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  startWidth: number,
  endWidth: number,
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

    // 渐变粗度：从 startWidth 到 endWidth
    const currentWidth = startWidth + (endWidth - startWidth) * t
    const size = Math.max(currentWidth / 2, 1) * (isSolid ? 1 : 0.5)

    particles.push({ x, y, size, color, shape: 'circle' })
  }
}

// ============ 辅助函数：对数增长 - 主根数量 ============
const calculateMainRootCount = (count: number): number => {
  // 🔥 对数增长（log2），避免阶梯突变
  // count=1: 1根, count=3: 2根, count=7: 3根, count=15: 4根, count=31: 5根
  // 增长非常平滑，每次翻倍才增加1个主根
  return Math.max(1, Math.ceil(Math.log2(count + 1)))
}

// ============ 辅助函数：目标导向 - 每个主根的深度 ============
const calculateRootDepth = (count: number, rootIndex: number, mainRootCount: number): number => {
  // 🔥 目标：总末端数 ≈ count × 1.3（约1.3倍，使"1个领域≈1个小叉"）
  //
  // 原问题：完全二叉树导致末端爆炸
  // - count=9: 4根 × depth=3 × 8末端 = 32个末端（期望9个！）
  //
  // 解决方案：为每个根分配不同深度，使总末端数≈目标

  const targetEndpoints = count * 1.3  // 目标末端数
  const avgEndpointsPerRoot = targetEndpoints / mainRootCount  // 每根平均末端数

  // 反推深度：2^depth = avgEndpointsPerRoot
  const idealDepth = Math.log2(avgEndpointsPerRoot)

  // 添加随机性（±1层），让树有深有浅更自然
  const variation = Math.floor(random(-1, 2))  // -1, 0, 1
  const depth = Math.round(idealDepth) + variation

  // 限制范围
  return Math.max(1, Math.min(depth, 6))
}

// ============ 新增：根据根系计算自然树干粗度（达芬奇规则） ============
const calculateNaturalTrunkWidth = (rootCount: number, depthLevel: number): number => {
  // 🌳 基于达芬奇规则：树干横截面积 ≈ 所有主根横截面积之和
  // 优化：使用更激进的线性关系，确保粗度视觉效果明显

  const mainRootCount = calculateMainRootCount(rootCount)

  // 基础粗度：主根数量贡献（每个主根+5px）
  const baseWidth = mainRootCount * 5

  // 深度加成：探索深度贡献（每层+4px）
  const depthBonus = depthLevel * 4

  // 自然粗度 = 基础 + 深度加成
  const naturalWidth = baseWidth + depthBonus

  // 确保最小值和合理上限（最大80px，确保粗壮的树干效果）
  return Math.max(Math.min(naturalWidth, 80), 10)
}

// ============ 新增：根据根系计算自然树干高度 ============
const calculateNaturalTrunkHeight = (rootCount: number, depthLevel: number): number => {
  // 🌳 自然规律：树干高度与根系延伸范围成正比（约1-2倍）

  const baseRootLength = 50 + depthLevel * 15  // 主根长度
  const mainRootCount = calculateMainRootCount(rootCount)

  // 估算根系延伸范围（考虑递归分支）
  const avgDepth = Math.log2(rootCount + 1)
  const rootExtension = baseRootLength * (1 + avgDepth * 0.3)

  // 树干高度 = 根系延伸范围的1.5倍（经验值）
  const naturalHeight = rootExtension * 1.5

  // 确保合理范围
  return Math.max(Math.min(naturalHeight, 400), 50)
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

// ============ 1. 根系：目标导向深度分配 + 扇形分布（方案F） ============
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

  // 🔥 方案F-步骤1：计算主根数量（对数增长）
  const mainRootCount = calculateMainRootCount(totalCount)

  // 🔥 方案F-步骤2：计算基础参数
  const baseLength = 50 + growthData.roots.depth_level * 15  // 基础长度
  const baseWidth = Math.max(growthData.roots.depth_level * 2, 3)  // 基础粗度

  // 🔥 方案F-步骤3：生成主根（150°扇形分布）
  const totalSpread = 150  // 扇形总角度
  const startAngle = 90 - totalSpread / 2  // 起始角度 15°
  const angleStep = totalSpread / (mainRootCount + 1)  // 均匀间隔

  for (let i = 0; i < mainRootCount; i++) {
    // 计算主根角度
    const angle = startAngle + (i + 1) * angleStep

    // 🌳 修复：所有根系都从树干底部中心点出发
    // 这样确保树干和根系完美对齐，不会偏移
    const startX = centerX
    const startY = baseY

    // 🌳 喇叭口过渡段：从树干粗度平滑过渡到根系粗度
    const transitionLength = Math.max(trunkWidth * 0.6, 15)  // 过渡段长度随树干粗度调整
    const transitionEndX = startX + Math.cos((angle * Math.PI) / 180) * transitionLength
    const transitionEndY = startY + Math.sin((angle * Math.PI) / 180) * transitionLength

    // 绘制过渡段（渐变粗度：从树干粗度 → 根系粗度）
    const transitionColor = getColor('root', 0, isSolid, glowIntensity)
    drawTaperLine(
      particles,
      startX,
      startY,
      transitionEndX,
      transitionEndY,
      trunkWidth * 0.8,   // 起始粗度 = 树干粗度的80%（避免过渡段比树干粗）
      baseWidth,          // 结束粗度 = 根系粗度
      transitionColor,
      isSolid,
      particleSize
    )

    // 🔥 方案F-步骤4：为每个主根动态分配深度（目标导向）
    // 使总末端数 ≈ count × 1.3，实现"1个领域≈1个小叉"
    const rootDepth = calculateRootDepth(totalCount, i, mainRootCount)

    // 为每个主根调用纯递归函数生成子树（从过渡段末端开始）
    drawRootRecursive(
      particles,
      transitionEndX,  // 从过渡段末端开始
      transitionEndY,
      angle,
      baseLength * random(0.9, 1.1),  // 稍微随机化初始长度
      baseWidth,
      1,  // 从第1层开始
      rootDepth,  // 🔥 每个主根深度不同（目标导向分配）
      isSolid,
      particleSize,
      glowIntensity
    )

    // 记录主根末端（保留接口兼容性）
    const endX = transitionEndX + Math.cos((angle * Math.PI) / 180) * baseLength
    const endY = transitionEndY + Math.sin((angle * Math.PI) / 180) * baseLength
    rootNodes.push({ x: endX, y: endY, level: 1, angle, length: baseLength, width: baseWidth })
  }

  return rootNodes
}

// ============ 2. 树干：自然比例 + 1/3规则 ============
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
  const heightLevel = growthData.trunk.height_level
  const isSolid = growthData.trunk.is_solid

  // 🌳 步骤1：计算"自然粗度Y"和"自然长度Z"（基于根系发展）
  const naturalWidth = calculateNaturalTrunkWidth(totalRootCount, growthData.roots.depth_level)
  const naturalHeight = calculateNaturalTrunkHeight(totalRootCount, growthData.roots.depth_level)

  // 🌳 步骤2：应用1/3规则
  // 默认粗度 = 1/3 × Y，最大粗度 = Y
  const minWidth = naturalWidth / 3
  const maxWidth = naturalWidth
  const actualWidth = minWidth + (maxWidth - minWidth) * (thickness / 50)  // thickness: 0-50

  // 默认长度 = 1/3 × Z，最大长度 = Z
  const minHeight = naturalHeight / 3
  const maxHeight = naturalHeight
  const actualHeight = minHeight + (maxHeight - minHeight) * (heightLevel / 100)  // height_level: 0-100

  const topX = centerX
  const topY = baseY - actualHeight

  // 关键：thickness > 0 绘制实线，thickness == 0 绘制虚线
  const drawSolid = thickness > 0 && isSolid

  // 颜色深度基于高度进度
  const colorDepth = heightLevel / 100
  const color = getColor('trunk', colorDepth, drawSolid, glowIntensity)

  // 使用粗粒子绘制树干
  drawLine(
    particles,
    centerX,
    baseY,
    topX,
    topY,
    actualWidth,
    color,
    drawSolid,
    particleSize
  )

  return { topX, topY, trunkWidth: actualWidth }
}

// ============ 3. 枝条：纯分形二叉树（简化版，更茂密） ============
const generateBranches = (
  particles: Particle[],
  trunkTopX: number,
  trunkTopY: number,
  trunkWidth: number,
  growthData: TreeGrowthData,
  particleSize: number,
  glowIntensity: number
): BranchNode[] => {
  const totalBudget = growthData.branches.count
  const baseLength = growthData.branches.avg_length * 10
  const isSolid = growthData.branches.is_solid
  const branchNodes: BranchNode[] = []

  let budgetUsed = 0

  // 🌳 纯递归二叉树函数（每个枝条末端分2叉）
  const recursiveBinaryTree = (
    startX: number,
    startY: number,
    angle: number,
    length: number,
    width: number,
    level: number,
    maxLevel: number
  ): void => {
    // 停止条件：预算用完、深度达到、长度太小
    if (budgetUsed >= totalBudget || level > maxLevel || length < 3) return

    // 计算终点
    const endX = startX + Math.cos((angle * Math.PI) / 180) * length
    const endY = startY + Math.sin((angle * Math.PI) / 180) * length

    // 绘制当前枝条
    const depth = Math.min(level / maxLevel, 1)
    const color = getColor('branch', depth, isSolid, glowIntensity)
    drawLine(particles, startX, startY, endX, endY, width, color, isSolid, particleSize)

    // 记录节点
    branchNodes.push({
      x: endX,
      y: endY,
      level,
      angle,
      length,
      width,
      isOpen: true,
      sideShootCount: 0,
    })

    budgetUsed++

    // 🌿 二叉分叉（每个枝条末端分2叉，持续递归）
    if (budgetUsed < totalBudget && level < maxLevel) {
      // 长度衰减：75-85%（更温和，枝条更长）
      const newLength = length * random(0.75, 0.85)

      // 粗度衰减：70%
      const newWidth = Math.max(width * 0.7, 0.8)

      // 分叉角度：20-35度（随机变化）
      const spreadAngle = random(20, 35)

      // 🔧 检查预算：如果只够生成一个分支，随机选左或右（避免总是偏左）
      const remainingBudget = totalBudget - budgetUsed

      if (remainingBudget >= 2) {
        // 预算充足，生成左右两个分叉（随机顺序，避免左分叉总是先消耗预算）
        if (Math.random() < 0.5) {
          // 先左后右
          recursiveBinaryTree(endX, endY, angle - spreadAngle, newLength, newWidth, level + 1, maxLevel)
          recursiveBinaryTree(endX, endY, angle + spreadAngle, newLength, newWidth, level + 1, maxLevel)
        } else {
          // 先右后左
          recursiveBinaryTree(endX, endY, angle + spreadAngle, newLength, newWidth, level + 1, maxLevel)
          recursiveBinaryTree(endX, endY, angle - spreadAngle, newLength, newWidth, level + 1, maxLevel)
        }
      } else if (remainingBudget === 1) {
        // 预算只够一个分支，随机选左或右
        const forkAngle = Math.random() < 0.5 ? angle - spreadAngle : angle + spreadAngle
        recursiveBinaryTree(endX, endY, forkAngle, newLength, newWidth, level + 1, maxLevel)
      }
    }
  }

  // 计算最大递归深度（基于预算）
  // budget=20 → maxLevel=6, budget=50 → maxLevel=7, budget=100 → maxLevel=8
  const maxLevel = Math.min(Math.ceil(Math.log2(totalBudget + 1)) + 1, 10)

  // 生成3个主枝（左、中、右）
  const mainBranches = [
    { angle: -130, name: '左' },
    { angle: -90, name: '中' },
    { angle: -50, name: '右' },
  ]

  // 为每个主枝分配预算
  const budgetPerBranch = Math.floor(totalBudget / 3)

  for (let i = 0; i < Math.min(3, totalBudget); i++) {
    const branch = mainBranches[i]
    const length = baseLength * random(0.9, 1.1)
    const width = Math.max(trunkWidth * 0.6, 2)

    // 主枝起点在树干顶部
    const originOffsetX = random(-trunkWidth / 3, trunkWidth / 3)
    const startX = trunkTopX + originOffsetX
    const startY = trunkTopY

    // 记录当前预算位置
    const branchStartBudget = budgetUsed
    const branchBudgetLimit = branchStartBudget + budgetPerBranch

    // 递归生成（使用临时变量限制预算）
    const savedBudgetUsed = budgetUsed
    recursiveBinaryTree(startX, startY, branch.angle, length, width, 1, maxLevel)

    // 如果当前主枝超过分配预算，停止继续分配给当前枝
    if (budgetUsed > branchBudgetLimit) {
      budgetUsed = branchBudgetLimit
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

  // 🔥 优化顺序：先计算树干宽度，再按【根系→树干→枝条】顺序绘制

  // 1. 预计算根系数量（用于对数增长公式）
  const estimatedRootCount = growthData.roots.count

  // 2. 预先计算树干参数（不绘制）
  const naturalWidth = calculateNaturalTrunkWidth(estimatedRootCount, growthData.roots.depth_level)
  const naturalHeight = calculateNaturalTrunkHeight(estimatedRootCount, growthData.roots.depth_level)

  const thickness = growthData.trunk.thickness
  const heightLevel = growthData.trunk.height_level

  const minWidth = naturalWidth / 3
  const maxWidth = naturalWidth
  const trunkWidth = minWidth + (maxWidth - minWidth) * (thickness / 50)

  const minHeight = naturalHeight / 3
  const maxHeight = naturalHeight
  const actualHeight = minHeight + (maxHeight - minHeight) * (heightLevel / 100)

  const topX = centerX
  const topY = baseY - actualHeight

  // 3. 先绘制根系（在底层）
  const rootNodes = generateRoots(
    particles,
    centerX,
    baseY,
    trunkWidth,  // 传入树干宽度
    growthData,
    params.particleSize,
    params.glowIntensity
  )

  // 4. 再绘制树干（覆盖在根系喇叭口上方）
  generateTrunk(
    particles,
    centerX,
    baseY,
    growthData,
    estimatedRootCount,
    params.particleSize,
    params.glowIntensity
  )

  // 5. 生成枝条（使用树干宽度进行横截面分布）
  const branchNodes = generateBranches(
    particles,
    topX,
    topY,
    trunkWidth,  // 传入树干宽度
    growthData,
    params.particleSize,
    params.glowIntensity
  )

  // 6. 生成树叶
  generateLeaves(particles, branchNodes, growthData, params.particleSize, params.glowIntensity)

  // 7. 生成果实
  generateFruits(particles, branchNodes, growthData, params.particleSize, params.glowIntensity)

  return particles
}
