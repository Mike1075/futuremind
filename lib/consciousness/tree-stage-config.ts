/**
 * 意识树五阶段成长配置
 * 基于真实植物生长规律：种子 → 发芽 → 幼苗 → 小树 → 大树
 */

export type TreeStage = 'seed' | 'sprout' | 'seedling' | 'young' | 'mature'

export interface TreeScaling {
  // 树干参数
  trunkWidth: number        // 相对基础宽度的比例 (0-1)
  trunkLength: number       // 相对屏幕高度的比例 (0-1)
  trunkOpacity: number      // 树干透明度 (0-1)

  // 根系参数
  rootWidth: number         // 根系粗细比例 (0-1)
  rootLength: number        // 根系长度比例 (0-1)
  rootOpacity: number       // 根系透明度 (0-1)
  maxRootBranches: number   // 最多主根数量
  rootDepthThreshold: number // 显示根系的最小depth值

  // 枝叶参数
  maxLeaves: number         // 最多叶子数量
  leafSize: number          // 叶子大小比例 (0-1)
  maxBranchGeneration: number // 最大分支层数
  branchProbability: number // 分支概率 (0-1)

  // 果实参数
  maxFruits: number         // 最多果实数量
  fruitSize: number         // 果实大小比例 (0-1)
  fruitMaturity: number     // 果实成熟度 (0-1)

  // 粒子参数
  particleCount: number     // 粒子数量
  particleOpacity: number   // 粒子透明度 (0-1)
}

export const TREE_STAGE_SCALING: Record<TreeStage, TreeScaling> = {
  // ====================================
  // 阶段1: 种子期 (Seed, 0-20%)
  // ====================================
  seed: {
    // 树干：完全不显示
    trunkWidth: 0,
    trunkLength: 0,
    trunkOpacity: 0,

    // 根系：1-2根极细的根须
    rootWidth: 0.05,          // 只有5%的粗细
    rootLength: 0.3,          // 只有30%的长度
    rootOpacity: 0.4,         // 很淡
    maxRootBranches: 2,       // 最多2根主根
    rootDepthThreshold: 3,    // depth >= 3 才显示

    // 枝叶：完全没有
    maxLeaves: 0,
    leafSize: 0,
    maxBranchGeneration: 0,
    branchProbability: 0,

    // 果实：完全没有
    maxFruits: 0,
    fruitSize: 0,
    fruitMaturity: 0,

    // 粒子：极少
    particleCount: 5,
    particleOpacity: 0.2,
  },

  // ====================================
  // 阶段2: 发芽期 (Sprout, 20-40%)
  // ====================================
  sprout: {
    // 树干：极细的茎
    trunkWidth: 0.05,         // 5%宽度
    trunkLength: 0.08,        // 8%高度
    trunkOpacity: 0.6,        // 稍微淡一点

    // 根系：2-3根细根
    rootWidth: 0.1,           // 10%粗细
    rootLength: 0.5,          // 50%长度
    rootOpacity: 0.6,
    maxRootBranches: 3,
    rootDepthThreshold: 2,    // depth >= 2 就显示

    // 枝叶：2片子叶（cotyledon）
    maxLeaves: 2,             // 固定2片
    leafSize: 0.3,            // 30%大小（子叶较小）
    maxBranchGeneration: 0,   // 无分支
    branchProbability: 0,

    // 果实：无
    maxFruits: 0,
    fruitSize: 0,
    fruitMaturity: 0,

    // 粒子：少量
    particleCount: 10,
    particleOpacity: 0.3,
  },

  // ====================================
  // 阶段3: 幼苗期 (Seedling, 40-60%)
  // ====================================
  seedling: {
    // 树干：细茎
    trunkWidth: 0.08,         // 8%宽度
    trunkLength: 0.12,        // 12%高度
    trunkOpacity: 0.85,

    // 根系：3-4根主根
    rootWidth: 0.15,          // 15%粗细
    rootLength: 0.6,          // 60%长度
    rootOpacity: 0.75,
    maxRootBranches: 4,
    rootDepthThreshold: 1,    // depth >= 1 就显示

    // 枝叶：2片子叶 + 4-6片真叶
    maxLeaves: 8,             // 子叶2片 + 真叶最多6片
    leafSize: 0.5,            // 50%大小
    maxBranchGeneration: 1,   // 最多1层分支（真叶一对对）
    branchProbability: 0.3,

    // 果实：无
    maxFruits: 0,
    fruitSize: 0,
    fruitMaturity: 0,

    // 粒子：增多
    particleCount: 20,
    particleOpacity: 0.4,
  },

  // ====================================
  // 阶段4: 小树期 (Young, 60-80%)
  // ====================================
  young: {
    // 树干：明显的树干
    trunkWidth: 0.4,          // 40%宽度
    trunkLength: 0.35,        // 35%高度
    trunkOpacity: 1.0,

    // 根系：4-5根主根，有二级根须
    rootWidth: 0.5,           // 50%粗细
    rootLength: 0.8,          // 80%长度
    rootOpacity: 0.85,
    maxRootBranches: 5,
    rootDepthThreshold: 0,    // 所有根都显示

    // 枝叶：12-18片真叶（子叶已消失）
    maxLeaves: 18,
    leafSize: 0.75,           // 75%大小
    maxBranchGeneration: 3,   // 最多3层分支
    branchProbability: 0.6,

    // 果实：花蕾/小果实
    maxFruits: 2,
    fruitSize: 0.4,           // 40%大小
    fruitMaturity: 0.3,       // 30%成熟度

    // 粒子：较多
    particleCount: 40,
    particleOpacity: 0.5,
  },

  // ====================================
  // 阶段5: 大树期 (Mature, 80-100%)
  // ====================================
  mature: {
    // 树干：粗壮的树干
    trunkWidth: 1.0,          // 100%宽度
    trunkLength: 0.5,         // 50%高度
    trunkOpacity: 1.0,

    // 根系：所有5个领域的根，深度网络
    rootWidth: 1.0,           // 100%粗细
    rootLength: 1.0,          // 100%长度
    rootOpacity: 1.0,
    maxRootBranches: 5,       // 所有5个领域
    rootDepthThreshold: 0,

    // 枝叶：25-35片真叶
    maxLeaves: 35,
    leafSize: 1.0,            // 100%大小
    maxBranchGeneration: 8,   // 最多8层分支
    branchProbability: 0.75,

    // 果实：成熟果实
    maxFruits: 8,
    fruitSize: 1.0,           // 100%大小
    fruitMaturity: 0.8,       // 80%成熟度

    // 粒子：很多
    particleCount: 60,
    particleOpacity: 0.6,
  },
}

/**
 * 根据等级进度获取树的阶段
 */
export function getTreeStage(levelProgress: number): TreeStage {
  if (levelProgress < 20) return 'seed'
  if (levelProgress < 40) return 'sprout'
  if (levelProgress < 60) return 'seedling'
  if (levelProgress < 80) return 'young'
  return 'mature'
}

/**
 * 根据等级进度获取树的缩放参数
 */
export function getTreeScaling(levelProgress: number): TreeScaling {
  const stage = getTreeStage(levelProgress)
  return TREE_STAGE_SCALING[stage]
}

/**
 * 获取阶段的中文名称
 */
export function getTreeStageName(stage: TreeStage): string {
  const names: Record<TreeStage, string> = {
    seed: '种子期',
    sprout: '发芽期',
    seedling: '幼苗期',
    young: '小树期',
    mature: '大树期',
  }
  return names[stage]
}

/**
 * 获取阶段的描述
 */
export function getTreeStageDescription(stage: TreeStage): string {
  const descriptions: Record<TreeStage, string> = {
    seed: '种子在土壤中孕育，根系开始萌发...',
    sprout: '种子破土而出，两片子叶展开！',
    seedling: '子叶之后，真叶一对对长出',
    young: '开始有分支，树干明显变粗',
    mature: '枝繁叶茂，准备开花结果',
  }
  return descriptions[stage]
}
