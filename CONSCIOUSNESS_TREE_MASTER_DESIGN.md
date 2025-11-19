# 意识树统一设计方案（主文档）

**文档版本**: v4.0
**创建时间**: 2025-11-19
**状态**: 最新版 - Canvas 2D代码绘制方案
**核心理念**: 7脉轮颜色 + 8阶段成长 + Canvas 2D实时绘制

---

## 📚 文档说明

本文档整合了以下旧版设计文档的内容：
- ~~CONSCIOUSNESS_TREE_VISUALIZATION_DESIGN.md~~ （Three.js方案）
- ~~CONSCIOUSNESS_LEVEL_SYSTEM_DESIGN.md~~ （旧颜色方案）
- ~~CONSCIOUSNESS_GROWTH_SYSTEM_DESIGN.md~~ （升级机制）
- ~~REALISTIC_TREE_GROWTH_DESIGN.md~~ （5阶段设计）
- ~~TREE_VISUALIZATION_HELP_REQUEST.md~~ （Canvas求助）

**最新方案**：使用Canvas 2D原生API代码绘制，实现实时动态的意识树可视化

### 📁 参考图文件

**位置**: `D:\CursorWork\FutureMindInstitute\readme\意识树参考图\`

**形态参考图**（7张苹果树生长阶段，提供树形结构参考）：
- `1.种子初始生根.png` - 种子在土壤中，细小的根系向下延伸
- `2.发芽.jpg` - 种子裂开，主根向下，茎向上钻出地面
- `3.两片子叶.jpg` - 两片圆润的子叶展开，根系分叉
- `3.小苗.png` - 多片真叶长出，树干明显增高
- `4.小树.png` - 树干分支，叶子增多，根系发达
- `5.开花.png` - 树冠丰满，花朵点缀
- `6.结果.png` - 硕果累累，树形成熟
- `7.参天大树.png` - 完全成熟的树，树冠宽广，根系庞大如树冠镜像

**风格参考图**（2张宇宙能量树，提供视觉风格参考）：
- `风格参考图1.png` - 蓝色发光的宇宙树，强烈的光效和粒子
- `风格参考图2.png` - 蓝色能量树，展示树的神秘感和灵性特质

**重要说明**：
- 形态参考图提供**树的结构、比例、分支方式**（参考图是绿色苹果树，代码实现时需改为对应脉轮颜色）
- 风格参考图提供**发光效果、粒子、宇宙感**的视觉风格
- 代码绘制需结合两者：真实的树形态 + 宇宙能量风格

---

## 🎨 一、7脉轮颜色系统（新方案）

### 颜色对应关系

```
红色(海底轮) → 橙色(脐轮) → 黄色(太阳神经丛) → 绿色(心轮) →
青色(喉轮) → 蓝色(眉心轮) → 紫色(顶轮)

对应可见光光谱：🔴🟠🟡🟢🔵🟣
```

### 完整颜色配置

```typescript
export const CONSCIOUSNESS_LEVEL_COLORS = {
  level_1: {
    name: '沉睡者 (The Sleeper)',
    chakra: '海底轮 (Root Chakra)',
    element: '土',
    theme: 'red',
    colors: {
      darkest: '#450A0A',    // 黑红色 (0-20% progress)
      dark: '#991B1B',       // 暗红色 (21-40%)
      primary: '#DC2626',    // 正红色 (41-70%)
      light: '#F87171',      // 亮红色 (71-90%)
      lightest: '#FCA5A5',   // 浅红色 (91-100%)
      accent: '#FFA500'      // 金色点缀（所有等级通用）
    }
  },
  level_2: {
    name: '觉醒者 (The Awakened)',
    chakra: '脐轮 (Sacral Chakra)',
    element: '水',
    theme: 'orange',
    colors: {
      darkest: '#7C2D12',
      dark: '#C2410C',
      primary: '#EA580C',
      light: '#FB923C',
      lightest: '#FDBA74',
      accent: '#FFA500'
    }
  },
  level_3: {
    name: '探索者 (The Explorer)',
    chakra: '太阳神经丛 (Solar Plexus Chakra)',
    element: '火',
    theme: 'yellow',
    colors: {
      darkest: '#713F12',
      dark: '#CA8A04',
      primary: '#EAB308',
      light: '#FACC15',
      lightest: '#FDE047',
      accent: '#FFA500'
    }
  },
  level_4: {
    name: '实践者 (The Practitioner)',
    chakra: '心轮 (Heart Chakra)',
    element: '气',
    theme: 'green',
    colors: {
      darkest: '#14532D',
      dark: '#15803D',
      primary: '#16A34A',
      light: '#4ADE80',
      lightest: '#86EFAC',
      accent: '#FFA500'
    }
  },
  level_5: {
    name: '洞察者 (The Insightful)',
    chakra: '喉轮 (Throat Chakra)',
    element: '以太',
    theme: 'cyan',
    colors: {
      darkest: '#164E63',
      dark: '#0891B2',
      primary: '#06B6D4',
      light: '#22D3EE',
      lightest: '#67E8F9',
      accent: '#FFA500'
    }
  },
  level_6: {
    name: '先锋者 (The Pioneer)',
    chakra: '眉心轮 (Third Eye Chakra)',
    element: '光',
    theme: 'blue',
    colors: {
      darkest: '#1E3A8A',
      dark: '#1D4ED8',
      primary: '#2563EB',
      light: '#60A5FA',
      lightest: '#93C5FD',
      accent: '#FFA500'
    }
  },
  level_7: {
    name: '引领者 (The Leader)',
    chakra: '顶轮 (Crown Chakra)',
    element: '意识',
    theme: 'purple',
    colors: {
      darkest: '#581C87',
      dark: '#7E22CE',
      primary: '#9333EA',
      light: '#C084FC',
      lightest: '#E9D5FF',
      accent: '#FFA500'
    }
  }
}

// 根据进度选择颜色
export function getColorByProgress(level: number, progress: number): string {
  const levelColors = CONSCIOUSNESS_LEVEL_COLORS[`level_${level}`].colors

  if (progress < 20) return levelColors.darkest
  if (progress < 40) return levelColors.dark
  if (progress < 70) return levelColors.primary
  if (progress < 90) return levelColors.light
  return levelColors.lightest  // 91-100%, 即将升级，最亮
}
```

---

## 🌱 二、8阶段成长系统

每个意识等级（Level 1-7）内部都经历8个清晰可见的阶段：

### 阶段定义

| 阶段 | 进度范围 | 英文名 | 视觉特征 | 用户行为 |
|------|---------|--------|---------|---------|
| 种子生根 | 0-12% | Seed Rooting | 地下根系生长，地上无树 | 刚注册，初步探索 |
| 发芽 | 12-25% | Germination | 种子裂开，细芽破土 | 开始学习，建立习惯 |
| 子叶萌发 | 25-37% | Cotyledon | 两片圆润子叶展开 | 初步学习，形成认知 |
| 长出真叶 | 37-50% | True Leaves | 子叶退化，真叶生长，小树冠形成 | 深入探索，产生洞见 |
| 小苗成长 | 50-62% | Sapling Growth | 树干增高，主枝分叉，叶子增多 | 稳定成长，积累经验 |
| 小树形成 | 62-75% | Young Tree | 树形轮廓清晰，树冠扩展 | 持续成长，开始创造 |
| 开花结果 | 75-87% | Flowering & Fruiting | 树冠开花，花朵转化为果实 | 创造成果，分享贡献 |
| 枝叶繁茂 | 87-100% | Flourishing | 硕果累累，能量充盈，呼吸动画 | 接近升级，成果显著 |

### 升级机制

```
Level 1 (红色)
├─ Seed 0-20%
├─ Sprout 20-40%
├─ Seedling 40-60%
├─ Young 60-80%
└─ Mature 80-100% → 升级！
    ↓
Level 2 (橙色)  ← 重新从Seed开始，但颜色变了！
├─ Seed 0-20%
├─ Sprout 20-40%
...
```

**关键点**：
- 每次升级后，`level_progress`重置为0
- 树重新从种子开始生长
- 但颜色升级到下一个脉轮颜色
- 给用户"重生"的感觉，象征意识的螺旋式上升

---

## 🎨 三、技术方案：Canvas 2D代码绘制

### 为什么使用Canvas 2D代码绘制？

**方案优势**：
- ✅ 完全数据驱动，用户行为实时反映在树形态上
- ✅ 无需预生成大量图片，节省存储空间
- ✅ 可以实现平滑的生长动画和呼吸效果
- ✅ 支持个性化参数（根系强度、枝叶丰富度、果实数量等）
- ✅ 性能优秀，Canvas 2D渲染效率高
- ✅ 代码可维护，易于调整和优化

**核心设计原则**：
1. **消除闪烁**：所有几何数据（根、枝、叶、果）一次性生成并缓存
2. **自然树形**：主根+侧根结构，主枝系统，叶子沿枝分布
3. **稳定渲染**：每帧只根据progress控制显示长度，不重新随机
4. **8阶段清晰**：每个阶段形态差异明显，用户肉眼可见

### 实现架构

```
用户数据（Supabase）
    ↓
读取 consciousness_level (1-7)
读取 level_progress (0-100)
读取 用户特质参数 (rootStrength, branchRichness等)
    ↓
传入Canvas引擎 getTreeParams(progress)
    ↓
计算当前阶段的树参数（根长度、树干高度、叶子数量等）
    ↓
首次渲染时生成几何数据缓存（根系、主枝、叶子、果实锚点）
    ↓
每帧根据参数绘制树（Canvas 2D API）
    ↓
平滑动画过渡（requestAnimationFrame）
```

### 目录结构

```
/public/tree-demo/
  ├── index.html           # 测试页面（单独运行）
  └── tree-engine.js       # Canvas绘制引擎（可集成到React）

/components/consciousness-tree/
  ├── CanvasTreeRenderer.tsx    # React封装组件
  └── tree-drawing-engine.ts    # 核心绘制逻辑（从tree-engine.js移植）

/lib/
  └── consciousness-config.ts   # 颜色配置和工具函数
```

### 核心数据结构

```javascript
// 树状态（可从Supabase传入）
const treeState = {
  growthProgress: 0,              // 0-100，主进度

  // 用户特质参数（从Supabase读取）
  rootStrength: 0.7,              // 影响根数量和深度
  trunkStrength: 0.7,             // 影响树干高度和粗细
  branchRichness: 0.8,            // 影响叶子数量和树冠大小
  fruitRichness: 0.5,             // 影响果实数量
  balanceLeftRight: 0.5,          // 影响树干弯曲方向

  // 缓存的几何数据（只生成一次，避免闪烁）
  _rootSegments: null,            // 根系控制点
  _branchSegments: null,          // 主枝控制点
  _leafAnchors: null,             // 叶子固定位置
  _fruitAnchors: null,            // 果实固定位置
  _backgroundStars: null          // 背景星星
}
```

---

## 📊 四、数据库设计

### profiles 表新增字段

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_experience_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_progress NUMERIC DEFAULT 0
  CHECK (level_progress >= 0 AND level_progress <= 100);

-- consciousness_level 字段已存在，表示当前等级(1-7)
-- consciousness_tree_view 字段保留，存储详细的树数据（根系、树干、果实等）
```

### 计算逻辑

```typescript
// 根据total_exp计算consciousness_level
function calculateLevel(totalExp: number): number {
  if (totalExp < 500) return 1      // 红色
  if (totalExp < 1500) return 2     // 橙色
  if (totalExp < 3500) return 3     // 黄色
  if (totalExp < 7000) return 4     // 绿色
  if (totalExp < 12000) return 5    // 青色
  if (totalExp < 20000) return 6    // 蓝色
  return 7                          // 紫色
}

// 根据level_progress选择树的阶段
function getTreeStage(progress: number): string {
  if (progress < 20) return 'seed'
  if (progress < 40) return 'sprout'
  if (progress < 60) return 'seedling'
  if (progress < 80) return 'young'
  return 'mature'
}

// 完整的树图路径
function getTreeImagePath(level: number, progress: number): string {
  const stage = getTreeStage(progress)
  return `/tree-images/level-${level}/${stage}.png`
}
```

---

## 🔄 五、更新触发机制

### 何时更新意识树？

| 用户行为 | 获得EXP | 更新 level_progress | 更新 consciousness_tree_view |
|---------|---------|-------------------|----------------------------|
| 完成课程单元 | +10 | +5% | 根系延伸 |
| 提交冥想日志 | +15 | +3% | 树干增粗 |
| 与Gaia深度对话 | +20 | +4% | 添加叶子（洞见） |
| 完成PBL项目 | +100 | +15% | 添加果实 |
| 获得社区共鸣 | +5 | +2% | 果实成熟度+10% |

### Edge Function示例

```typescript
// supabase/functions/update-consciousness-tree/index.ts
import { createClient } from '@supabase/supabase-js'

export async function updateTree(userId: string, action: string, metadata: any) {
  const supabase = createClient(/* ... */)

  // 1. 获取当前数据
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_experience_points, level_progress, consciousness_level')
    .eq('id', userId)
    .single()

  let { total_experience_points, level_progress, consciousness_level } = profile

  // 2. 根据行为增加EXP和进度
  const rewards = {
    'complete_course': { exp: 10, progress: 5 },
    'submit_meditation': { exp: 15, progress: 3 },
    'deep_dialogue': { exp: 20, progress: 4 },
    'complete_pbl': { exp: 100, progress: 15 }
  }

  const reward = rewards[action]
  total_experience_points += reward.exp
  level_progress += reward.progress

  // 3. 检查是否升级
  const newLevel = calculateLevel(total_experience_points)
  if (newLevel > consciousness_level) {
    consciousness_level = newLevel
    level_progress = 0  // 重置进度，重新从种子开始
  }

  // 4. 限制progress在0-100
  if (level_progress > 100) level_progress = 100

  // 5. 更新数据库
  await supabase
    .from('profiles')
    .update({
      total_experience_points,
      level_progress,
      consciousness_level
    })
    .eq('id', userId)

  return { newLevel: consciousness_level, newProgress: level_progress }
}
```

---

## 🎬 六、前端实现

### React组件封装（Canvas版本）

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CONSCIOUSNESS_LEVEL_COLORS } from '@/lib/consciousness-config'
import { TreeCanvasEngine } from '@/lib/consciousness-tree/tree-canvas-engine'

interface ConsciousnessTreeDisplayProps {
  level: number          // 1-7
  progress: number       // 0-100
  userName: string
  // 用户特质参数（从Supabase读取）
  rootStrength?: number
  trunkStrength?: number
  branchRichness?: number
  fruitRichness?: number
}

export default function ConsciousnessTreeDisplay({
  level,
  progress,
  userName,
  rootStrength = 0.7,
  trunkStrength = 0.7,
  branchRichness = 0.8,
  fruitRichness = 0.5
}: ConsciousnessTreeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<TreeCanvasEngine | null>(null)

  const levelConfig = CONSCIOUSNESS_LEVEL_COLORS[`level_${level}`]
  const currentColor = levelConfig.colors.primary

  // 初始化Canvas引擎
  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new TreeCanvasEngine(canvasRef.current, {
      level,
      colors: levelConfig.colors
    })

    engine.setTreeState({
      growthProgress: progress,
      rootStrength,
      trunkStrength,
      branchRichness,
      fruitRichness
    })

    engine.start()
    engineRef.current = engine

    return () => {
      engine.stop()
    }
  }, [level])

  // 更新进度时平滑过渡
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.animateToProgress(progress, 1000)
    }
  }, [progress])

  // 更新用户特质参数
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateTreeState({
        rootStrength,
        trunkStrength,
        branchRichness,
        fruitRichness
      })
    }
  }, [rootStrength, trunkStrength, branchRichness, fruitRichness])

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 主标题 */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-10"
      >
        <h1 className="text-4xl font-bold" style={{ color: currentColor }}>
          {userName}的意识之树
        </h1>
        <p className="text-gray-400 mt-2">
          {levelConfig.name} · {levelConfig.chakra}
        </p>
        <div className="mt-4 flex items-center gap-4 justify-center">
          <span className="text-white">等级进度</span>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: currentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span style={{ color: currentColor }}>{progress.toFixed(0)}%</span>
        </div>
      </motion.div>

      {/* Canvas画布 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="rounded-lg shadow-2xl"
          style={{
            boxShadow: `0 0 50px ${currentColor}40`
          }}
        />
      </div>

      {/* 等级图例 */}
      <div className="absolute bottom-8 left-8 bg-black/50 backdrop-blur-md p-6 rounded-lg text-white">
        <h3 className="font-bold mb-4">7脉轮色彩对应</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(CONSCIOUSNESS_LEVEL_COLORS).map(([key, config]) => {
            const levelNum = parseInt(key.split('_')[1])
            const isCurrentLevel = levelNum === level
            return (
              <div
                key={key}
                className={`flex items-center gap-3 ${isCurrentLevel ? 'font-bold' : 'opacity-60'}`}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <span>{config.chakra} - {config.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**关键点说明**：
1. 使用 `useRef` 保持Canvas引擎实例
2. 进度变化时调用 `animateToProgress` 实现平滑过渡
3. 用户特质参数变化时实时更新树形态
4. 组件卸载时停止渲染循环

---

## 📋 七、实施计划（Canvas方案）

### 第一步：测试和验证Canvas引擎

1. 访问 `http://localhost:3000/tree-demo/index.html`
2. 测试8个阶段的形态变化是否清晰
3. 测试3种学员类型预设的形态差异
4. 验证无闪烁、平滑动画

**当前状态**：✅ 已完成，测试页面可用

### 第二步：更新数据库

```sql
-- 添加新字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_experience_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_progress NUMERIC DEFAULT 0
  CHECK (level_progress >= 0 AND level_progress <= 100),
ADD COLUMN IF NOT EXISTS root_strength NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS trunk_strength NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS branch_richness NUMERIC DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS fruit_richness NUMERIC DEFAULT 0.5;

-- consciousness_level 字段已存在(1-7)
```

### 第三步：将Canvas引擎移植到React

1. 创建 `lib/consciousness-tree/tree-canvas-engine.ts`
   - 从 `public/tree-demo/tree-engine.js` 移植核心代码
   - 改为TypeScript类封装
   - 添加 `start()`, `stop()`, `animateToProgress()` 方法

2. 创建 `components/consciousness-tree/CanvasTreeRenderer.tsx`
   - React封装组件
   - 使用useRef管理Canvas引擎实例
   - 监听props变化并更新树状态

3. 创建 `lib/consciousness-config.ts`
   - 导出 `CONSCIOUSNESS_LEVEL_COLORS` 配置
   - 工具函数：`getColorByProgress`, `calculateLevel` 等

### 第四步：集成到Portal页面

```typescript
// app/portal/page.tsx
import { CanvasTreeRenderer } from '@/components/consciousness-tree'

// 读取用户数据
const { data: profile } = await supabase
  .from('profiles')
  .select('consciousness_level, level_progress, root_strength, ...')
  .eq('id', userId)
  .single()

// 渲染树
<CanvasTreeRenderer
  level={profile.consciousness_level}
  progress={profile.level_progress}
  rootStrength={profile.root_strength}
  trunkStrength={profile.trunk_strength}
  branchRichness={profile.branch_richness}
  fruitRichness={profile.fruit_richness}
/>
```

### 第五步：实现更新逻辑

- Edge Function: `update-consciousness-tree`
- 在各个行为触发点调用更新（完成课程、提交冥想、PBL项目等）

---

## 🎯 八、成功标准

✅ **视觉效果**
- 树的绘制自然、有机，具有真实树的形态
- 主根+侧根结构明显，根系不闪烁
- 5条主枝清晰可见，叶子沿枝条分布
- 8个阶段形态差异明显，用户肉眼可见
- 7种颜色清晰区分7个等级（Level 1-7）

✅ **用户体验**
- 用户行为实时反映在树形态上（根、枝、叶、果的变化）
- 个性化参数影响树的独特形态
- 升级时树从种子重新生长，有重生感
- 进度变化有平滑过渡动画
- 呼吸效果让树有生命感

✅ **技术实现**
- Canvas渲染流畅，60fps无卡顿
- 几何数据缓存，完全消除闪烁
- 数据驱动，易于从Supabase集成
- React组件封装良好，易于复用
- 代码结构清晰，便于维护和扩展

✅ **性能指标**
- 初次加载渲染时间 < 100ms
- 进度变化动画流畅 (60fps)
- 内存占用稳定（无泄漏）
- 支持多个树同时渲染（如社区页面）

---

**本文档是意识树系统的唯一权威设计文档 v4.0 - Canvas 2D实现方案**

**测试页面**：`http://localhost:3000/tree-demo/index.html`
**核心代码**：`/public/tree-demo/tree-engine.js`
