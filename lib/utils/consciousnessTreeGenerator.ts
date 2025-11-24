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

// ============ 性能优化常量 ============
const PERFORMANCE = {
  MAX_ROOT_DEPTH: 7,      // 根系最大递归深度
  MAX_BRANCH_DEPTH: 5,    // 枝条最大递归深度
  MAX_PARTICLES: Infinity,    // 🔥 移除粒子上限，让树完整生成
  SPARSE_THRESHOLD: Infinity,  // 🔥 移除稀疏化，改用LOD策略
  LOD_THRESHOLD: 8000,    // 🔥 LOD阈值：粒子数>8000时自动缩小粒子尺寸
  LOD_SCALE_MIN: 0.3      // 🔥 LOD最小缩放：粒子最小缩到30%
} as const

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
  startX: number     // 起点X
  startY: number     // 起点Y
  x: number          // 终点X
  y: number          // 终点Y
  level: number      // 递归深度
  angle: number      // 生长角度
  length: number     // 线段长度
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

// 🔥 确定性随机数生成：基于索引生成固定的随机值
// 用于叶子/果实位置，确保相同索引每次都生成相同的随机数
function deterministicRandom(seed1: number, seed2: number, min: number, max: number): number {
  // 简单哈希函数：将两个索引组合成一个确定性的值
  const hash = ((seed1 * 73856093) ^ (seed2 * 19349663)) % 233280
  const normalized = hash / 233280
  return normalized * (max - min) + min
}

// ============ 动态计算枝条最大叶子容量 ============
const calculateMaxLeafCapacity = (branchCount: number): number => {
  // 🔥 根据枝条数量动态计算最大叶子容量
  // 假设：每个枝条平均可以容纳 3-5 片叶子（根据枝条密度调整）
  const leavesPerBranch = 4  // 每个枝条平均叶子数
  const maxLeaves = Math.max(50, Math.min(branchCount * leavesPerBranch, 500))  // 最少50，最多500
  return Math.round(maxLeaves)
}

// ============ 动态计算最大果实数量（叶子数量的1/10） ============
const calculateMaxFruitCapacity = (maxLeaves: number): number => {
  return Math.max(5, Math.round(maxLeaves / 10))  // 最少5个
}

// ============ 计算整体树生长进度（所有部分的平均值） ============
const calculateOverallGrowthProgress = (growthData: TreeGrowthData): number => {
  // 各部分的最大值设定（可调整）
  const MAX_ROOT_COUNT = 80
  const MAX_TRUNK_THICKNESS = 50
  const MAX_TRUNK_HEIGHT = 100
  const MAX_BRANCH_COUNT = 100
  const MAX_BRANCH_LENGTH = 20

  // 🔥 动态计算叶子和果实容量（基于枝条数量）
  const MAX_LEAF_COUNT = calculateMaxLeafCapacity(growthData.branches.count)
  const MAX_FRUIT_COUNT = calculateMaxFruitCapacity(MAX_LEAF_COUNT)

  // 计算各部分的填充百分比
  const rootProgress = Math.min(growthData.roots.count / MAX_ROOT_COUNT, 1)
  const rootDepthProgress = Math.min(growthData.roots.depth_level / 10, 1)
  const trunkThicknessProgress = Math.min(growthData.trunk.thickness / MAX_TRUNK_THICKNESS, 1)
  const trunkHeightProgress = Math.min(growthData.trunk.height_level / MAX_TRUNK_HEIGHT, 1)
  const branchCountProgress = Math.min(growthData.branches.count / MAX_BRANCH_COUNT, 1)
  const branchLengthProgress = Math.min(growthData.branches.avg_length / MAX_BRANCH_LENGTH, 1)
  const leafProgress = Math.min(growthData.leaves.count / MAX_LEAF_COUNT, 1)
  const fruitProgress = Math.min(growthData.fruits.count / MAX_FRUIT_COUNT, 1)

  // 取所有部分的平均值（整体生长进度）
  const overallProgress = (
    rootProgress +
    rootDepthProgress +
    trunkThicknessProgress +
    trunkHeightProgress +
    branchCountProgress +
    branchLengthProgress +
    leafProgress +
    fruitProgress
  ) / 8

  return overallProgress
}

// ============ 颜色系统：基于整体生长进度，从暗红到金边红 ============
const getColor = (
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'fruit',
  overallProgress: number,  // 整体生长进度 (0-1)，0=刚开始，1=接近升级
  isSolid: boolean,
  glowIntensity: number = 0.5,
  seed: number = 0  // 用于果实的随机颜色
): string => {
  // 🌿 叶子：绿色，亮度跟随红色同步变化
  if (type === 'leaf') {
    const hue = 120  // 绿色

    // 🔥 叶子亮度与红色同步：都是从暗到亮
    let lightness: number
    if (overallProgress < 0.9) {
      // 第一级树：0-90%，亮度范围与红色一致
      // 红色：20 + overallProgress * 30 = 20-47
      // 叶子：25 + overallProgress * 30 = 25-52（稍亮一点，更显眼）
      lightness = 25 + overallProgress * 30
    } else {
      // 第二级树：90%+，与红色保持一致的高亮度
      lightness = 58  // 红色是55%，叶子稍亮
    }

    const saturation = 65 + overallProgress * 25  // 65-90%，越成熟越鲜艳
    const alpha = isSolid ? 0.95 : 0.85
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
  }

  // 🍎 果实：随机彩色（红、橙、黄、紫、粉、青）
  if (type === 'fruit') {
    const fruitHues = [0, 30, 60, 280, 320, 180]  // 红、橙、黄、紫、粉、青
    const hue = fruitHues[seed % fruitHues.length]
    const saturation = 80 + (seed % 20)  // 80-100%
    const lightness = 50 + (seed % 15)   // 50-65%
    const alpha = isSolid ? 0.95 : 0.7
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
  }

  // 🌳 树干/树枝/树根：暗红到亮红的渐变
  let hue = 0       // 纯红色
  let saturation = 70
  let lightness = 20

  if (overallProgress < 0.9) {
    // 第一级树：0-90%
    hue = 0

    // 饱和度：70 → 95 (逐渐鲜艳)
    saturation = 70 + overallProgress * 28

    // 亮度：根据部位基础值 + 整体进度加成
    const baseLight = type === 'trunk' ? 15 :
                      type === 'root' ? 20 : 20  // branch

    // 进度越高，亮度提升越多
    const progressBonus = overallProgress * 30
    lightness = Math.min(baseLight + progressBonus, 50)

  } else {
    // 第二级树：90%+（亮红色为主 + 金边点缀）
    hue = 0
    saturation = 95
    lightness = 55
  }

  const alpha = isSolid ? 0.95 : 0.5

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
const calculateNaturalTrunkWidth = (): number => {
  // 🔥 修复：树干粗度固定，不受领域数量影响
  // 只依赖固定基础值，用户可通过thickness参数调节
  const baseWidth = 30  // 🔥 减细：60 → 30

  // 确保合理范围
  return baseWidth
}

// ============ 新增：根据根系计算自然树干高度 ============
const calculateNaturalTrunkHeight = (): number => {
  // 🔥 修复：树干高度固定，不受领域数量影响
  // 只依赖固定基础值，用户可通过height_level参数调节
  const baseHeight = 300  // 🔥 整体放大一倍：150 → 300

  // 确保合理范围
  return baseHeight
}

// ============ 新增：根据树干计算自然枝条长度 ============
const calculateNaturalBranchLength = (
  trunkHeight: number
): number => {
  // 🌿 自然规律：枝条长度与树干高度成比例（约90%）
  // 🔥 修复：移除depthLevel依赖，只基于树干高度计算

  // 基础长度：树干高度的90%
  const baseLength = trunkHeight * 0.9

  // 🔥 整体放大50%
  // 确保合理范围（最小90px，最大675px）
  return Math.max(Math.min(baseLength * 1.5, 675), 90)
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
  overallProgress: number, // 整体生长进度
  particleSize: number,
  glowIntensity: number,
  depthBonus: number = 1  // 🔥 深度增益系数（随总深度增加）
): void => {
  // 递归终止条件
  if (level > maxLevel || length < 5) return

  // 1. 🔥 应用深度增益：每多一级根，所有根都会相应增长
  const actualLength = length * depthBonus

  // 2. 计算终点
  const endX = x + Math.cos((angle * Math.PI) / 180) * actualLength
  const endY = y + Math.sin((angle * Math.PI) / 180) * actualLength

  // 3. 使用整体进度决定颜色（所有部分统一）
  const color = getColor('root', overallProgress, isSolid, glowIntensity)

  // 4. 🔥 绘制当前线段（粗细渐变：从粗到细）
  const newWidth = Math.max(width * 0.7, 0.8)  // 末端粗度
  drawTaperLine(particles, x, y, endX, endY, width, newWidth, color, isSolid, particleSize)

  // 5. 递归生成左右子树（强制对称分叉）
  const newLength = length * 0.70  // 🔥 根系长度衰减（保持适中）
  const spread = 38  // 🔥 根系分叉角度

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
    overallProgress,
    particleSize,
    glowIntensity,
    depthBonus  // 🔥 传递深度增益系数
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
    overallProgress,
    particleSize,
    glowIntensity,
    depthBonus  // 🔥 传递深度增益系数
  )
}

// ============ 1. 根系：目标导向深度分配 + 扇形分布（方案F） ============
const generateRoots = (
  particles: Particle[],
  centerX: number,
  baseY: number,
  trunkWidth: number,
  growthData: TreeGrowthData,
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): RootNode[] => {
  const totalCount = growthData.roots.count
  const isSolid = growthData.roots.is_solid
  const rootNodes: RootNode[] = []

  if (totalCount === 0) return rootNodes

  // 🔥 主根数量：缓慢自然增长（更平缓的曲线）
  let mainRootCount = 1
  if (totalCount >= 10) mainRootCount = 2  // 10个领域长出第2根
  if (totalCount >= 30) mainRootCount = 3  // 30个领域长出第3根
  if (totalCount >= 60) mainRootCount = 4  // 60个领域长出第4根

  // Step 2: 基础参数
  // 🔥 修复：长度由depth_level参数决定（不是count）
  const baseLength = 30 + growthData.roots.depth_level * 10  // 🔥 整体放大一倍：15+depth*5 → 30+depth*10

  // 粗度固定（不随count变化）
  const baseWidth = Math.max(trunkWidth * 0.4, 4)  // 🔥 最小值放大：2 → 4

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

    // 🔥 方案G：所有主根使用相同的基础长度和粗度（累积生长，不递减）
    // 随着count增加，所有根一起变长变粗，体现时间累积效应
    const currentLength = baseLength * random(0.95, 1.05)
    const currentWidth = baseWidth

    // 🌳 喇叭口过渡段：从树干粗度平滑过渡到根系粗度
    const transitionLength = Math.max(trunkWidth * 0.6, 15)  // 过渡段长度随树干粗度调整
    const transitionEndX = startX + Math.cos((angle * Math.PI) / 180) * transitionLength
    const transitionEndY = startY + Math.sin((angle * Math.PI) / 180) * transitionLength

    // 绘制过渡段（渐变粗度：从树干粗度 → 根系粗度）
    const transitionColor = getColor('root', overallProgress, isSolid, glowIntensity)
    drawTaperLine(
      particles,
      startX,
      startY,
      transitionEndX,
      transitionEndY,
      trunkWidth * 0.8,   // 起始粗度 = 树干粗度的80%（避免过渡段比树干粗）
      currentWidth,       // 🔥 结束粗度 = 当前主根粗度（递进）
      transitionColor,
      isSolid,
      particleSize
    )

    // 🔥 新增长策略：让末端数 ≈ count × 1.3（线性增长）
    // 公式：mainRootCount × 2^depth = count × 1.3
    // 推导：depth = log2((count × 1.3) / mainRootCount)

    const targetEndpoints = totalCount * 1.3  // 目标末端数（略多于count）
    const endpointsPerRoot = targetEndpoints / mainRootCount  // 每个主根的末端数
    const idealDepth = Math.log2(Math.max(1, endpointsPerRoot))  // 反推深度

    // 深度范围：1-7
    const adjustedDepth = Math.max(1, Math.min(Math.round(idealDepth), PERFORMANCE.MAX_ROOT_DEPTH))

    // 🔥 深度增益（随着递归深度增加，每级增长3%）
    const depthBonus = 1 + (adjustedDepth - 1) * 0.03

    // 为每个主根调用纯递归函数生成子树（从过渡段末端开始）
    drawRootRecursive(
      particles,
      transitionEndX,  // 从过渡段末端开始
      transitionEndY,
      angle,
      currentLength,
      currentWidth,
      1,  // 从第1层开始
      adjustedDepth,  // 🔥 渐进式深度：第1个最深，后续依次减少
      isSolid,
      overallProgress,  // 传递整体进度
      particleSize,
      glowIntensity,
      depthBonus  // 🔥 传递深度增益系数
    )

    // 记录主根末端（保留接口兼容性）
    const endX = transitionEndX + Math.cos((angle * Math.PI) / 180) * currentLength
    const endY = transitionEndY + Math.sin((angle * Math.PI) / 180) * currentLength
    rootNodes.push({ x: endX, y: endY, level: 1, angle, length: currentLength, width: currentWidth })
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
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): { topX: number; topY: number; trunkWidth: number } => {
  const thickness = growthData.trunk.thickness
  const heightLevel = growthData.trunk.height_level
  const isSolid = growthData.trunk.is_solid

  // 🌳 步骤1：计算"自然粗度Y"和"自然长度Z"（基于根系发展）
  const naturalWidth = calculateNaturalTrunkWidth()
  const naturalHeight = calculateNaturalTrunkHeight()

  // 🌳 步骤2：应用1/3规则
  // 默认粗度 = 1/3 × Y，最大粗度 = Y
  const minWidth = naturalWidth / 3
  const maxWidth = naturalWidth
  // 🔥 修复：使用平方曲线让粗度变化更明显（小值增长慢，大值增长快）
  const thicknessRatio = Math.pow(thickness / 50, 1.5)  // 指数曲线，让变化更敏感
  const actualWidth = minWidth + (maxWidth - minWidth) * thicknessRatio  // thickness: 0-50

  // 默认长度 = 1/3 × Z，最大长度 = Z
  const minHeight = naturalHeight / 3
  const maxHeight = naturalHeight
  const actualHeight = minHeight + (maxHeight - minHeight) * (heightLevel / 100)  // height_level: 0-100

  const topX = centerX
  const topY = baseY - actualHeight

  // 关键：thickness > 0 绘制实线，thickness == 0 绘制虚线
  const drawSolid = thickness > 0 && isSolid

  // 使用整体进度决定颜色（所有部分统一）
  const color = getColor('trunk', overallProgress, drawSolid, glowIntensity)

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

// ============ 3. 枝条：简单累积生成（1 count = 1 枝条） ============

// 🌿 辅助函数：使用ID作为随机种子（确保稳定性）
const getStableRandom = (branchId: number, offset: number): number => {
  const seed = (branchId * 9301 + offset * 49297) % 233280
  return seed / 233280
}

// 🌿 单枝条定义（用于累积生成）
interface SimpleBranch {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  angle: number
  length: number
  width: number
  level: number
  parentId: number
}

// 🌿 递归枝条生成函数（纯Y形分叉）
const drawBranchRecursive = (
  particles: Particle[],
  startX: number,
  startY: number,
  length: number,
  angle: number,  // 角度（度）
  width: number,
  currentDepth: number,
  maxDepth: number,
  totalCount: number,  // 用于控制虚实状态
  avgLength: number,  // 洞见程度影响
  branchNodes: BranchNode[],
  overallProgress: number,
  isSolid: boolean,
  particleSize: number,
  glowIntensity: number,
  branchId: number  // 用于稳定随机
): void => {
  // 🔥 只用深度限制（深度由count决定）
  if (currentDepth > maxDepth) return

  // 计算当前段的终点
  const endX = startX + Math.cos((angle * Math.PI) / 180) * length
  const endY = startY + Math.sin((angle * Math.PI) / 180) * length

  // 绘制当前枝条段（使用传入的isSolid状态）
  const color = getColor('branch', overallProgress, isSolid, glowIntensity)
  drawLine(particles, startX, startY, endX, endY, width, color, isSolid, particleSize)

  branchNodes.push({
    startX,
    startY,
    x: endX,
    y: endY,
    level: currentDepth,
    angle,
    length,
    width,
    isOpen: true,
    sideShootCount: 0,
  })

  // 🔥 纯Y形递归分叉（参考tree.js）
  const baseBranchAngle = 25  // 基础分叉角度
  const newLength = length * 0.75  // 长度衰减75%
  const newWidth = Math.max(width * 0.7, 0.8)  // 宽度衰减70%

  // 左分支：固定角度 - baseBranchAngle
  drawBranchRecursive(
    particles,
    endX,
    endY,
    newLength,
    angle - baseBranchAngle,
    newWidth,
    currentDepth + 1,
    maxDepth,
    totalCount,  // 继续传递totalCount
    avgLength,
    branchNodes,
    overallProgress,
    isSolid,  // 保持传递isSolid（用于getColor）
    particleSize,
    glowIntensity,
    branchId * 2  // 左分支ID
  )

  // 右分支：固定角度 + baseBranchAngle
  drawBranchRecursive(
    particles,
    endX,
    endY,
    newLength,
    angle + baseBranchAngle,
    newWidth,
    currentDepth + 1,
    maxDepth,
    totalCount,  // 继续传递totalCount
    avgLength,
    branchNodes,
    overallProgress,
    isSolid,  // 保持传递isSolid（用于getColor）
    particleSize,
    glowIntensity,
    branchId * 2 + 1  // 右分支ID
  )
}

// 🌿 主函数：生成枝条（递归Y字形分叉 + count控制）
const generateBranches = (
  particles: Particle[],
  trunkTopX: number,
  trunkTopY: number,
  trunkWidth: number,
  trunkHeight: number,
  growthData: TreeGrowthData,
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): BranchNode[] => {
  const totalCount = growthData.branches.count  // 里程数（总count）
  const avgLength = growthData.branches.avg_length  // 洞见程度（控制长度）
  const isSolid = growthData.branches.is_solid

  const branchNodes: BranchNode[] = []

  if (totalCount === 0) {
    // count=0时绘制3个虚线主枝
    const mainBranches = [
      { angle: -130, name: '左主枝' },
      { angle: -90, name: '中主枝' },
      { angle: -50, name: '右主枝' },
    ]

    const naturalBranchLength = calculateNaturalBranchLength(trunkHeight)
    const baseLength = naturalBranchLength * (0.5 + avgLength / 40)

    for (let i = 0; i < 3; i++) {
      const branch = mainBranches[i]
      const width = Math.max(trunkWidth * 0.6, 3)
      const offsetX = (i - 1) * (trunkWidth / 4)
      const startX = trunkTopX + offsetX
      const startY = trunkTopY

      const endX = startX + Math.cos((branch.angle * Math.PI) / 180) * baseLength
      const endY = startY + Math.sin((branch.angle * Math.PI) / 180) * baseLength

      const color = getColor('branch', overallProgress, false, glowIntensity)
      drawLine(particles, startX, startY, endX, endY, width, color, false, particleSize)

      branchNodes.push({
        startX,
        startY,
        x: endX,
        y: endY,
        level: 1,
        angle: branch.angle,
        length: baseLength,
        width,
        isOpen: false,
        sideShootCount: 0,
      })
    }
  } else {
    // count>0时使用递归算法

    // 🔥 count控制深度：count越大，深度越深，枝条越多
    // 每个深度需要的枝条数：depth=1→3×2=6, depth=2→3×2^2=12, depth=3→3×2^3=24
    // 反推公式：depth ≈ log2(count/3)
    // 🔥 性能优化：最大深度限制为5（平衡性能和视觉）
    let maxDepth = 1
    if (totalCount <= 3) {
      maxDepth = 1  // 0-3个：只有主枝第一层分叉
    } else if (totalCount <= 9) {
      maxDepth = 2  // 4-9个
    } else if (totalCount <= 21) {
      maxDepth = 3  // 10-21个
    } else if (totalCount <= 45) {
      maxDepth = 4  // 22-45个
    } else {
      maxDepth = PERFORMANCE.MAX_BRANCH_DEPTH  // 46+个：最大深度5（3×2^5=96个枝条）
    }

    // 🔥 基础长度：受avgLength影响（0-20映射到50%-150%）
    const naturalBranchLength = calculateNaturalBranchLength(trunkHeight)
    const minLength = naturalBranchLength * 0.5
    const maxLength = naturalBranchLength * 1.5
    const baseLength = minLength + (maxLength - minLength) * (avgLength / 20)

    // 🔥 恢复3个主枝设计
    const mainBranches = [
      { angle: -130, name: '左主枝' },
      { angle: -90, name: '中主枝' },
      { angle: -50, name: '右主枝' },
    ]

    // 🔥 让每个主枝都完全生长到maxDepth，count只控制虚实状态
    // 🌿 枝条粗度自然调节：枝条少时更细，枝条多时更粗
    let branchWidthScale = 0.3  // 基础粗度（枝条少时）
    if (totalCount > 10) branchWidthScale = 0.4
    if (totalCount > 30) branchWidthScale = 0.5
    if (totalCount > 60) branchWidthScale = 0.6  // 枝条多时最粗

    for (let i = 0; i < 3; i++) {
      const branch = mainBranches[i]
      const width = Math.max(trunkWidth * branchWidthScale, 2)  // 使用动态粗度系数
      const offsetX = (i - 1) * (trunkWidth / 4)
      const startX = trunkTopX + offsetX
      const startY = trunkTopY

      drawBranchRecursive(
        particles,
        startX,
        startY,
        baseLength,
        branch.angle,
        width,
        1,
        maxDepth,
        totalCount,  // 传递totalCount用于虚实判断
        avgLength,
        branchNodes,
        overallProgress,
        isSolid,
        particleSize,
        glowIntensity,
        i + 1  // 主枝ID: 1, 2, 3
      )
    }
  }

  return branchNodes
}

// ============ 4. 树叶：随机附着在实线枝条上 ============
const generateLeaves = (
  particles: Particle[],
  branchNodes: BranchNode[],
  growthData: TreeGrowthData,
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): void => {
  const leafCount = growthData.leaves.count
  const isSolid = growthData.leaves.is_solid

  if (leafCount === 0 || branchNodes.length === 0) return

  // 🍃 自然规律：根据枝条数量决定叶子生长位置
  const totalCount = growthData.branches.count

  console.log(`[叶子生成] totalCount (branches.count): ${totalCount}`)

  // 计算最小叶子层级：枝条越多，叶子越只长在末端细枝上
  let minLeafLevel = 1  // 默认所有枝条都可以长叶子
  if (totalCount > 10) minLeafLevel = 2  // 10+个里程：从第2层开始长叶子
  if (totalCount > 30) minLeafLevel = 3  // 30+个里程：从第3层开始长叶子
  if (totalCount > 60) minLeafLevel = 4  // 60+个里程：只在细小末端长叶子

  // 过滤出可以长叶子的枝条（细枝）
  const leafBranches = branchNodes.filter(n => n.level >= minLeafLevel)
  if (leafBranches.length === 0) return

  // 🔥 叶子大小随枝条数量成正比增长（枝条越多，叶子越大）
  let leafSizeScale = 2.0  // 基础大小（枝条少时）
  if (totalCount > 10) leafSizeScale = 2.5
  if (totalCount > 30) leafSizeScale = 3.0
  if (totalCount > 60) leafSizeScale = 3.5
  if (totalCount > 100) leafSizeScale = 4.0  // 枝条很多时，叶子最大

  // 🔥 全新算法：沿着整个枝条均匀分布叶子
  let generatedLeafCount = 0

  // 每个枝条分配的叶子数
  const leavesPerBranch = Math.ceil(leafCount / leafBranches.length)

  console.log(`[叶子生成] 总叶子数: ${leafCount}, 可用枝条数: ${leafBranches.length}, 每枝叶子数: ${leavesPerBranch}`)
  console.log(`[叶子生成] particleSize: ${particleSize}, leafSizeScale: ${leafSizeScale}`)

  // 遍历每个枝条
  for (const branch of leafBranches) {
    if (generatedLeafCount >= leafCount) break

    const leavesOnThisBranch = Math.min(leavesPerBranch, leafCount - generatedLeafCount)

    // 计算枝条方向向量
    const dx = branch.x - branch.startX
    const dy = branch.y - branch.startY
    const branchLength = Math.sqrt(dx * dx + dy * dy)

    // 沿枝条均匀分布叶子（从30%到90%）
    for (let i = 0; i < leavesOnThisBranch && generatedLeafCount < leafCount; i++) {
      // 沿枝条的位置（30%到90%范围）
      const t = 0.3 + (i / Math.max(1, leavesOnThisBranch - 1)) * 0.6
      const baseX = branch.startX + dx * t
      const baseY = branch.startY + dy * t

      // 🔥 新方法：让叶子在枝条周围随机分布（不限于垂直方向）
      // 使用确定性随机生成角度（-150度到+150度，避开枝条延伸方向）
      const leafSeed = generatedLeafCount
      const angleOffset = deterministicRandom(leafSeed, 2000, -150, 150) * Math.PI / 180

      // 🌿 偏移距离：较小的随机值，让叶子紧贴树枝
      const randomFactor = deterministicRandom(leafSeed, 3000, 1.2, 2.0)
      const offsetDist = particleSize * leafSizeScale * randomFactor * 2.5

      // 🔥 根据随机角度计算偏移量
      const offsetX = Math.cos(angleOffset) * offsetDist
      const offsetY = Math.sin(angleOffset) * offsetDist

      const finalX = baseX + offsetX
      const finalY = baseY + offsetY

      if (i < 3) {
        const side = offsetX > 0 ? '右' : '左'
        console.log(`    叶子 ${i}: ${side}, angle=${(angleOffset * 180 / Math.PI).toFixed(0)}°, offsetX=${offsetX.toFixed(0)}`)
      }

      // 叶子颜色（跟随整体进度）
      const color = getColor('leaf', overallProgress, isSolid, glowIntensity)

      // 叶子大小
      const size = particleSize * leafSizeScale * deterministicRandom(leafSeed, 4000, 0.9, 1.1)

      // 叶子旋转角度：指向枝条外侧
      const branchAngle = Math.atan2(dy, dx)
      const rotation = (branchAngle + 90 * side) * 180 / Math.PI + deterministicRandom(leafSeed, 5000, -20, 20)

      particles.push({
        x: finalX,
        y: finalY,
        size,
        color,
        shape: 'leaf',
        rotation,
      })

      generatedLeafCount++
    }
  }
}

// ============ 5. 果实：附着在叶子附近或枝条节点上 ============
const generateFruits = (
  particles: Particle[],
  branchNodes: BranchNode[],
  growthData: TreeGrowthData,
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): void => {
  const fruitCount = growthData.fruits.count
  const isSolid = growthData.fruits.is_solid

  if (fruitCount === 0 || branchNodes.length === 0) return

  // 🔥 1. 识别终端枝条：不再生长的枝条（isOpen = false）或最高层级的枝条
  const maxLevel = Math.max(...branchNodes.map(n => n.level))
  const terminalBranches = branchNodes.filter(
    n => !n.isOpen || n.level === maxLevel
  )

  if (terminalBranches.length === 0) return

  // 🔥 2. 使用循环分配算法，确保果实均匀分布在所有终端枝条上
  let generatedFruitCount = 0
  let branchIndex = 0

  while (generatedFruitCount < fruitCount) {
    const branch = terminalBranches[branchIndex % terminalBranches.length]

    // 计算这是该枝条的第几个果实
    const fruitIndexOnBranch = Math.floor(branchIndex / terminalBranches.length)

    // 使用确定性随机，确保位置固定
    const fruitSeed = generatedFruitCount

    // 🔥 果实沿枝条均匀分布：从70%到95%的位置
    // 如果一个枝条有多个果实，它们按顺序排列
    const fruitsOnThisBranch = Math.ceil(fruitCount / terminalBranches.length)
    let positionRatio: number

    if (fruitsOnThisBranch === 1) {
      // 只有一个果实，放在80-85%位置
      positionRatio = deterministicRandom(fruitSeed, 100, 0.8, 0.85)
    } else {
      // 多个果实，从70%到95%均匀分布
      positionRatio = 0.7 + (fruitIndexOnBranch / Math.max(1, fruitsOnThisBranch - 1)) * 0.25
      positionRatio = Math.min(0.95, Math.max(0.7, positionRatio))
    }

    // 计算果实在枝条上的位置
    const x = branch.startX + (branch.x - branch.startX) * positionRatio
    const y = branch.startY + (branch.y - branch.startY) * positionRatio

    // 🔥 果实垂挂效果：Y轴向下垂挂
    // 使用确定性随机确保每个果实位置固定
    const offsetX = deterministicRandom(fruitSeed, 200, -3, 3)
    const offsetY = deterministicRandom(fruitSeed, 300, 10, 16)

    // 🍎 使用种子生成随机彩色果实
    const color = getColor('fruit', overallProgress, isSolid, glowIntensity, fruitSeed)

    // 🔥 果实大小使用确定性随机
    const size = particleSize * deterministicRandom(fruitSeed, 400, 3.2, 4.2)

    particles.push({
      x: x + offsetX,
      y: y + offsetY,
      size,
      color,
      shape: 'apple',
    })

    generatedFruitCount++
    branchIndex++
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

  // 🎨 计算整体生长进度（所有部分的平均值）- 用于统一颜色
  const overallProgress = calculateOverallGrowthProgress(growthData)

  const centerX = canvasWidth / 2

  // 🔥 修复居中问题：需要先计算树干高度，然后调整baseY让整树居中
  // 预计算树干高度以确定合适的baseY位置
  const estimatedRootCount = growthData.roots.count
  const naturalWidth = calculateNaturalTrunkWidth()
  const naturalHeight = calculateNaturalTrunkHeight()
  const thickness = growthData.trunk.thickness
  const heightLevel = growthData.trunk.height_level
  const minHeight = naturalHeight / 3
  const maxHeight = naturalHeight
  const actualHeight = minHeight + (maxHeight - minHeight) * (heightLevel / 100)

  // 🔥 修复居中：重新估算树的实际高度
  // 枝条会递归生长，向上延伸较远，需要更大的估算系数
  const estimatedTreeTop = actualHeight * 3.5  // 树干 + 枝条向上延伸
  const estimatedRootDepth = 100  // 根系向下延伸（增加估算）
  const totalTreeHeight = estimatedTreeTop + estimatedRootDepth

  // 树的顶部：baseY - estimatedTreeTop（从baseY向上延伸）
  // 树的底部：baseY + estimatedRootDepth（从baseY向下延伸）
  // 树的中心应该在：(treeTop + treeBottom) / 2 = baseY - (estimatedTreeTop - estimatedRootDepth) / 2
  // 要让树中心在canvasHeight/2，解出baseY：
  const baseY = canvasHeight / 2 + (estimatedTreeTop - estimatedRootDepth) / 2

  // 🔥 优化顺序：先计算树干宽度，再按【根系→树干→枝条】顺序绘制

  // 计算树干宽度（naturalWidth, naturalHeight等已在上面计算）
  const minWidth = naturalWidth / 3
  const maxWidth = naturalWidth
  const trunkWidth = minWidth + (maxWidth - minWidth) * (thickness / 50)

  const topX = centerX
  const topY = baseY - actualHeight

  // 3. 先绘制根系（在底层）
  const rootNodes = generateRoots(
    particles,
    centerX,
    baseY,
    trunkWidth,  // 传入树干宽度
    growthData,
    overallProgress,  // 传入整体进度
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
    overallProgress,  // 传入整体进度
    params.particleSize,
    params.glowIntensity
  )

  // 5. 生成枝条（使用树干宽度和高度计算自然长度）
  const branchNodes = generateBranches(
    particles,
    topX,
    topY,
    trunkWidth,     // 传入树干宽度
    actualHeight,   // 传入树干实际高度（用于计算自然枝条长度）
    growthData,
    overallProgress,  // 传入整体进度
    params.particleSize,
    params.glowIntensity
  )

  // 6. 生成树叶
  generateLeaves(particles, branchNodes, growthData, overallProgress, params.particleSize, params.glowIntensity)

  // 7. 生成果实
  generateFruits(particles, branchNodes, growthData, overallProgress, params.particleSize, params.glowIntensity)

  // 🔥 8. LOD优化：粒子多时自动缩小粒子尺寸
  const totalParticles = particles.length
  if (totalParticles > PERFORMANCE.LOD_THRESHOLD) {
    // 计算缩放系数：粒子数越多，尺寸越小（最小30%）
    // 例如：8000粒子=100%，16000粒子=65%，24000粒子=43%
    const scale = Math.max(
      PERFORMANCE.LOD_SCALE_MIN,
      PERFORMANCE.LOD_THRESHOLD / totalParticles
    )

    // 应用缩放到所有粒子
    particles.forEach(p => {
      p.size *= scale
    })
  }

  return particles
}
