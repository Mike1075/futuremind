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
  MAX_ROOT_DEPTH: 4,      // 根系最大递归深度（2^4=16，大幅降低）
  MAX_BRANCH_DEPTH: 4,    // 枝条最大递归深度（3×2^4=48个枝条）
  MAX_PARTICLES: 3000,    // 最大粒子总数（从6000大幅降到3000）
  SPARSE_THRESHOLD: 1500  // 达到此粒子数后开始稀疏化（从3000降到1500）
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

// ============ 计算整体树生长进度（所有部分的平均值） ============
const calculateOverallGrowthProgress = (growthData: TreeGrowthData): number => {
  // 各部分的最大值设定（可调整）
  const MAX_ROOT_COUNT = 80
  const MAX_TRUNK_THICKNESS = 50
  const MAX_TRUNK_HEIGHT = 100
  const MAX_BRANCH_COUNT = 100
  const MAX_BRANCH_LENGTH = 20
  const MAX_LEAF_COUNT = 50
  const MAX_FRUIT_COUNT = 30  // 🔥 修复：果实最大数量改为30

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
  glowIntensity: number = 0.5
): string => {
  // 🎨 基于整体生长进度的颜色演变
  // 0-90%: 从暗红 → 亮红 → 金边红
  // 90%+: 第二级树（换颜色，暂时保持红色系）

  let hue = 0       // 纯红色
  let saturation = 70
  let lightness = 20

  // 🌳 整体进度影响颜色演变（所有部分统一）
  if (overallProgress < 0.9) {
    // 第一级树：0-90%
    // 色相：纯红色 (0)
    hue = 0

    // 饱和度：70 → 95 (逐渐鲜艳)
    saturation = 70 + overallProgress * 28  // 0% → 70, 90% → 95

    // 亮度：根据部位基础值 + 整体进度加成
    const baseLight = type === 'trunk' ? 15 :
                      type === 'root' ? 20 :
                      type === 'branch' ? 20 :
                      type === 'leaf' ? 30 : 35  // fruit

    // 进度越高，亮度提升越多（0-90%提升20-30个亮度点）
    const progressBonus = overallProgress * 30
    lightness = Math.min(baseLight + progressBonus, 50)

  } else {
    // 第二级树：90%+（亮红色为主 + 金边点缀）
    // 🔥 修复：保持红色为主，只在边缘添加金色光晕效果
    // 色相：纯红色 (0)，不变金黄
    hue = 0
    // 饱和度：保持高饱和红色
    saturation = 95
    // 亮度：亮红色（比之前稍亮，但不是金色）
    lightness = 55  // 亮红色（原来50%，现在55%更亮一点）
    // 注意：金边效果应该通过后续的发光/描边实现，而不是改变主色调
  }

  const alpha = isSolid ? 0.9 : 0.4

  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
}

// ============ 绘制直线（粒子化 + 性能优化） ============
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
  // 🔥 性能优化：检查粒子数量上限
  if (particles.length >= PERFORMANCE.MAX_PARTICLES) return

  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

  // 🔥 性能优化：动态稀疏化 - 粒子多时增加步长，减少粒子密度
  let densityMultiplier = 1
  if (particles.length > PERFORMANCE.SPARSE_THRESHOLD) {
    // 达到4000后逐步稀疏化：4000-8000之间，密度从1x降到0.5x
    const sparseProgress = (particles.length - PERFORMANCE.SPARSE_THRESHOLD) / (PERFORMANCE.MAX_PARTICLES - PERFORMANCE.SPARSE_THRESHOLD)
    densityMultiplier = 1 + sparseProgress * 1  // 1x → 2x步长（即密度减半）
  }

  const steps = isSolid
    ? Math.ceil(distance / (particleSize * 0.8 * densityMultiplier))
    : Math.ceil(distance / (particleSize * 3 * densityMultiplier))

  for (let i = 0; i <= steps; i++) {
    // 🔥 性能优化：每次循环检查上限
    if (particles.length >= PERFORMANCE.MAX_PARTICLES) break

    const t = i / steps
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t

    // 🔥 使用粗粒子而非多层填充，避免发光叠加过强
    const size = Math.max(width / 2, 1) * (isSolid ? 1 : 0.5)

    particles.push({ x, y, size, color, shape: 'circle' })
  }
}

// ============ 绘制渐变粗度线段（用于喇叭口过渡 + 性能优化） ============
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
  // 🔥 性能优化：检查粒子数量上限
  if (particles.length >= PERFORMANCE.MAX_PARTICLES) return

  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

  // 🔥 性能优化：动态稀疏化
  let densityMultiplier = 1
  if (particles.length > PERFORMANCE.SPARSE_THRESHOLD) {
    const sparseProgress = (particles.length - PERFORMANCE.SPARSE_THRESHOLD) / (PERFORMANCE.MAX_PARTICLES - PERFORMANCE.SPARSE_THRESHOLD)
    densityMultiplier = 1 + sparseProgress * 1
  }

  const steps = isSolid
    ? Math.ceil(distance / (particleSize * 0.8 * densityMultiplier))
    : Math.ceil(distance / (particleSize * 3 * densityMultiplier))

  for (let i = 0; i <= steps; i++) {
    // 🔥 性能优化：每次循环检查上限
    if (particles.length >= PERFORMANCE.MAX_PARTICLES) break

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
  const baseWidth = 60  // 🔥 整体放大一倍：30 → 60

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

  // 🔥 方案J：借鉴对标网站的简洁性
  // Step 1: 主根数量根据count逐步增加
  let mainRootCount = 1
  if (totalCount >= 4) mainRootCount = 2
  if (totalCount >= 10) mainRootCount = 3
  if (totalCount >= 20) mainRootCount = 4

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

    // 🔥 方案K-Step 3：正确的控制逻辑
    // 递归深度由count决定（领域数量多 → 分支多）
    // 🔥 性能优化：上限从8降到6，防止指数级爆炸（2^6=64 vs 2^8=256）
    const depthFromCount = Math.max(1, Math.min(Math.floor(1 + totalCount * 0.15), PERFORMANCE.MAX_ROOT_DEPTH))

    // 先长的主根深度更深（体现先长先深）
    // 第1个主根用完整深度，后面的依次减1
    const adjustedDepth = Math.max(1, depthFromCount - i)

    // 🔥 方案K-Step 4：深度增益（随着递归深度增加，每级增长3%）
    const depthBonus = 1 + (depthFromCount - 1) * 0.03

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
    // 🔥 性能优化：最大深度限制为4（防止指数级爆炸）
    let maxDepth = 1
    if (totalCount <= 3) {
      maxDepth = 1  // 0-3个：只有主枝第一层分叉
    } else if (totalCount <= 9) {
      maxDepth = 2  // 4-9个
    } else if (totalCount <= 21) {
      maxDepth = 3  // 10-21个
    } else {
      maxDepth = PERFORMANCE.MAX_BRANCH_DEPTH  // 22+个：最大深度4（3×2^4=48个枝条）
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
    for (let i = 0; i < 3; i++) {
      const branch = mainBranches[i]
      const width = Math.max(trunkWidth * 0.6, 3)
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

  // 🍃 沿着枝条线段两侧密集分布叶子（所有枝条都可以长叶子）
  const leafBranches = branchNodes
  if (leafBranches.length === 0) return

  // 🔥 修复：确保叶子数量完全匹配leafCount
  // 每个枝条分配的叶子数 = 总数 / 枝条数
  const leavesPerSegment = leafCount / leafBranches.length

  for (const branch of leafBranches) {
    // 🔥 性能优化：检查粒子上限
    if (particles.length >= PERFORMANCE.MAX_PARTICLES) break

    // 根据线段长度决定叶子数量
    const segmentLeafCount = Math.max(1, Math.round(leavesPerSegment))

    for (let i = 0; i < segmentLeafCount; i++) {
      // 🔥 性能优化：每次循环检查上限
      if (particles.length >= PERFORMANCE.MAX_PARTICLES) break

      // 沿着线段随机位置（10%-90%，避免起点和终点）
      const t = 0.1 + random(0, 0.8)
      const x = branch.startX + (branch.x - branch.startX) * t
      const y = branch.startY + (branch.y - branch.startY) * t

      // 计算垂直于枝条的方向（用于左右偏移）
      const perpAngle = branch.angle + (random(0, 1) > 0.5 ? 90 : -90)  // 随机选择左侧或右侧
      const offsetDist = random(5, 15)  // 垂直偏移距离
      const offsetX = Math.cos((perpAngle * Math.PI) / 180) * offsetDist
      const offsetY = Math.sin((perpAngle * Math.PI) / 180) * offsetDist

      // 使用整体生长进度决定颜色（所有部分统一）
      const color = getColor('leaf', overallProgress, isSolid, glowIntensity)
      const size = particleSize * random(2, 3.5)  // 增大叶子尺寸
      // 叶子旋转角度与枝条方向一致
      const rotation = branch.angle + random(-30, 30)

      particles.push({
        x: x + offsetX,
        y: y + offsetY,
        size,
        color,
        shape: 'leaf',
        rotation,
      })
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

  // 🔥 优化果实位置：果实长在成熟的外层枝条上（level >= 3），更符合植物学规律
  const matureNodes = branchNodes.filter(n => n.level >= 3)

  // 如果没有足够成熟的枝条，降级到level >= 2
  const fruitNodes = matureNodes.length > 0 ? matureNodes : branchNodes.filter(n => n.level >= 2)

  for (let i = 0; i < fruitCount; i++) {
    // 🔥 性能优化：检查粒子上限
    if (particles.length >= PERFORMANCE.MAX_PARTICLES) break
    if (fruitNodes.length === 0) break

    const node = fruitNodes[Math.floor(random(0, fruitNodes.length))]
    // 🔥 果实垂挂效果：X轴小幅偏移，Y轴向下垂挂
    const offsetX = random(-5, 5)
    const offsetY = random(8, 18)  // 果实自然下垂

    // 使用整体生长进度决定颜色（所有部分统一）
    const color = getColor('fruit', overallProgress, isSolid, glowIntensity)
    const size = particleSize * random(2.8, 4.0)  // 🔥 果实稍大更明显

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

  return particles
}
