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

// ============ 计算整体树生长进度（所有部分的平均值） ============
const calculateOverallGrowthProgress = (growthData: TreeGrowthData): number => {
  // 各部分的最大值设定（可调整）
  const MAX_ROOT_COUNT = 80
  const MAX_TRUNK_THICKNESS = 50
  const MAX_TRUNK_HEIGHT = 100
  const MAX_BRANCH_COUNT = 100
  const MAX_BRANCH_LENGTH = 20
  const MAX_LEAF_COUNT = 50
  const MAX_FRUIT_COUNT = 20

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
const calculateNaturalTrunkWidth = (rootCount: number): number => {
  // 🌳 基于达芬奇规则：树干横截面积 ≈ 所有主根横截面积之和
  // 🔥 修复：移除depthLevel依赖，只根据rootCount计算，避免根系深度影响树干粗度

  const mainRootCount = calculateMainRootCount(rootCount)

  // 基础粗度：主根数量贡献（每个主根+5px）
  const baseWidth = mainRootCount * 5

  // 领域数量加成：领域越多，树干越粗（但增长缓慢）
  const countBonus = Math.log2(rootCount + 1) * 3

  // 自然粗度 = 基础 + 数量加成
  const naturalWidth = baseWidth + countBonus

  // 确保最小值和合理上限（最大80px，确保粗壮的树干效果）
  return Math.max(Math.min(naturalWidth, 80), 10)
}

// ============ 新增：根据根系计算自然树干高度 ============
const calculateNaturalTrunkHeight = (rootCount: number): number => {
  // 🌳 自然规律：树干高度与根系规模成正比
  // 🔥 修复：移除depthLevel依赖，只根据rootCount计算

  const mainRootCount = calculateMainRootCount(rootCount)

  // 基础高度：主根数量的影响
  const baseHeight = mainRootCount * 40

  // 领域数量的对数影响（避免过度增长）
  const countBonus = Math.log2(rootCount + 1) * 20

  // 自然高度 = 基础 + 数量加成
  const naturalHeight = baseHeight + countBonus

  // 确保合理范围
  return Math.max(Math.min(naturalHeight, 400), 50)
}

// ============ 新增：根据树干计算自然枝条长度 ============
const calculateNaturalBranchLength = (
  trunkHeight: number
): number => {
  // 🌿 自然规律：枝条长度与树干高度成比例（约90%）
  // 🔥 修复：移除depthLevel依赖，只基于树干高度计算

  // 基础长度：树干高度的90%
  const baseLength = trunkHeight * 0.9

  // 确保合理范围（最小60px，最大450px）
  return Math.max(Math.min(baseLength, 450), 60)
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
  glowIntensity: number
): void => {
  // 递归终止条件
  if (level > maxLevel || length < 5) return

  // 1. 计算终点
  const endX = x + Math.cos((angle * Math.PI) / 180) * length
  const endY = y + Math.sin((angle * Math.PI) / 180) * length

  // 2. 使用整体进度决定颜色（所有部分统一）
  const color = getColor('root', overallProgress, isSolid, glowIntensity)

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
    overallProgress,
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
    overallProgress,
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
  overallProgress: number,
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
  // 🔥 修复：主根粗度与树干粗度成正比（达芬奇规则：约70%树干粗度）
  const baseWidth = Math.max(trunkWidth * 0.7, 3)  // 基础粗度

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
    const transitionColor = getColor('root', overallProgress, isSolid, glowIntensity)
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
      overallProgress,  // 传递整体进度
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
  overallProgress: number,
  particleSize: number,
  glowIntensity: number
): { topX: number; topY: number; trunkWidth: number } => {
  const thickness = growthData.trunk.thickness
  const heightLevel = growthData.trunk.height_level
  const isSolid = growthData.trunk.is_solid

  // 🌳 步骤1：计算"自然粗度Y"和"自然长度Z"（基于根系发展）
  const naturalWidth = calculateNaturalTrunkWidth(totalRootCount)
  const naturalHeight = calculateNaturalTrunkHeight(totalRootCount)

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

// 🌿 主函数：生成枝条（累积生成，1 count = 1 枝条）
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

  // 🌿 步骤1：计算基础长度（只受avgLength影响，不影响Canvas尺寸）
  // 🔥 修复：移除depthLevel参数
  const naturalBranchLength = calculateNaturalBranchLength(trunkHeight)

  // 🔥 修复：avgLength控制长度（0-20），映射到50%-150%（增加变化幅度）
  const minInitialLength = naturalBranchLength * 0.5  // 最小50%
  const maxInitialLength = naturalBranchLength * 1.5  // 最大150%
  const baseInitialLength = minInitialLength + (maxInitialLength - minInitialLength) * (avgLength / 20)

  const allBranches: SimpleBranch[] = []
  const branchNodes: BranchNode[] = []

  // 🌿 步骤2：创建3个主枝（固定，level=1）
  const mainBranches = [
    { angle: -130, name: '左主枝' },
    { angle: -90, name: '中主枝' },
    { angle: -50, name: '右主枝' },
  ]

  for (let i = 0; i < 3; i++) {
    const branch = mainBranches[i]
    const width = Math.max(trunkWidth * 0.6, 3)  // 最小宽度从2提高到3
    const offsetX = (i - 1) * (trunkWidth / 4)
    const startX = trunkTopX + offsetX
    const startY = trunkTopY

    // 主枝长度（不受count影响，只受avgLength影响）
    const mainLength = baseInitialLength

    const endX = startX + Math.cos((branch.angle * Math.PI) / 180) * mainLength
    const endY = startY + Math.sin((branch.angle * Math.PI) / 180) * mainLength

    // 保存主枝
    allBranches.push({
      id: i + 1,  // ID: 1, 2, 3
      startX,
      startY,
      endX,
      endY,
      angle: branch.angle,
      length: mainLength,
      width,
      level: 1,
      parentId: 0  // 主枝无父枝
    })

    // count=0时绘制虚线，count>0时绘制实线
    const color = getColor('branch', overallProgress, totalCount > 0 && isSolid, glowIntensity)
    drawLine(particles, startX, startY, endX, endY, width, color, totalCount > 0 && isSolid, particleSize)

    branchNodes.push({
      x: endX,
      y: endY,
      level: 1,
      angle: branch.angle,
      length: mainLength,
      width,
      isOpen: true,
      sideShootCount: 0,
    })
  }

  // 🌿 步骤3：根据count累积生成侧枝（1 count = 1 侧枝）
  for (let i = 0; i < totalCount; i++) {
    const branchId = i + 4  // 从4开始（1,2,3是主枝）

    // 🔥 关键：每10个侧枝，基础长度增加10%
    const lengthMultiplier = 1 + Math.floor(i / 10) * 0.1
    const currentBaseLength = baseInitialLength * lengthMultiplier

    // 🔥 全新父枝选择策略：形成真正的树状多级分支结构
    let parentBranch: SimpleBranch

    if (i < 9) {
      // 前9个侧枝：均匀分配到3个主枝（每个主枝3个一级侧枝）
      const mainBranchIndex = i % 3
      parentBranch = allBranches[mainBranchIndex]
    } else if (i < 27) {
      // 第10-27个侧枝（18个）：从9个一级侧枝生长（每个长2个二级侧枝）
      const parentIndex = 3 + ((i - 9) % 9)  // 从索引3-11的一级侧枝选择
      if (parentIndex < allBranches.length) {
        parentBranch = allBranches[parentIndex]
      } else {
        // fallback：从主枝选择
        parentBranch = allBranches[i % 3]
      }
    } else {
      // 第28+个侧枝：从所有已有枝条中智能选择
      // 优先选择较粗的枝条（宽度>=1.0），但不限制层级
      const availableParents = allBranches.filter(b => b.width >= 1.0 && b.level <= 4)

      if (availableParents.length === 0) {
        // fallback：从所有枝条中选择（限制最大level=5，避免无限深度）
        const fallbackParents = allBranches.filter(b => b.level <= 5)
        const parentIndex = Math.floor(getStableRandom(branchId, 0) * fallbackParents.length)
        parentBranch = fallbackParents[parentIndex]
      } else {
        // 使用稳定随机从可用父枝中选择
        const parentIndex = Math.floor(getStableRandom(branchId, 0) * availableParents.length)
        parentBranch = availableParents[parentIndex]
      }
    }

    // 🔥 计算稳定的位置（基于branchId种子，在父枝的30%-80%位置）
    const positionRatio = 0.3 + getStableRandom(branchId, 1) * 0.5  // 0.3-0.8

    const sideStartX = parentBranch.startX + Math.cos((parentBranch.angle * Math.PI) / 180) * parentBranch.length * positionRatio
    const sideStartY = parentBranch.startY + Math.sin((parentBranch.angle * Math.PI) / 180) * parentBranch.length * positionRatio

    // 🔥 计算稳定的角度（基于branchId种子，左右交替+随机偏移）
    const baseSide = getStableRandom(branchId, 2) < 0.5 ? -1 : 1  // 左或右
    const angleOffset = (40 + getStableRandom(branchId, 3) * 30) * baseSide  // ±40-70度

    const sideAngle = parentBranch.angle + angleOffset

    // 🔥 侧枝长度：根据父枝层级动态调整
    // level 1（主枝）的侧枝：70-85%
    // level 2（一级侧枝）的侧枝：65-80%
    // level 3+的侧枝：60-75%
    let lengthRatioBase = 0.7
    let lengthRatioRange = 0.15
    if (parentBranch.level === 1) {
      lengthRatioBase = 0.7
      lengthRatioRange = 0.15
    } else if (parentBranch.level === 2) {
      lengthRatioBase = 0.65
      lengthRatioRange = 0.15
    } else {
      lengthRatioBase = 0.6
      lengthRatioRange = 0.15
    }
    const sideLengthRatio = lengthRatioBase + getStableRandom(branchId, 4) * lengthRatioRange
    const sideLength = currentBaseLength * sideLengthRatio

    // 🔥 侧枝粗度：根据父枝层级动态衰减
    // level 1 → level 2: 80%
    // level 2 → level 3: 75%
    // level 3+: 70%
    let widthDecay = 0.75
    if (parentBranch.level === 1) {
      widthDecay = 0.8
    } else if (parentBranch.level === 2) {
      widthDecay = 0.75
    } else {
      widthDecay = 0.7
    }
    const sideWidth = Math.max(parentBranch.width * widthDecay, 0.8)  // 最小宽度0.8

    const sideEndX = sideStartX + Math.cos((sideAngle * Math.PI) / 180) * sideLength
    const sideEndY = sideStartY + Math.sin((sideAngle * Math.PI) / 180) * sideLength

    // 保存侧枝
    allBranches.push({
      id: branchId,
      startX: sideStartX,
      startY: sideStartY,
      endX: sideEndX,
      endY: sideEndY,
      angle: sideAngle,
      length: sideLength,
      width: sideWidth,
      level: parentBranch.level + 1,
      parentId: parentBranch.id
    })

    // 绘制侧枝
    const color = getColor('branch', overallProgress, isSolid, glowIntensity)
    drawLine(particles, sideStartX, sideStartY, sideEndX, sideEndY, sideWidth, color, isSolid, particleSize)

    branchNodes.push({
      x: sideEndX,
      y: sideEndY,
      level: parentBranch.level + 1,
      angle: sideAngle,
      length: sideLength,
      width: sideWidth,
      isOpen: true,
      sideShootCount: 0,
    })
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

  // 只附着在实线枝条上
  const solidNodes = isSolid ? branchNodes : branchNodes.filter(() => random(0, 1) > 0.5)

  for (let i = 0; i < leafCount; i++) {
    if (solidNodes.length === 0) break

    const node = solidNodes[Math.floor(random(0, solidNodes.length))]
    const offsetX = random(-10, 10)
    const offsetY = random(-10, 10)

    // 使用整体生长进度决定颜色（所有部分统一）
    const color = getColor('leaf', overallProgress, isSolid, glowIntensity)
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
  overallProgress: number,
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

    // 使用整体生长进度决定颜色（所有部分统一）
    const color = getColor('fruit', overallProgress, isSolid, glowIntensity)
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

  // 🎨 计算整体生长进度（所有部分的平均值）- 用于统一颜色
  const overallProgress = calculateOverallGrowthProgress(growthData)

  const centerX = canvasWidth / 2
  // 🔥 修复居中问题：改为50%让树垂直居中（根系向下30%，树冠向上70%）
  const baseY = canvasHeight * 0.5

  // 🔥 优化顺序：先计算树干宽度，再按【根系→树干→枝条】顺序绘制

  // 1. 预计算根系数量（用于对数增长公式）
  const estimatedRootCount = growthData.roots.count

  // 2. 预先计算树干参数（不绘制）
  const naturalWidth = calculateNaturalTrunkWidth(estimatedRootCount)
  const naturalHeight = calculateNaturalTrunkHeight(estimatedRootCount)

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
