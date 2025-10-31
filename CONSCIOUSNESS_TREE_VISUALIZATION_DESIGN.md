# 意识树可视化设计方案

**创建时间**: 2025-10-29
**版本**: v1.0
**设计目标**: 将意识进化树从抽象概念转化为美丽、可交互的视觉体验

---

## 📋 目录

1. [核心理念回顾](#核心理念回顾)
2. [技术选型](#技术选型)
3. [四大模块设计](#四大模块设计)
4. [数据结构设计](#数据结构设计)
5. [前端实现方案](#前端实现方案)
6. [后台管理设计](#后台管理设计)
7. [更新机制](#更新机制)

---

## 核心理念回顾

### 来自设计文档的核心思想

**"意识进化树"是学员内在世界的外化，是成长路径的活地图**

四个生长部分：
1. **根系（Roots）** - 探索的广度与深度
2. **树干（Trunk）** - 内省的稳定性
3. **枝叶（Branches & Leaves）** - 洞见的火花
4. **果实（Fruits）** - 创造的贡献

### 设计目标

- ✅ **美观震撼**：像艺术品一样的视觉效果
- ✅ **实时反馈**：学习行为立即反映在树上
- ✅ **可交互**：点击、旋转、缩放，探索细节
- ✅ **性能优化**：即使在移动端也流畅运行

---

## 技术选型

### 方案对比

| 技术 | 优点 | 缺点 | 是否采用 |
|-----|------|------|----------|
| **Three.js** | 强大的3D能力，真实感强 | 学习曲线陡峭，性能开销大 | ✅ 推荐（桌面端） |
| **D3.js** | 数据驱动，灵活性高 | 3D效果有限 | ⚠️ 备选（简化版） |
| **SVG + CSS** | 轻量，兼容性好 | 缺乏3D效果 | ⚠️ 移动端降级方案 |
| **Canvas 2D** | 性能好，控制精细 | 需要手动实现所有效果 | ❌ 不推荐 |

### 最终选择：**混合方案**

```
桌面端（屏幕 > 768px）：Three.js 3D渲染
移动端（屏幕 ≤ 768px）：D3.js 2D渲染（性能优化）
```

---

## 四大模块设计

### 1. 根系（Roots）- 探索的广度与深度

#### 视觉设计

```
        [树干]
          |
    ╱─────┼─────╲
   ╱      |      ╲
  ●       ●       ●  ← 主根（5个领域）
  │       │       │
  ●       ●       ●  ← 根须（深度）
 ╱│╲     ╱│╲     ╱│╲
```

**颜色映射**（五大领域）:
```typescript
const domainColors = {
  self_awareness: '#8B5CF6',      // 自我觉察 - 紫色
  life_sciences: '#10B981',       // 生命科学 - 绿色
  universal_laws: '#3B82F6',      // 通用法则 - 蓝色
  creative_expression: '#F59E0B', // 创意表达 - 橙色
  social_connection: '#EC4899'    // 社会连接 - 粉色
}
```

#### Three.js实现

```typescript
function renderRoots(rootsData: RootsData) {
  const geometry = new THREE.CylinderGeometry(0.05, 0.02, 1, 8)

  rootsData.main_roots.forEach((root, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: domainColors[root.domain],
      emissive: domainColors[root.domain],
      emissiveIntensity: 0.3
    })

    const mesh = new THREE.Mesh(geometry, material)

    // 主根位置（以树干为中心，向外辐射）
    const angle = (index / 5) * Math.PI * 2
    const distance = 0.5
    mesh.position.set(
      Math.cos(angle) * distance,
      -root.length * 0.1,  // 根据长度向下延伸
      Math.sin(angle) * distance
    )

    // 旋转使其朝下
    mesh.rotation.x = Math.PI / 6

    scene.add(mesh)

    // 添加根须（递归生成）
    addRootBranches(mesh, root.density, 3) // 3层根须
  })
}

function addRootBranches(parent: THREE.Mesh, density: number, depth: number) {
  if (depth === 0) return

  for (let i = 0; i < density / 5; i++) {
    const branchGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.5, 6)
    const branch = new THREE.Mesh(branchGeometry, parent.material)

    // 随机位置和角度
    branch.position.y = -0.5
    branch.position.x = (Math.random() - 0.5) * 0.2
    branch.position.z = (Math.random() - 0.5) * 0.2
    branch.rotation.x = Math.random() * 0.3

    parent.add(branch)

    // 递归生成下一层
    addRootBranches(branch, density, depth - 1)
  }
}
```

#### 交互效果

- **鼠标悬停**: 高亮该领域的根系，显示Tooltip
  ```
  ┌────────────────────┐
  │ 自我觉察领域        │
  │ 探索深度：25 points │
  │ 最近活动：2天前     │
  └────────────────────┘
  ```

- **点击**: 展开该领域的详细信息
  ```
  自我觉察领域探索记录：
  • 完成自在聆听Day 1-7
  • 完成地球课程Stage 1
  • 深度对话：12次
  ```

---

### 2. 树干（Trunk）- 内省的稳定性

#### 视觉设计

```
         ╱═══╲
        │ ○ ○ │  ← 年轮纹理
        │ ○ ○ │
        │     │  ← 树干
        ╲═══╱
```

**颜色动态变化**（根据情绪状态）:
```typescript
// 从 meditation_guide 提交中提取情绪标签
const emotionColors = {
  peaceful: '#4ADE80',    // 平静 - 绿色
  joyful: '#FBBF24',      // 喜悦 - 黄色
  anxious: '#F87171',     // 焦虑 - 红色
  sad: '#60A5FA',         // 悲伤 - 蓝色
  neutral: '#9CA3AF'      // 中性 - 灰色
}

// 树干纹理根据最近7天的情绪记录生成
function getTrunkTexture(recentEmotions: string[]) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  recentEmotions.forEach((emotion, index) => {
    ctx.fillStyle = emotionColors[emotion]
    ctx.fillRect(0, index * 10, 256, 10) // 横向条纹
  })

  return new THREE.CanvasTexture(canvas)
}
```

#### Three.js实现

```typescript
function renderTrunk(trunkData: TrunkData) {
  const geometry = new THREE.CylinderGeometry(
    trunkData.thickness * 0.01,  // 顶部半径
    trunkData.thickness * 0.012, // 底部半径（略粗）
    2,                            // 高度
    32                            // 分段数（越多越圆滑）
  )

  const material = new THREE.MeshStandardMaterial({
    map: getTrunkTexture(trunkData.emotion_history),
    roughness: 0.8,
    metalness: 0.2
  })

  const trunk = new THREE.Mesh(geometry, material)
  trunk.position.y = 0
  scene.add(trunk)

  // 添加呼吸动画（冥想时的脉动效果）
  gsap.to(trunk.scale, {
    y: 1.05,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })
}
```

#### 交互效果

- **点击树干**: 显示冥想历史时间线
  ```
  📅 冥想历史：
  10/20: 15分钟 - 平静 ●
  10/21: 20分钟 - 喜悦 ●
  10/22: 10分钟 - 焦虑 ●
  10/23: 25分钟 - 平静 ●
  ...

  总时长：156小时
  平均时长：22分钟/次
  ```

---

### 3. 枝叶（Branches & Leaves）- 洞见的火花

#### 视觉设计

```
         🍃        🍃
       ╱   ╲    ╱   ╲
      │    🍃  🍃    │  ← 叶子（洞见）
      │     ╲╱      │
       ╲── 枝干 ──╱
```

**叶子类型**（根据洞见类型）:
```typescript
const leafShapes = {
  analytical: '🔬',      // 分析性洞见
  intuitive: '💡',       // 直觉性洞见
  integrative: '🔗',     // 整合性洞见
  creative: '🎨',        // 创造性洞见
  philosophical: '🧘'    // 哲学性洞见
}
```

#### Three.js实现

```typescript
function renderBranchesAndLeaves(branchesData: BranchesData) {
  branchesData.branches.forEach((branch, index) => {
    // 1. 生成枝干
    const branchGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.8, 8)
    const branchMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' })
    const branchMesh = new THREE.Mesh(branchGeometry, branchMaterial)

    // 枝干从树干顶部向外辐射
    const angle = (index / branchesData.branches.length) * Math.PI * 2
    branchMesh.position.set(
      Math.cos(angle) * 0.3,
      1 + Math.random() * 0.5, // 树干顶部往上
      Math.sin(angle) * 0.3
    )
    branchMesh.rotation.z = Math.PI / 6 // 向外倾斜

    scene.add(branchMesh)

    // 2. 在枝干末端添加叶子（洞见）
    branch.leaves.forEach((leaf, leafIndex) => {
      const leafSprite = createLeafSprite(leaf.insight_type)
      leafSprite.position.copy(branchMesh.position)
      leafSprite.position.y += 0.4 + leafIndex * 0.1
      leafSprite.position.x += Math.random() * 0.1 - 0.05

      // 添加闪烁动画
      gsap.to(leafSprite.material, {
        opacity: 0.7,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })

      scene.add(leafSprite)

      // 点击事件：显示洞见详情
      leafSprite.userData = {
        insightText: leaf.insight_text,
        createdAt: leaf.created_at
      }
    })
  })
}

function createLeafSprite(insightType: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = '48px Arial'
  ctx.fillText(leafShapes[insightType], 0, 48)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  })
  return new THREE.Sprite(material)
}
```

#### 交互效果

- **点击叶子**: 弹出洞见卡片
  ```
  ┌──────────────────────────────┐
  │ 💡 洞见：关于声音本质的思考   │
  ├──────────────────────────────┤
  │ "我今天突然意识到，声音本质上│
  │  是一种振动的传递，这让我重新 │
  │  理解了..."                   │
  │                               │
  │ 时间：2025-10-15 14:23       │
  │ 来源：地球课程 Stage 1        │
  │                               │
  │ [查看完整对话]  [关闭]        │
  └──────────────────────────────┘
  ```

---

### 4. 果实（Fruits）- 创造的贡献

#### 视觉设计

```
      🍎
       │
      ╱═╲
     │   │ ← 果实
      ╲═╱
```

**果实类型与颜色**:
```typescript
const fruitTypes = {
  creative_fruit: {
    color: '#F59E0B',      // 金色
    icon: '🍎',
    label: '创造之果'
  },
  world_seed: {
    color: '#8B5CF6',      // 紫色（最稀有）
    icon: '💎',
    label: '世界种子'
  }
}
```

#### Three.js实现

```typescript
function renderFruits(fruitsData: FruitData[]) {
  fruitsData.forEach((fruit, index) => {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: fruitTypes[fruit.type].color,
      emissive: fruitTypes[fruit.type].color,
      emissiveIntensity: fruit.maturity / 100, // 成熟度影响发光强度
      roughness: 0.3,
      metalness: 0.7
    })

    const fruitMesh = new THREE.Mesh(geometry, material)

    // 果实悬挂在树冠顶部
    fruitMesh.position.set(
      (Math.random() - 0.5) * 0.5,
      2 + Math.random() * 0.3,
      (Math.random() - 0.5) * 0.5
    )

    scene.add(fruitMesh)

    // 成熟度动画（从小长大）
    if (fruit.maturity < 100) {
      gsap.to(fruitMesh.scale, {
        x: fruit.maturity / 100,
        y: fruit.maturity / 100,
        z: fruit.maturity / 100,
        duration: 2
      })
    }

    // 点击事件
    fruitMesh.userData = {
      title: fruit.title,
      description: fruit.description,
      maturity: fruit.maturity
    }
  })
}
```

#### 交互效果

- **点击果实**: 显示创作详情
  ```
  ┌──────────────────────────────┐
  │ 🍎 创造之果                   │
  │ 家庭声音博物馆设计            │
  ├──────────────────────────────┤
  │ 成熟度：75% ████████░░       │
  │                               │
  │ 项目简介：                    │
  │ "通过采集和整理家庭中的各种声音│
  │  ，创建一个个人声音博物馆..."  │
  │                               │
  │ 社区反响：                    │
  │ 👍 12个共鸣  💬 5条评论       │
  │                               │
  │ [查看完整项目]  [分享]        │
  └──────────────────────────────┘
  ```

---

## 数据结构设计

### profiles 表的 consciousness_tree_view 字段

```typescript
interface ConsciousnessTreeView {
  roots: {
    main_roots: Array<{
      domain: 'self_awareness' | 'life_sciences' | 'universal_laws' | 'creative_expression' | 'social_connection'
      length: number        // 0-100，探索深度
      density: number       // 0-50，根须密度
      last_updated: string  // ISO日期
    }>
  }
  trunk: {
    thickness: number       // 0-100，树干粗壮度
    rings: number           // 年轮数量（冥想天数）
    emotion_history: string[] // 最近14天的情绪标签
    total_meditation_minutes: number
  }
  branches_and_leaves: {
    total_leaves: number    // 总洞见数
    branches: Array<{
      id: string
      leaves: Array<{
        insight_type: 'analytical' | 'intuitive' | 'integrative' | 'creative' | 'philosophical'
        insight_text: string // 洞见内容
        created_at: string
        related_content_id: string // 关联的课程内容
      }>
    }>
  }
  fruits: Array<{
    id: string
    type: 'creative_fruit' | 'world_seed'
    title: string
    description: string
    maturity: number        // 0-100，成熟度
    community_resonance: number // 社区共鸣数
    created_at: string
  }>
  last_updated: string
}
```

### 默认初始化数据

```typescript
const DEFAULT_TREE_VIEW: ConsciousnessTreeView = {
  roots: {
    main_roots: [
      { domain: 'self_awareness', length: 0, density: 0, last_updated: new Date().toISOString() },
      { domain: 'life_sciences', length: 0, density: 0, last_updated: new Date().toISOString() },
      { domain: 'universal_laws', length: 0, density: 0, last_updated: new Date().toISOString() },
      { domain: 'creative_expression', length: 0, density: 0, last_updated: new Date().toISOString() },
      { domain: 'social_connection', length: 0, density: 0, last_updated: new Date().toISOString() }
    ]
  },
  trunk: {
    thickness: 1,
    rings: 0,
    emotion_history: [],
    total_meditation_minutes: 0
  },
  branches_and_leaves: {
    total_leaves: 0,
    branches: []
  },
  fruits: [],
  last_updated: new Date().toISOString()
}
```

---

## 前端实现方案

### React组件架构

```
<ConsciousnessTreeViewer>
  ├── <TreeCanvas> (Three.js场景)
  │   ├── <Roots />
  │   ├── <Trunk />
  │   ├── <Branches />
  │   └── <Fruits />
  ├── <TreeControls> (旋转、缩放、视角切换)
  ├── <TreeLegend> (图例说明)
  └── <InsightModal> (洞见详情弹窗)
```

### 核心组件代码

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

interface TreeProps {
  treeData: ConsciousnessTreeView
  userId: string
}

export default function ConsciousnessTreeViewer({ treeData, userId }: TreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedElement, setSelectedElement] = useState<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // 1. 场景设置
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0A0A0A')

    // 2. 相机设置
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(3, 2, 3)

    // 3. 渲染器设置
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true

    // 4. 光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(0, 5, 0)
    scene.add(pointLight)

    // 5. 控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 6. 后处理（辉光效果）
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,  // 强度
      0.4,  // 半径
      0.85  // 阈值
    )
    composer.addPass(bloomPass)

    // 7. 渲染意识树
    renderRoots(scene, treeData.roots)
    renderTrunk(scene, treeData.trunk)
    renderBranchesAndLeaves(scene, treeData.branches_and_leaves)
    renderFruits(scene, treeData.fruits)

    // 8. 添加星空背景
    addStarryBackground(scene)

    // 9. 动画循环
    function animate() {
      requestAnimationFrame(animate)
      controls.update()
      composer.render()
    }
    animate()

    // 10. 清理
    return () => {
      renderer.dispose()
      controls.dispose()
    }
  }, [treeData])

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* 控制面板 */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-4 rounded-lg">
        <h3 className="text-white font-bold mb-2">视角控制</h3>
        <button className="btn">正面</button>
        <button className="btn">侧面</button>
        <button className="btn">俯视</button>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md p-4 rounded-lg text-white">
        <h3 className="font-bold mb-2">图例</h3>
        <div className="space-y-2">
          <div>🌱 根系 - 探索广度与深度</div>
          <div>🌲 树干 - 内省稳定性</div>
          <div>🍃 枝叶 - 洞见火花</div>
          <div>🍎 果实 - 创造贡献</div>
        </div>
      </div>

      {/* 洞见详情弹窗 */}
      {selectedElement && (
        <InsightModal
          data={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      )}
    </div>
  )
}
```

---

## 后台管理设计

管理员可以在学员详情页查看和调整意识树参数。

### 管理界面

```
┌───────────────────────────────────────────────────┐
│  学员：杜富陶  |  意识树管理                        │
├───────────────────────────────────────────────────┤
│                                                    │
│  [3D预览] | [数据编辑]                             │
│                                                    │
│  根系调整：                                         │
│  ┌─────────────────────────────────────────┐     │
│  │ 自我觉察：[=========●==] 50 (+5)        │     │
│  │ 生命科学：[======●======] 40 (+3)       │     │
│  │ 通用法则：[====●========] 30 (+2)       │     │
│  │ ...                                      │     │
│  └─────────────────────────────────────────┘     │
│                                                    │
│  树干调整：                                         │
│  粗壮度：[========●=] 45 (+2)                     │
│  冥想总时长：156小时                               │
│                                                    │
│  枝叶：28片  |  果实：2个                           │
│                                                    │
│  [手动添加洞见]  [手动添加果实]                    │
│  [重新计算树的参数]  [保存修改]                    │
└───────────────────────────────────────────────────┘
```

---

## 更新机制

### 触发时机

意识树在以下情况下自动更新：

1. **完成课程内容** → 根系延伸
2. **提交冥想日志** → 树干增粗
3. **与盖亚深度对话** → 枝叶生长
4. **完成PBL项目** → 果实成熟

### Edge Function: 更新意识树

```typescript
// supabase/functions/update-consciousness-tree/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, updateType, metadata } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 获取当前树数据
  const { data: profile } = await supabase
    .from('profiles')
    .select('consciousness_tree_view')
    .eq('id', userId)
    .single()

  let treeData = profile.consciousness_tree_view

  // 根据更新类型修改树数据
  switch (updateType) {
    case 'complete_course':
      // 增加根系
      const domain = getDomainFromCourse(metadata.courseId)
      treeData.roots.main_roots.find(r => r.domain === domain).length += 5
      treeData.roots.main_roots.find(r => r.domain === domain).density += 2
      break

    case 'submit_meditation':
      // 增加树干
      treeData.trunk.thickness += 2
      treeData.trunk.rings += 1
      treeData.trunk.emotion_history.push(metadata.emotion)
      treeData.trunk.total_meditation_minutes += metadata.duration
      break

    case 'deep_insight':
      // 添加叶子
      const branch = treeData.branches_and_leaves.branches[0] || { id: generateId(), leaves: [] }
      branch.leaves.push({
        insight_type: metadata.type,
        insight_text: metadata.text,
        created_at: new Date().toISOString(),
        related_content_id: metadata.contentId
      })
      treeData.branches_and_leaves.total_leaves += 1
      break

    case 'complete_pbl':
      // 添加果实
      treeData.fruits.push({
        id: generateId(),
        type: 'creative_fruit',
        title: metadata.title,
        description: metadata.description,
        maturity: 100,
        community_resonance: 0,
        created_at: new Date().toISOString()
      })
      break
  }

  // 更新数据库
  await supabase
    .from('profiles')
    .update({ consciousness_tree_view: treeData })
    .eq('id', userId)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 性能优化

### 1. LOD（层次细节）

```typescript
// 根据相机距离调整渲染细节
function adjustLOD(camera: THREE.Camera, tree: THREE.Group) {
  const distance = camera.position.distanceTo(tree.position)

  if (distance > 10) {
    // 远距离：简化几何体
    tree.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry = lowPolyGeometry
      }
    })
  } else {
    // 近距离：高细节
    tree.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry = highPolyGeometry
      }
    })
  }
}
```

### 2. 移动端降级

```typescript
function isMobile() {
  return window.innerWidth <= 768
}

if (isMobile()) {
  // 使用2D Canvas渲染
  renderTree2D()
} else {
  // 使用Three.js渲染
  renderTree3D()
}
```

---

## 下一步

完成本文档后，查看：
- **文档4**: 技术实现路线图与API设计

---

**文档版本**: v1.0
**最后更新**: 2025-10-29
**负责人**: Claude + 杜富陶