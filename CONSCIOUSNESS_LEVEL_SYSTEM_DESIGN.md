# 意识层级系统完整设计方案

**文档版本**: v1.1
**创建时间**: 2025-11-10
**最后更新**: 2025-11-16
**状态**: 设计阶段 → 待评审 → 待实现

---

## 📚 相关文档

- **[意识树成长与升级系统设计](./CONSCIOUSNESS_GROWTH_SYSTEM_DESIGN.md)** - 详细的升级机制、经验值计算和动态成长方案

---

## 📋 目录

1. [七层意识定义](#七层意识定义)
2. [意识层级判定系统](#意识层级判定系统)
3. [视觉差异化设计](#视觉差异化设计)
4. [现有代码评估](#现有代码评估)
5. [实现方案](#实现方案)
6. [数据库设计](#数据库设计)
7. [API设计](#api设计)

---

## 🌟 七层意识定义

基于赛斯理论和灵性成长框架

### Level 1: 沉睡者 (The Sleeper)
**特征**:
- 刚开始接触内在探索
- 主要依赖外部指导和课程框架
- 尚未建立自主探索的习惯

**颜色**: `#9CA3AF` (灰色)

**行为表现**:
- 完成基础课程（如"欢迎来到地球"前2阶段）
- 被动学习，完成分配的任务
- 很少主动与Gaia对话
- 没有冥想习惯

---

### Level 2: 觉醒者 (The Awakened)
**特征**:
- 开始意识到内在探索的重要性
- 开始建立规律性的学习习惯
- 对某些主题产生真实好奇

**颜色**: `#10B981` (绿色)

**行为表现**:
- 完成至少1个课程体系
- 开始定期冥想（每周至少2-3次）
- 主动向Gaia提问（每周至少5次）
- 在1-2个领域有初步探索（depth_score > 5）

---

### Level 3: 探索者 (The Explorer)
**特征**:
- 主动探索多个领域
- 开始产生自己的洞见
- 建立了稳定的内省习惯

**颜色**: `#3B82F6` (蓝色)

**行为表现**:
- 完成至少2个课程体系
- 规律冥想（每周5次以上）
- 深度对话（产生至少10个"顿悟时刻"）
- 在3个以上领域有探索（depth_score > 10）
- 开始参与PBL项目

---

### Level 4: 实践者 (The Practitioner)
**特征**:
- 将学习转化为生活实践
- 开始创造和分享
- 深入1-2个核心领域

**颜色**: `#8B5CF6` (紫色)

**行为表现**:
- 完成所有三大课程
- 每日冥想习惯（连续30天以上）
- 完成至少1个PBL项目并分享
- 产生至少30个洞见
- 在至少1个领域达到专家级（depth_score > 20）
- 开始启发他人（至少3次"共鸣"）

---

### Level 5: 洞察者 (The Insightful)
**特征**:
- 能够整合跨领域知识
- 产生原创性洞见
- 成为社区的智慧贡献者

**颜色**: `#F59E0B` (黄色 - 智慧之光)

**行为表现**:
- 长期冥想实践（连续90天以上）
- 完成多个PBL项目，至少2个获得高共鸣（>10次）
- 产生至少100个洞见，其中至少20个是"整合性"洞见
- 在3个以上领域达到专家级
- 主动提出新的探索问题或PBL模板（至少1个）

---

### Level 6: 先锋者 (The Pioneer)
**特征**:
- 开拓新的探索领域
- 创造对社区有重大影响的内容
- 成为他人的引导者

**颜色**: `#F97316` (橙色 - 创造之火)

**行为表现**:
- 持续深度冥想实践（180天以上）
- 至少1个"世界种子"被采纳（提出的PBL模板或核心问题成为课程）
- 创造的作品启发至少50人（50次共鸣）
- 在所有5个领域都有深度探索（depth_score > 15）
- 主动指导和支持其他学员

---

### Level 7: 引领者 (The Guide)
**特征**:
- 体现了完整的意识觉醒
- 持续创造和引领
- 成为社区的灵魂人物

**颜色**: `#EF4444` (红色 - 觉醒之光)

**行为表现**:
- 持续的内在实践（365天以上）
- 多个"世界种子"被采纳（至少3个）
- 创造的作品成为社区的重要资源（100+共鸣）
- 在所有领域达到大师级（depth_score > 30）
- 主动设计新的课程或学习路径
- 体现出高度的慈悲、智慧和创造力

---

## 🎯 意识层级判定系统

### 判定原则

**核心理念**: 意识层级不是简单的积分累积，而是**综合素质**的体现

**四大维度**:
1. **探索广度** (Breadth) - 在多少领域有探索
2. **探索深度** (Depth) - 在核心领域的深度
3. **内在稳定** (Stability) - 冥想和内省的规律性
4. **创造贡献** (Contribution) - 对社区的实际影响

---

### 计算公式

#### 综合得分 (Composite Score)

```typescript
CompositeScore = (
  BreadthScore * 0.25 +      // 广度 25%
  DepthScore * 0.30 +         // 深度 30%
  StabilityScore * 0.25 +     // 稳定 25%
  ContributionScore * 0.20    // 贡献 20%
)
```

#### 分项得分计算

**1. 广度得分 (BreadthScore, 0-100)**

```typescript
// 基于5个领域的探索情况
const domains = ['self_awareness', 'life_sciences', 'universal_laws',
                 'creative_expression', 'social_connection']

// 每个领域的最小深度门槛
const thresholds = [
  { depth: 0,  score: 0 },   // 未探索
  { depth: 5,  score: 20 },  // 初步探索
  { depth: 10, score: 40 },  // 中度探索
  { depth: 15, score: 60 },  // 深度探索
  { depth: 20, score: 80 },  // 专家级
  { depth: 30, score: 100 }, // 大师级
]

// 计算每个领域的得分，然后平均
const domainScores = domains.map(domain => {
  const depth = user.domain_scores[domain].depth_score
  // 线性插值计算
  return interpolateScore(depth, thresholds)
})

BreadthScore = average(domainScores)
```

**2. 深度得分 (DepthScore, 0-100)**

```typescript
// 取最深的3个领域的平均深度
const topDepths = sortDesc(user.domain_scores).slice(0, 3)
const avgTopDepth = average(topDepths.map(d => d.depth_score))

// 深度到分数的映射
const depthToScore = [
  { depth: 0,  score: 0 },
  { depth: 10, score: 30 },
  { depth: 20, score: 60 },
  { depth: 30, score: 85 },
  { depth: 40, score: 100 },
]

DepthScore = interpolateScore(avgTopDepth, depthToScore)
```

**3. 稳定性得分 (StabilityScore, 0-100)**

```typescript
// 基于冥想规律性
const recentMeditations = getMeditationLogs(user, last90Days)

// 指标1: 总次数
const totalCount = recentMeditations.length
const countScore = Math.min(100, (totalCount / 90) * 100) // 每天1次=100分

// 指标2: 连续性（最长连续天数）
const longestStreak = calculateLongestStreak(recentMeditations)
const streakScore = Math.min(100, (longestStreak / 30) * 100) // 30天=100分

// 指标3: 规律性（标准差越小越好）
const regularityScore = calculateRegularity(recentMeditations)

StabilityScore = (countScore * 0.4 + streakScore * 0.4 + regularityScore * 0.2)
```

**4. 贡献得分 (ContributionScore, 0-100)**

```typescript
// 指标1: 洞见数量和质量
const insights = user.insight_leaves
const insightScore = Math.min(50, insights.length / 2) // 100个洞见=50分

// 指标2: PBL项目完成和共鸣
const projects = user.completed_projects
const projectScore = projects.reduce((sum, p) => {
  return sum + Math.min(10, p.resonance_count) // 每个项目最多10分
}, 0)

// 指标3: 世界种子（重大贡献）
const worldSeeds = user.world_seeds.filter(s => s.status === 'adopted')
const seedScore = worldSeeds.length * 20 // 每个世界种子20分

ContributionScore = Math.min(100, insightScore + projectScore + seedScore)
```

---

### 层级判定规则

#### 方案一：固定阈值（简单直接）

```typescript
const LEVEL_THRESHOLDS = [
  { level: 1, minScore: 0 },
  { level: 2, minScore: 20 },   // 觉醒者
  { level: 3, minScore: 40 },   // 探索者
  { level: 4, minScore: 60 },   // 实践者
  { level: 5, minScore: 75 },   // 洞察者
  { level: 6, minScore: 85 },   // 先锋者
  { level: 7, minScore: 95 },   // 引领者
]

function determineLevel(compositeScore: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (compositeScore >= LEVEL_THRESHOLDS[i].minScore) {
      return LEVEL_THRESHOLDS[i].level
    }
  }
  return 1
}
```

#### 方案二：相对排名（动态调整，推荐）

```typescript
// 结合固定阈值和相对排名
function determineLevel(compositeScore: number, percentileRank: number): number {
  // 1. 先用固定阈值确定基础层级
  let baseLevel = determineBaseLevel(compositeScore)

  // 2. 如果分数很高但百分位不够，可能降级
  // 例如：分数85但只排在50%，说明整体水平提高了
  if (baseLevel >= 6 && percentileRank < 0.9) {
    baseLevel = 5
  }
  if (baseLevel >= 5 && percentileRank < 0.75) {
    baseLevel = 4
  }

  // 3. 特殊规则：Level 7 需要同时满足绝对分数和相对排名
  if (baseLevel === 7) {
    if (compositeScore < 95 || percentileRank < 0.95) {
      return 6
    }
  }

  return baseLevel
}
```

#### 方案三：混合条件（最严格）

```typescript
const LEVEL_REQUIREMENTS = {
  2: { // 觉醒者
    minCompositeScore: 20,
    minBreadthScore: 15,
    minMeditationDays: 7,
  },
  3: { // 探索者
    minCompositeScore: 40,
    minBreadthScore: 30,
    minDepthScore: 20,
    minMeditationDays: 30,
    minDomainCount: 3, // 至少3个领域 depth>5
  },
  4: { // 实践者
    minCompositeScore: 60,
    minBreadthScore: 50,
    minDepthScore: 50,
    minMeditationDays: 60,
    minProjects: 1,
    minInsights: 30,
  },
  5: { // 洞察者
    minCompositeScore: 75,
    minBreadthScore: 60,
    minDepthScore: 70,
    minMeditationDays: 90,
    minProjects: 2,
    minInsights: 100,
    minResonance: 10,
  },
  6: { // 先锋者
    minCompositeScore: 85,
    minBreadthScore: 70,
    minDepthScore: 80,
    minMeditationDays: 180,
    minProjects: 5,
    minWorldSeeds: 1,
    minResonance: 50,
  },
  7: { // 引领者
    minCompositeScore: 95,
    minBreadthScore: 85,
    minDepthScore: 90,
    minMeditationDays: 365,
    minProjects: 10,
    minWorldSeeds: 3,
    minResonance: 100,
    percentileRank: 0.98, // 前2%
  }
}

function meetsLevelRequirements(user: User, level: number): boolean {
  const req = LEVEL_REQUIREMENTS[level]
  if (!req) return false

  return (
    user.compositeScore >= req.minCompositeScore &&
    user.breadthScore >= req.minBreadthScore &&
    (req.minDepthScore ? user.depthScore >= req.minDepthScore : true) &&
    // ... 检查所有条件
  )
}
```

**推荐使用**: 方案三（混合条件），确保层级提升是真实的成长而非单一指标刷分

---

## 🎨 视觉差异化设计

### 核心设计原则

**不同层级的意识树应该有本质性的视觉差异**，而不仅仅是颜色变化。

### 🌟 金色点缀系统 (Gold Accent System)

**设计理念**: 金色贯穿所有7个等级，渐进增强，象征觉醒与智慧之光

**金色象征意义**:
- 智慧与觉醒的光芒
- 珍贵的成长成果
- 神性与超越
- 温暖的生命能量

**美学合理性分析**:

| 等级 | 主色 | 与金色搭配效果 | 美学评分 |
|------|------|----------------|----------|
| Level 1 | 灰色 #9CA3AF | 对比强烈，暗示"沉睡中的黄金潜能" | ⭐⭐⭐⭐⭐ |
| Level 2 | 绿色 #10B981 | 自然搭配，如阳光照耀绿叶 | ⭐⭐⭐⭐⭐ |
| Level 3 | 蓝色 #3B82F6 | 经典组合，如星空中的金色星辰 | ⭐⭐⭐⭐⭐ |
| Level 4 | 紫色 #8B5CF6 | 皇家/灵性组合，神秘而高贵 | ⭐⭐⭐⭐⭐ |
| Level 5 | 黄色 #F59E0B | 同色系强化，智慧之光更盛 | ⭐⭐⭐⭐ |
| Level 6 | 橙色 #F97316 | 火焰与黄金，太阳般的能量 | ⭐⭐⭐⭐⭐ |
| Level 7 | 红色 #EF4444 | 吉祥组合，觉醒之巅 | ⭐⭐⭐⭐⭐ |

**渐进式设计原则**:
- **Level 1-2**: 微光暗示 (5-20% opacity) - 沉睡中的潜能
- **Level 3-4**: 金色线索 (25-50% opacity) - 探索的成果
- **Level 5-6**: 金色核心 (60-90% opacity) - 智慧的显现
- **Level 7**: 金色宇宙 (95-100% opacity) - 光明的化身

**金色标准色值**:
```typescript
export const GOLD_COLORS = {
  pure: '#FFD700',      // hsl(51, 100%, 50%) - 纯金色
  light: '#FFEB80',     // hsl(51, 100%, 75%) - 高光
  dark: '#CC9900',      // hsl(45, 100%, 40%) - 阴影
  warm: '#FFAA00'       // hsl(40, 100%, 50%) - 暖金(橙金)
}
```

**各等级金色点缀详细配置**:

#### Level 1: 沉睡者 - 微光暗示 (Gold Opacity: 5-10%)
- **粒子**: 10个粒子中混入2-3个淡金色 (opacity 0.1)
- **根系**: 无金色
- **树干**: 无金色
- **叶子**: 无
- **果实**: 无
- **效果**: 偶尔闪现的金色粒子，像沉睡意识中偶尔的灵光一现

#### Level 2: 觉醒者 - 初现金光 (Gold Opacity: 15-20%)
- **粒子**: 绿色+金色混合 (20%金色)
- **根系**: depth > 8 的根系末端有细微金色光点
- **树干**: 第一圈年轮带淡金色边缘
- **叶子**: 无
- **果实**: 无
- **效果**: 金色开始在深度探索的领域显现

#### Level 3: 探索者 - 金色线索 (Gold Opacity: 25-35%)
- **粒子**: 蓝色+金色双色粒子流 (30%金色)
- **根系**: depth > 12 的根系有明显金色光晕
- **树干**: 年轮之间有细金色纹路
- **叶子**: 5%的叶子边缘带金色 (高质量洞见)
- **果实**: 未成熟果实有微弱金色核心
- **效果**: 金色成为探索成果的标记

#### Level 4: 实践者 - 金色脉络 (Gold Opacity: 40-50%)
- **粒子**: 紫色+金色螺旋 (40%金色)
- **根系**: depth > 15 的根系有明显金色能量流
- **树干**: **金色纹理贯穿树干，如同能量经络**
- **叶子**: 20%金色，整合性洞见全金色
- **果实**: 成熟果实 (maturity > 0.7) 发出金色光芒
- **效果**: 金色能量在树中流动

#### Level 5: 洞察者 - 金色核心 (Gold Opacity: 60-75%)
- **粒子**: 金色为主 (60%)，形成曼陀罗图案
- **根系**: 深度根系完全金色化
- **树干**: **核心是脉动的金色光球**
- **叶子**: 50%金色，排列成几何图案
- **果实**: 所有成熟果实金光闪耀
- **特殊**: **果实之间有细金色光线连接**
- **效果**: 金色成为智慧的核心，光芒四射

#### Level 6: 先锋者 - 金色烈焰 (Gold Opacity: 80-90%)
- **粒子**: 橙红+金色凤凰羽翼 (80%金色)
- **根系**: 根系末端喷涌金色能量
- **树干**: 表面流动金橙色能量波纹
- **叶子**: 70%金色，部分叶子蜕变为金色光点
- **果实**: 所有果实金光璀璨
- **世界种子**: **巨大的金色八芒星**
- **特殊**: **树周围有金色光环 (halo)**
- **效果**: 金色如烈焰般燃烧，引领他人之路

#### Level 7: 引领者 - 金色宇宙 (Gold Opacity: 95-100%)
- **粒子**: 多彩+金色星系 (90%金色，点缀彩虹色)
- **根系**: 根系延伸成金色星图
- **树干**: **内部是金色光的通道，外部流动金色符文**
- **叶子**: 所有叶子发出金色+彩虹光芒
- **果实**: 金色网络连接所有果实
- **世界种子**: **如同小太阳般的金色球体**
- **特殊效果**:
  - 定期的"觉醒爆发"动画 (金色光波扩散)
  - 树周围形成金色曼陀罗图案
  - 金色光柱连接天地
- **效果**: 金色统治整个画面，光明的化身

**技术实现配置表**:

```typescript
export interface GoldAccentConfig {
  particleGoldRatio: number      // 粒子中金色比例 0-1
  rootGoldThreshold: number       // 根系金色化的depth阈值
  trunkGoldFeatures: {
    hasCore: boolean              // 是否有金色核心
    hasVeins: boolean             // 是否有金色纹理
    hasFlow: boolean              // 是否有金色能量流
    hasPillar: boolean            // 是否有金色光柱
  }
  leafGoldRatio: number           // 叶子金色比例
  fruitGoldGlow: boolean          // 果实是否金色发光
  specialGoldEffects: {
    halo: boolean                 // 光环
    connections: boolean          // 连接线
    mandala: boolean              // 曼陀罗
    burst: boolean                // 爆发动画
  }
}

const GOLD_CONFIGS: Record<number, GoldAccentConfig> = {
  1: {
    particleGoldRatio: 0.1,
    rootGoldThreshold: 999,
    trunkGoldFeatures: { hasCore: false, hasVeins: false, hasFlow: false, hasPillar: false },
    leafGoldRatio: 0,
    fruitGoldGlow: false,
    specialGoldEffects: { halo: false, connections: false, mandala: false, burst: false }
  },
  2: {
    particleGoldRatio: 0.2,
    rootGoldThreshold: 8,
    trunkGoldFeatures: { hasCore: false, hasVeins: false, hasFlow: false, hasPillar: false },
    leafGoldRatio: 0,
    fruitGoldGlow: false,
    specialGoldEffects: { halo: false, connections: false, mandala: false, burst: false }
  },
  3: {
    particleGoldRatio: 0.3,
    rootGoldThreshold: 12,
    trunkGoldFeatures: { hasCore: false, hasVeins: false, hasFlow: false, hasPillar: false },
    leafGoldRatio: 0.05,
    fruitGoldGlow: true,
    specialGoldEffects: { halo: false, connections: false, mandala: false, burst: false }
  },
  4: {
    particleGoldRatio: 0.4,
    rootGoldThreshold: 15,
    trunkGoldFeatures: { hasCore: false, hasVeins: true, hasFlow: false, hasPillar: false },
    leafGoldRatio: 0.2,
    fruitGoldGlow: true,
    specialGoldEffects: { halo: false, connections: false, mandala: false, burst: false }
  },
  5: {
    particleGoldRatio: 0.6,
    rootGoldThreshold: 20,
    trunkGoldFeatures: { hasCore: true, hasVeins: true, hasFlow: false, hasPillar: false },
    leafGoldRatio: 0.5,
    fruitGoldGlow: true,
    specialGoldEffects: { halo: false, connections: true, mandala: false, burst: false }
  },
  6: {
    particleGoldRatio: 0.8,
    rootGoldThreshold: 25,
    trunkGoldFeatures: { hasCore: true, hasVeins: true, hasFlow: true, hasPillar: false },
    leafGoldRatio: 0.7,
    fruitGoldGlow: true,
    specialGoldEffects: { halo: true, connections: true, mandala: false, burst: false }
  },
  7: {
    particleGoldRatio: 0.9,
    rootGoldThreshold: 0, // 全部金色
    trunkGoldFeatures: { hasCore: true, hasVeins: true, hasFlow: true, hasPillar: true },
    leafGoldRatio: 1.0,
    fruitGoldGlow: true,
    specialGoldEffects: { halo: true, connections: true, mandala: true, burst: true }
  }
}
```

**实现优先级**:
- ✅ **Phase 1** (必须): 粒子金色混合、根系金色光晕、果实金色发光
- ⚠️ **Phase 2** (重要): 树干金色纹理/核心、叶子金色边缘、果实金色连线
- 💫 **Phase 3** (锦上添花): 金色光环、曼陀罗图案、觉醒爆发动画、金色光柱

---

### 七种树的视觉特征

#### Level 1: 沉睡者之树 🌱
**主题**: 萌芽、潜在

**视觉特征**:
- **根系**: 5个领域都是很浅的小根（depth < 5）
- **树干**: 细弱，灰色，无年轮纹理
- **枝叶**: 几乎没有枝叶，只有1-2片叶子
- **果实**: 无
- **整体感觉**: 种子刚发芽，脆弱但充满潜能
- **粒子效果**: 暗淡的白色粒子，稀疏
- **背景**: 深灰色，星空暗淡

**Canvas实现要点**:
```typescript
if (userLevel === 1) {
  trunkThickness = 1.0  // 最细
  trunkColor = '#9CA3AF'
  maxBranchGeneration = 2  // 最多2代分支
  particleCount = 10
  particleOpacity = 0.3
}
```

---

#### Level 2: 觉醒者之树 🌿
**主题**: 觉醒、初生

**视觉特征**:
- **根系**: 开始在2-3个领域扎根（depth 5-10），根部开始发光
- **树干**: 稍微变粗，出现第一圈绿色年轮
- **枝叶**: 开始有小分支（generation 3-4），5-10片嫩绿色叶子
- **果实**: 无
- **整体感觉**: 生命力开始显现，绿意盎然
- **粒子效果**: 绿色粒子，开始活跃
- **背景**: 夜空中星星变亮

**Canvas实现要点**:
```typescript
if (userLevel === 2) {
  trunkThickness = 1.3
  trunkColor = '#10B981'
  treeRings = [{ color: '#10B981', radius: 50, emotion: 'calm' }]
  maxBranchGeneration = 4
  leafCount = 5-10
  leafColor = '#10B981'
  particleCount = 20
}
```

---

#### Level 3: 探索者之树 🌳
**主题**: 扩展、好奇

**视觉特征**:
- **根系**: 3-4个领域深度扎根（depth 10-15），根部明显粗壮
- **树干**: 明显变粗（1.6x），出现3-5圈年轮（不同情绪颜色）
- **枝叶**: 枝干延伸到generation 5-6，20-30片叶子，开始有不同形状（分析性、直觉性）
- **果实**: 可能有1-2个小果实（未成熟）
- **整体感觉**: 旺盛生长，探索四方
- **粒子效果**: 蓝色粒子，快速流动
- **背景**: 星空璀璨，星云出现

**Canvas实现要点**:
```typescript
if (userLevel === 3) {
  trunkThickness = 1.6
  maxBranchGeneration = 6
  leafCount = 20-30
  leafShapes = ['triangle', 'circle']  // 多种形状
  fruitCount = 1-2
  fruitMaturity = 0.3
  particleCount = 40
  particleColor = '#3B82F6'
}
```

---

#### Level 4: 实践者之树 🌲
**主题**: 稳固、创造

**视觉特征**:
- **根系**: 所有5个领域都有根（depth 15-20），根系交织形成网络
- **树干**: 粗壮（2.0x），6-10圈年轮，纹理复杂
- **枝叶**: 枝干延伸到generation 7-8，50-80片叶子，三种形状都有，排列有序
- **果实**: 3-5个果实，部分成熟（maturity 0.5-0.7），开始发光
- **整体感觉**: 成熟的树，既有深度又有广度
- **粒子效果**: 紫色粒子，形成螺旋上升的能量流
- **背景**: 星河流转，能量场可见

**Canvas实现要点**:
```typescript
if (userLevel === 4) {
  trunkThickness = 2.0
  trunkRings = 6-10
  maxBranchGeneration = 8
  leafCount = 50-80
  leafShapes = ['triangle', 'circle', 'hexagon']
  fruitCount = 3-5
  fruitGlow = true
  particleCount = 60
  particlePattern = 'spiral'
}
```

---

#### Level 5: 洞察者之树 ✨
**主题**: 整合、智慧

**视觉特征**:
- **根系**: 所有领域深度探索（depth 20-30），根系发出金色光芒
- **树干**: 非常粗壮（2.5x），10+圈年轮，树干中心有脉动的金色光核
- **枝叶**: 枝干优雅展开（generation 9-10），100+片叶子，呈现几何美学分布
- **果实**: 8-12个成熟果实，金色光芒，部分果实之间有光线连接
- **整体感觉**: 智慧之树，光芒四射
- **粒子效果**: 金色粒子，形成复杂的曼陀罗图案
- **背景**: 宇宙中心，光芒万丈

**Canvas实现要点**:
```typescript
if (userLevel === 5) {
  trunkThickness = 2.5
  trunkCore = { color: '#F59E0B', glow: true, pulse: true }
  trunkRings = 10+
  maxBranchGeneration = 10
  leafCount = 100+
  leafPattern = 'geometric'  // 几何分布
  fruitCount = 8-12
  fruitMaturity = 0.9
  fruitConnections = true  // 果实间光线连接
  particleCount = 100
  particlePattern = 'mandala'
}
```

---

#### Level 6: 先锋者之树 🔥
**主题**: 突破、引领

**视觉特征**:
- **根系**: 所有领域大师级（depth 30+），根系如同地下星系，光芒汇聚成河
- **树干**: 极其粗壮（3.0x），树干表面流动着橙色能量纹路
- **枝叶**: 枝干突破天际（generation 12+），150+片叶子，一些叶子转化为光点
- **果实**: 15+个完全成熟果实，其中2-3个是"世界种子"（巨大恒星状）
- **整体感觉**: 火焰之树，照亮他人之路
- **粒子效果**: 橙红色粒子，如凤凰火焰般上升
- **背景**: 宇宙创世般的光景

**Canvas实现要点**:
```typescript
if (userLevel === 6) {
  trunkThickness = 3.0
  trunkEnergyFlow = true  // 能量流动效果
  trunkColor = gradient(['#F97316', '#EF4444'])
  maxBranchGeneration = 12
  leafCount = 150+
  leafEvolution = true  // 叶子→光点
  fruitCount = 15+
  worldSeedCount = 2-3
  worldSeedSize = 2x
  particleCount = 150
  particlePattern = 'phoenix'
}
```

---

#### Level 7: 引领者之树 🌌
**主题**: 圆满、宇宙

**视觉特征**:
- **根系**: 根系延伸无限，与整个宇宙星图融为一体
- **树干**: 超粗（3.5x+），树干本身就是光的通道，内部可见能量脉动
- **枝叶**: 枝干如同宇宙射线（generation 15+），200+片叶子，叶子发出各色光芒
- **果实**: 20+个果实，多个"世界种子"（5+），最大的种子如同小太阳
- **整体感觉**: 宇宙树，生命之树，世界树的终极形态
- **粒子效果**: 多色粒子，形成星系旋臂般的壮观景象
- **背景**: 宇宙本源，光与暗的完美平衡
- **特殊效果**:
  - 树会呼吸（整体脉动）
  - 果实之间形成光的网络
  - 定期有"灵感爆发"动画（光芒扩散）

**Canvas实现要点**:
```typescript
if (userLevel === 7) {
  trunkThickness = 3.5+
  trunkIsLightChannel = true
  trunkPulse = { speed: 'slow', amplitude: 0.2 }
  maxBranchGeneration = 15+
  branchLightRays = true
  leafCount = 200+
  leafColors = 'rainbow'
  fruitCount = 20+
  worldSeedCount = 5+
  worldSeedSize = 3x
  fruitNetwork = true  // 果实光网络
  particleCount = 200
  particlePattern = 'galaxy'
  specialEffects = {
    breathing: true,
    inspirationBurst: { interval: 30000 } // 每30秒
  }
}
```

---

## 📊 现有代码评估

### 可复用部分 ✅

**文件**: `components/ui/database-consciousness-roots.tsx`

**可复用代码**:
1. **基础Canvas设置** (100%可用)
   - Canvas ref和context管理
   - 动画循环（requestAnimationFrame）
   - 鼠标交互处理

2. **根系绘制逻辑** (80%可用)
   - 5个领域的根系分支算法
   - 域颜色区分
   - 深度驱动的生长逻辑
   - **需要调整**: 根据层级调整根系粗细和光芒效果

3. **分支数据结构** (90%可用)
   - `Branch` interface已经很完善
   - `Tree` interface包含了必要的属性
   - **需要添加**: `level`, `evolutionStage` 等字段

4. **粒子系统** (60%可用)
   - 基础粒子动画
   - **需要扩展**: 不同层级的粒子模式

### 需要重构部分 ⚠️

1. **缺少层级概念** (需要大改)
   - 当前代码只区分5个领域，没有用户层级（1-7）
   - 需要在组件中引入 `userLevel` 状态

2. **树干绘制不完整** (需要完善)
   - 有 `trunkThickness` 状态但未应用到Canvas
   - 缺少年轮绘制
   - 缺少能量流动效果

3. **叶子系统未实现** (需要新建)
   - 当前只有Branch，没有Leaf
   - 需要实现不同形状的叶子
   - 需要点击交互显示洞见内容

4. **果实系统未实现** (需要新建)
   - 完全缺失
   - 需要从头实现

### 重构 vs 新建评估

**结论**: **60%可复用，40%需要重构/新建**

**建议**:
- ✅ **保留**: Canvas基础、根系算法、分支结构
- 🔧 **重构**: 添加层级参数，调整视觉效果
- ➕ **新增**: 树干完整绘制、叶子系统、果实系统

**不需要全部重构！**

---

## 🔧 实现方案

### 阶段一：层级判定系统（Week 1，3-4天）

#### Task 1.1: 数据库函数（1天）

**创建评估函数**:
```sql
-- 文件: supabase/migrations/xxx_consciousness_level_evaluation.sql

CREATE OR REPLACE FUNCTION evaluate_consciousness_level(
  p_user_id UUID
) RETURNS TABLE (
  consciousness_level INTEGER,
  composite_score DECIMAL(5,2),
  breadth_score DECIMAL(5,2),
  depth_score DECIMAL(5,2),
  stability_score DECIMAL(5,2),
  contribution_score DECIMAL(5,2),
  percentile_rank DECIMAL(5,4)
) AS $$
DECLARE
  v_domain_scores JSONB;
  v_meditation_count INTEGER;
  v_insight_count INTEGER;
  -- ... 其他变量
BEGIN
  -- 1. 获取领域探索数据
  SELECT domain_scores INTO v_domain_scores
  FROM user_domain_exploration
  WHERE user_id = p_user_id;

  -- 2. 计算广度得分
  -- ... (SQL实现评分逻辑)

  -- 3. 计算深度得分
  -- ...

  -- 4. 计算稳定性得分
  -- ...

  -- 5. 计算贡献得分
  -- ...

  -- 6. 计算综合得分
  composite_score := (
    breadth_score * 0.25 +
    depth_score * 0.30 +
    stability_score * 0.25 +
    contribution_score * 0.20
  );

  -- 7. 计算百分位排名
  WITH all_scores AS (
    SELECT composite_score AS score
    FROM consciousness_level_history
    WHERE recorded_at > NOW() - INTERVAL '30 days'
  )
  SELECT
    COUNT(*) FILTER (WHERE score <= composite_score)::DECIMAL /
    NULLIF(COUNT(*), 0)
  INTO percentile_rank
  FROM all_scores;

  -- 8. 判定层级（混合条件）
  consciousness_level := determine_level(
    composite_score,
    breadth_score,
    depth_score,
    stability_score,
    contribution_score,
    percentile_rank
  );

  -- 9. 返回结果
  RETURN QUERY SELECT
    consciousness_level,
    composite_score,
    breadth_score,
    depth_score,
    stability_score,
    contribution_score,
    percentile_rank;
END;
$$ LANGUAGE plpgsql;
```

#### Task 1.2: Edge Function实现（1天）

**文件**: `supabase/functions/evaluate-consciousness-level/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { user_id } = await req.json()

  // 调用数据库函数
  const { data, error } = await supabase
    .rpc('evaluate_consciousness_level', { p_user_id: user_id })

  if (error) throw error

  const evaluation = data[0]

  // 如果层级有变化，更新profiles和记录历史
  const { data: profile } = await supabase
    .from('profiles')
    .select('consciousness_level')
    .eq('id', user_id)
    .single()

  if (profile.consciousness_level !== evaluation.consciousness_level) {
    // 更新profiles
    await supabase
      .from('profiles')
      .update({ consciousness_level: evaluation.consciousness_level })
      .eq('id', user_id)

    // 记录历史
    await supabase
      .from('consciousness_level_history')
      .insert({
        user_id,
        consciousness_level: evaluation.consciousness_level,
        composite_score: evaluation.composite_score,
        domain_depth_score: evaluation.breadth_score,
        activity_score: evaluation.depth_score,
        quality_score: evaluation.stability_score,
        dialogue_depth_score: evaluation.contribution_score
      })

    // 触发通知（层级提升）
    if (evaluation.consciousness_level > profile.consciousness_level) {
      // TODO: 发送庆祝通知
    }
  }

  return new Response(JSON.stringify(evaluation), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### Task 1.3: 定时评估（半天）

**配置**: 每天凌晨3点自动评估所有活跃用户

```sql
-- Supabase Cron Job配置
SELECT cron.schedule(
  'daily-consciousness-evaluation',
  '0 3 * * *', -- 每天凌晨3点
  $$
  SELECT evaluate_consciousness_level(user_id)
  FROM profiles
  WHERE updated_at > NOW() - INTERVAL '7 days'
  $$
);
```

#### Task 1.4: API路由（半天）

**文件**: `app/api/consciousness/evaluate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 调用Edge Function
  const { data, error } = await supabase.functions.invoke(
    'evaluate-consciousness-level',
    { body: { user_id: user.id } }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

---

### 阶段二：视觉差异化实现（Week 2-3，7-10天）

#### Task 2.1: 层级配置系统（1天）

**文件**: `lib/consciousness/level-visual-config.ts`

```typescript
export interface LevelVisualConfig {
  level: number
  name: string
  color: string
  trunk: {
    thickness: number
    color: string
    hasEnergyFlow: boolean
    hasPulse: boolean
    ringCount: number
  }
  roots: {
    glowIntensity: number
    minDepthForGlow: number
  }
  branches: {
    maxGeneration: number
    pattern: 'natural' | 'geometric' | 'cosmic'
  }
  leaves: {
    minCount: number
    maxCount: number
    shapes: ('triangle' | 'circle' | 'hexagon')[]
    pattern: 'random' | 'geometric' | 'fractal'
  }
  fruits: {
    minCount: number
    maxCount: number
    hasglow: boolean
    hasConnections: boolean
    worldSeedCount: number
  }
  particles: {
    count: number
    color: string
    pattern: 'simple' | 'spiral' | 'mandala' | 'phoenix' | 'galaxy'
  }
  background: {
    starDensity: number
    nebula: boolean
    cosmicCenter: boolean
  }
  specialEffects?: {
    breathing?: boolean
    inspirationBurst?: { interval: number }
  }
}

export const LEVEL_CONFIGS: Record<number, LevelVisualConfig> = {
  1: {
    level: 1,
    name: '沉睡者',
    color: '#9CA3AF',
    trunk: {
      thickness: 1.0,
      color: '#9CA3AF',
      hasEnergyFlow: false,
      hasPulse: false,
      ringCount: 0
    },
    roots: {
      glowIntensity: 0.1,
      minDepthForGlow: 10
    },
    branches: {
      maxGeneration: 2,
      pattern: 'natural'
    },
    leaves: {
      minCount: 0,
      maxCount: 3,
      shapes: ['circle'],
      pattern: 'random'
    },
    fruits: {
      minCount: 0,
      maxCount: 0,
      hasglow: false,
      hasConnections: false,
      worldSeedCount: 0
    },
    particles: {
      count: 10,
      color: '#FFFFFF',
      pattern: 'simple'
    },
    background: {
      starDensity: 0.3,
      nebula: false,
      cosmicCenter: false
    }
  },
  2: {
    level: 2,
    name: '觉醒者',
    color: '#10B981',
    trunk: {
      thickness: 1.3,
      color: '#10B981',
      hasEnergyFlow: false,
      hasPulse: false,
      ringCount: 1
    },
    roots: {
      glowIntensity: 0.3,
      minDepthForGlow: 5
    },
    branches: {
      maxGeneration: 4,
      pattern: 'natural'
    },
    leaves: {
      minCount: 5,
      maxCount: 10,
      shapes: ['circle'],
      pattern: 'random'
    },
    fruits: {
      minCount: 0,
      maxCount: 0,
      hasglow: false,
      hasConnections: false,
      worldSeedCount: 0
    },
    particles: {
      count: 20,
      color: '#10B981',
      pattern: 'simple'
    },
    background: {
      starDensity: 0.5,
      nebula: false,
      cosmicCenter: false
    }
  },
  // ... 3-7层级配置
  7: {
    level: 7,
    name: '引领者',
    color: '#EF4444',
    trunk: {
      thickness: 3.5,
      color: 'gradient(#EF4444, #FBBF24)',
      hasEnergyFlow: true,
      hasPulse: true,
      ringCount: 15
    },
    roots: {
      glowIntensity: 1.0,
      minDepthForGlow: 0
    },
    branches: {
      maxGeneration: 15,
      pattern: 'cosmic'
    },
    leaves: {
      minCount: 150,
      maxCount: 250,
      shapes: ['triangle', 'circle', 'hexagon'],
      pattern: 'fractal'
    },
    fruits: {
      minCount: 15,
      maxCount: 30,
      hasglow: true,
      hasConnections: true,
      worldSeedCount: 5
    },
    particles: {
      count: 200,
      color: 'rainbow',
      pattern: 'galaxy'
    },
    background: {
      starDensity: 1.0,
      nebula: true,
      cosmicCenter: true
    },
    specialEffects: {
      breathing: true,
      inspirationBurst: { interval: 30000 }
    }
  }
}
```

#### Task 2.2: 重构根系绘制（2天）

**修改**: `components/ui/database-consciousness-roots.tsx`

```typescript
// 在 draw() 函数中
function drawRoots(
  ctx: CanvasRenderingContext2D,
  tree: Tree,
  levelConfig: LevelVisualConfig,
  domains: Record<string, DomainState>
) {
  tree.branches.forEach(branch => {
    if (!branch.isDomainRoot) return

    const domain = Object.values(domains).find(
      d => d.color === branch.domainColor
    )
    if (!domain) return

    ctx.save()
    ctx.strokeStyle = `hsl(${branch.domainColor}, 70%, 50%)`

    // 根据层级调整粗细
    ctx.lineWidth = branch.stw * levelConfig.trunk.thickness

    // 根据深度和层级配置决定是否发光
    if (domain.depth >= levelConfig.roots.minDepthForGlow) {
      const glowIntensity = levelConfig.roots.glowIntensity
      ctx.shadowBlur = 15 * glowIntensity
      ctx.shadowColor = `hsl(${branch.domainColor}, 100%, 60%)`
    }

    // 绘制根系分支
    ctx.beginPath()
    ctx.moveTo(branch.position.x, branch.position.y)
    const endX = branch.position.x + Math.sin(branch.angle) * branch.age
    const endY = branch.position.y + Math.cos(branch.angle) * branch.age
    ctx.lineTo(endX, endY)
    ctx.stroke()

    ctx.restore()
  })
}
```

#### Task 2.3: 实现树干绘制（2天）

```typescript
function drawTrunk(
  ctx: CanvasRenderingContext2D,
  levelConfig: LevelVisualConfig,
  treeRings: TreeRing[],
  canvas: HTMLCanvasElement
) {
  const centerX = canvas.width / 2
  const centerY = canvas.height - 100
  const trunkHeight = 200
  const trunkWidth = 40 * levelConfig.trunk.thickness

  ctx.save()

  // 1. 绘制主树干
  ctx.fillStyle = levelConfig.trunk.color
  ctx.globalAlpha = 0.8
  ctx.fillRect(
    centerX - trunkWidth / 2,
    centerY - trunkHeight,
    trunkWidth,
    trunkHeight
  )

  // 2. 绘制年轮
  if (treeRings.length > 0) {
    treeRings.forEach((ring, index) => {
      ctx.strokeStyle = ring.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(centerX, centerY - trunkHeight / 2, ring.radius, 0, Math.PI * 2)
      ctx.stroke()
    })
  }

  // 3. 能量流动效果（Level 6+）
  if (levelConfig.trunk.hasEnergyFlow) {
    const time = Date.now() / 1000
    const gradient = ctx.createLinearGradient(
      centerX,
      centerY - trunkHeight,
      centerX,
      centerY
    )
    gradient.addColorStop(0, `rgba(255, 100, 0, ${0.3 + Math.sin(time) * 0.2})`)
    gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0.3)')

    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.5
    ctx.fillRect(
      centerX - trunkWidth / 2,
      centerY - trunkHeight,
      trunkWidth,
      trunkHeight
    )
  }

  // 4. 脉动效果（Level 6+）
  if (levelConfig.trunk.hasPulse) {
    const pulseScale = 1 + Math.sin(Date.now() / 1000) * 0.05
    ctx.globalAlpha = 0.3
    ctx.fillStyle = levelConfig.trunk.color
    ctx.fillRect(
      centerX - (trunkWidth * pulseScale) / 2,
      centerY - trunkHeight,
      trunkWidth * pulseScale,
      trunkHeight
    )
  }

  ctx.restore()
}
```

#### Task 2.4: 实现叶子系统（2天）

```typescript
interface Leaf {
  id: string
  position: Vector2D
  shape: 'triangle' | 'circle' | 'hexagon'
  color: string
  insightType: string
  content: string
  created_at: Date
}

function drawLeaves(
  ctx: CanvasRenderingContext2D,
  leaves: Leaf[],
  levelConfig: LevelVisualConfig
) {
  const visibleLeaves = leaves.slice(0, levelConfig.leaves.maxCount)

  visibleLeaves.forEach(leaf => {
    ctx.save()
    ctx.fillStyle = leaf.color
    ctx.globalAlpha = 0.8

    const size = 6

    switch (leaf.shape) {
      case 'triangle':
        drawTriangle(ctx, leaf.position.x, leaf.position.y, size)
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(leaf.position.x, leaf.position.y, size, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'hexagon':
        drawHexagon(ctx, leaf.position.x, leaf.position.y, size)
        break
    }

    // 光芒效果
    ctx.globalAlpha = 0.3
    ctx.shadowBlur = 10
    ctx.shadowColor = leaf.color
    ctx.fill()

    ctx.restore()
  })
}

function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - size)
  ctx.lineTo(x - size, y + size)
  ctx.lineTo(x + size, y + size)
  ctx.closePath()
  ctx.fill()
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}
```

#### Task 2.5: 实现果实系统（2天）

```typescript
interface Fruit {
  id: string
  position: Vector2D
  type: 'creative_work' | 'world_seed'
  maturity: number // 0-1
  glowIntensity: number
  projectId: string
  resonanceCount: number
}

function drawFruits(
  ctx: CanvasRenderingContext2D,
  fruits: Fruit[],
  levelConfig: LevelVisualConfig
) {
  // 普通果实
  const normalFruits = fruits.filter(f => f.type === 'creative_work')
  normalFruits.forEach(fruit => {
    const size = 8 + fruit.maturity * 6 // 8-14px

    ctx.save()

    if (levelConfig.fruits.hasglow) {
      ctx.shadowBlur = fruit.glowIntensity * 20
      ctx.shadowColor = '#FFAA00'
    }

    const gradient = ctx.createRadialGradient(
      fruit.position.x, fruit.position.y, 0,
      fruit.position.x, fruit.position.y, size
    )
    gradient.addColorStop(0, `rgba(255, 215, 0, ${fruit.glowIntensity})`)
    gradient.addColorStop(1, `rgba(255, 140, 0, ${fruit.glowIntensity * 0.5})`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(fruit.position.x, fruit.position.y, size, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  })

  // 世界种子（特殊渲染）
  const worldSeeds = fruits.filter(f => f.type === 'world_seed')
  worldSeeds.forEach(seed => {
    const size = 20 // 2倍大小

    ctx.save()
    ctx.shadowBlur = 30
    ctx.shadowColor = '#FFD700'
    ctx.fillStyle = '#FFD700'

    // 绘制多角星
    drawStar(ctx, seed.position.x, seed.position.y, size, 8)

    ctx.restore()
  })

  // 果实连接线（Level 5+）
  if (levelConfig.fruits.hasConnections && fruits.length > 1) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'
    ctx.lineWidth = 1

    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        const dist = distance(fruits[i].position, fruits[j].position)
        if (dist < 150) { // 只连接近距离的果实
          ctx.beginPath()
          ctx.moveTo(fruits[i].position.x, fruits[i].position.y)
          ctx.lineTo(fruits[j].position.x, fruits[j].position.y)
          ctx.stroke()
        }
      }
    }

    ctx.restore()
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  points: number
) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i
    const r = i % 2 === 0 ? radius : radius / 2
    const px = x + r * Math.sin(angle)
    const py = y - r * Math.cos(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}
```

---

### 阶段三：集成与优化（Week 3-4，3-4天）

#### Task 3.1: 主组件重构（2天）

**更新**: `components/ui/database-consciousness-roots.tsx`

```typescript
export function DatabaseConsciousnessRoots() {
  const [userLevel, setUserLevel] = useState(1)
  const [treeView, setTreeView] = useState<ConsciousnessTreeView | null>(null)
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const [fruits, setFruits] = useState<Fruit[]>([])

  // 加载用户层级
  useEffect(() => {
    async function loadUserLevel() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('consciousness_level')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserLevel(profile.consciousness_level || 1)
      }
    }
    loadUserLevel()
  }, [])

  // 加载叶子和果实数据
  useEffect(() => {
    // TODO: 从数据库加载insight_leaves和consciousness_fruits
  }, [userLevel])

  // 获取当前层级配置
  const levelConfig = LEVEL_CONFIGS[userLevel]

  // 主绘制函数
  const draw = useCallback(() => {
    if (!canvasRef.current || !treeRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. 绘制背景（星空、星云等）
    drawBackground(ctx, canvas, levelConfig)

    // 2. 绘制根系
    drawRoots(ctx, treeRef.current, levelConfig, domains)

    // 3. 绘制树干
    drawTrunk(ctx, levelConfig, treeRings, canvas)

    // 4. 绘制枝干
    drawBranches(ctx, treeRef.current, levelConfig)

    // 5. 绘制叶子
    drawLeaves(ctx, leaves, levelConfig)

    // 6. 绘制果实
    drawFruits(ctx, fruits, levelConfig)

    // 7. 绘制粒子
    drawParticles(ctx, levelConfig)

    // 8. 特殊效果
    if (levelConfig.specialEffects) {
      drawSpecialEffects(ctx, levelConfig.specialEffects, canvas)
    }
  }, [userLevel, levelConfig, domains, leaves, fruits, treeRings])

  // 动画循环
  useEffect(() => {
    const animate = () => {
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width={window.innerWidth}
        height={window.innerHeight}
      />
      {/* 层级指示器 */}
      <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-4">
        <div className="text-sm text-gray-300">意识层级</div>
        <div className="text-2xl font-bold" style={{ color: levelConfig.color }}>
          Level {userLevel}
        </div>
        <div className="text-sm" style={{ color: levelConfig.color }}>
          {levelConfig.name}
        </div>
      </div>
    </div>
  )
}
```

#### Task 3.2: 性能优化（1天）

1. **离屏Canvas缓存**（静态元素）
2. **限制粒子数量**（根据设备性能）
3. **延迟加载**（先加载关键元素）
4. **requestAnimationFrame优化**（跳帧策略）

#### Task 3.3: 测试与调优（1天）

---

## 📊 总结

### 关键设计决策

1. **层级判定**: 使用混合条件（综合得分+分项要求+百分位），确保真实成长
2. **视觉差异**: 7种树有本质性差异（不仅颜色，还有结构复杂度）
3. **代码复用**: 60%可复用，避免全部重构
4. **渐进式实现**: 分3个阶段（判定系统→视觉系统→集成优化）

### 时间估算

- **阶段一**: 3-4天（层级判定系统）
- **阶段二**: 7-10天（视觉差异化）
- **阶段三**: 3-4天（集成优化）
- **总计**: 13-18天（约2.5-3.5周）

### 风险与挑战

1. **性能风险**: Level 7的树非常复杂，可能卡顿
   - **缓解**: 离屏Canvas、WebGL加速（如需要）

2. **判定公平性**: 确保层级提升是公平的
   - **缓解**: 多次测试、社区反馈、动态调整

3. **视觉一致性**: 7种树风格差异大，但要保持整体美学
   - **缓解**: 统一配色方案、设计规范

---

**最后更新**: 2025-11-10
**版本**: v1.0
**状态**: 📋 待评审
