# 意识树成长与升级系统设计

**文档版本**: v1.0
**创建时间**: 2025-11-16
**状态**: 设计阶段 → 待评审

---

## 📋 目录

1. [核心概念](#核心概念)
2. [双评分系统](#双评分系统)
3. [用户行为评分规则](#用户行为评分规则)
4. [树的形态变化](#树的形态变化)
5. [升级机制](#升级机制)
6. [可扩展课程系统](#可扩展课程系统)
7. [动态成长方案](#动态成长方案)
8. [数据库设计](#数据库设计)
9. [实现示例](#实现示例)

---

## 🌟 核心概念

### 两套关键数据

```
用户行为 → 经验值累积 → 两套评分系统
                ↓
    ┌───────────┴───────────┐
    │                       │
总经验值(EXP)          等级进度(0-100)
    │                       │
决定意识等级(1-7)      决定树的形态
颜色、特效              小苗/小树/大树
```

**1. 总经验值 (Total Experience Points)**
- 永久累积，永不重置
- 决定用户的 `consciousness_level` (1-7)
- 象征用户在平台的整体成长历程

**2. 等级进度 (Level Progress, 0-100)**
- 在当前等级内的进度
- 决定树的形态：seedling(0-33) / young(34-66) / mature(67-100)
- 升级时重置为0，重新从小苗开始

### 成长循环

```
Level 1 (灰色)
├─ 小苗 (0-33分)   ← 刚开始
├─ 小树 (34-66分)  ← 探索中
├─ 大树 (67-100分) ← 接近升级
└─ ✨ 达到100分 + 满足升级条件
    ↓
Level 2 (绿色)
├─ 小苗 (0-33分)   ← 重新开始，但颜色变了！
├─ 小树 (34-66分)
├─ 大树 (67-100分)
└─ ✨ 升级
    ↓
Level 3 (蓝色)...
```

---

## 📊 双评分系统

### 系统一：总经验值系统 (EXP)

**字段**: `profiles.total_experience_points` (integer, default 0)

**作用**:
- 记录用户在平台的所有学习成果
- 决定 `consciousness_level` (1-7)

**等级所需经验值表**:

| 等级 | 等级名称 | 所需总EXP | 当前等级所需EXP | 主色 |
|------|---------|----------|----------------|------|
| 1 | 沉睡者 | 0 - 500 | 500 | 灰色 |
| 2 | 觉醒者 | 500 - 1,500 | 1,000 | 绿色 |
| 3 | 探索者 | 1,500 - 3,500 | 2,000 | 蓝色 |
| 4 | 实践者 | 3,500 - 7,000 | 3,500 | 紫色 |
| 5 | 洞察者 | 7,000 - 12,000 | 5,000 | 黄色 |
| 6 | 先锋者 | 12,000 - 20,000 | 8,000 | 橙色 |
| 7 | 引领者 | 20,000+ | ∞ | 红色 |

**设计理念**:
- 每个等级所需经验值递增（类似游戏等级设计）
- Level 1-2: 快速升级，建立成就感
- Level 3-5: 中速升级，深入探索
- Level 6-7: 慢速升级，大师之路

**升级判定**:
```typescript
function determineLevel(totalExp: number): number {
  if (totalExp < 500) return 1
  if (totalExp < 1500) return 2
  if (totalExp < 3500) return 3
  if (totalExp < 7000) return 4
  if (totalExp < 12000) return 5
  if (totalExp < 20000) return 6
  return 7
}
```

---

### 系统二：等级进度系统 (Level Progress)

**字段**: `profiles.level_progress` (decimal, 0-100)

**作用**:
- 显示用户在当前等级内的进度
- 决定树的形态（小苗/小树/大树）

**计算公式**:
```typescript
// 获取当前等级的经验值范围
const currentLevelRange = LEVEL_EXP_RANGES[currentLevel]

// 当前等级内已获得的经验值
const expInCurrentLevel = totalExp - currentLevelRange.start

// 当前等级所需的总经验值
const expNeededForLevel = currentLevelRange.end - currentLevelRange.start

// 进度百分比
level_progress = (expInCurrentLevel / expNeededForLevel) * 100
```

**示例**:
```
用户总EXP = 1200
→ consciousness_level = 2 (因为500 < 1200 < 1500)
→ Level 2 范围: 500-1500
→ 当前等级内EXP = 1200 - 500 = 700
→ Level 2 所需EXP = 1500 - 500 = 1000
→ level_progress = (700 / 1000) * 100 = 70
→ 树的形态 = mature (大树)
```

**形态映射**:
```typescript
function getTreeForm(levelProgress: number): 'seedling' | 'young' | 'mature' {
  if (levelProgress < 34) return 'seedling'  // 小苗
  if (levelProgress < 67) return 'young'     // 小树
  return 'mature'                             // 大树
}
```

---

## 🎯 用户行为评分规则

### 行为类型与经验值

#### 1️⃣ 完成课程内容 (Course Completion)

**基础经验值**:
```typescript
const COURSE_EXP = {
  // Stage类型的课程单元
  stage: {
    base: 50,                    // 基础分
    firstTime: 30,               // 首次完成奖励
    depthBonus: 20,              // 深度探索奖励
  },

  // Module类型的课程单元
  module: {
    base: 30,
    firstTime: 15,
    depthBonus: 10,
  },

  // Lesson类型的课程单元
  lesson: {
    base: 10,
    firstTime: 5,
    depthBonus: 5,
  }
}
```

**计算逻辑**:
```typescript
function calculateCourseExp(
  contentType: 'stage' | 'module' | 'lesson',
  isFirstTime: boolean,
  hasDeepEngagement: boolean
): number {
  const config = COURSE_EXP[contentType]

  let exp = config.base

  // 首次完成奖励
  if (isFirstTime) {
    exp += config.firstTime
  }

  // 深度探索奖励（完成时间超过平均、有笔记、有思考等）
  if (hasDeepEngagement) {
    exp += config.depthBonus
  }

  return exp
}
```

**深度探索判定标准**:
- 学习时长 > 平均时长的1.5倍
- 提交了学习笔记或反思
- 与Gaia对话 > 3次关于该内容
- 完成了相关练习或思考题

**示例**:
```
用户首次完成"欢迎来到地球 Stage 1"，用时45分钟（平均25分钟），并提交了反思
→ base: 50
→ firstTime: 30
→ deepEngagement: 20
→ Total: 100 EXP
```

#### 2️⃣ 冥想练习 (Meditation)

**基础经验值**:
```typescript
const MEDITATION_EXP = {
  perSession: 5,              // 每次冥想基础分
  durationBonus: {
    short: 0,                 // < 10分钟: 无奖励
    medium: 5,                // 10-20分钟: +5
    long: 15,                 // > 20分钟: +15
  },
  streakBonus: {
    3: 10,                    // 连续3天: +10
    7: 30,                    // 连续7天: +30
    30: 100,                  // 连续30天: +100
    90: 300,                  // 连续90天: +300
  },
  reflectionBonus: 10,        // 提交深度反思: +10
}
```

**计算逻辑**:
```typescript
function calculateMeditationExp(
  durationMinutes: number,
  currentStreak: number,
  hasReflection: boolean
): number {
  let exp = MEDITATION_EXP.perSession

  // 时长奖励
  if (durationMinutes >= 20) {
    exp += MEDITATION_EXP.durationBonus.long
  } else if (durationMinutes >= 10) {
    exp += MEDITATION_EXP.durationBonus.medium
  }

  // 连续性奖励（里程碑式）
  if (MEDITATION_EXP.streakBonus[currentStreak]) {
    exp += MEDITATION_EXP.streakBonus[currentStreak]
  }

  // 反思奖励
  if (hasReflection) {
    exp += MEDITATION_EXP.reflectionBonus
  }

  return exp
}
```

**示例**:
```
用户冥想15分钟，连续第7天，提交了情绪记录和反思
→ base: 5
→ medium duration: 5
→ 7-day streak: 30
→ reflection: 10
→ Total: 50 EXP
```

#### 3️⃣ 与Gaia对话 (Dialogue with Gaia)

**基础经验值**:
```typescript
const DIALOGUE_EXP = {
  perMessage: 2,              // 每条消息基础分
  deepDialogue: {
    threshold: 5,             // 连续5轮以上算深度对话
    bonus: 20,                // 深度对话奖励
  },
  insightExtracted: 30,       // AI识别到洞见: +30
  topicDiversity: {
    newTopic: 5,              // 探索新话题: +5
    crossDomain: 15,          // 跨领域整合: +15
  }
}
```

**深度对话判定**:
- 连续对话轮次 >= 5
- 对话时长 > 10分钟
- AI判定为"深度思考"类对话（非简单问答）

**示例**:
```
用户与Gaia进行了15轮对话，探讨"声音与意识的关系"，AI提取到2个洞见
→ messages: 15 * 2 = 30
→ deep dialogue: 20
→ insights: 2 * 30 = 60
→ cross-domain: 15
→ Total: 125 EXP
```

#### 4️⃣ 洞见生成 (Insight Generation)

**基础经验值**:
```typescript
const INSIGHT_EXP = {
  base: 30,                   // 每个洞见基础分
  qualityBonus: {
    depthScore: {             // 基于AI评估的深度分数(0-100)
      excellent: 50,          // >= 90: +50
      good: 30,               // >= 70: +30
      average: 10,            // >= 50: +10
    },
    originalityScore: {       // 基于AI评估的原创性(0-100)
      excellent: 40,          // >= 90: +40
      good: 20,               // >= 70: +20
      average: 5,             // >= 50: +5
    }
  },
  typeBonus: {
    integration: 30,          // 整合性洞见: +30
    breakthrough: 50,         // 突破性洞见: +50
    reflection: 15,           // 反思性洞见: +15
    awareness: 20,            // 觉察性洞见: +20
  }
}
```

**计算逻辑**:
```typescript
function calculateInsightExp(insight: {
  depthScore: number,
  originalityScore: number,
  type: string
}): number {
  let exp = INSIGHT_EXP.base

  // 深度奖励
  if (insight.depthScore >= 90) {
    exp += INSIGHT_EXP.qualityBonus.depthScore.excellent
  } else if (insight.depthScore >= 70) {
    exp += INSIGHT_EXP.qualityBonus.depthScore.good
  } else if (insight.depthScore >= 50) {
    exp += INSIGHT_EXP.qualityBonus.depthScore.average
  }

  // 原创性奖励
  if (insight.originalityScore >= 90) {
    exp += INSIGHT_EXP.qualityBonus.originalityScore.excellent
  } else if (insight.originalityScore >= 70) {
    exp += INSIGHT_EXP.qualityBonus.originalityScore.good
  } else if (insight.originalityScore >= 50) {
    exp += INSIGHT_EXP.qualityBonus.originalityScore.average
  }

  // 类型奖励
  exp += INSIGHT_EXP.typeBonus[insight.type] || 0

  return exp
}
```

**示例**:
```
AI从对话中提取到一个"整合性洞见"，深度90分，原创性75分
→ base: 30
→ depth excellent: 50
→ originality good: 20
→ integration type: 30
→ Total: 130 EXP
```

#### 5️⃣ PBL项目 (Project-Based Learning)

**基础经验值**:
```typescript
const PROJECT_EXP = {
  creation: 100,              // 创建项目: 100
  milestones: {
    started: 50,              // 开始执行: +50
    halfDone: 100,            // 完成50%: +100
    completed: 200,           // 完成项目: +200
  },
  quality: {
    basic: 0,                 // 基本完成: 0
    good: 100,                // 质量良好: +100
    excellent: 300,           // 质量优秀: +300
  },
  impact: {
    perResonance: 10,         // 每个共鸣: +10
    featured: 200,            // 被精选: +200
    worldSeed: 500,           // 成为世界种子: +500
  },
  collaboration: {
    perMember: 20,            // 每个协作成员: +20
    leaderBonus: 50,          // 作为领导者: +50
  }
}
```

**计算逻辑**:
```typescript
function calculateProjectExp(project: {
  status: 'started' | 'in_progress' | 'completed',
  completionPercentage: number,
  qualityRating: number,  // 1-5星
  resonanceCount: number,
  isFeatured: boolean,
  isWorldSeed: boolean,
  memberCount: number,
  isLeader: boolean
}): number {
  let exp = PROJECT_EXP.creation

  // 里程碑奖励
  if (project.status === 'completed') {
    exp += PROJECT_EXP.milestones.completed
  } else if (project.completionPercentage >= 50) {
    exp += PROJECT_EXP.milestones.halfDone
  } else if (project.status === 'started') {
    exp += PROJECT_EXP.milestones.started
  }

  // 质量奖励
  if (project.qualityRating >= 4.5) {
    exp += PROJECT_EXP.quality.excellent
  } else if (project.qualityRating >= 3.5) {
    exp += PROJECT_EXP.quality.good
  }

  // 影响力奖励
  exp += project.resonanceCount * PROJECT_EXP.impact.perResonance
  if (project.isFeatured) exp += PROJECT_EXP.impact.featured
  if (project.isWorldSeed) exp += PROJECT_EXP.impact.worldSeed

  // 协作奖励
  if (project.memberCount > 1) {
    exp += (project.memberCount - 1) * PROJECT_EXP.collaboration.perMember
    if (project.isLeader) exp += PROJECT_EXP.collaboration.leaderBonus
  }

  return exp
}
```

**示例**:
```
用户完成了一个PBL项目，质量4.8星，获得25个共鸣，被精选，3人协作，用户是leader
→ creation: 100
→ completed: 200
→ excellent quality: 300
→ resonance: 25 * 10 = 250
→ featured: 200
→ collaboration: 2 * 20 = 40
→ leader: 50
→ Total: 1,140 EXP
```

#### 6️⃣ 社区互动 (Community Engagement)

**基础经验值**:
```typescript
const COMMUNITY_EXP = {
  comment: {
    base: 3,                  // 评论: 3
    thoughtful: 10,           // 深度评论(>50字): +10
    resonated: 5,             // 被点赞: +5
  },
  help: {
    answer: 15,               // 回答问题: 15
    accepted: 30,             // 答案被采纳: +30
  },
  sharing: {
    post: 10,                 // 分享内容: 10
    perView: 0.5,             // 每个浏览: +0.5
    perLike: 2,               // 每个点赞: +2
  },
  mentoring: {
    session: 50,              // 指导他人: 50
    feedback: 100,            // 获得良好反馈: +100
  }
}
```

---

## 🌳 树的形态变化

### 三种形态详细定义

#### 1. 小苗 (Seedling, 0-33分)

**视觉特征**:
- **总高度**: 12% 屏幕高度
- **树干**:
  - 宽度: 8% 基础宽度
  - 更像"茎"而非树干
  - 细嫩，略微透明(opacity 0.85)
- **根系**:
  - 最多2根主根
  - 根系长度: 60% 标准长度
  - 根系粗细: 15% 标准粗细
  - 深度限制: 只在depth > 8的领域才显示细小根须
- **枝叶**:
  - 最多3片小叶子
  - 叶子大小: 50% 标准大小
  - 无分支或最多1层分支
- **果实**: 无
- **金色**: 根据等级，微弱金色粒子

**代码参数**:
```typescript
const seedlingScaling = {
  trunkWidth: 0.08,
  trunkLength: 0.12,
  rootWidth: 0.15,
  rootLength: 0.6,
  maxRootBranches: 2,
  rootDepthThreshold: 8,
  maxLeaves: 3,
  leafSize: 0.5,
  maxBranchGeneration: 1,
  fruitCount: 0,
}
```

**用户感受**:
- "我刚开始"
- "还很脆弱，需要呵护"
- "充满潜力"

---

#### 2. 小树 (Young Tree, 34-66分)

**视觉特征**:
- **总高度**: 35% 屏幕高度
- **树干**:
  - 宽度: 40% 基础宽度
  - 开始有树干的感觉
  - 出现第一圈年轮(如果有冥想记录)
- **根系**:
  - 3-4根主根
  - 根系长度: 80% 标准长度
  - 根系粗细: 50% 标准粗细
  - 在depth > 5的领域显示根系
  - 开始有二级根须
- **枝叶**:
  - 8-15片叶子
  - 叶子大小: 75% 标准大小
  - 2-3层分支
  - 开始有小分叉
- **果实**:
  - 如果完成了PBL，可能有1-2个小果实
  - 果实成熟度 < 50%
- **金色**: 根据等级，金色开始显现

**代码参数**:
```typescript
const youngScaling = {
  trunkWidth: 0.4,
  trunkLength: 0.35,
  rootWidth: 0.5,
  rootLength: 0.8,
  maxRootBranches: 8,
  rootDepthThreshold: 5,
  maxLeaves: 15,
  leafSize: 0.75,
  maxBranchGeneration: 3,
  fruitCount: 2,
  fruitMaturity: 0.4,
}
```

**用户感受**:
- "我在成长"
- "已经有了一些积累"
- "继续努力"

---

#### 3. 大树 (Mature Tree, 67-100分)

**视觉特征**:
- **总高度**: 50% 屏幕高度
- **树干**:
  - 宽度: 100% 基础宽度
  - 粗壮有力
  - 多圈年轮，纹理清晰
  - 根据等级有金色纹理/核心/能量流
- **根系**:
  - 所有5个领域都有根系
  - 根系长度: 100% 标准长度
  - 根系粗细: 100% 标准粗细
  - 深度根系有3-4层根须
  - 根系交织成网络
- **枝叶**:
  - 20-30片叶子(根据等级更多)
  - 叶子大小: 100% 标准大小
  - 5-8层分支
  - 优美的分叉结构
  - 根据等级，部分叶子为金色
- **果实**:
  - 3-8个果实
  - 果实成熟度 >= 70%
  - 果实发光
  - 根据等级，果实间有金色连线
- **金色**: 根据等级，金色特效丰富

**代码参数**:
```typescript
const matureScaling = {
  trunkWidth: 1.0,
  trunkLength: 0.5,
  rootWidth: 1.0,
  rootLength: 1.0,
  maxRootBranches: 25,
  rootDepthThreshold: 0,  // 所有领域都显示
  maxLeaves: 30,
  leafSize: 1.0,
  maxBranchGeneration: 8,
  fruitCount: 8,
  fruitMaturity: 0.8,
}
```

**用户感受**:
- "我即将突破"
- "已经很强大了"
- "准备迎接新的挑战"

---

### 形态过渡动画

**平滑过渡**: 树的形态应该是连续变化的，而非突变

```typescript
function interpolateTreeScaling(levelProgress: number) {
  // 定义关键帧
  const keyframes = [
    { progress: 0,   scaling: seedlingScaling },
    { progress: 33,  scaling: seedlingScaling },
    { progress: 34,  scaling: youngScaling },
    { progress: 66,  scaling: youngScaling },
    { progress: 67,  scaling: matureScaling },
    { progress: 100, scaling: matureScaling },
  ]

  // 找到当前所在的区间
  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i]
    const next = keyframes[i + 1]

    if (levelProgress >= current.progress && levelProgress <= next.progress) {
      // 线性插值
      const t = (levelProgress - current.progress) / (next.progress - current.progress)
      return lerpScaling(current.scaling, next.scaling, t)
    }
  }

  return matureScaling
}

function lerpScaling(a: TreeScaling, b: TreeScaling, t: number): TreeScaling {
  return {
    trunkWidth: lerp(a.trunkWidth, b.trunkWidth, t),
    trunkLength: lerp(a.trunkLength, b.trunkLength, t),
    rootWidth: lerp(a.rootWidth, b.rootWidth, t),
    rootLength: lerp(a.rootLength, b.rootLength, t),
    maxRootBranches: Math.round(lerp(a.maxRootBranches, b.maxRootBranches, t)),
    rootDepthThreshold: Math.round(lerp(a.rootDepthThreshold, b.rootDepthThreshold, t)),
    maxLeaves: Math.round(lerp(a.maxLeaves, b.maxLeaves, t)),
    leafSize: lerp(a.leafSize, b.leafSize, t),
    maxBranchGeneration: Math.round(lerp(a.maxBranchGeneration, b.maxBranchGeneration, t)),
    fruitCount: Math.round(lerp(a.fruitCount, b.fruitCount, t)),
    fruitMaturity: lerp(a.fruitMaturity || 0, b.fruitMaturity || 0, t),
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
```

---

## 🎊 升级机制

### 升级流程

```
1. 用户完成某个行为
   ↓
2. 计算该行为的EXP
   ↓
3. total_experience_points += EXP
   ↓
4. 判断是否达到下一等级所需EXP
   ↓
5. 如果是：
   - consciousness_level += 1
   - 触发升级动画
   - 重置 level_progress = 0
   - 触发升级通知
   - 记录到 consciousness_level_history
   ↓
6. 如果否：
   - 更新 level_progress
   - 树平滑生长动画
```

### 升级条件

**基础条件**: 达到所需EXP

**附加条件** (可选，确保真实成长):

```typescript
interface LevelUpRequirements {
  minTotalExp: number              // 最低总经验值
  minDomainCount?: number          // 至少探索N个领域
  minMeditationDays?: number       // 至少冥想N天
  minInsights?: number             // 至少N个洞见
  minProjects?: number             // 至少N个项目
  minCommunityContribution?: number // 最低社区贡献
}

const LEVEL_UP_REQUIREMENTS: Record<number, LevelUpRequirements> = {
  2: {  // Level 1 → 2
    minTotalExp: 500,
    minDomainCount: 1,              // 至少探索1个领域
    minMeditationDays: 3,           // 至少冥想3天
  },
  3: {  // Level 2 → 3
    minTotalExp: 1500,
    minDomainCount: 2,
    minMeditationDays: 14,
    minInsights: 5,
  },
  4: {  // Level 3 → 4
    minTotalExp: 3500,
    minDomainCount: 3,
    minMeditationDays: 30,
    minInsights: 20,
    minProjects: 1,
  },
  5: {  // Level 4 → 5
    minTotalExp: 7000,
    minDomainCount: 4,
    minMeditationDays: 60,
    minInsights: 50,
    minProjects: 3,
    minCommunityContribution: 100,
  },
  6: {  // Level 5 → 6
    minTotalExp: 12000,
    minDomainCount: 5,
    minMeditationDays: 120,
    minInsights: 100,
    minProjects: 8,
    minCommunityContribution: 500,
  },
  7: {  // Level 6 → 7
    minTotalExp: 20000,
    minDomainCount: 5,
    minMeditationDays: 365,
    minInsights: 200,
    minProjects: 15,
    minCommunityContribution: 2000,
  }
}
```

### 升级动画

**视觉效果**:
1. **准备阶段** (1秒)
   - 大树开始发光
   - 金色粒子加速聚集
   - 背景音效：能量汇聚

2. **升级爆发** (2秒)
   - 金色光波从树中心向外扩散
   - 树的颜色开始转变(灰→绿，绿→蓝...)
   - 所有叶子和果实短暂发出强光
   - 背景音效：升级音效

3. **形态转换** (3秒)
   - 树快速"缩小"回小苗形态
   - 但颜色已经是新等级的颜色
   - 根系重新生长
   - 背景音效：新生命音效

4. **完成** (1秒)
   - 新等级的小苗稳定显示
   - 显示升级祝贺卡片
   - 粒子效果恢复正常

**祝贺卡片**:
```
┌──────────────────────────────────┐
│        ✨ 意识层级提升！ ✨        │
├──────────────────────────────────┤
│                                   │
│     Level 2 → Level 3             │
│    觉醒者 → 探索者                │
│                                   │
│  你的意识之树已经成长到新的高度   │
│                                   │
│  新的旅程从这颗小苗开始           │
│  继续探索，不断觉醒               │
│                                   │
│  🎁 解锁新特性：                  │
│  • 蓝色树 + 金色星辰粒子          │
│  • 更深的根系探索                 │
│  • 新的洞见类型                   │
│                                   │
│         [继续成长]                 │
└──────────────────────────────────┘
```

---

## 📚 可扩展课程系统

### 课程元数据设计

**目标**: 未来可以动态添加新课程，而不需要修改代码

**数据结构**:
```typescript
interface Course {
  id: string
  title: string
  description: string
  domains: DomainType[]          // 课程关联的领域
  difficulty: 1 | 2 | 3 | 4 | 5  // 难度等级
  recommendedLevel: number        // 推荐等级(1-7)
  structure: CourseStructure
  metadata: CourseMetadata
}

interface CourseStructure {
  type: 'sequential' | 'flexible' | 'project-based'
  stages?: Stage[]
  modules?: Module[]
  lessons?: Lesson[]
}

interface CourseMetadata {
  estimatedHours: number          // 预估学时
  expReward: {
    base: number                  // 基础经验值
    perUnit: number               // 每单元经验值
    completion: number            // 完成奖励
  }
  domainImpact: {                 // 对各领域的影响
    [domain: string]: number      // 完成后增加的depth_score
  }
  prerequisites?: string[]        // 前置课程ID
  unlocks?: string[]              // 解锁的课程ID
}
```

**示例 - 现有三大课程**:

```typescript
const EXISTING_COURSES: Course[] = [
  {
    id: 'earth-welcome',
    title: '欢迎来到地球',
    description: '从声音觉察开始的生命探索',
    domains: ['self_awareness', 'life_sciences'],
    difficulty: 1,
    recommendedLevel: 1,
    structure: {
      type: 'sequential',
      stages: [
        { id: 'stage-1', title: '声音觉察', units: 7, exp: 50 },
        { id: 'stage-2', title: '身体觉察', units: 7, exp: 50 },
        { id: 'stage-3', title: '整合', units: 5, exp: 60 },
      ]
    },
    metadata: {
      estimatedHours: 15,
      expReward: {
        base: 100,
        perUnit: 50,
        completion: 200,
      },
      domainImpact: {
        self_awareness: 10,
        life_sciences: 8,
      },
      unlocks: ['meditation-guide', 'self-listening']
    }
  },

  {
    id: 'meditation-guide',
    title: '冥想指南',
    description: '建立稳定的内在修炼',
    domains: ['self_awareness'],
    difficulty: 2,
    recommendedLevel: 2,
    structure: {
      type: 'flexible',
      modules: [
        { id: 'basics', title: '冥想基础', lessons: 5, exp: 30 },
        { id: 'techniques', title: '冥想技巧', lessons: 8, exp: 40 },
        { id: 'advanced', title: '高级修炼', lessons: 6, exp: 50 },
      ]
    },
    metadata: {
      estimatedHours: 20,
      expReward: {
        base: 150,
        perUnit: 35,
        completion: 300,
      },
      domainImpact: {
        self_awareness: 15,
      },
      prerequisites: ['earth-welcome']
    }
  },

  {
    id: 'self-listening',
    title: '自在聆听',
    description: '深度倾听与沟通的艺术',
    domains: ['self_awareness', 'social_connection'],
    difficulty: 2,
    recommendedLevel: 2,
    structure: {
      type: 'sequential',
      stages: [
        { id: 'day-1-7', title: '第1-7天', units: 7, exp: 45 },
        { id: 'day-8-14', title: '第8-14天', units: 7, exp: 50 },
        { id: 'integration', title: '整合', units: 3, exp: 60 },
      ]
    },
    metadata: {
      estimatedHours: 18,
      expReward: {
        base: 120,
        perUnit: 45,
        completion: 250,
      },
      domainImpact: {
        self_awareness: 12,
        social_connection: 15,
      },
      prerequisites: ['earth-welcome']
    }
  }
]
```

### 未来课程添加流程

**1. 管理员在后台创建课程**:
- 填写课程元数据
- 定义课程结构
- 设置经验值奖励
- 指定领域影响

**2. 系统自动处理**:
- 课程保存到 `courses` 表
- 根据 `recommendedLevel` 自动推荐给合适等级的用户
- 根据 `prerequisites` 自动管理解锁逻辑
- 完成课程时，根据 `domainImpact` 自动更新用户的 `domain_scores`

**3. 无需代码修改**:
- 经验值计算自动应用 `expReward` 配置
- 领域影响自动应用 `domainImpact` 配置
- 升级判定逻辑保持不变

---

## 🤖 动态成长方案

### 个性化推荐系统

**目标**: 根据用户的当前状态，动态推荐最适合的成长路径

**输入数据**:
```typescript
interface UserState {
  consciousness_level: number
  level_progress: number
  total_experience_points: number
  domain_scores: Record<DomainType, number>
  completed_courses: string[]
  meditation_streak: number
  recent_insights: number
  project_count: number
  weak_areas: DomainType[]       // 薄弱领域
  strong_areas: DomainType[]     // 强势领域
  learning_style: 'fast' | 'steady' | 'deep'  // 学习风格
}
```

**推荐算法**:

```typescript
function generateGrowthPlan(user: UserState): GrowthPlan {
  const recommendations: Recommendation[] = []

  // 1. 优先推荐前置课程已完成的课程
  const availableCourses = COURSES.filter(course => {
    // 检查前置条件
    if (course.metadata.prerequisites) {
      return course.metadata.prerequisites.every(
        prereq => user.completed_courses.includes(prereq)
      )
    }
    return true
  })

  // 2. 根据用户等级过滤
  const levelAppropriate = availableCourses.filter(
    course => Math.abs(course.recommendedLevel - user.consciousness_level) <= 1
  )

  // 3. 分析用户薄弱领域
  const weakDomains = Object.entries(user.domain_scores)
    .filter(([_, score]) => score < 10)
    .map(([domain, _]) => domain)

  // 4. 推荐能提升薄弱领域的课程
  const balancingCourses = levelAppropriate.filter(
    course => course.domains.some(d => weakDomains.includes(d))
  )

  // 5. 如果冥想较少，推荐冥想
  if (user.meditation_streak < 7) {
    recommendations.push({
      type: 'meditation',
      priority: 'high',
      reason: '建立稳定的内在修炼是成长的基石',
      goal: '连续冥想7天',
      expReward: 100,
    })
  }

  // 6. 如果洞见较少，推荐深度对话
  if (user.recent_insights < 5) {
    recommendations.push({
      type: 'dialogue',
      priority: 'medium',
      reason: '通过与Gaia的对话，挖掘更多洞见',
      goal: '进行3次深度对话，提取5个洞见',
      expReward: 200,
    })
  }

  // 7. 推荐平衡性课程
  if (balancingCourses.length > 0) {
    recommendations.push({
      type: 'course',
      course: balancingCourses[0],
      priority: 'high',
      reason: `提升你在「${balancingCourses[0].domains[0]}」领域的探索`,
      expReward: balancingCourses[0].metadata.expReward.completion,
    })
  }

  // 8. 根据学习风格调整
  if (user.learning_style === 'fast') {
    // 推荐短期、高奖励的任务
  } else if (user.learning_style === 'deep') {
    // 推荐深度、长期的项目
  }

  // 9. 计算升级还需多少EXP
  const nextLevelExp = LEVEL_EXP_RANGES[user.consciousness_level + 1]?.start || Infinity
  const expNeeded = nextLevelExp - user.total_experience_points

  return {
    recommendations: recommendations.sort((a, b) =>
      priorityValue(b.priority) - priorityValue(a.priority)
    ),
    nextLevel: {
      level: user.consciousness_level + 1,
      expNeeded: expNeeded,
      estimatedDays: estimateDaysToLevel(expNeeded, user.learning_style),
    },
    currentFocus: determineFocus(user),
  }
}

function determineFocus(user: UserState): string {
  // 分析用户应该聚焦的方向
  if (user.meditation_streak < 14) {
    return '内在稳定性 - 建立冥想习惯'
  }
  if (user.weak_areas.length >= 3) {
    return '探索广度 - 拓展新领域'
  }
  if (user.project_count === 0 && user.consciousness_level >= 3) {
    return '创造贡献 - 开始PBL项目'
  }
  if (user.strong_areas.length > 0) {
    return `探索深度 - 深化「${user.strong_areas[0]}」领域`
  }
  return '全面发展 - 持续探索'
}
```

### 成长建议展示

**界面位置**: 个人门户 Portal 页面

```
┌─────────────────────────────────────┐
│  🌱 你的成长计划                     │
├─────────────────────────────────────┤
│                                      │
│  当前等级：Level 2 觉醒者 (绿色)     │
│  进度：45% (小树形态)                │
│  距离 Level 3：还需 350 EXP          │
│  预计：15天 (按当前速度)              │
│                                      │
│  📍 当前聚焦：内在稳定性              │
│                                      │
│  🎯 优先推荐：                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│  1. [高优先级] 冥想修炼               │
│     理由：建立稳定的内在修炼是基石    │
│     目标：连续冥想7天                │
│     奖励：+100 EXP                   │
│     [开始冥想]                       │
│                                      │
│  2. [高优先级] 学习「冥想指南」       │
│     理由：提升你在自我觉察领域的探索  │
│     预计：20小时                     │
│     奖励：+450 EXP                   │
│     [开始学习]                       │
│                                      │
│  3. [中优先级] 与Gaia深度对话         │
│     理由：挖掘更多洞见               │
│     目标：3次深度对话，5个洞见       │
│     奖励：+200 EXP                   │
│     [开始对话]                       │
│                                      │
│  📊 薄弱领域：                        │
│  • 通用法则 (depth: 3)               │
│  • 创意表达 (depth: 2)               │
│                                      │
│  💪 强势领域：                        │
│  • 自我觉察 (depth: 15)              │
│                                      │
└─────────────────────────────────────┘
```

---

## 💾 数据库设计

### 新增/修改字段

**profiles 表**:
```sql
ALTER TABLE profiles
ADD COLUMN total_experience_points INTEGER DEFAULT 0,
ADD COLUMN level_progress DECIMAL(5,2) DEFAULT 0,
ADD COLUMN learning_style VARCHAR(20) DEFAULT 'steady',
ADD COLUMN last_exp_gain_at TIMESTAMP;

-- 索引
CREATE INDEX idx_profiles_exp ON profiles(total_experience_points);
CREATE INDEX idx_profiles_level ON profiles(consciousness_level);
```

**新表: experience_log (经验值日志)**:
```sql
CREATE TABLE experience_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action_type VARCHAR(50) NOT NULL,  -- 'course_complete', 'meditation', 'dialogue', etc.
  exp_gained INTEGER NOT NULL,
  related_id UUID,                    -- 关联的课程/项目/对话ID
  metadata JSONB,                     -- 详细信息
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_experience_log_user ON experience_log(user_id, created_at DESC);
CREATE INDEX idx_experience_log_type ON experience_log(action_type);
```

**新表: growth_recommendations (成长推荐)**:
```sql
CREATE TABLE growth_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  recommendation_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  reason TEXT,
  goal TEXT,
  exp_reward INTEGER,
  related_course_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_growth_recommendations_user ON growth_recommendations(user_id, is_active);
```

---

## 🔧 实现示例

### Edge Function: 添加经验值

**文件**: `supabase/functions/add-experience/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEVEL_EXP_RANGES = {
  1: { start: 0, end: 500 },
  2: { start: 500, end: 1500 },
  3: { start: 1500, end: 3500 },
  4: { start: 3500, end: 7000 },
  5: { start: 7000, end: 12000 },
  6: { start: 12000, end: 20000 },
  7: { start: 20000, end: Infinity },
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { user_id, action_type, exp_gained, related_id, metadata } = await req.json()

  // 1. 获取用户当前数据
  const { data: user } = await supabase
    .from('profiles')
    .select('total_experience_points, consciousness_level, level_progress')
    .eq('id', user_id)
    .single()

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }

  // 2. 计算新的总经验值
  const newTotalExp = user.total_experience_points + exp_gained

  // 3. 判断新的等级
  const newLevel = determineLevel(newTotalExp)
  const oldLevel = user.consciousness_level

  // 4. 计算新的等级进度
  const levelRange = LEVEL_EXP_RANGES[newLevel]
  const expInCurrentLevel = newTotalExp - levelRange.start
  const expNeededForLevel = levelRange.end - levelRange.start
  const newLevelProgress = (expInCurrentLevel / expNeededForLevel) * 100

  // 5. 是否升级？
  const didLevelUp = newLevel > oldLevel

  // 6. 更新用户数据
  await supabase
    .from('profiles')
    .update({
      total_experience_points: newTotalExp,
      consciousness_level: newLevel,
      level_progress: didLevelUp ? 0 : newLevelProgress,  // 升级时重置进度
      last_exp_gain_at: new Date().toISOString()
    })
    .eq('id', user_id)

  // 7. 记录经验值日志
  await supabase
    .from('experience_log')
    .insert({
      user_id,
      action_type,
      exp_gained,
      related_id,
      metadata
    })

  // 8. 如果升级，记录历史
  if (didLevelUp) {
    await supabase
      .from('consciousness_level_history')
      .insert({
        user_id,
        consciousness_level: newLevel,
        total_experience_points: newTotalExp,
      })

    // 触发升级通知
    // TODO: 发送通知给用户
  }

  return new Response(JSON.stringify({
    success: true,
    exp_gained,
    new_total_exp: newTotalExp,
    old_level: oldLevel,
    new_level: newLevel,
    level_progress: didLevelUp ? 0 : newLevelProgress,
    did_level_up: didLevelUp,
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function determineLevel(totalExp: number): number {
  if (totalExp < 500) return 1
  if (totalExp < 1500) return 2
  if (totalExp < 3500) return 3
  if (totalExp < 7000) return 4
  if (totalExp < 12000) return 5
  if (totalExp < 20000) return 6
  return 7
}
```

### 使用示例

**用户完成课程时**:
```typescript
// app/api/courses/complete/route.ts
const response = await supabase.functions.invoke('add-experience', {
  body: {
    user_id: user.id,
    action_type: 'course_complete',
    exp_gained: 80,  // 50 base + 30 first time
    related_id: courseId,
    metadata: {
      course_title: '欢迎来到地球 Stage 1',
      completion_time: 45,
      has_deep_engagement: true
    }
  }
})
```

**用户冥想后**:
```typescript
const response = await supabase.functions.invoke('add-experience', {
  body: {
    user_id: user.id,
    action_type: 'meditation',
    exp_gained: 50,  // 5 base + 5 duration + 30 streak + 10 reflection
    related_id: meditationLogId,
    metadata: {
      duration: 15,
      streak: 7,
      emotion: 'peaceful',
      has_reflection: true
    }
  }
})
```

---

## 📈 总结

### 核心机制

1. **双评分系统**:
   - `total_experience_points`: 累积经验，决定等级
   - `level_progress`: 等级进度，决定形态

2. **渐进式升级**:
   - 每个等级从小苗开始
   - 在等级内成长到大树
   - 升级后重新变成小苗（新颜色）

3. **多维度评分**:
   - 课程完成
   - 冥想练习
   - 对话深度
   - 洞见质量
   - 项目贡献
   - 社区互动

4. **可扩展性**:
   - 课程元数据驱动
   - 动态推荐系统
   - 个性化成长路径

### 优势

- ✅ **直观**: 用户能清晰看到成长进度
- ✅ **激励**: 升级后重新开始，保持新鲜感
- ✅ **公平**: 多维度评分，防止刷分
- ✅ **灵活**: 课程系统可扩展
- ✅ **智能**: 动态推荐，个性化成长

---

**最后更新**: 2025-11-16
**版本**: v1.0
**状态**: 📋 待评审
