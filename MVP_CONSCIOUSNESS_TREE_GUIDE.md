# 意识树MVP实现指南 - 从零到可用

**目标**: 实现Level 1（红色）意识树的完整功能
**范围**: 5个生长阶段 + 数据库联动 + 防止畸形发展
**时间**: 预计1-2天完成

---

## 📋 目录

1. [整体流程图](#整体流程图)
2. [第一步：用Lovart画5张树图](#第一步用lovart画5张树图)
3. [第二步：图片转成代码](#第二步图片转成代码)
4. [第三步：连接Supabase数据库](#第三步连接supabase数据库)
5. [第四步：防止畸形发展机制](#第四步防止畸形发展机制)
6. [第五步：测试验证](#第五步测试验证)

---

## 🎯 整体流程图

```
用户学习行为
    ↓
记录到Supabase数据库
    ↓
计算 level_progress (0-100)
    ↓
根据进度选择对应的树图片
    ↓
显示在网页上（带动画效果）
```

**关键数据流**:
```
用户完成任务 → total_experience_points +10
              → level_progress +5%
              → 如果 progress < 20% → 显示 seed.png
              → 如果 20% ≤ progress < 40% → 显示 sprout.png
              → 如果 40% ≤ progress < 60% → 显示 seedling.png
              → 如果 60% ≤ progress < 80% → 显示 young.png
              → 如果 progress ≥ 80% → 显示 mature.png
```

---

## 第一步：用Lovart画5张树图

### 1.1 注册Lovart账号（5分钟）

1. **访问网站**: 打开浏览器，输入 https://www.lovart.ai
2. **注册账号**:
   - 点击右上角"Sign Up"
   - 可以用Google账号快速登录，或者邮箱注册
   - 如果提示排队，等待几分钟（免费用户可能需要排队）
3. **进入创作页面**:
   - 登录后，点击"Create"或"New Project"
   - 会看到一个大的输入框（这就是输入提示词的地方）

### 1.2 生成第一张图：种子期（Seed）

**操作步骤**:

1. **在提示词输入框粘贴以下内容**:

```
A mystical consciousness seed buried in rich dark soil, deep crimson red color,
1-2 ultra-thin glowing red roots emerging downward into darkness,
subtle golden energy sparkles around the seed,
watercolor illustration style with soft brush strokes,
minimal and elegant design, dark mystical background with subtle starfield,
ethereal spiritual atmosphere,
transparent PNG format, ultra-high quality, 4K resolution
```

2. **在"Negative Prompt"（负面提示词）输入框粘贴**:

```
geometric shapes, perfect circle, straight lines, cartoon character,
childish drawing, dotted lines, pearl string effect,
busy background, text, watermark
```

3. **设置参数**（在右侧面板）:
   - **Model**: 选择"Flux"或最新模型
   - **Style**: 选择"Watercolor Illustration"
   - **Aspect Ratio**: 选择"1:1"（正方形）
   - **Quality**: 拉到"High"

4. **点击"Generate"按钮**（通常是紫色或蓝色大按钮）

5. **等待生成**（约30秒-2分钟）
   - 会生成4-8张变体
   - 选择最满意的一张

6. **下载图片**:
   - 点击选中的图片
   - 点击"Download"或下载图标
   - **重要**: 下载后重命名为 `seed.png`

### 1.3 生成第二张图：发芽期（Sprout）

**操作步骤**:

1. **点击"New Generation"或清空之前的提示词**

2. **粘贴新提示词**:

```
A delicate sprout breaking through dark soil surface,
vibrant crimson red stem with graceful gentle curve,
2 small round cotyledon leaves in bright red-orange gradient,
2-3 thin red roots visible below ground spreading naturally,
watercolor painting style with flowing brush strokes,
soft color gradients from dark red base to bright red tips,
golden accent sparkles around new growth,
magical spiritual energy particles rising,
dark background transitioning to dawn light,
transparent background, 4K quality
```

3. **负面提示词保持不变**（跟Seed一样）

4. **参数保持不变**

5. **生成、选择、下载**，重命名为 `sprout.png`

### 1.4 生成第三张图：幼苗期（Seedling）

**提示词**:

```
A young seedling in active growth, red-orange color theme,
gracefully wilting cotyledon leaves turning pale gray-yellow,
4-6 vibrant fresh true leaves emerging in pairs,
leaves with subtle vein patterns, red-orange gradient colors,
thin elegant stem gaining slight thickness,
4 spreading roots underground in organic curved patterns,
watercolor illustration with soft brush techniques,
layers of color creating depth, light coming from upper left,
life transformation visible, old fading, new thriving,
ethereal mystical particles, spiritual energy flow,
dark background with gentle glow, transparent PNG, 4K resolution
```

**下载后重命名**: `seedling.png`

### 1.5 生成第四张图：小树期（Young Tree）

**提示词**:

```
A young consciousness tree with developing structure,
red-orange trunk with subtle vertical bark texture,
slightly wider at base tapering upward, hand-painted watercolor style,
5 colorful roots spreading underground with smooth flowing curves,
NO dotted lines, NO pearl string effect,
round fluffy canopy composed of multiple overlapping cloud-like shapes,
NOT a perfect geometric circle, irregular organic outline,
12-18 oval leaves in varying red-orange shades scattered naturally,
3-5 small pink flower buds appearing on branches,
soft watercolor wash technique, gentle highlights and shadows,
magical glowing particles floating around,
dark starry background, transparent PNG, high quality 4K
```

**下载后重命名**: `young.png`

### 1.6 生成第五张图：大树期（Mature Tree）⭐最重要

**提示词**:

```
A majestic mature consciousness tree, masterpiece quality,
thick robust trunk in red-orange gradient,
realistic watercolor bark texture with vertical grain patterns,
trunk wider at base,
sophisticated light and shadow creating strong 3D form,

5 main roots PLUS 10 smaller branch roots spreading underground,
roots in golden-brown-red-orange gradient color palette,
roots painted with smooth flowing watercolor brush strokes,
ABSOLUTELY NO dotted lines, NO pearl string effect,

expansive irregular canopy composed of multiple overlapping cloud-like blobs,
canopy outline is scalloped and wavy, NOT a perfect geometric circle,
layered depth: dark red in back, medium red in middle, bright red-orange front,

25-35 individual oval leaves painted with radial gradients,
leaf centers bright red-orange, edges darker crimson,

5-8 luminous golden fruits representing achievements,
fruits with subtle shadows, small highlight spots suggesting glossy surface,

professional watercolor illustration,
subtle golden particle effects floating in air,
spiritual mystical atmosphere,
dark deep space background with distant stars,
transparent background PNG, ultra-high quality 8K resolution
```

**下载后重命名**: `mature.png`

### 1.7 整理文件

**创建文件夹结构**:

```
项目根目录/
└── public/
    └── tree-images/
        └── level-1/
            ├── seed.png
            ├── sprout.png
            ├── seedling.png
            ├── young.png
            └── mature.png
```

**Windows操作**:
1. 打开项目文件夹 `D:\CursorWork\FutureMindInstitute\futuremind-new\`
2. 进入 `public` 文件夹
3. 右键创建新文件夹 `tree-images`
4. 进入 `tree-images`，创建文件夹 `level-1`
5. 把下载的5张PNG图片复制进去

---

## 第二步：图片转成代码

### 2.1 创建显示组件

这个**不需要用Figma**！因为只是显示图片，我直接给你写好的代码：

**创建文件**: `components/consciousness-tree/TreeDisplay.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getTreeImagePath, getTreeStage, CONSCIOUSNESS_LEVEL_COLORS } from '@/lib/consciousness-config'

export default function TreeDisplay() {
  const [level, setLevel] = useState(1)  // MVP只做Level 1
  const [progress, setProgress] = useState(0)  // 0-100
  const [loading, setLoading] = useState(true)

  // 从数据库加载用户数据
  useEffect(() => {
    loadUserTreeData()
  }, [])

  async function loadUserTreeData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('用户未登录')
        setLoading(false)
        return
      }

      // 获取用户的意识等级和进度
      const { data, error } = await supabase
        .from('profiles')
        .select('consciousness_level, level_progress')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('获取数据失败:', error)
        return
      }

      if (data) {
        setLevel(data.consciousness_level || 1)
        setProgress(data.level_progress || 0)
      }
    } catch (error) {
      console.error('加载树数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  // 获取当前阶段
  const stage = getTreeStage(progress)
  const imagePath = getTreeImagePath(level, progress)
  const levelConfig = CONSCIOUSNESS_LEVEL_COLORS[`level_${level}`]

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden relative">
      {/* 背景星空 */}
      <div className="absolute inset-0 bg-stars opacity-30" />

      {/* 顶部信息栏 */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10"
      >
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: levelConfig.colors.primary }}
        >
          意识之树
        </h1>
        <p className="text-gray-400 text-lg">
          {levelConfig.name} · {levelConfig.chakra}
        </p>

        {/* 进度条 */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-white text-sm">成长进度</span>
          <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: levelConfig.colors.primary }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: levelConfig.colors.light }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>

        {/* 当前阶段标签 */}
        <div
          className="mt-4 inline-block px-4 py-2 rounded-full text-white text-sm"
          style={{ backgroundColor: `${levelConfig.colors.primary}50` }}
        >
          {stage === 'seed' && '🌰 种子期 - 蓄势待发'}
          {stage === 'sprout' && '🌱 发芽期 - 破土而出'}
          {stage === 'seedling' && '🌿 幼苗期 - 茁壮成长'}
          {stage === 'young' && '🌳 小树期 - 枝繁叶茂'}
          {stage === 'mature' && '🌲 大树期 - 硕果累累'}
        </div>
      </motion.div>

      {/* 意识树图片 - 核心部分 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={imagePath}  // 图片路径变化时触发动画
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -50 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Image
            src={imagePath}
            alt={`Level ${level} - ${stage}`}
            width={800}
            height={800}
            className="object-contain drop-shadow-2xl"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* 底部统计信息 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2
                      bg-black/60 backdrop-blur-md p-6 rounded-2xl text-white
                      border border-white/10 min-w-[400px]">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-gray-400 text-xs mb-1">当前等级</div>
            <div className="text-2xl font-bold" style={{ color: levelConfig.colors.primary }}>
              {level}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">成长阶段</div>
            <div className="text-lg font-medium capitalize">{stage}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">距离升级</div>
            <div className="text-xl font-bold" style={{ color: levelConfig.colors.light }}>
              {(100 - progress).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**这段代码做了什么**？

1. **从Supabase读取数据**: `consciousness_level` 和 `level_progress`
2. **根据进度选图片**: 调用 `getTreeImagePath(level, progress)`
3. **显示图片**: 使用Next.js的 `<Image>` 组件
4. **添加动画**: 使用Framer Motion让树生长有过渡效果
5. **显示进度**: 顶部进度条、底部统计卡片

### 2.2 创建测试页面

**创建文件**: `app/my-tree/page.tsx`

```typescript
import TreeDisplay from '@/components/consciousness-tree/TreeDisplay'

export default function MyTreePage() {
  return <TreeDisplay />
}
```

**访问方式**: 浏览器打开 `http://localhost:3000/my-tree`

---

## 第三步：连接Supabase数据库

### 3.1 确保数据库字段存在

**检查profiles表**（应该已经有这些字段）:
```sql
-- 打开Supabase Dashboard → SQL Editor → 执行以下查询
SELECT
  id,
  consciousness_level,
  level_progress,
  total_experience_points
FROM profiles
WHERE id = auth.uid();
```

**如果没有这些字段**，执行：
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS consciousness_level INTEGER DEFAULT 1
  CHECK (consciousness_level >= 1 AND consciousness_level <= 7),
ADD COLUMN IF NOT EXISTS level_progress NUMERIC DEFAULT 0
  CHECK (level_progress >= 0 AND level_progress <= 100),
ADD COLUMN IF NOT EXISTS total_experience_points INTEGER DEFAULT 0;
```

### 3.2 创建更新函数（让树能"自动生长"）

**创建文件**: `lib/services/tree-growth.service.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

export class TreeGrowthService {
  /**
   * 用户完成学习任务后，增加经验值和进度
   */
  async addGrowth(action: 'complete_course' | 'submit_meditation' | 'deep_dialogue' | 'complete_pbl') {
    const supabase = createClient()

    // 1. 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    // 2. 获取当前数据
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_level, level_progress, total_experience_points')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('未找到用户资料')

    // 3. 定义奖励规则
    const rewards = {
      'complete_course': { exp: 10, progress: 5 },      // 完成课程单元
      'submit_meditation': { exp: 15, progress: 3 },    // 提交冥想日志
      'deep_dialogue': { exp: 20, progress: 4 },        // 深度对话
      'complete_pbl': { exp: 100, progress: 15 }        // 完成PBL项目
    }

    const reward = rewards[action]

    let newProgress = (profile.level_progress || 0) + reward.progress
    let newExp = (profile.total_experience_points || 0) + reward.exp
    let newLevel = profile.consciousness_level || 1

    // 4. 检查是否升级（Level 1的升级门槛是500经验）
    if (newLevel === 1 && newExp >= 500) {
      newLevel = 2
      newProgress = 0  // 重置进度，重新从种子开始
      console.log('🎉 恭喜升级到Level 2！')
    }

    // 5. 限制进度在0-100之间
    if (newProgress > 100) newProgress = 100

    // 6. 更新数据库
    const { error } = await supabase
      .from('profiles')
      .update({
        consciousness_level: newLevel,
        level_progress: newProgress,
        total_experience_points: newExp
      })
      .eq('id', user.id)

    if (error) throw error

    return {
      oldProgress: profile.level_progress,
      newProgress,
      oldLevel: profile.consciousness_level,
      newLevel,
      leveledUp: newLevel > (profile.consciousness_level || 1)
    }
  }

  /**
   * 手动设置进度（测试用）
   */
  async setProgress(progress: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('profiles')
      .update({ level_progress: progress })
      .eq('id', user.id)

    if (error) throw error
  }
}

export const treeGrowthService = new TreeGrowthService()
```

### 3.3 在用户行为处调用生长函数

**示例：用户完成课程单元后**

找到课程相关的代码（比如 `components/courses/CourseContent.tsx`），在用户完成任务后添加：

```typescript
import { treeGrowthService } from '@/lib/services/tree-growth.service'

// 用户点击"完成"按钮时
async function handleComplete() {
  try {
    // 原有的完成逻辑...

    // 让意识树生长
    const result = await treeGrowthService.addGrowth('complete_course')

    if (result.leveledUp) {
      alert('🎉 恭喜！你的意识等级提升了！')
    } else {
      console.log(`树生长了 ${result.newProgress - result.oldProgress}%`)
    }
  } catch (error) {
    console.error('生长失败:', error)
  }
}
```

---

## 第四步：防止畸形发展机制

### 4.1 问题：偏科会导致树畸形吗？

**回答：会的！这是设计的一部分。**

**设计理念**：
- 意识的成长需要**五大领域平衡发展**：
  1. 自我认知 (self_awareness)
  2. 生命科学 (life_sciences)
  3. 宇宙法则 (universal_laws)
  4. 创意表达 (creative_expression)
  5. 社会连接 (social_connection)

- 如果用户只做项目不学习理论，**树会长偏**
- 如果用户只学理论不实践，**树根会弱**

### 4.2 畸形发展的具体表现

**当前数据库设计**（已存在的表）：

```sql
-- user_domain_exploration 表记录了5个领域的深度
CREATE TABLE user_domain_exploration (
  user_id UUID REFERENCES profiles(id),
  domain_scores JSONB,  -- 包含5个领域的depth_score
  ...
)
```

**depth_score的含义**：
- 每个领域有独立的深度分数（0-100）
- 5个领域分数差距太大 = 畸形发展

**举例**：
```json
{
  "self_awareness": { "depth_score": 80 },      // 自我认知很强
  "life_sciences": { "depth_score": 10 },       // 生命科学很弱
  "universal_laws": { "depth_score": 15 },
  "creative_expression": { "depth_score": 5 },  // 创意几乎没有
  "social_connection": { "depth_score": 12 }
}
```

这种情况下：
- **level_progress会受限**：即使完成很多任务，进度增长变慢
- **视觉上**（未来版本）：树会向一边倾斜，某些根系特别发达，其他很弱

### 4.3 实现平衡检查机制

**修改 TreeGrowthService**，添加平衡检查：

```typescript
/**
 * 检查领域发展是否平衡
 * 返回平衡系数：1.0 = 完全平衡，0.5 = 严重偏科
 */
async getBalanceFactor(): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 1.0

  // 获取5个领域的深度
  const { data } = await supabase
    .from('user_domain_exploration')
    .select('domain_scores')
    .eq('user_id', user.id)
    .single()

  if (!data || !data.domain_scores) return 1.0

  const scores = data.domain_scores as Record<string, { depth_score: number }>
  const depths = [
    scores.self_awareness?.depth_score || 0,
    scores.life_sciences?.depth_score || 0,
    scores.universal_laws?.depth_score || 0,
    scores.creative_expression?.depth_score || 0,
    scores.social_connection?.depth_score || 0
  ]

  // 计算标准差（衡量离散程度）
  const avg = depths.reduce((a, b) => a + b, 0) / depths.length
  const variance = depths.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / depths.length
  const stdDev = Math.sqrt(variance)

  // 标准差越大，平衡系数越低
  // 标准差 < 10: 很平衡，系数 1.0
  // 标准差 > 40: 严重偏科，系数 0.5
  const balanceFactor = Math.max(0.5, 1.0 - (stdDev / 100))

  return balanceFactor
}

/**
 * 添加成长时考虑平衡因素
 */
async addGrowth(action: string) {
  // ... 前面的代码不变 ...

  // 获取平衡系数
  const balanceFactor = await this.getBalanceFactor()

  // 应用平衡系数到进度增长
  const baseProgressGain = reward.progress
  const actualProgressGain = baseProgressGain * balanceFactor

  let newProgress = (profile.level_progress || 0) + actualProgressGain

  console.log(`平衡系数: ${balanceFactor.toFixed(2)}`)
  console.log(`原本应增长: ${baseProgressGain}%, 实际增长: ${actualProgressGain.toFixed(2)}%`)

  // ... 后续代码不变 ...
}
```

### 4.4 给用户的提示

**在树展示页面添加平衡提示**：

```typescript
// 在 TreeDisplay 组件中添加
const [balanceFactor, setBalanceFactor] = useState(1.0)
const [domainScores, setDomainScores] = useState<any>(null)

useEffect(() => {
  checkBalance()
}, [])

async function checkBalance() {
  const result = await treeGrowthService.getBalanceFactor()
  setBalanceFactor(result)

  // 同时获取各领域分数
  const { data } = await supabase
    .from('user_domain_exploration')
    .select('domain_scores')
    .eq('user_id', user.id)
    .single()

  setDomainScores(data?.domain_scores)
}

// 在页面上显示警告
{balanceFactor < 0.8 && (
  <div className="absolute top-24 right-8 bg-yellow-500/20 border border-yellow-500
                  rounded-lg p-4 max-w-xs">
    <p className="text-yellow-200 text-sm">
      ⚠️ 检测到发展不平衡！<br/>
      某些领域探索过少，树的成长速度已降低{((1 - balanceFactor) * 100).toFixed(0)}%
    </p>
    <p className="text-yellow-300 text-xs mt-2">
      建议：均衡探索五大领域以获得最佳成长
    </p>
  </div>
)}
```

### 4.5 视觉体现（进阶版）

**当前MVP**：暂时不做视觉畸形，只通过进度惩罚

**未来版本**：
- 可以让Lovart生成"畸形树"的变体
- 根据5个领域的比例，动态组合不同的根系图片
- 比如：自我认知强 → 左侧根系特别发达

---

## 第五步：测试验证

### 5.1 创建测试页面

**创建文件**: `app/tree-test/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { treeGrowthService } from '@/lib/services/tree-growth.service'
import TreeDisplay from '@/components/consciousness-tree/TreeDisplay'

export default function TreeTestPage() {
  const [message, setMessage] = useState('')

  async function testGrowth(action: any) {
    try {
      const result = await treeGrowthService.addGrowth(action)
      setMessage(`✅ 成功！进度: ${result.oldProgress}% → ${result.newProgress}%`)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      setMessage(`❌ 失败: ${error.message}`)
    }
  }

  async function setManualProgress(value: number) {
    try {
      await treeGrowthService.setProgress(value)
      setMessage(`✅ 手动设置进度为 ${value}%`)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      setMessage(`❌ 失败: ${error.message}`)
    }
  }

  return (
    <div className="relative">
      <TreeDisplay />

      {/* 测试控制面板 */}
      <div className="fixed top-4 left-4 bg-black/80 p-4 rounded-lg text-white z-50">
        <h3 className="font-bold mb-3">树生长测试</h3>

        <div className="space-y-2 mb-4">
          <button
            onClick={() => testGrowth('complete_course')}
            className="block w-full px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            完成课程 (+5%)
          </button>

          <button
            onClick={() => testGrowth('deep_dialogue')}
            className="block w-full px-3 py-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            深度对话 (+4%)
          </button>

          <button
            onClick={() => testGrowth('complete_pbl')}
            className="block w-full px-3 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            完成PBL (+15%)
          </button>
        </div>

        <div className="border-t border-gray-600 pt-3">
          <p className="text-xs text-gray-400 mb-2">快速跳转</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setManualProgress(10)}
              className="px-2 py-1 bg-gray-700 rounded text-xs"
            >
              种子 10%
            </button>
            <button
              onClick={() => setManualProgress(30)}
              className="px-2 py-1 bg-gray-700 rounded text-xs"
            >
              发芽 30%
            </button>
            <button
              onClick={() => setManualProgress(50)}
              className="px-2 py-1 bg-gray-700 rounded text-xs"
            >
              幼苗 50%
            </button>
            <button
              onClick={() => setManualProgress(70)}
              className="px-2 py-1 bg-gray-700 rounded text-xs"
            >
              小树 70%
            </button>
            <button
              onClick={() => setManualProgress(90)}
              className="px-2 py-1 bg-gray-700 rounded text-xs"
            >
              大树 90%
            </button>
            <button
              onClick={() => setManualProgress(0)}
              className="px-2 py-1 bg-red-700 rounded text-xs"
            >
              重置 0%
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 5.2 测试步骤

1. **启动开发服务器**: `npm run dev`

2. **访问测试页面**: `http://localhost:3000/tree-test`

3. **测试场景**：
   - 点击"种子 10%" → 应该看到seed.png
   - 点击"发芽 30%" → 应该看到sprout.png，并有过渡动画
   - 点击"幼苗 50%" → 应该看到seedling.png
   - 点击"小树 70%" → 应该看到young.png
   - 点击"大树 90%" → 应该看到mature.png

4. **测试真实生长**：
   - 点击"重置 0%" 回到种子
   - 连续点击"完成课程"按钮
   - 观察进度条和树的变化

5. **测试平衡机制**（需要先设置领域数据）

---

## ✅ 完成检查清单

- [ ] Lovart生成了5张树图片
- [ ] 图片放在了 `public/tree-images/level-1/` 目录
- [ ] 创建了 `TreeDisplay` 组件
- [ ] 创建了 `TreeGrowthService` 服务
- [ ] 数据库有 `consciousness_level` 和 `level_progress` 字段
- [ ] 测试页面能正常显示所有5个阶段
- [ ] 点击按钮能看到树生长动画
- [ ] 进度条正确显示
- [ ] 平衡机制代码已添加

---

## 🎯 总结：从图片到运行的完整链路

```
1. Lovart生成PNG → 下载5张图片
         ↓
2. 放入项目 → public/tree-images/level-1/
         ↓
3. 创建React组件 → TreeDisplay.tsx
         ↓
4. 组件读取Supabase → consciousness_level, level_progress
         ↓
5. 根据progress选图 → getTreeImagePath(level, progress)
         ↓
6. Image组件显示 → 自动优化、懒加载
         ↓
7. 用户学习行为 → treeGrowthService.addGrowth()
         ↓
8. 更新数据库 → level_progress +5%
         ↓
9. 组件自动刷新 → 显示新的树图片
         ↓
10. 动画过渡 → Framer Motion平滑切换
```

**核心技术栈**：
- **图片来源**: Lovart AI生成
- **图片存储**: Next.js public文件夹
- **数据库**: Supabase PostgreSQL
- **前端**: React + Next.js + TypeScript
- **动画**: Framer Motion
- **图片优化**: Next.js Image组件

**不需要**：
- ❌ 不需要Canvas手绘
- ❌ 不需要Three.js
- ❌ 不需要复杂的SVG
- ❌ 不需要Figma（MVP阶段）

只需要：
- ✅ 5张PNG图片
- ✅ 简单的React组件
- ✅ Supabase读写

---

## 📞 遇到问题怎么办？

**问题1**: Lovart生成的图不满意
→ 修改提示词，强调"watercolor, organic, no geometric shapes"

**问题2**: 图片不显示
→ 检查路径是否正确：`/tree-images/level-1/seed.png`
→ 检查public文件夹结构

**问题3**: 数据库连接失败
→ 检查 `.env.local` 的Supabase配置

**问题4**: 动画不流畅
→ 检查Framer Motion是否安装：`npm install framer-motion`

**问题5**: 进度不增长
→ 检查 `treeGrowthService` 是否正确调用
→ 打开浏览器控制台看错误信息

---

**现在你可以开始第一步：去Lovart生成5张树图！** 🎨
