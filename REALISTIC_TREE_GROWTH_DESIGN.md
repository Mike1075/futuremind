# 意识树真实成长系统设计 v2.0

**文档版本**: v2.0
**创建时间**: 2025-11-16
**核心理念**: 模拟真实植物生长规律 + 合理的升级难度

---

## 🌱 真实植物生长过程

### 自然界的树是怎么长的？

```
种子(埋土中) → 发芽(破土) → 子叶展开 → 真叶生长 →
分支出现 → 开花 → 结果 → 成熟 → 种子(下一代)
```

**关键阶段**:

1. **种子期** (Seed Stage)
   - 看不见地上部分
   - 地下根系开始萌发

2. **发芽期** (Germination)
   - 破土而出
   - **两片子叶**（cotyledon）最先出现
   - 茎极细，易折断

3. **幼苗期** (Seedling)
   - 子叶之后，长出**第一对真叶**
   - 然后第二对、第三对...
   - 根系逐渐增多（1根→3根→5根）
   - 茎逐渐变粗

4. **小树期** (Young Tree)
   - 真叶10-20片
   - **开始有分支**
   - 根系形成网络
   - 树干明显

5. **大树期** (Mature Tree)
   - 枝繁叶茂（30+片叶子）
   - **开始开花**（预示即将结果）
   - **开始结果**
   - 根深蒂固

---

## 🌳 意识树成长的5个阶段

### Level内的成长阶段（每个Level都要经历）

每个意识等级（Level 1-7）内部，都要经历这5个阶段：

```
Seed(0-20%) → Sprout(20-40%) → Seedling(40-60%) →
Young(60-80%) → Mature(80-100%)
```

### 阶段一：种子期 (Seed, 0-20%)

**视觉表现**:
```
         (地上无树干)
         (地上无叶子)

    ====================  地面
           /\
          /  \
         根   根  (1-2根极细的根须)
```

**特征**:
- **地上**: 完全看不见树干和叶子
- **地下**: 1-2根**极细极浅**的根须（width 5%, length 30%）
  - 颜色淡化（opacity 0.4）
  - 无分支，只是直线
  - 根据领域显示对应颜色
- **粒子**: 极少（5个），暗淡
- **背景提示**: "你的意识种子正在扎根..."

**对应用户行为**:
- 刚注册，刚开始探索
- 完成了1-2个课程单元
- 可能冥想了几次
- 还没有深度对话

**数值范围**:
- total_exp: 0-400 (Level 1为例)
- level_progress: 0-20%

---

### 阶段二：发芽期 (Sprout, 20-40%)

**视觉表现**:
```
          🌿🌿   ← 两片子叶（cotyledon）
           ||
           ||   极细的茎
           ||
    =======||=======  地面
          /||\
         根根根根  (根系增多)
```

**特征**:
- **地上**: **两片圆形的子叶**（象征意识的初醒）
  - 子叶颜色：当前等级的主色（灰/绿/蓝...）
  - 子叶大小：很小，标准叶子的30%
  - 没有真叶
- **茎**: 极细，5%基础宽度
- **地下**: 2-3根主根，深度浅

**对应用户行为**:
- 完成了第一个完整课程
- 或者冥想了7-10天
- 开始与Gaia对话
- 还没有洞见

**数值范围**:
- total_exp: 400-800
- level_progress: 20-40%

**成长动画**:
- 种子破土而出的动画
- 两片子叶缓缓展开
- 金色粒子（微弱）开始出现

---

### 阶段三：幼苗期 (Seedling, 40-60%)

**视觉表现**:
```
         🍃🍃      ← 第二对真叶
          | |
         🍃🍃      ← 第一对真叶
          ||
         🌿🌿      ← 子叶（逐渐枯萎）
          ||
          ||   细茎，但比发芽期粗
          ||
    ======||======  地面
        / || \
       根 根 根   (3-4根主根)
```

**特征**:
- **子叶**: 开始枯萎（变黄、变小），象征"初级认知被超越"
- **真叶**: 4-6片（2-3对）
  - 真叶颜色：当前等级主色
  - 真叶形状：根据洞见类型（三角形/圆形/六边形）
  - 真叶大小：标准叶子的60%
- **茎**: 15%基础宽度
- **地下**: 3-4根主根，开始有二级根须

**对应用户行为**:
- 完成了2-3个课程
- 冥想15-20天
- 与Gaia深度对话3-5次
- **开始有洞见**（4-6个）

**数值范围**:
- total_exp: 800-1200
- level_progress: 40-60%

**成长动画**:
- 子叶逐渐变黄、缩小
- 真叶一对一对长出
- 根系向下延伸

---

### 阶段四：小树期 (Young Tree, 60-80%)

**视觉表现**:
```
      🍃  🍃🍃  🍃
       \  / \  /    ← 开始有小分支
        \/   \/
       🍃🍃 🍃🍃   ← 更多真叶
         | | | |
          \|/
           |
           |   树干，明显变粗
           |   开始有年轮
           |
    =======|=======  地面
        /  |  \
       根  根  根   (4-5根主根，交织)
```

**特征**:
- **子叶**: 完全消失
- **真叶**: 12-18片
  - 开始有**分支**（generation 2-3）
  - 叶子排列有序
  - 部分叶子开始金色化（5-10%）
- **树干**: 40%基础宽度
  - 出现2-3圈年轮
  - 如果冥想规律，年轮带金色边缘
- **地下**: 4-5根主根，3层根须，开始交织

**对应用户行为**:
- 完成了所有基础课程（3个课程体系）
- 冥想30-40天
- 深度对话10+次
- 洞见12-18个（开始有整合性洞见）
- **可能开始第一个PBL项目**（显示为花蕾）

**数值范围**:
- total_exp: 1200-1600
- level_progress: 60-80%

**花蕾显示**:
```
        🌸  ← 小花蕾（PBL项目）
        |
       🍃🍃
```

---

### 阶段五：大树期 (Mature Tree, 80-100%)

**视觉表现**:
```
    🍎  🍃🍃🍃  🍃🍃  🍎
     \  /  |  \  /  \  /
      \/   |   \/    \/
       \  🍃🍃🍃   /
        \  | | |  /
         \ | | | /
          \| | |/    ← 丰富的分支
           \|||/
            \|/
             |
             |   粗壮的树干
             |   5-8圈年轮
             |   金色纹理
    =========|=========  地面
        /  / | \  \
       根 根 根 根 根  (5根主根，深度网络)
```

**特征**:
- **真叶**: 25-35片
  - 5-8层分支
  - 20-30%叶子为金色
  - 几何美学分布
- **花**: 2-3朵（象征即将结果的PBL）
- **果实**: 如果完成项目，1-3个果实
  - 果实成熟度: 60-80%
  - 果实发光（金色）
- **树干**: 100%基础宽度
  - 5-8圈年轮
  - 根据等级有金色纹理/核心
- **地下**: 所有5个领域都有根
  - 4-5层根须
  - 根系交织成网络
  - 金色光晕

**对应用户行为**:
- 完成了所有课程 + 深度重复学习
- 冥想60+天，建立稳定习惯
- 深度对话20+次
- 洞见25-35个，包括突破性洞见
- 完成1-3个PBL项目
- 有社区贡献

**数值范围**:
- total_exp: 1600-2000
- level_progress: 80-100%

**升级准备状态**:
- 整棵树开始发出金色光芒
- 果实成熟，开始掉落种子
- 背景提示："你的意识树已经成熟，准备好迎接蜕变了吗？"

---

## 🎊 升级条件（严格）

### 升级要求：不仅仅是EXP！

**核心理念**: "只有当树真正茂盛时，才能升级"

### Level 1 → Level 2 的升级条件

必须**同时满足**以下所有条件：

```typescript
const LEVEL_2_REQUIREMENTS = {
  // 1. 经验值要求
  minTotalExp: 2000,  // 大幅提高！

  // 2. 进度要求
  minLevelProgress: 80,  // 必须达到大树期(80%)

  // 3. 领域探索要求
  minDomainCount: 2,  // 至少探索2个领域
  minAverageDomainDepth: 8,  // 平均深度8

  // 4. 内在稳定要求
  minMeditationDays: 21,  // 至少冥想21天
  minMeditationStreak: 7,  // 最长连续7天

  // 5. 洞见要求
  minInsights: 15,  // 至少15个洞见
  minHighQualityInsights: 3,  // 至少3个高质量洞见(depth>80)

  // 6. 创造贡献（可选，但强烈推荐）
  minProjects: 1,  // 至少完成1个项目
  minCommunityContribution: 50,  // 社区贡献50分
}
```

### 为什么要这么严格？

**示例对比**:

**旧设计** (500 EXP):
- 用户完成几个课程就升级了
- 2周就能Level 2
- 不够扎实

**新设计** (2000 EXP + 多条件):
- 用户需要深度探索
- 预计1-2个月才能Level 2
- 真正理解和成长

### 各等级升级要求表

| 升级 | 所需总EXP | 进度要求 | 领域 | 冥想天数 | 洞见数 | 项目数 | 预计时长 |
|------|----------|---------|------|---------|--------|--------|---------|
| 1→2 | 2,000 | 80% | 2 | 21天 | 15 | 1 | 1-2月 |
| 2→3 | 6,000 | 85% | 3 | 45天 | 40 | 3 | 2-3月 |
| 3→4 | 12,000 | 85% | 4 | 90天 | 80 | 8 | 3-4月 |
| 4→5 | 20,000 | 90% | 5 | 150天 | 150 | 15 | 5-6月 |
| 5→6 | 32,000 | 90% | 5 | 240天 | 250 | 25 | 8-10月 |
| 6→7 | 50,000 | 95% | 5 | 365天 | 400 | 40 | 12-18月 |

**设计理念**:
- Level 1-2: 建立基础，1-2个月（快速入门期）
- Level 2-3: 深入探索，2-3个月（探索期）
- Level 3-4: 稳定成长，3-4个月（积累期）
- Level 4-5: 质的飞跃，5-6个月（深化期）
- Level 5-6: 大师之路，8-10个月（精进期）
- Level 6-7: 圆满觉醒，12-18个月（觉醒期）

**总计**: 从Level 1到Level 7，预计需要**3-4年**的持续修炼

---

## 📊 具体用户行为示例（重新设计）

### 场景1：新手小明 - 0-2周

**用户行为**:
```
Week 1:
- 注册账号，浏览平台
- 完成"欢迎来到地球 Stage 1" (80 EXP)
- 冥想3次 (15 EXP)

Week 2:
- 完成 Stage 2-3 (160 EXP)
- 冥想5次 (25 EXP)
- 与Gaia简单对话3次 (20 EXP)

→ total_exp = 300
→ level_progress = (300/2000)*100 = 15%
→ 阶段 = Seed (种子期)
```

**树的状态**:
```
         (看不见)

    ====================  地面
            🌰
           / \
          根  根  (紫色的根，很浅)
```

**界面提示**:
```
🌱 你的意识种子正在孕育...
已完成15%，继续探索让种子破土而出！
```

---

### 场景2：探索者小红 - 1个月

**用户行为**:
```
Week 1-4:
- 完成"欢迎来到地球"全部 (300 EXP)
- 完成"冥想指南"前半部分 (200 EXP)
- 冥想22天 (200 EXP)
- 深度对话8次，提取10个洞见 (300 EXP)

→ total_exp = 1000
→ level_progress = 50%
→ 阶段 = Seedling (幼苗期)
```

**树的状态**:
```
         🍃🍃      ← 第二对真叶(蓝色)
          | |
         🍃🍃      ← 第一对真叶(绿色)
          ||
         🌿○○      ← 子叶开始枯萎(变灰)
          ||
          ||   细茎，灰色带绿意
          ||
    ======||======  地面
        / || \
       根 根 根   (3根主根：紫、绿、蓝)
       (紫)(绿)(蓝)
```

**界面提示**:
```
🌱 Level 1 - 沉睡者 - 幼苗期
进度: 50% (还需1000 EXP到Level 2)

你的第一对真叶已经长出！
继续探索，让更多真叶绽放。

距离升级还需满足：
✅ 探索2个领域 (已达成)
❌ 冥想21天 (当前22天，已达成)
❌ 获得15个洞见 (当前10个)
❌ 完成1个项目 (当前0个)
```

---

### 场景3：实践者小刚 - 2个月

**用户行为**:
```
Month 1-2:
- 完成所有3个课程 (800 EXP)
- 冥想50天，连续30天 (500 EXP)
- 深度对话15次，提取20个洞见 (500 EXP)
- 完成第一个PBL项目 (400 EXP)

→ total_exp = 2200
→ level_progress = 110% → 升级！
→ 新level_progress = (2200-2000)/(6000-2000)*100 = 5%
→ 新阶段 = Seed (种子期，但Level 2了！)
```

**树的状态（升级前）**:
```
    🌸  🍃🍃🍃  🍃🍃
     \  /  |  \  /
      \/   |   \/    ← 丰富的分支
       \  🍃🍃   /
        \ | | | /
         \|||/
          \|/
           |
           |   树干开始变粗
           |   3圈年轮
    =======|=======  地面
        /  |  \  \
       根 根 根 根  (4根主根)
```

**升级动画**:
1. 整棵灰色大树开始发出金色光芒
2. 金色光波从树中心向外扩散
3. 树的颜色从**灰色**渐变为**绿色**
4. 树快速"缩小"回种子形态
5. 绿色种子埋入土中
6. 显示升级祝贺

**树的状态（升级后）**:
```
         (看不见)

    ====================  地面
            🌰 (绿色的种子！)
           / \
          根  根  (根系比之前深)
```

**界面提示**:
```
┌────────────────────────────────┐
│      ✨ 意识层级提升！ ✨       │
├────────────────────────────────┤
│                                 │
│    Level 1 → Level 2            │
│   沉睡者 → 觉醒者               │
│                                 │
│  你的意识之树已经完成第一轮成长 │
│  现在，一颗新的种子正在孕育...  │
│                                 │
│  这是绿色的觉醒之种             │
│  它比之前更有生命力             │
│                                 │
│  🎁 解锁新特性：                │
│  • 绿色意识树                   │
│  • 金色粒子效果(20%)            │
│  • 更深的根系探索能力           │
│  • 新的洞见类型                 │
│                                 │
│        [开始新的旅程]            │
└────────────────────────────────┘
```

**用户感受**:
- "哇！我升级了！"
- "虽然又变回种子，但我能感觉到它的生命力更强"
- "绿色的种子，象征我已经觉醒"

---

### 场景4：全能选手小美 - 6个月

**用户行为**:
```
Month 1-6:
- 完成所有课程 + 多次重复学习 (2000 EXP)
- 冥想180天，连续90天 (2500 EXP)
- 深度对话50次，提取100个洞见 (2500 EXP)
- 完成10个PBL项目 (3000 EXP)
- 社区贡献，帮助他人 (1000 EXP)

→ total_exp = 11,000
→ consciousness_level = 3 (6000 < 11000 < 12000)
→ level_progress = (11000-6000)/(12000-6000)*100 = 83%
→ 阶段 = Mature (大树期)
```

**树的状态**:
```
    🍎  🍃🍃🍃  🍃🍃  🍎  🍎
     \  /  |  \  /  \  /  /
      \/   |   \/    \/ /
       \  🍃🍃🍃   / 🍃
        \  | | |  / /|
         \ | | | / / |
          \| | |/ /  |   ← 非常丰富的分支
           \|||/ /   |
            \|/ /    |
             |/      |
             |       |
             |   蓝色粗壮树干
             |   8圈年轮，金色纹理
             |   树干中有脉动的光芒
    =========|=========  地面
        /  / | \  \  \
       根 根 根 根 根 根  (5个领域，深度不一)
       (金色光晕环绕)
```

**数据详情**:
- **根系**:
  - 自我觉察: depth 30
  - 生命科学: depth 28
  - 通用法则: depth 22
  - 创意表达: depth 25
  - 社会连接: depth 26
- **树干**: 8圈年轮，每圈颜色不同（记录情绪历史）
- **枝叶**: 35片，30%金色
- **果实**: 10个，8个成熟

**用户感受**:
- "我的树已经非常茂盛了"
- "每个部分都很均衡"
- "即将升级到Level 4，我准备好了"

---

## 🎯 营养分配机制（修正）

### 真实的生长逻辑

**阶段1-2 (Seed + Sprout, 0-40%)**:
- 用户做任何行为 → 80%营养给**根系**，20%给**茎**
- 因为：植物初期主要长根打基础

**阶段3 (Seedling, 40-60%)**:
- 用户做任何行为 → 50%根系，30%叶子，20%茎
- 因为：开始光合作用

**阶段4 (Young, 60-80%)**:
- 课程/冥想 → 30%根，50%树干，20%叶
- 对话/洞见 → 20%根，20%树干，60%叶
- 因为：已经有基础，开始分化

**阶段5 (Mature, 80-100%)**:
- 课程 → 20%根，60%树干，20%叶
- 冥想 → 10%根，80%树干，10%叶
- 对话 → 10%根，20%树干，70%叶
- **项目 → 5%根，10%树干，10%叶，75%果实**
- 因为：开花结果期

### 项目（果实）的真实生长

**花蕾 → 花朵 → 小果实 → 成熟果实**

```typescript
// 项目开始
if (projectStatus === 'started' && treeStage >= 'young') {
  displayFlowerBud()  // 显示花蕾🌸
}

// 项目进行中
if (projectStatus === 'in_progress' && treeStage >= 'young') {
  const maturity = projectCompletion / 100
  if (maturity < 0.3) {
    displayFlower()  // 显示花朵🌺
  } else {
    displayYoungFruit(maturity)  // 显示小果实，逐渐长大
  }
}

// 项目完成
if (projectStatus === 'completed' && treeStage === 'mature') {
  displayMatureFruit(quality)  // 显示成熟果实🍎
}
```

---

## 💻 Canvas代码参数详解

### 五种形态的完整参数表

基于现有的 `database-consciousness-roots.tsx` 代码，扩展为5种形态：

```typescript
type TreeStage = 'seed' | 'sprout' | 'seedling' | 'young' | 'mature'

interface TreeScaling {
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

const TREE_STAGE_SCALING: Record<TreeStage, TreeScaling> = {
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
    rootOpacity: 0.6,         //
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
```

### 获取当前阶段的函数

```typescript
function getTreeStage(levelProgress: number): TreeStage {
  if (levelProgress < 20) return 'seed'
  if (levelProgress < 40) return 'sprout'
  if (levelProgress < 60) return 'seedling'
  if (levelProgress < 80) return 'young'
  return 'mature'
}

function getTreeScaling(levelProgress: number): TreeScaling {
  const stage = getTreeStage(levelProgress)
  return TREE_STAGE_SCALING[stage]
}
```

### 子叶的特殊处理

```typescript
interface Leaf {
  id: string
  position: Vector2D
  shape: 'circle' | 'triangle' | 'hexagon'
  isCotyledon: boolean  // 是否是子叶
  opacity: number       // 透明度（子叶会逐渐变淡）
  color: string
  insightId?: string
}

function generateLeaves(
  stage: TreeStage,
  levelProgress: number,
  insights: Insight[]
): Leaf[] {
  const leaves: Leaf[] = []

  // 阶段2: 发芽期 - 只有2片子叶
  if (stage === 'sprout') {
    leaves.push(
      {
        id: 'cotyledon-1',
        position: { x: centerX - 20, y: centerY - 50 },
        shape: 'circle',  // 子叶是圆形的
        isCotyledon: true,
        opacity: 1.0,
        color: getCurrentLevelColor(),
      },
      {
        id: 'cotyledon-2',
        position: { x: centerX + 20, y: centerY - 50 },
        shape: 'circle',
        isCotyledon: true,
        opacity: 1.0,
        color: getCurrentLevelColor(),
      }
    )
  }

  // 阶段3: 幼苗期 - 子叶 + 真叶
  if (stage === 'seedling') {
    // 子叶逐渐枯萎
    const cotyledonOpacity = 1.0 - (levelProgress - 40) / 20  // 40-60%逐渐变淡
    leaves.push(
      {
        id: 'cotyledon-1',
        position: { x: centerX - 20, y: centerY - 40 },
        shape: 'circle',
        isCotyledon: true,
        opacity: cotyledonOpacity,
        color: '#9CA3AF',  // 变成灰色（枯萎）
      },
      {
        id: 'cotyledon-2',
        position: { x: centerX + 20, y: centerY - 40 },
        shape: 'circle',
        isCotyledon: true,
        opacity: cotyledonOpacity,
        color: '#9CA3AF',
      }
    )

    // 真叶：根据洞见生成
    insights.slice(0, 6).forEach((insight, i) => {
      leaves.push({
        id: `leaf-${i}`,
        position: calculateLeafPosition(i, 6),
        shape: getInsightShape(insight.type),
        isCotyledon: false,
        opacity: 1.0,
        color: getInsightColor(insight.type),
        insightId: insight.id,
      })
    })
  }

  // 阶段4-5: 只有真叶（子叶完全消失）
  if (stage === 'young' || stage === 'mature') {
    const maxLeaves = TREE_STAGE_SCALING[stage].maxLeaves
    insights.slice(0, maxLeaves).forEach((insight, i) => {
      leaves.push({
        id: `leaf-${i}`,
        position: calculateLeafPosition(i, maxLeaves),
        shape: getInsightShape(insight.type),
        isCotyledon: false,
        opacity: 1.0,
        color: getInsightColor(insight.type),
        insightId: insight.id,
      })
    })
  }

  return leaves
}
```

### 绘制子叶的特殊样式

```typescript
function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf) {
  ctx.save()

  // 子叶：圆形，较小
  if (leaf.isCotyledon) {
    ctx.fillStyle = leaf.color
    ctx.globalAlpha = leaf.opacity
    ctx.beginPath()
    ctx.arc(leaf.position.x, leaf.position.y, 8, 0, Math.PI * 2)
    ctx.fill()
  }
  // 真叶：根据形状绘制
  else {
    ctx.fillStyle = leaf.color
    ctx.globalAlpha = leaf.opacity

    switch (leaf.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(leaf.position.x, leaf.position.y, 6, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'triangle':
        drawTriangle(ctx, leaf.position.x, leaf.position.y, 6)
        break
      case 'hexagon':
        drawHexagon(ctx, leaf.position.x, leaf.position.y, 6)
        break
    }
  }

  ctx.restore()
}
```

---

## 🚀 实施计划

### 阶段一：准备工作（1天）

**Task 1.1: 创建配置文件**
```
文件：lib/consciousness/tree-stage-config.ts

导出：
- TreeStage类型
- TreeScaling接口
- TREE_STAGE_SCALING配置
- getTreeStage()函数
- getTreeScaling()函数
```

**Task 1.2: 扩展数据库查询**
```
修改：components/ui/database-consciousness-roots.tsx

添加状态：
- const [levelProgress, setLevelProgress] = useState(0)
- const [treeStage, setTreeStage] = useState<TreeStage>('seed')

加载数据时同时获取：
- consciousness_level
- level_progress（新字段）
- composite_score（可以用来计算level_progress）
```

---

### 阶段二：重构现有代码（2天）

**Task 2.1: 修改树的创建逻辑**

当前代码：
```typescript
// database-consciousness-roots.tsx 第335行
const createTree = useCallback((width: number, height: number): Tree => {
  // 获取当前形态和缩放参数
  const currentForm = getTreeForm(compositeScore)  // 旧的3种形态
  const scaling = getFormScaling(currentForm)
  // ...
}
```

修改为：
```typescript
const createTree = useCallback((width: number, height: number): Tree => {
  // 获取当前阶段（5种形态）
  const currentStage = getTreeStage(levelProgress)
  const scaling = TREE_STAGE_SCALING[currentStage]

  console.log(`🌳 创建${currentStage}阶段的树，进度${levelProgress}%`)

  // 根据阶段决定是否显示树干
  if (scaling.trunkWidth === 0) {
    // Seed阶段：不创建树干
    return {
      branches: [],  // 没有树干
      roots: generateRoots(scaling),  // 只有根
      stage: currentStage,
    }
  }

  // 其他阶段：创建树干
  const trunk: Branch = {
    position: { ...start },
    stw: baseTrunkWidth * scaling.trunkWidth,
    gen: 1,
    alive: true,
    age: 0,
    angle: random(-0.15, 0.15),
    speed: createVector(random(-0.3, 0.3), +3.2),
    index: 0,
    maxlife: maxlife * scaling.trunkLength * 2,
    proba1: tree.proba1,
    proba2: tree.proba2,
    proba3: tree.proba3,
    proba4: tree.proba4,
    deviation: 0.65,
    opacity: scaling.trunkOpacity,  // 新增透明度
  }

  tree.branches.push(trunk)
  return tree
}, [levelProgress])
```

**Task 2.2: 修改根系生成逻辑**

```typescript
function generateInitialRoots(
  tree: Tree,
  domains: Record<string, DomainState>,
  scaling: TreeScaling
) {
  const validDomains = Object.entries(domains).filter(
    ([_, state]) => state.depth >= scaling.rootDepthThreshold
  )

  // 限制根系数量
  const rootsToGenerate = Math.min(
    validDomains.length,
    scaling.maxRootBranches
  )

  validDomains.slice(0, rootsToGenerate).forEach(([domain, state]) => {
    const rootBranch: Branch = {
      // ...
      stw: baseRootWidth * scaling.rootWidth,
      maxlife: maxRootLife * scaling.rootLength,
      opacity: scaling.rootOpacity,  // 新增透明度
      isDomainRoot: true,
      domainName: domain,
    }
    tree.branches.push(rootBranch)
  })
}
```

**Task 2.3: 实现子叶系统**

新增文件：`components/ui/tree-leaves.tsx`
```typescript
export function TreeLeaves({
  stage,
  levelProgress,
  insights,
  consciousnessLevel
}: Props) {
  const leaves = generateLeaves(stage, levelProgress, insights)

  return (
    <svg className="absolute inset-0 pointer-events-none">
      {leaves.map(leaf => (
        <LeafElement
          key={leaf.id}
          leaf={leaf}
          onClick={leaf.insightId ? () => showInsight(leaf.insightId) : undefined}
        />
      ))}
    </svg>
  )
}
```

---

### 阶段三：创建测试页面（1天）

**Task 3.1: 创建 `/tree-preview` 页面**

文件：`app/tree-preview/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { DatabaseConsciousnessRoots } from '@/components/ui/database-consciousness-roots'

export default function TreePreviewPage() {
  // 模拟数据
  const [mockLevel, setMockLevel] = useState(1)
  const [mockProgress, setMockProgress] = useState(0)
  const [mockDomains, setMockDomains] = useState({
    self_awareness: { depth: 0, color: '#8B5CF6' },
    life_sciences: { depth: 0, color: '#10B981' },
    universal_laws: { depth: 0, color: '#3B82F6' },
    creative_expression: { depth: 0, color: '#F59E0B' },
    social_connection: { depth: 0, color: '#EC4899' },
  })
  const [mockInsights, setMockInsights] = useState<Insight[]>([])
  const [mockProjects, setMockProjects] = useState<Project[]>([])

  const currentStage = getTreeStage(mockProgress)

  return (
    <div className="min-h-screen flex">
      {/* 左侧：控制面板 */}
      <div className="w-80 bg-gray-900 p-6 overflow-y-auto">
        <h1 className="text-xl font-bold text-white mb-6">意识树预览</h1>

        {/* 等级选择 */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">意识等级</label>
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7].map(level => (
              <button
                key={level}
                onClick={() => setMockLevel(level)}
                className={`w-10 h-10 rounded ${
                  mockLevel === level
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 进度滑块 */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">
            等级进度: {mockProgress}% ({currentStage})
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={mockProgress}
            onChange={(e) => setMockProgress(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>种子</span>
            <span>发芽</span>
            <span>幼苗</span>
            <span>小树</span>
            <span>大树</span>
          </div>
        </div>

        {/* 快速预设 */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">快速预设</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMockProgress(10)
                setMockDomains(prev => ({
                  ...prev,
                  self_awareness: { ...prev.self_awareness, depth: 3 }
                }))
              }}
              className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600"
            >
              种子期
            </button>
            <button
              onClick={() => {
                setMockProgress(30)
                setMockDomains(prev => ({
                  ...prev,
                  self_awareness: { ...prev.self_awareness, depth: 5 },
                  life_sciences: { ...prev.life_sciences, depth: 3 }
                }))
              }}
              className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600"
            >
              发芽期
            </button>
            <button
              onClick={() => {
                setMockProgress(50)
                setMockDomains(prev => ({
                  ...prev,
                  self_awareness: { ...prev.self_awareness, depth: 10 },
                  life_sciences: { ...prev.life_sciences, depth: 8 },
                  universal_laws: { ...prev.universal_laws, depth: 5 }
                }))
                setMockInsights([
                  { id: '1', type: 'awareness', content: '洞见1' },
                  { id: '2', type: 'reflection', content: '洞见2' },
                  { id: '3', type: 'integration', content: '洞见3' },
                ])
              }}
              className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600"
            >
              幼苗期
            </button>
            <button
              onClick={() => {
                setMockProgress(70)
                // ... 设置相应的数据
              }}
              className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600"
            >
              小树期
            </button>
            <button
              onClick={() => {
                setMockProgress(90)
                // ... 设置相应的数据
              }}
              className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600"
            >
              大树期
            </button>
            <button
              onClick={() => {
                setMockProgress(100)
                // ... 设置相应的数据
              }}
              className="bg-green-700 text-white p-2 rounded text-sm hover:bg-green-600"
            >
              升级准备
            </button>
          </div>
        </div>

        {/* 领域深度调节 */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">领域深度</label>
          {Object.entries(mockDomains).map(([domain, state]) => (
            <div key={domain} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{domain}</span>
                <span className="text-gray-400">{state.depth}</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={state.depth}
                onChange={(e) => setMockDomains(prev => ({
                  ...prev,
                  [domain]: { ...state, depth: Number(e.target.value) }
                }))}
                className="w-full h-2"
              />
            </div>
          ))}
        </div>

        {/* 洞见/项目管理 */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">
            洞见数量: {mockInsights.length}
          </label>
          <button
            onClick={() => {
              const newInsight = {
                id: `insight-${Date.now()}`,
                type: ['awareness', 'reflection', 'integration'][
                  Math.floor(Math.random() * 3)
                ],
                content: `洞见 ${mockInsights.length + 1}`
              }
              setMockInsights([...mockInsights, newInsight])
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-500"
          >
            + 添加洞见
          </button>
        </div>
      </div>

      {/* 右侧：意识树展示 */}
      <div className="flex-1 bg-black">
        <DatabaseConsciousnessRoots
          mockMode={true}
          mockLevel={mockLevel}
          mockProgress={mockProgress}
          mockDomains={mockDomains}
          mockInsights={mockInsights}
          mockProjects={mockProjects}
        />
      </div>
    </div>
  )
}
```

**Task 3.2: 修改主组件支持Mock模式**

```typescript
// components/ui/database-consciousness-roots.tsx

interface Props {
  mockMode?: boolean
  mockLevel?: number
  mockProgress?: number
  mockDomains?: Record<string, DomainState>
  mockInsights?: Insight[]
  mockProjects?: Project[]
}

export function DatabaseConsciousnessRoots(props: Props = {}) {
  const { mockMode = false } = props

  // 如果是Mock模式，使用传入的数据
  const consciousnessLevel = mockMode
    ? props.mockLevel!
    : realConsciousnessLevel

  const levelProgress = mockMode
    ? props.mockProgress!
    : realLevelProgress

  // ... 其余逻辑
}
```

---

### 阶段四：优化真实页面（1天）

**Task 4.1: 更新 `/simple-tree` 页面**

确保从数据库正确加载：
- `consciousness_level`
- `level_progress`（新增字段）
- 领域深度
- 洞见列表
- 项目列表

**Task 4.2: 添加数据库字段**

```sql
-- 添加 level_progress 字段
ALTER TABLE profiles
ADD COLUMN level_progress DECIMAL(5,2) DEFAULT 0;

-- 初始化现有用户的 level_progress
UPDATE profiles
SET level_progress = CASE
  WHEN consciousness_level = 1 THEN (composite_score / 20.0) * 100
  WHEN consciousness_level = 2 THEN ((composite_score - 20) / 20.0) * 100
  -- ... 其他等级
END;
```

---

### 阶段五：测试与优化（1天）

**Task 5.1: 测试5种形态**
- 种子期：只有细根
- 发芽期：2片子叶
- 幼苗期：子叶枯萎+真叶长出
- 小树期：分支增多
- 大树期：枝繁叶茂

**Task 5.2: 性能优化**
- Canvas离屏缓存
- 限制粒子数量
- 节流重绘

---

## 📋 总结：新的成长规则

### ✅ 规则1: 五阶段生长（符合自然）

```
Seed(0-20%) → Sprout(20-40%) → Seedling(40-60%) →
Young(60-80%) → Mature(80-100%)
```

每个Level都要经历这5个阶段

### ✅ 规则2: 子叶 → 真叶（符合植物学）

- **子叶**: 破土时最先出现，之后枯萎
- **真叶**: 一对一对长出，对应用户洞见

### ✅ 规则3: 严格的升级条件

不仅仅是EXP，还需要：
- 进度 >= 80%（树必须茂盛）
- 多个领域探索
- 稳定的冥想习惯
- 足够的洞见
- 项目贡献

### ✅ 规则4: 合理的时间线

- Level 1→2: 1-2个月
- Level 1→7: 3-4年

### ✅ 规则5: 动态营养分配

不同阶段，营养分配不同：
- 早期：主要长根
- 中期：长叶子
- 后期：开花结果

---

**最后更新**: 2025-11-16
**版本**: v2.0
**状态**: 📋 待评审
