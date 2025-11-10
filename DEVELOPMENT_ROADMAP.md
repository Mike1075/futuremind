# 未来心灵学院 - 开发路线图

**文档版本**: v2.0（上线前冲刺版）
**文档创建时间**: 2025-10-27
**最后更新**: 2025-11-10
**数据库重构状态**: ✅ 已完成
**当前阶段**: 意识树完善 & 上线前准备

---

## 🎯 上线目标

**目标**: 实现面向公众测试的完整产品
**预计上线时间**: 2-3周后
**核心里程碑**: 意识树完整视觉化 + 三大课程完整体验 + 基础管理系统

---

## 📋 总体进度概览

### ✅ 已完成（Phase 0-1）
- [x] 后台管理基础框架
- [x] 管理后台首页 (`/admin`)
- [x] 课程管理入口 (`/admin/courses`)
- [x] 学员管理入口框架（空）
- [x] "自在聆听"课程体系完整功能
  - [x] 后台编辑页面（增删改查、媒体上传）
  - [x] 14天课程数据表（5天有内容）
- [x] 数据库架构重构
  - [x] 统一课程内容模型（course_contents）
  - [x] 课程体系元数据（course_systems）
  - [x] 作业提交系统（user_submissions）
  - [x] 媒体资源扩展
  - [x] PBL项目扩展
- [x] **"欢迎来到地球"课程体系** (2025-11-10)
  - [x] 6阶段课程结构设计
  - [x] 后台管理页面 (`/admin/courses/earth`)
  - [x] 前端用户页面 (`/courses/earth`)
  - [x] 知识点、启发式提问、探索者项目完整实现
  - [x] 进度计算系统（30%项目+70%知识）
  - [x] Gaia对话课程隔离
- [x] **"伊卡洛斯计划"PBL体系** (2025-11-10)
  - [x] 项目管理后台
  - [x] 项目展示前端
  - [x] 项目提交和评分系统
- [x] **意识树基础系统** (2025-11-10)
  - [x] 根系（Roots）可视化 - 5个领域深度显示
  - [x] 数据库支持（user_domain_exploration, consciousness_tree_view）
  - [x] Portal页面集成
  - [x] 详细树视图页面 (`/simple-tree`)

### ⚠️ 部分完成/需要完善
- [ ] Gaia对话系统
  - [x] 基础对话功能
  - [x] 课程隔离（project_id映射）
  - [x] 历史记录保存
  - [ ] 盖亚"园丁"角色 - 意识树解读和反馈
  - [ ] 情感状态识别和年轮纹理生成
- [ ] 意识树完整视觉化
  - [x] 根系（探索广度和深度）✅
  - [ ] 树干（内在觉察与稳定）⚠️ 代码框架存在，未完全实现
  - [ ] 枝叶（洞见火花）⚠️ 缺少洞见叶子的生成逻辑
  - [ ] 果实（创造与贡献）❌ 完全未实现
  - [ ] 生长动画和交互效果

---

## 🌳 意识树完整实现方案（核心优先级）

基于设计文档 `ConsciousnessTreeDesign.md` 和当前代码分析

### 设计哲学回顾
**"你的内在宇宙，值得被看见。"**

意识树包含四个核心组成部分，每个部分反映不同的学习维度：
1. **根系（Roots）** - 探索的广度与深度 ✅ 已实现
2. **树干（Trunk）** - 内在的觉察与稳定 ⚠️ 部分实现
3. **枝叶（Branches & Leaves）** - 洞见的火花 ⚠️ 需要完善
4. **果实（Fruits）** - 创造与贡献 ❌ 未实现

### 当前实现状态分析

#### ✅ 已实现：根系（Roots）
**文件**: `components/ui/database-consciousness-roots.tsx`

**当前功能**：
- 5个领域的根系可视化（自我觉察、生命科学、宇宙法则、创意表达、社会连接）
- 从数据库读取depth_score并渲染成根部长度
- 不同颜色代表不同领域
- 鼠标悬浮显示领域信息

**数据来源**：`user_domain_exploration` 表的 `domain_scores` JSONB字段

**设计对齐度**: 90% - 基本符合设计文档中"根系代表学员从集体知识海洋中汲取养分"

#### ⚠️ 部分实现：树干（Trunk）
**文件**: `database-consciousness-roots.tsx` (line 71-81)

**当前代码**：
```typescript
const [trunkThickness, setTrunkThickness] = useState(1.0)
const MAX_TRUNK_THICKNESS = 3.0
const THICKNESS_INCREMENT = 0.1

const handleMeditation = () => {
  setTrunkThickness(prev => Math.min(prev + THICKNESS_INCREMENT, MAX_TRUNK_THICKNESS))
}
```

**问题**：
1. ❌ `handleMeditation()` 函数未被调用
2. ❌ `trunkThickness` 状态未应用到视觉渲染
3. ❌ 缺少与冥想日志数据库的绑定
4. ❌ 未实现"年轮光环"和情绪纹理

**设计要求**：
- 树干粗细 = 持续冥想练习的数量和质量
- 年轮纹理 = 情绪状态的可视化（平静、喜悦、烦躁、悲伤）
- 脉动光芒 = 实时冥想状态反馈

**数据需求**：
- 表：`meditation_logs` 或 `user_submissions` (type='meditation')
- 字段：meditation_count, emotional_state, consistency_score

#### ⚠️ 需要完善：枝叶（Branches & Leaves）
**文件**: `database-consciousness-roots.tsx` (Branch interface)

**当前代码**：
- 有Branch数据结构和生成逻辑
- 但缺少"洞见叶子"（Insight Leaves）的概念

**设计要求**：
- 枝干 = PBL项目的里程碑
- 叶子 = 与Gaia对话中的"Aha Moment"（顿悟时刻）
- 每片叶子可点击查看当时的对话或笔记
- 叶子的形状和颜色 = 洞见的类型（分析性、直觉性、整合性）

**数据需求**：
- 表：`discussion_messages` + AI标记的"顿悟时刻"
- 表：`pbl_milestones` 或 `user_submissions` (type='milestone')
- 字段：insight_type, insight_content, related_discussion_id

**实现建议**：
```typescript
interface Leaf {
  id: string
  branchIndex: number
  position: Vector2D
  insightType: 'analytical' | 'intuitive' | 'integrative'
  content: string
  timestamp: Date
  discussionId?: string
}
```

#### ❌ 未实现：果实（Fruits）
**设计要求**：
- 创造之果 = 完成并分享PBL项目
- 果实成熟度 = 社区"共鸣"数量（启发他人）
- 世界种子 = 提出被采纳的新"核心问题"或PBL模板

**数据需求**：
- 表：`pbl_projects` (status='completed_shared')
- 表：`community_resonance` (type='inspired_by')
- 表：`world_seeds` (adopted_questions)

**视觉设计**：
- 位置：树冠顶端
- 大小：根据共鸣数动态变化
- 光芒：成熟度越高，光芒越亮
- 交互：点击查看项目详情

**实现建议**：
```typescript
interface Fruit {
  id: string
  position: Vector2D
  projectId: string
  maturity: number // 0-100
  resonanceCount: number
  type: 'creative_work' | 'world_seed'
  glowIntensity: number
}
```

---

## 📋 意识树完整实现任务清单（P0最高优先级）

### 任务T1: 树干（Trunk）完整实现
**优先级**: 🔴 P0
**预计时间**: 2-3天
**文件**: `components/ui/database-consciousness-roots.tsx`

#### T1.1 数据库表设计（4小时）
```sql
-- 冥想日志表（如果不存在）
CREATE TABLE IF NOT EXISTS meditation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  meditation_date DATE NOT NULL,
  duration_minutes INTEGER, -- 冥想时长（分钟）
  emotional_state VARCHAR(50), -- 'calm', 'joyful', 'anxious', 'sad', 'neutral'
  reflection_text TEXT, -- 冥想感悟
  consistency_score NUMERIC(3,2), -- 规律性得分 0-1
  created_at TIMESTAMP DEFAULT NOW()
);

-- 或扩展 user_submissions 表
ALTER TABLE user_submissions
ADD COLUMN IF NOT EXISTS emotional_state VARCHAR(50),
ADD COLUMN IF NOT EXISTS meditation_duration INTEGER;
```

#### T1.2 树干厚度计算逻辑（4小时）
**目标**: 根据冥想历史计算树干粗细

```typescript
// lib/services/consciousness-tree.service.ts
async function calculateTrunkThickness(userId: string): Promise<number> {
  // 1. 查询最近30天的冥想记录
  const { data: meditationLogs } = await supabase
    .from('meditation_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('meditation_date', thirtyDaysAgo)

  // 2. 计算规律性得分（连续天数加成）
  const consistencyScore = calculateConsistency(meditationLogs)

  // 3. 计算总时长
  const totalMinutes = meditationLogs.reduce((sum, log) => sum + log.duration_minutes, 0)

  // 4. 公式：thickness = 1.0 + (总时长/100) * 0.5 + 规律性得分 * 1.0
  // 最大3.0倍
  return Math.min(3.0, 1.0 + (totalMinutes / 100) * 0.5 + consistencyScore * 1.0)
}
```

#### T1.3 年轮纹理生成（6小时）
**目标**: 根据情绪状态生成树干的年轮纹理

```typescript
interface TreeRing {
  radius: number
  color: string
  emotion: string
  date: Date
}

function generateTreeRings(meditationLogs: MeditationLog[]): TreeRing[] {
  const emotionColors = {
    calm: '#4facfe',      // 蓝色 - 平静
    joyful: '#ffd700',    // 金色 - 喜悦
    anxious: '#ff6b6b',   // 红色 - 焦虑
    sad: '#9b59b6',       // 紫色 - 悲伤
    neutral: '#95a5a6'    // 灰色 - 中性
  }

  return meditationLogs.map((log, index) => ({
    radius: 50 + index * 5, // 从中心向外扩展
    color: emotionColors[log.emotional_state] || emotionColors.neutral,
    emotion: log.emotional_state,
    date: new Date(log.meditation_date)
  }))
}
```

#### T1.4 Canvas渲染树干（6小时）
**修改**: `database-consciousness-roots.tsx` 的 canvas 绘制逻辑

```typescript
// 在 draw() 函数中添加树干绘制
function drawTrunk(ctx: CanvasRenderingContext2D, thickness: number, rings: TreeRing[]) {
  const centerX = canvas.width / 2
  const centerY = canvas.height - 100

  // 1. 绘制主树干
  ctx.save()
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#8b4513'
  ctx.fillRect(centerX - thickness * 20, centerY - 200, thickness * 40, 200)

  // 2. 绘制年轮（从内到外）
  rings.forEach(ring => {
    ctx.strokeStyle = ring.color
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.arc(centerX, centerY - 100, ring.radius, 0, Math.PI * 2)
    ctx.stroke()
  })

  // 3. 脉动效果（使用requestAnimationFrame）
  if (isMeditating) {
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 1000) * 0.2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(centerX - thickness * 20, centerY - 200, thickness * 40, 200)
  }

  ctx.restore()
}
```

#### T1.5 集成到Portal（2小时）
- 在Portal页面添加"今日冥想"入口
- 完成冥想后调用API更新`meditation_logs`
- 实时刷新树干厚度

**验证清单**：
- [ ] meditation_logs表创建成功
- [ ] 冥想日志可以正常提交
- [ ] 树干厚度根据冥想历史动态计算
- [ ] 年轮纹理正确显示情绪状态
- [ ] 视觉效果符合设计文档

---

### 任务T2: 枝叶（Branches & Leaves）完整实现
**优先级**: 🔴 P0
**预计时间**: 3-4天

#### T2.1 "顿悟时刻"AI识别系统（1天）
**目标**: 在Gaia对话中自动识别"Aha Moment"

**方案1：规则匹配**（快速实现）
```typescript
// lib/services/insight-detector.ts
function detectInsight(message: string): boolean {
  const insightKeywords = [
    '原来', '我明白了', '突然想到', '恍然大悟',
    'aha', 'eureka', '这让我想到',
    '所以说', '这意味着', '我理解了'
  ]

  return insightKeywords.some(keyword => message.includes(keyword))
}
```

**方案2：AI评估**（高质量）
```typescript
// 调用OpenAI API判断是否是洞见时刻
async function evaluateInsight(message: string, context: string): Promise<{
  isInsight: boolean
  insightType: 'analytical' | 'intuitive' | 'integrative'
  confidence: number
}> {
  const prompt = `分析以下学生消息，判断是否包含"洞见"（深刻理解或顿悟）：

  学生消息：${message}
  对话上下文：${context}

  请返回JSON格式：
  {
    "isInsight": true/false,
    "insightType": "analytical"/"intuitive"/"integrative",
    "confidence": 0-1
  }`

  // 调用OpenAI...
}
```

#### T2.2 数据库表设计（3小时）
```sql
-- 洞见叶子表
CREATE TABLE insight_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  discussion_id UUID REFERENCES knowledge_discussions(id),
  message_id UUID REFERENCES discussion_messages(id),
  insight_type VARCHAR(20) CHECK (insight_type IN ('analytical', 'intuitive', 'integrative')),
  insight_content TEXT NOT NULL,
  confidence_score NUMERIC(3,2), -- AI评估的置信度
  created_at TIMESTAMP DEFAULT NOW(),
  branch_index INTEGER, -- 关联到哪个枝干
  leaf_color VARCHAR(7) -- 十六进制颜色
);

-- PBL里程碑表（枝干）
CREATE TABLE pbl_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES course_contents(id) NOT NULL,
  milestone_type VARCHAR(50), -- 'experiment_design', 'data_collection', 'discussion'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  branch_generation INTEGER -- 第几代枝干（1-N）
);
```

#### T2.3 Gaia对话集成（4小时）
**文件**: `app/api/n8n/gaia-chat/route.ts`

```typescript
// 在保存assistant回复后，检测洞见
const isInsight = detectInsight(message) // 用户消息
if (isInsight) {
  // 保存洞见叶子
  await supabase.from('insight_leaves').insert({
    user_id: userId,
    discussion_id: discussionId,
    message_id: userMessageId,
    insight_type: determineInsightType(message),
    insight_content: message,
    confidence_score: 0.8 // 如果使用AI评估则用AI返回的值
  })

  // 更新意识树视图
  await updateConsciousnessTreeView(userId)
}
```

#### T2.4 Canvas渲染叶子（6小时）
```typescript
// components/ui/database-consciousness-roots.tsx

interface Leaf {
  id: string
  position: Vector2D
  color: string
  insightType: string
  content: string
  created_at: Date
}

function drawLeaves(ctx: CanvasRenderingContext2D, leaves: Leaf[]) {
  leaves.forEach(leaf => {
    const { position, color, insightType } = leaf

    // 绘制叶子形状（根据类型不同形状）
    ctx.save()
    ctx.fillStyle = color
    ctx.globalAlpha = 0.8

    switch (insightType) {
      case 'analytical':
        // 三角形 - 锐利的分析
        drawTriangle(ctx, position.x, position.y, 8)
        break
      case 'intuitive':
        // 圆形 - 圆融的直觉
        ctx.beginPath()
        ctx.arc(position.x, position.y, 6, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'integrative':
        // 六边形 - 整合的智慧
        drawHexagon(ctx, position.x, position.y, 7)
        break
    }

    // 光芒效果
    ctx.globalAlpha = 0.3
    ctx.shadowBlur = 10
    ctx.shadowColor = color
    ctx.fill()

    ctx.restore()
  })
}

// 点击叶子显示内容
canvas.addEventListener('click', (e) => {
  const clickedLeaf = findLeafAtPosition(e.offsetX, e.offsetY)
  if (clickedLeaf) {
    showInsightDialog(clickedLeaf)
  }
})
```

#### T2.5 用户交互（4小时）
- 点击叶子弹出卡片，显示洞见内容和创建时间
- 链接到原始对话
- 动画效果：叶子闪烁、飘落

**验证清单**：
- [ ] insight_leaves表创建成功
- [ ] Gaia对话中自动识别洞见
- [ ] 洞见保存到数据库
- [ ] Canvas正确渲染不同类型的叶子
- [ ] 点击叶子显示详情
- [ ] 视觉效果符合设计文档

---

### 任务T3: 果实（Fruits）完整实现
**优先级**: 🟠 P1
**预计时间**: 2-3天

#### T3.1 数据库表设计（3小时）
```sql
-- 果实表
CREATE TABLE consciousness_fruits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fruit_type VARCHAR(20) CHECK (fruit_type IN ('creative_work', 'world_seed')),

  -- 创造之果
  project_id UUID REFERENCES course_contents(id), -- PBL项目
  shared_at TIMESTAMP, -- 分享时间

  -- 成熟度指标
  maturity_level INTEGER DEFAULT 0, -- 0-100
  resonance_count INTEGER DEFAULT 0, -- 共鸣数量

  -- 世界种子
  adopted_question_id UUID, -- 如果是世界种子
  impact_score NUMERIC(5,2), -- 影响力得分

  created_at TIMESTAMP DEFAULT NOW(),
  glow_intensity NUMERIC(3,2) DEFAULT 0.5 -- 光芒强度
);

-- 社区共鸣表
CREATE TABLE community_resonance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resonator_user_id UUID REFERENCES auth.users(id) NOT NULL, -- 被启发的人
  fruit_id UUID REFERENCES consciousness_fruits(id) NOT NULL,
  resonance_type VARCHAR(20), -- 'inspired', 'learned', 'amazed'
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### T3.2 果实生成逻辑（4小时）
```typescript
// lib/services/consciousness-fruit.service.ts

// 当用户完成并分享PBL项目时
async function createCreativeFruit(userId: string, projectId: string) {
  const { data: fruit } = await supabase
    .from('consciousness_fruits')
    .insert({
      user_id: userId,
      fruit_type: 'creative_work',
      project_id: projectId,
      shared_at: new Date(),
      maturity_level: 30 // 初始成熟度
    })
    .select()
    .single()

  // 更新意识树视图
  await updateConsciousnessTreeFruits(userId)

  return fruit
}

// 当其他用户表达"共鸣"时
async function addResonance(fruitId: string, resonatorUserId: string) {
  // 1. 记录共鸣
  await supabase.from('community_resonance').insert({
    resonator_user_id: resonatorUserId,
    fruit_id: fruitId,
    resonance_type: 'inspired'
  })

  // 2. 更新果实成熟度
  const { data: fruit } = await supabase
    .from('consciousness_fruits')
    .select('*')
    .eq('id', fruitId)
    .single()

  const newMaturity = Math.min(100, fruit.maturity_level + 10)
  const newGlow = newMaturity / 100

  await supabase
    .from('consciousness_fruits')
    .update({
      resonance_count: fruit.resonance_count + 1,
      maturity_level: newMaturity,
      glow_intensity: newGlow
    })
    .eq('id', fruitId)
}
```

#### T3.3 Canvas渲染果实（6小时）
```typescript
interface Fruit {
  id: string
  position: Vector2D
  type: 'creative_work' | 'world_seed'
  maturity: number // 0-100
  glowIntensity: number
  projectId: string
}

function drawFruits(ctx: CanvasRenderingContext2D, fruits: Fruit[]) {
  fruits.forEach(fruit => {
    const { position, type, maturity, glowIntensity } = fruit

    // 果实大小随成熟度变化
    const size = 10 + (maturity / 100) * 10

    ctx.save()

    // 世界种子 - 特殊的恒星光芒
    if (type === 'world_seed') {
      ctx.shadowBlur = 30
      ctx.shadowColor = '#ffd700'
      ctx.fillStyle = '#ffd700'

      // 绘制多角星形
      drawStar(ctx, position.x, position.y, size * 2, 8)
    } else {
      // 创造之果 - 发光的圆球
      const gradient = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, size
      )
      gradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`)
      gradient.addColorStop(1, `rgba(255, 140, 0, ${glowIntensity * 0.5})`)

      ctx.fillStyle = gradient
      ctx.shadowBlur = glowIntensity * 20
      ctx.shadowColor = '#ffaa00'

      ctx.beginPath()
      ctx.arc(position.x, position.y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  })
}
```

#### T3.4 社区互动功能（5小时）
- 在项目展示页面添加"共鸣"按钮
- 显示果实的成熟度和共鸣数
- 世界种子列表页面

**验证清单**：
- [ ] consciousness_fruits表创建成功
- [ ] 完成PBL项目自动生成果实
- [ ] 共鸣功能正常工作
- [ ] 果实成熟度动态更新
- [ ] Canvas正确渲染果实
- [ ] 世界种子有特殊视觉效果

---

### 任务T4: 盖亚园丁角色
**优先级**: 🟡 P1
**预计时间**: 2天

#### T4.1 意识树解读API（6小时）
```typescript
// app/api/gaia/interpret-tree/route.ts

export async function POST(req: Request) {
  const { userId } = await req.json()

  // 1. 获取完整意识树数据
  const treeView = await getConsciousnessTreeView(userId)
  const domains = await getDomainExploration(userId)
  const recentMeditations = await getRecentMeditations(userId, 7)
  const insights = await getRecentInsights(userId, 10)
  const fruits = await getUserFruits(userId)

  // 2. 构建分析提示词
  const analysisPrompt = `你是盖亚，智慧的园丁。请分析这位学员的意识树：

  根系（探索）：
  ${JSON.stringify(domains)}

  树干（冥想）：
  最近7天冥想${recentMeditations.length}次

  枝叶（洞见）：
  最近产生${insights.length}个洞见

  果实（创造）：
  完成${fruits.length}个创造性作品

  请用温暖、充满智慧的语气：
  1. 赞美学员当前成长最突出的方面
  2. 指出可能被忽略的领域
  3. 给出启发性的建议（而非直接答案）
  4. 保持慈悲和鼓励的基调
  `

  // 3. 调用OpenAI
  const interpretation = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: '你是盖亚，未来心灵学院的智慧向导' },
      { role: 'user', content: analysisPrompt }
    ]
  })

  return NextResponse.json({
    interpretation: interpretation.choices[0].message.content
  })
}
```

#### T4.2 前端集成（4小时）
- 在simple-tree页面添加"盖亚解读"按钮
- 显示解读结果的美观对话框
- 可以追问和深入探讨

**验证清单**：
- [ ] API正确分析意识树数据
- [ ] 盖亚的回复符合"园丁"角色定位
- [ ] 前端显示效果良好
- [ ] 可以与盖亚深入对话

---

## 🎯 开发任务清单（按优先级排序）

---

## **P0 - 紧急修复（1天）** 🔴

### 任务0.1：更新自在聆听后台适配新架构
**优先级**: 🔴 最高
**预计时间**: 3-4小时
**负责人**: 开发者
**状态**: ⚠️ 待执行

#### 目标
修复因数据库重构导致的后台页面功能中断

#### 具体工作
**文件路径**: `/app/admin/courses/listening/page.tsx`

**需要修改的代码**:

```typescript
// 1. 更新数据加载逻辑
// 旧代码：
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('course_system', '自在聆听')
  .order('day_number', { ascending: true })

// 新代码：
const { data: systemData } = await supabase
  .from('course_systems')
  .select('id')
  .eq('system_key', 'listening')
  .single()

const { data, error } = await supabase
  .from('course_contents')
  .select('*')
  .eq('system_id', systemData.id)
  .order('sequence_number', { ascending: true })

// 2. 更新字段映射
// day_number → sequence_number
// course_system → 删除（通过 system_id 关联）

// 3. 更新新增课程逻辑
const { data, error } = await supabase
  .from('course_contents')
  .insert({
    system_id: systemData.id,
    content_type: 'daily_lesson',
    sequence_number: newDayNumber,
    title: `第${newDayNumber}天`,
    is_published: false,
    // ... 其他字段
  })

// 4. 更新媒体资源加载
// lesson_id → course_content_id
const { data, error } = await supabase
  .from('media_resources')
  .select('*')
  .eq('course_content_id', selectedContent.id)
```

#### 验证清单
- [ ] 课程列表正常显示14天
- [ ] 点击某一天能正常加载内容
- [ ] 编辑保存功能正常
- [ ] 新增一天功能正常
- [ ] 媒体文件上传和显示正常
- [ ] 删除功能正常（如有）

#### 输出物
- 更新后的 `listening/page.tsx` 文件
- 测试通过截图

---

### 任务0.2：重新生成TypeScript类型定义
**优先级**: 🔴 最高
**预计时间**: 30分钟
**状态**: ⚠️ 待执行

#### 命令
```bash
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 生成新的类型定义
supabase gen types typescript --project-id lvjezsnwesyblnlkkirz > types/database.types.ts
```

#### 验证
检查新增的类型是否包含：
- CourseSystem
- CourseContent
- UserSubmission
- MediaResource（更新后的）
- ExplorerProject（更新后的）

---

## **P1 - "欢迎来到地球"课程体系（3-4天）** 🟠

### 任务1.1：设计并创建数据结构
**优先级**: 🟠 高
**预计时间**: 4小时
**状态**: 📋 计划中

#### 目标
为"欢迎来到地球"6个阶段设计完整的数据结构

#### 数据模型设计

**基本结构**（使用 course_contents 表）：
```json
{
  "system_id": "earth的UUID",
  "content_type": "stage",
  "sequence_number": 1-6,
  "title": "第一课：探索我们感官之外的世界",
  "subtitle": "无形的咆哮（声音）",

  // 欢迎来到地球专用字段
  "documentary_url": "YouTube/Bilibili链接",
  "pre_watch_guide": "课前引导文字（Markdown）",

  "knowledge_points": [
    {
      "title": "声音的本质是什么？",
      "description": "声音是振动，通过介质传播的波",
      "examples": ["人类听觉范围", "次声波", "超声波"]
    }
  ],

  "socratic_questions": [
    {
      "stage": "pre_watch",
      "question": "同学们，你们有没有想过，'绝对的安静'真的存在吗？",
      "purpose": "引导学生思考声音的本质"
    },
    {
      "stage": "during_watch",
      "question": "威尔·史密斯说他能'感觉'到火山的咆哮，这是什么意思？",
      "purpose": "理解声音不仅通过耳朵感知"
    },
    {
      "stage": "post_watch",
      "question": "看完这集，你认为我们的五种感官告诉我们的就是世界的全部样貌吗？",
      "purpose": "激发对感官局限性的思考"
    }
  ],

  "post_reflection": [
    {
      "type": "hands_on_project",
      "title": "项目一：振动猎人",
      "description": "亲身验证声音就是振动",
      "materials": ["一个碗", "保鲜膜", "盐粒", "音响"],
      "steps": ["用保鲜膜封住碗口...", "撒上盐粒...", "播放音乐观察"]
    }
  ],

  "estimated_duration": 120,
  "prerequisites": [{"type": "complete_previous", "content_id": "上一阶段的UUID"}]
}
```

#### 输出物
- 数据结构设计文档（JSON Schema）
- 第一阶段完整示例数据（可直接导入数据库）

---

### 任务1.2：开发后台管理页面
**优先级**: 🟠 高
**预计时间**: 1天
**状态**: 📋 计划中

#### 目标
创建欢迎来到地球的后台编辑界面

#### 文件路径
`/app/admin/courses/earth/page.tsx`

#### 功能需求

**布局设计**：
```
┌─────────────────────────────────────────────────┐
│  ← 返回课程管理    欢迎来到地球               │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ 左侧栏   │         右侧编辑区                   │
│          │                                      │
│ [+]新增  │  ┌──────────────────────────┐      │
│          │  │ 阶段1：探索感官之外的世界 │      │
│ □ 阶段1  │  └──────────────────────────┘      │
│ □ 阶段2  │                                      │
│ □ 阶段3  │  【基本信息】                        │
│ □ 阶段4  │  标题: [           ]                │
│ □ 阶段5  │  副标题: [         ]                │
│ □ 阶段6  │                                      │
│          │  【纪录片】                          │
│          │  链接: [           ]                │
│          │                                      │
│          │  【课前引导】                        │
│          │  [富文本编辑器]                      │
│          │                                      │
│          │  【知识点管理】                      │
│          │  + 添加知识点                        │
│          │  □ 知识点1 [编辑] [删除]            │
│          │                                      │
│          │  【启发式提问】                      │
│          │  + 添加提问                          │
│          │  □ 课前 | 问题... [编辑] [删除]     │
│          │                                      │
│          │  【课后实践项目】                    │
│          │  + 添加项目                          │
│          │  □ 振动猎人 [编辑] [删除]           │
│          │                                      │
│          │  [保存草稿] [发布]                  │
└──────────┴──────────────────────────────────────┘
```

**核心组件**：
1. 左侧：阶段列表（1-6）
2. 右侧：表单编辑器
   - 基本信息输入
   - 纪录片URL输入
   - 富文本编辑器（课前引导）
   - 动态数组编辑器（知识点）
   - 动态数组编辑器（启发式提问）
   - 动态数组编辑器（实践项目）

#### 技术要点
- 使用 React Hook Form + Zod 验证
- 富文本编辑器：可选用 Tiptap 或 Quill
- JSONB字段的编辑：自定义动态表单组件
- 实时保存草稿功能

#### 参考模板
```typescript
// 参考 listening/page.tsx 的整体结构
// 扩展表单字段以支持欢迎来到地球的特殊需求
```

#### 验证清单
- [ ] 6个阶段列表正确显示
- [ ] 选中阶段加载对应数据
- [ ] 所有字段编辑正常
- [ ] 知识点动态添加/删除
- [ ] 启发式提问动态管理
- [ ] 保存功能正常
- [ ] 发布/取消发布功能

---

### 任务1.3：填充第一阶段示例数据
**优先级**: 🟠 高
**预计时间**: 4小时
**状态**: 📋 计划中

#### 数据来源
文档：`D:\CursorWork\FutureMindInstitute\readme\未来教育课程之一：欢迎来到地球.md`

#### 需要录入的内容
**第一课：探索我们感官之外的世界**
- ✅ 知识结构（5个知识点）
- ✅ 苏格拉底启发式对话（课前/观看中/课后）
- ✅ 生活中的小探险家项目（3个）
- ⚠️ 纪录片链接（需要找到对应集数）

#### 执行方式
1. 手动在后台页面录入
2. 或：编写SQL插入脚本批量导入

#### 输出物
- 第一阶段完整数据（在数据库中）
- 数据录入SQL脚本（可选）

---

## **P2 - "伊卡洛斯计划"PBL体系完善（2-3天）** 🟡

### 任务2.1：完善PBL项目数据结构
**优先级**: 🟡 中
**预计时间**: 4小时
**状态**: 📋 计划中

#### 目标
为12个预设项目填充完整的周/日计划

#### 项目矩阵

```
模块一：无形的纽带
├─ beginner: 项目A - 声音的旅行日记
├─ intermediate: 项目B - 家庭声音博物馆
├─ advanced: 项目C - 跨文化音乐探索
└─ expert: 项目D - 声音与神经科学

模块二：现实的边缘
├─ beginner: （待设计）
├─ intermediate: （待设计）
├─ advanced: （待设计）
└─ expert: （待设计）

模块三：未来的种子
├─ beginner: （待设计）
├─ intermediate: （待设计）
├─ advanced: （待设计）
└─ expert: （待设计）
```

#### 周计划结构示例
```json
{
  "week_plan": [
    {
      "week": 1,
      "theme": "感知与觉察",
      "goals": [
        "建立对声音的敏感度",
        "学会使用观察日记"
      ],
      "activities": [
        {
          "day": "周一",
          "title": "启动会议",
          "description": "项目介绍和团队组建",
          "deliverables": ["团队名称", "角色分工"]
        },
        {
          "day": "周三",
          "title": "声音采集",
          "description": "在不同环境中采集声音样本",
          "deliverables": ["至少10个声音样本"]
        }
      ]
    }
  ]
}
```

#### 输出物
- 12个项目的完整周计划（8周 × 12项目）
- SQL更新脚本

---

### 任务2.2：开发伊卡洛斯后台管理页面
**优先级**: 🟡 中
**预计时间**: 1.5天
**状态**: 📋 计划中

#### 文件路径
`/app/admin/courses/icarus/page.tsx`

#### 布局设计
```
┌─────────────────────────────────────────────────┐
│  ← 返回    伊卡洛斯计划：探索现实的边缘        │
├─────────────────────────────────────────────────┤
│                                                 │
│  3×4 项目矩阵视图                               │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  模块一：无形的纽带                 │       │
│  ├──────┬──────┬──────┬──────────┤       │
│  │初级  │中级  │高级  │专家级    │       │
│  │项目A │项目B │项目C │项目D     │       │
│  │[编辑]│[编辑]│[编辑]│[编辑]    │       │
│  └──────┴──────┴──────┴──────────┘       │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  模块二：现实的边缘                 │       │
│  │  ... 同上结构 ...                   │
│  └─────────────────────────────────────┘       │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 功能需求
1. 矩阵式项目概览
2. 点击项目进入详细编辑
3. 周计划编辑器（可视化）
4. 日计划编辑器
5. 学习目标管理
6. 评估标准设置

#### 验证清单
- [ ] 3×4矩阵正确显示12个项目
- [ ] 项目详情编辑功能完整
- [ ] 周/日计划可视化编辑
- [ ] 保存功能正常

---

## **P3 - 前端用户展示系统（4-5天）** 🟢

### 任务3.1：课程列表首页
**优先级**: 🟢 标准
**预计时间**: 1天
**状态**: 📋 计划中

#### 文件路径
`/app/courses/page.tsx`

#### 功能需求
1. 展示三大课程体系卡片
2. 显示用户的学习进度
3. 显示解锁状态
4. 意识树预览组件
5. 最近学习记录

#### 设计要点
- 响应式布局
- 美观的卡片设计
- 进度条可视化
- 引导用户继续学习

---

### 任务3.2：自在聆听用户端页面
**优先级**: 🟢 标准
**预计时间**: 1.5天
**状态**: 📋 计划中

#### 文件路径
`/app/courses/listening/[day]/page.tsx`

#### 功能需求
1. 14天进度条
2. 递进式解锁显示
3. 每日内容完整展示
   - 原文摘录
   - 深度解读
   - 冥想引导（音频播放器）
   - 生活练习
4. 感想提交表单
5. 完成打卡功能

#### 技术要点
- 动态路由：[day] 参数
- 音频播放器组件
- 富文本内容渲染
- 提交表单集成 user_submissions

---

### 任务3.3：欢迎来到地球用户端页面
**优先级**: 🟢 标准
**预计时间**: 1.5天
**状态**: 📋 计划中

#### 文件路径
`/app/courses/earth/[stage]/page.tsx`

#### 功能需求
1. 6阶段进度条
2. 纪录片嵌入播放（YouTube/Bilibili）
3. 知识点展开/折叠
4. 启发式提问互动
5. 课后思辨作业提交
6. 关联PBL项目推荐

---

### 任务3.4：探索者联盟页面
**优先级**: 🟢 标准
**预计时间**: 1天
**状态**: 📋 计划中

#### 文件路径
`/app/explorer-alliance/page.tsx`

#### 功能需求
1. 3×4项目矩阵展示
2. 项目卡片（标题、描述、难度、参与人数）
3. 筛选功能（模块、难度）
4. 项目详情页
5. 加入项目按钮
6. 用户自建项目入口

---

## **P4 - 学员管理系统（3-4天）** 🔵

### 任务4.1：完善学员管理页面
**优先级**: 🔵 后续
**预计时间**: 2天
**状态**: 📋 计划中

#### 文件路径
`/app/admin/students/page.tsx`

#### 功能需求
1. 学员列表（分页、搜索、筛选）
2. 学员详情页
   - 基本信息
   - 学习进度（三大课程）
   - 意识树可视化
   - 提交作业历史
   - 成长轨迹

---

### 任务4.2：作业批改系统
**优先级**: 🔵 后续
**预计时间**: 1.5天
**状态**: 📋 计划中

#### 文件路径
`/app/admin/review/page.tsx`

#### 功能需求
1. 待批改作业列表
2. 作业详情查看器
3. 评分界面（0-100分）
4. 反馈文本编辑
5. 意识树成长点数分配
6. 批量操作

---

## 📅 上线前冲刺时间线（v2.0 更新版）

**总时长预估**: 2-3周
**核心目标**: 意识树完整视觉化 + 基础管理功能 + 性能优化

### **第一周：意识树核心功能实现**（最高优先级）
```
Day 1-2:   T1 - 树干完整实现（冥想系统+年轮纹理）
Day 3-5:   T2 - 枝叶完整实现（顿悟识别+洞见叶子）
Day 6-7:   T3 - 果实基础实现（创造之果+共鸣系统）
```

### **第二周：意识树完善 + 管理系统**
```
Day 8-9:   T3继续 - 果实完善（世界种子+社区互动）
Day 10:    T4 - 盖亚园丁角色（意识树解读）
Day 11-12: 学员管理后台基础功能
Day 13-14: 作业批改系统初版
```

### **第三周：测试、优化、上线准备**
```
Day 15-16: 完整功能测试和修复
Day 17:    性能优化（加载速度、Canvas渲染）
Day 18:    用户体验优化（引导教程、帮助文档）
Day 19:    内部测试和反馈收集
Day 20:    最终调整和部署准备
Day 21:    🚀 公开测试版上线
```

---

## 🎯 上线前必须完成清单（Launch Checklist）

### ✅ 核心功能完整性

#### 意识树系统（P0 - 必须完成）
- [ ] **根系（Roots）** ✅ 已完成
  - [x] 5个领域的根系可视化
  - [x] 数据库集成
  - [x] 实时更新
- [ ] **树干（Trunk）** ⚠️ 需要完成（2-3天）
  - [ ] 冥想日志数据库表
  - [ ] 树干厚度计算逻辑
  - [ ] 年轮纹理渲染
  - [ ] Canvas视觉效果
  - [ ] Portal冥想入口
- [ ] **枝叶（Branches & Leaves）** ⚠️ 需要完成（3-4天）
  - [ ] 顿悟时刻AI识别
  - [ ] insight_leaves表创建
  - [ ] Gaia对话集成
  - [ ] Canvas叶子渲染
  - [ ] 点击查看详情
- [ ] **果实（Fruits）** ⚠️ 可选完成，建议完成基础版（2-3天）
  - [ ] consciousness_fruits表
  - [ ] 创造之果生成逻辑
  - [ ] 社区共鸣功能
  - [ ] Canvas渲染
  - [ ] 世界种子（可后续版本）

#### 三大课程体系（已基本完成，需测试）
- [x] **自在聆听** - 完整可用 ✅
  - [x] 14天课程内容
  - [x] 冥想音频播放
  - [x] 作业提交
  - [ ] 完整测试（待验证）
- [x] **欢迎来到地球** - 完整可用 ✅
  - [x] 6阶段课程结构
  - [x] 知识点、提问、探索者项目
  - [x] 进度计算（30%+70%）
  - [x] Gaia对话隔离
  - [ ] 完整测试（待验证）
- [x] **伊卡洛斯计划** - 基础可用 ✅
  - [x] PBL项目管理
  - [x] 项目提交评分
  - [ ] 12个项目完整数据（可逐步填充）
  - [ ] 完整测试（待验证）

#### Gaia对话系统
- [x] 基础对话功能 ✅
- [x] 课程隔离 ✅
- [x] 历史记录 ✅
- [ ] **盖亚园丁角色**（P1 - 建议完成，2天）
  - [ ] 意识树解读API
  - [ ] 前端集成
  - [ ] 情感温暖的对话风格调试

### ⚠️ 基础管理功能（P1 - 建议完成）

#### 学员管理（简化版，3-4天）
- [ ] 学员列表页面
  - [ ] 基本信息展示
  - [ ] 搜索功能
  - [ ] 分页
- [ ] 学员详情页
  - [ ] 学习进度概览
  - [ ] 意识树预览
  - [ ] 作业历史

#### 作业批改（MVP版本，2-3天）
- [ ] 待批改列表
- [ ] 作业详情查看
- [ ] 评分和反馈
- [ ] 状态更新（approved/rejected）

### 🔧 技术性能优化（P1 - 建议完成）

#### 性能（2-3天）
- [ ] Canvas渲染优化
  - [ ] 减少重绘次数
  - [ ] 使用requestAnimationFrame
  - [ ] 离屏Canvas缓存
- [ ] 数据库查询优化
  - [ ] 添加必要索引
  - [ ] 减少N+1查询
- [ ] 图片和媒体资源优化
  - [ ] Next.js Image优化
  - [ ] 懒加载

#### 错误处理（1天）
- [ ] 全局错误边界
- [ ] 友好的错误提示
- [ ] 日志记录系统

#### 测试（2天）
- [ ] 核心功能手动测试
- [ ] 跨浏览器兼容性（Chrome, Safari, Firefox）
- [ ] 移动端响应式测试
- [ ] 性能基准测试

### 📱 用户体验优化（P2 - 可选）

#### 引导教程（1-2天）
- [ ] 首次登录引导
- [ ] 意识树使用说明
- [ ] 课程学习流程引导

#### 帮助文档（1天）
- [ ] FAQ页面
- [ ] 使用指南
- [ ] 常见问题解答

### 🔒 安全和稳定性（P1 - 建议完成）

#### 安全性（2天）
- [ ] RLS策略完整性检查
- [ ] API权限验证
- [ ] 防止SQL注入和XSS
- [ ] 敏感信息保护

#### 数据备份（半天）
- [ ] Supabase自动备份配置
- [ ] 关键数据导出功能

---

## 🎯 新版里程碑检查点

### Milestone 1: 意识树核心完成（第1周结束）
**目标**: 意识树四大组成部分基本可用

**验收标准**：
- [ ] 根系：5个领域正确显示，数据实时更新
- [ ] 树干：冥想系统可用，年轮纹理显示
- [ ] 枝叶：至少10个测试洞见叶子正确渲染
- [ ] 果实：基础版创造之果可以生成和显示

**阻塞问题**：
- 无，T1-T3任务可以并行开发

### Milestone 2: 管理系统可用（第2周结束）
**目标**: 教师可以基本管理学员和批改作业

**验收标准**：
- [ ] 可以查看学员列表和详情
- [ ] 可以批改作业并给出反馈
- [ ] 盖亚可以解读意识树
- [ ] 所有P0任务完成80%以上

**阻塞问题**：
- 依赖Milestone 1的意识树数据结构

### Milestone 3: 上线准备完成（第3周结束）
**目标**: 产品达到公开测试标准

**验收标准**：
- [ ] 三大课程完整测试通过
- [ ] 意识树完整功能100%可用
- [ ] 核心功能无严重Bug
- [ ] 性能指标达标：
  - 首页加载 < 2秒
  - Canvas FPS > 30
  - API响应 < 500ms
- [ ] 至少5个内部测试用户完成完整学习流程

**上线条件**：
1. ✅ 所有P0任务完成
2. ✅ 至少80%的P1任务完成
3. ✅ 无严重安全漏洞
4. ✅ 核心用户流程测试通过
5. ✅ 监控和日志系统就绪

---

## 📊 上线前工作量估算

### P0 - 必须完成（约10-12天）
| 任务 | 工作量 | 备注 |
|------|--------|------|
| T1 树干实现 | 2-3天 | 包括数据库、逻辑、渲染 |
| T2 枝叶实现 | 3-4天 | AI识别是关键 |
| T3 果实基础 | 2-3天 | 仅基础版，世界种子可后续 |
| 功能测试和修复 | 2天 | 完整流程测试 |
| 性能优化 | 1-2天 | Canvas和查询优化 |

### P1 - 建议完成（约6-8天）
| 任务 | 工作量 | 备注 |
|------|--------|------|
| T4 盖亚园丁 | 2天 | 意识树解读功能 |
| 学员管理（简化版） | 2-3天 | MVP版本 |
| 作业批改系统 | 2-3天 | MVP版本 |

### P2 - 可选完成（约2-4天）
| 任务 | 工作量 | 备注 |
|------|--------|------|
| 引导教程 | 1-2天 | 提升新用户体验 |
| 帮助文档 | 1天 | FAQ和指南 |
| 高级分析功能 | 1-2天 | 数据可视化 |

**总计**: 18-24天（约2.5-3.5周）

### 快速上线方案（2周）
如果需要2周内上线，建议：
1. **第1周**: 全力完成T1-T3（意识树核心）
2. **第2周**: 基础管理功能+测试优化
3. **暂缓**: T4盖亚园丁、引导教程、帮助文档
4. **发布**: Beta测试版，收集反馈后迭代

### 稳健上线方案（3周，推荐）
1. **第1周**: T1-T3意识树完整实现
2. **第2周**: T4+基础管理系统
3. **第3周**: 完整测试+优化+上线准备
4. **发布**: 功能完整的v1.0公开测试版

---

## 📌 开发规范

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件文件命名：PascalCase
- 工具函数命名：camelCase

### Git提交规范
```
feat: 新增功能
fix: 修复问题
refactor: 重构代码
docs: 文档更新
style: 样式调整
test: 测试相关
```

### 测试要求
每个功能完成后需要：
1. 单元测试（可选）
2. 手动功能测试
3. 截图记录

---

## 📞 相关文档

- **意识树设计文档**: `D:\CursorWork\FutureMindInstitute\readme\ConsciousnessTreeDesign.md`
- **数据库重构报告**: `DATABASE_REFACTOR_REPORT.md`
- **数据库架构设计**: `DATABASE_REFACTOR_PLAN.md`
- **Migration备份**: `MIGRATION_BACKUP.sql`
- **需求文档目录**: `D:\CursorWork\FutureMindInstitute\readme\`

---

## 📝 版本历史

- **v1.0** (2025-10-27) - 初始版本：三大课程体系规划
- **v2.0** (2025-11-10) - 上线冲刺版：意识树完整实现方案 + 上线前清单

---

**文档最后更新**: 2025-11-10 23:00
**下次审查时间**: 每周一上午
**当前版本**: v2.0
