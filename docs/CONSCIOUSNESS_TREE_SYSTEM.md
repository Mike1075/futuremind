# 意识树系统架构文档

## 🌳 系统概述

意识树是"未来心智学院"的核心功能，用于可视化学员的学习成长轨迹。系统采用**累积生长制**，树只会长大不会缩小。

## 📊 完整数据流程

```
用户学习行为（对话/作业/项目）
    ↓
数据库记录
    ├─ gaia_conversations (对话记录)
    ├─ user_submissions (作业提交)
    └─ user_selected_projects (PBL项目)
    ↓
Edge Function: generate-student-summary  ← 每周执行
    ↓
生成三部分总结
    ├─ dialogue (对话维度总结)
    ├─ coursework (作业维度总结)
    └─ projects (项目维度总结)
    ↓
存储到: student_summaries.course_summaries (jsonb)
    ↓
Edge Function: evaluate-and-grow-tree  ← 手动触发/定期执行
    ↓
调用 AI "The Gardener" (GPT-4o-mini)
  分析总结，计算意识树生长增量
    ↓
更新: profiles.consciousness_tree_view (jsonb)
    ↓
前端展示: 意识树可视化
```

## 🗄️ 数据库表结构

### 1. student_summaries（学员综合评价表）

**字段**：`course_summaries` (jsonb)

**三部分总结结构**：

```json
{
  "dialogue": {
    "summary": "该学生在对话中展现出深度思考...",
    "message_count": 23,
    "conversation_count": 5,
    "last_summarized_at": "2025-11-21T13:20:48.990Z"
  },
  "coursework": {
    "summary": "该学生在作业提交方面...",
    "submission_count": 9,
    "interaction_count": 75,
    "last_summarized_at": "2025-11-21T13:21:00.604Z"
  },
  "projects": {
    "summary": "该学生在PBL项目参与...",
    "total_project_count": 4,
    "active_project_count": 4,
    "last_summarized_at": "2025-11-21T13:21:06.572Z"
  },
  "last_full_update": "2025-11-21T13:21:06.573Z"
}
```

### 2. profiles（用户档案表）

**字段**：`consciousness_tree_view` (jsonb)

**意识树结构**：

```json
{
  "roots": {
    "count": 15,          // 涉及的知识领域数量
    "depth_level": 4.5,   // 平均探索深度 (0-10)
    "is_solid": true      // 是否为实线（count > 0）
  },
  "trunk": {
    "thickness": 8,       // 觉察力/定力 (0-50)
    "height_level": 25,   // 坚持练习的时长 (0-100)
    "is_solid": true      // 依赖于 roots.is_solid AND thickness > 0
  },
  "branches": {
    "count": 5,           // 项目里程碑/深度探究次数
    "avg_length": 3.5,    // 洞见的平均精辟程度 (0-20)
    "is_solid": true      // 依赖于 trunk.is_solid AND count > 0
  },
  "leaves": {
    "count": 12,          // Aha Moments 总数
    "is_solid": true      // 依赖于 branches.is_solid
  },
  "fruits": {
    "count": 2,           // 完成项目/贡献总数
    "is_solid": false     // 依赖于 branches.is_solid
  }
}
```

## ⚙️ Edge Functions（边缘函数）

### 1. generate-student-summary

**文件位置**：`supabase/functions/generate-student-summary/index.ts`

**功能**：为所有学员生成AI综合评价（三部分总结）

**触发方式**：每周日凌晨3点（定时任务）

**AI模型**：GPT-4o-mini

**输出**：三部分总结（dialogue、coursework、projects）

### 2. evaluate-and-grow-tree

**文件位置**：`supabase/functions/evaluate-and-grow-tree/index.ts`

**功能**：根据三部分总结，计算意识树生长增量

**触发方式**：
- Fire-and-Forget 模式（立即返回200，后台异步计算）
- 手动触发或定期执行

**AI模型**：GPT-4o-mini（"The Gardener" - 首席园丁）

**核心逻辑**：

#### 生长法则

1. **根 (Roots) - 知识领域**
   - `count` = 旧count + 新发现的领域数量
   - `depth_level` = 根据深度探讨适当增加（每次+0.5，上限10）
   - `is_solid` = count > 0

2. **树干 (Trunk) - 觉察与定力**
   - `thickness` = 每次深刻自我觉察或冥想练习 +2
   - `height_level` = 有持续学习/练习行为 +1
   - `is_solid` = roots.is_solid AND thickness > 0

3. **枝 (Branches) - 探究里程碑**
   - `count` = 旧count + 新识别的里程碑数量
   - `avg_length` = 根据精彩程度微调
   - `is_solid` = trunk.is_solid AND count > 0

4. **叶 (Leaves) - 顿悟时刻**
   - `count` = 旧count + 新发现的顿悟数量
   - `is_solid` = branches.is_solid

5. **果 (Fruits) - 创造与贡献**
   - `count` = 旧count + 新发现的贡献数量
   - `is_solid` = branches.is_solid

#### 特殊规则

- **只增不减**：除非数据重置，否则数值不应减少
- **虚线连锁**：如果树干变虚，上面的枝叶果必须强制变虚
- **畸形允许**：允许 roots.count 很大（博学）但 trunk.thickness 很小（无定力）

## 🎨 前端可视化

### 组件位置

- **意识树Canvas**：`components/consciousness/ConsciousnessTreeCanvas.tsx`
- **意识树生成器**：`lib/utils/consciousnessTreeGenerator.ts`
- **测试工作台**：`components/consciousness/ConsciousnessTreeClient.tsx`（仅校长可见）
- **学生视图**：`components/consciousness/ConsciousnessTreeView.tsx`

### 特性

1. **空树状态**：显示闪烁的暗红色种子（等待探索和发芽）
2. **缩放功能**：学生视图支持50%-300%缩放
3. **实时渲染**：基于Canvas的粒子系统
4. **权限控制**：
   - 校长：可访问测试工作台，手动调节参数
   - 学生/教师：只能查看真实数据生成的意识树

## 🎨 可视化算法详解

### 核心设计原则

意识树采用**数字植物学生长系统（Digital Botany Growth System）**，基于以下原则：

1. **自然比例**：树干粗细、高度、枝条长度遵循达芬奇规则和自然生长规律
2. **分形递归**：枝条系统采用递归预算消耗，形成自然的分形结构
3. **颜色演变**：基于整体生长进度，从暗红→亮红→金边红
4. **粒子渲染**：使用Canvas粒子系统，支持实线/虚线双态
5. **稳定生长**：使用固定随机种子，确保相同参数下形态稳定

### 颜色系统（统一进度驱动）

**整体生长进度计算**（8项指标平均值）：
```typescript
overallProgress = (
  rootProgress +        // roots.count / 80
  rootDepthProgress +   // roots.depth_level / 10
  trunkThicknessProgress + // trunk.thickness / 50
  trunkHeightProgress + // trunk.height_level / 100
  branchCountProgress + // branches.count / 100
  branchLengthProgress + // branches.avg_length / 20
  leafProgress +        // leaves.count / 50
  fruitProgress         // fruits.count / 20
) / 8
```

**颜色演变规则**：
- **0-90%**：从暗红逐渐变为亮红
  - 色相(hue)：始终为0（纯红色）
  - 饱和度(saturation)：70 → 95
  - 亮度(lightness)：基础值 + 进度加成（20 → 50）

- **90%+**：亮红色为主，保持红色主导
  - 色相(hue)：0（不变金黄）
  - 饱和度(saturation)：95
  - 亮度(lightness)：55
  - 注：金边效果通过发光实现，而非改变主色调

**重要**：所有部分（根、干、枝、叶、果）使用统一的 `overallProgress`，确保整棵树颜色协调演变。

### 1. 根系生成算法

**目标导向深度分配 + 扇形分布**：

```typescript
// 步骤1：主根数量（对数增长，避免爆炸）
mainRootCount = Math.max(1, Math.ceil(Math.log2(count + 1)))
// count=1→1根, count=3→2根, count=7→3根, count=15→4根

// 步骤2：每个主根的深度（目标：总末端数 ≈ count × 1.3）
targetEndpoints = count * 1.3
avgEndpointsPerRoot = targetEndpoints / mainRootCount
idealDepth = Math.log2(avgEndpointsPerRoot)
rootDepth = Math.round(idealDepth) + random(-1, 1)  // 随机±1层

// 步骤3：扇形分布（150°扇形，均匀间隔）
totalSpread = 150°
startAngle = 15°
angleStep = totalSpread / (mainRootCount + 1)
angle[i] = startAngle + (i + 1) * angleStep

// 步骤4：喇叭口过渡（从树干粗度平滑到根系粗度）
transitionLength = trunkWidth * 0.6
绘制渐变粗度段：trunkWidth * 0.8 → baseWidth

// 步骤5：对称二叉树递归（每层分叉角度40°）
drawRootRecursive(终点, 角度, 长度*0.75, 粗度*0.7, 层级+1, 最大层级)
```

**关键特性**：
- 主根数量平滑增长（对数），不会突变
- 每个主根深度不同，形成自然的深浅变化
- 总末端数接近领域数，避免过度分叉

### 2. 树干生成算法

**自然比例 + 1/3规则**：

```typescript
// 步骤1：计算自然粗度Y（基于根系发展，达芬奇规则）
naturalWidth = mainRootCount * 5 + depthLevel * 4
// 限制范围: 10px - 80px

// 步骤2：计算自然高度Z（根系延伸的1.5倍）
rootExtension = baseRootLength * (1 + avgDepth * 0.3)
naturalHeight = rootExtension * 1.5
// 限制范围: 50px - 400px

// 步骤3：应用1/3规则
actualWidth = naturalWidth/3 + (naturalWidth*2/3) * (thickness / 50)
actualHeight = naturalHeight/3 + (naturalHeight*2/3) * (height_level / 100)
```

**关键特性**：
- 树干粗度和高度与根系发展成正比（自然规律）
- 默认值为自然值的1/3，最大值为自然值
- thickness=0 时绘制虚线，thickness>0 时绘制实线

### 3. 枝条生成算法（核心创新）

**递归预算消耗 + 分形生长**：

#### 总体策略
```typescript
// 每个主枝分配 1/3 总预算
budgetPerMain = Math.floor(totalCount / 3)

// 递归消耗预算
drawBranchRecursive(起点, 角度, 长度, 粗度, 预算, 层级)
```

#### 递归函数逻辑
```typescript
function drawBranchRecursive(x, y, angle, length, width, budget, level) {
  // 1. 绘制当前枝条，消耗1预算
  绘制线段(起点 → 终点)
  budget -= 1

  // 2A. 生成侧枝（从中段伸出）
  侧枝数量 = {
    层级1: 2个（在40%, 70%位置）
    层级2: 1-2个（随机）
    层级3: 0-1个（50%概率）
    层级4+: 0个
  }

  for (每个侧枝) {
    侧枝位置 = 起点 + 方向 * 长度 * positionRatio
    侧枝角度 = 主枝角度 ± (50-70°)  // 较大角度，横向伸展
    侧枝长度 = 主枝长度 * (0.4-0.6)
    侧枝粗度 = 主枝粗度 * 0.6
    侧枝预算 = 剩余预算 * 25%

    递归生成(侧枝位置, 侧枝角度, 侧枝长度, 侧枝粗度, 侧枝预算, 层级+1)
  }

  // 2B. 生成末端分叉（Y字形）
  分叉数 = {
    层级1: 2-3个（随机）
    层级2+: 2个
  }

  for (每个分叉) {
    分叉角度 = 主枝角度 ± (25-40°)  // 较小角度，向上延伸
    分叉长度 = 主枝长度 * (0.65-0.75)
    分叉粗度 = 主枝粗度 * 0.7
    分叉预算 = 剩余预算 / 分叉数

    递归生成(终点, 分叉角度, 分叉长度, 分叉粗度, 分叉预算, 层级+1)
  }
}
```

#### 层级衰减规律

| 层级 | 侧枝数 | 分叉数 | 侧枝角度 | 分叉角度 | 长度比例 | 粗度比例 |
|------|--------|--------|----------|----------|----------|----------|
| 1（主枝） | 2 | 2-3 | 50-70° | 25-40° | 100% | 100% |
| 2（次级） | 1-2 | 2 | 40-60° | 20-35° | 70% | 70% |
| 3（三级） | 0-1 | 2 | 30-50° | 15-30° | 50% | 50% |
| 4+（高级） | 0 | 2 | - | 10-25° | 35% | 35% |

**最大层级**：6层

#### 预算分配示例

```
count=30，每个主枝获得10预算：

主枝（1预算）
├─ 侧枝1（2.5预算）→ 次级枝 → 三级枝
├─ 侧枝2（2.5预算）→ 次级枝 → 三级枝
└─ 分叉（剩余4预算）
   ├─ 分叉1（2预算）→ 次级枝
   └─ 分叉2（2预算）→ 次级枝

总枝条数 ≈ 30个（符合count）
```

#### 稳定性保证

```typescript
// 每个枝条分配唯一ID
branchId = ++branchIdCounter

// 使用ID作为随机种子
getStableRandom(branchId, offset) = (branchId * 9301 + offset * 49297) % 233280

// 同一branchId + 同一offset = 相同随机值
// 确保count变化时，已有枝条位置不变
```

**关键特性**：
- **分形结构**：侧枝和分叉可以递归，形成自然层次
- **预算消耗**：count直接对应枝条总数（1 count ≈ 1 枝条）
- **角度控制**：侧枝横向伸展，分叉向上延伸
- **层级衰减**：越高层级，侧枝越少，角度越小
- **完全稳定**：使用ID种子，枝条位置固定不跳动

### 4. 叶子生成算法

**随机附着在枝条末端**：

```typescript
// 从所有枝条中随机选择
for (i = 0; i < leafCount; i++) {
  node = 随机选择一个枝条节点
  位置 = node.x + random(-10, 10), node.y + random(-10, 10)
  大小 = particleSize * random(1.5, 2.5)
  旋转角度 = random(0, 360)
  形状 = 'leaf'
}
```

### 5. 果实生成算法

**附着在成熟枝条（层级≥2）**：

```typescript
// 只选择层级≥2的枝条
matureNodes = branchNodes.filter(n => n.level >= 2)

for (i = 0; i < fruitCount; i++) {
  node = 随机选择一个成熟节点
  位置 = node.x + random(-8, 8), node.y + random(5, 15)  // 垂挂下方
  大小 = particleSize * random(2.5, 3.5)
  形状 = 'apple'
}
```

### 虚实线逻辑

- **虚线（is_solid=false）**：稀疏粒子（间距3倍），透明度40%
- **实线（is_solid=true）**：密集粒子（间距0.8倍），透明度90%

**特殊情况**：
- `count=0`：3个主枝为虚线示意枝，长度响应 `avg_length`
- `count>0`：调用递归算法，生成实线枝条

## 🔧 如何触发意识树生长

### 方法1：手动触发（开发/调试）

```typescript
const response = await fetch('/api/evaluate-tree', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId: 'user-uuid' })
});
```

### 方法2：自动触发（生产环境）

- 设置定时任务（如每周一次）
- 或在用户完成关键行为后触发（作业提交、项目完成等）

## 📈 查询用户意识树数据

### SQL 查询总结

```sql
SELECT
  auth.users.email,
  student_summaries.course_summaries
FROM student_summaries
JOIN auth.users ON student_summaries.user_id = auth.users.id
WHERE auth.users.email = 'user@example.com';
```

### SQL 查询意识树

```sql
SELECT
  auth.users.email,
  profiles.consciousness_tree_view
FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'user@example.com';
```

## 🚨 常见问题排查

### 1. 意识树不更新？

检查清单：
- [ ] `student_summaries` 表是否有最新总结？
- [ ] Edge Function `evaluate-and-grow-tree` 是否成功执行？
- [ ] OpenAI API Key 是否配置正确？
- [ ] 查看 Edge Function 日志

### 2. 总结数据为空？

- 确认用户是否有学习行为（对话/作业/项目）
- 检查 `generate-student-summary` 是否定时执行

### 3. AI 返回的树结构不合法？

- 查看 Edge Function 日志中的 `[AI原始输出]`
- 检查 `validateTreeStructure` 函数的验证逻辑

## 📚 相关文件索引

### Edge Functions
- `supabase/functions/generate-student-summary/index.ts` - 生成三部分总结
- `supabase/functions/evaluate-and-grow-tree/index.ts` - 计算意识树增量

### 前端组件
- `components/consciousness/ConsciousnessTreeCanvas.tsx` - Canvas渲染
- `components/consciousness/ConsciousnessTreeClient.tsx` - 测试工作台
- `components/consciousness/ConsciousnessTreeView.tsx` - 学生视图
- `lib/utils/consciousnessTreeGenerator.ts` - 树生成算法

### 数据库表
- `student_summaries` - 存储三部分总结
- `profiles` - 存储意识树结构
- `gaia_conversations` - 对话记录
- `user_submissions` - 作业提交记录
- `user_selected_projects` - PBL项目选择记录

## 🎯 设计哲学

> "The tree never shrinks, it only grows."

意识树采用**累积生长制**，象征着学习的不可逆性和持续成长。即使学员暂时停止学习，树也不会缩小，只会等待下一次生长。

---

**最后更新**：2025-11-23
**维护者**：Claude Code (Anthropic)

**重要更新日志**：
- 2025-11-23：添加完整可视化算法详解（颜色系统、根系、树干、枝条递归算法）
- 2025-11-23：更新 branches.avg_length 范围为 0-20（原为0-10）
- 2025-11-23：添加递归预算消耗算法说明（分形枝条生成）
