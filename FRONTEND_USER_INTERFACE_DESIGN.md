# 前端用户界面设计方案（基础版 + 游戏化）

**创建时间**: 2025-10-29
**版本**: v1.0
**设计目标**: 打造游戏化、沉浸式、美观的学习体验，让用户享受学习的每一刻

---

## 📋 目录

1. [设计理念](#设计理念)
2. [整体架构](#整体架构)
3. [三大课程前端设计](#三大课程前端设计)
4. [游戏化机制设计](#游戏化机制设计)
5. [解锁系统详解](#解锁系统详解)
6. [交互动画设计](#交互动画设计)
7. [响应式适配](#响应式适配)

---

## 设计理念

### 核心理念：**"探索即游戏，学习即冒险"**

传统在线课程的问题：
- ❌ 界面枯燥，缺乏互动
- ❌ 进度不可见，缺乏成就感
- ❌ 被动接受，缺乏主动性

我们的解决方案：
- ✅ **游戏化界面**：像玩游戏一样学习
- ✅ **渐进式解锁**：完成前置才能解锁后续
- ✅ **即时反馈**：每个行动都有视觉和情感反馈
- ✅ **成长可见**：意识树实时展示成长轨迹

### 设计原则

1. **美观至上**：每个页面都是艺术品
2. **流畅交互**：丝滑的动画和过渡
3. **清晰导航**：用户永远知道自己在哪，能去哪
4. **正向激励**：庆祝每一个小进步

---

## 整体架构

### 用户端页面地图

```
/
├── /courses (课程总览页 - 游戏地图)
│   ├── /listening/[day] (自在聆听课程页)
│   ├── /earth/[stage] (欢迎来到地球课程页)
│   └── /pbl (探索者联盟 - PBL项目)
│
├── /portal (个人门户 - 已有)
│   ├── 意识树可视化
│   ├── 学习统计
│   └── 盖亚对话
│
└── /profile (个人设置)
```

### 统一设计语言

**颜色系统**:
```css
/* 自在聆听 - 紫色系 */
--listening-primary: #8B5CF6;
--listening-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 欢迎来到地球 - 蓝/青色系 */
--earth-primary: #06B6D4;
--earth-gradient: linear-gradient(135deg, #0EA5E9 0%, #2DD4BF 100%);

/* 探索者联盟 - 橙/金色系 */
--pbl-primary: #F59E0B;
--pbl-gradient: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);

/* 通用 */
--bg-primary: #0A0A0A;
--bg-secondary: #1A1A2E;
--text-primary: #FFFFFF;
--text-secondary: #A0AEC0;
```

**字体系统**:
```css
--font-heading: 'Inter', 'PingFang SC', sans-serif;
--font-body: 'Inter', 'PingFang SC', sans-serif;
--font-mono: 'Fira Code', 'Consolas', monospace;
```

---

## 三大课程前端设计

### 1. 课程总览页 (`/courses`)

这是用户的"冒险地图"，展示所有可探索的领域。

#### 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  [个人门户]  [盖亚对话]                    [头像▼]       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│             🌌 未来心灵学院 - 探索之旅                    │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │                                               │      │
│  │        [三大课程体系 3D地图可视化]             │      │
│  │                                               │      │
│  │   🌸 自在聆听      🌍 欢迎来到地球     🚀 探索者联盟│      │
│  │   (紫色光环)      (蓝色光环)          (金色光环)  │      │
│  │                                               │      │
│  │   进度：2/14      进度：1/6          进度：0/12 │      │
│  │   [继续学习]      [🔒已解锁]         [🔒锁定]    │      │
│  │                                               │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  最近学习：                                              │
│  • 自在聆听·第2天 - 放下心中的障碍  (2小时前)             │
│                                                          │
│  推荐下一步：                                            │
│  • 🌟 继续自在聆听第3天的练习                            │
│  • 💡 盖亚建议："你的冥想练习很稳定，可以尝试地球课程了"   │
└─────────────────────────────────────────────────────────┘
```

#### 3D地图可视化（核心亮点）

使用**Three.js**创建一个可交互的3D星空地图：

```typescript
// 伪代码示例
function CourseMapScene() {
  return (
    <Canvas>
      <Stars radius={100} depth={50} count={5000} fade />
      <ambientLight intensity={0.5} />

      {/* 自在聆听星球 */}
      <mesh position={[-5, 0, 0]} onClick={() => navigate('/courses/listening')}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 欢迎来到地球星球 */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => navigate('/courses/earth')}
        opacity={userHasUnlocked ? 1 : 0.3}
      >
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#06B6D4"
          emissive={userHasUnlocked ? "#06B6D4" : "#333"}
        />
      </mesh>

      {/* 探索者联盟星球 */}
      <mesh
        position={[5, 0, 0]}
        onClick={() => navigate('/courses/pbl')}
        opacity={userHasUnlocked ? 1 : 0.3}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={userHasUnlocked ? "#F59E0B" : "#555"}
        />
        {!userHasUnlocked && <LockIcon />}
      </mesh>

      <OrbitControls enableZoom={true} />
    </Canvas>
  )
}
```

**交互效果**:
- 鼠标悬停：星球发光、放大
- 点击：飞向该星球（过渡动画）
- 锁定状态：星球灰暗，显示锁图标，不可点击
- 已完成：星球周围环绕金色光环

---

### 2. 自在聆听课程页 (`/courses/listening`)

#### 2.1 课程入口页

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回]  自在聆听·观音之旅                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📖 14天的内在探索之旅                                    │
│  通过聆听，发现内心的宁静与智慧                            │
│                                                          │
│  你的进度：                                              │
│  [████░░░░░░░░░░░░░░░░░░] 2/14 (14%)                  │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  📅 Day 1: 自在地聆听          [✅ 已完成]     │      │
│  │  "你可曾安静地坐着..."                         │      │
│  │  完成时间：2025-10-20  |  [回顾]              │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  📅 Day 2: 放下心中的障碍      [✅ 已完成]     │      │
│  │  "你以何种方式在听..."                         │      │
│  │  完成时间：2025-10-22  |  [回顾]              │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  📅 Day 3: 倾听内在的声音      [▶️ 开始学习]   │      │
│  │  "除非你能倾听..."                             │      │
│  │  预计时长：30分钟  |  [立即开始]               │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  📅 Day 4: ？？？              [🔒 锁定]       │      │
│  │  完成Day 3后解锁                               │      │
│  │  [查看解锁条件]                                │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ... (Day 5-14，全部灰显锁定)                            │
└─────────────────────────────────────────────────────────┘
```

**解锁逻辑**:
```typescript
function getLessonStatus(dayNumber: number, userProgress: UserProgress) {
  const isCompleted = userProgress.completedDays.includes(dayNumber)
  const isPreviousCompleted = dayNumber === 1 || userProgress.completedDays.includes(dayNumber - 1)

  if (isCompleted) return 'completed'
  if (isPreviousCompleted) return 'unlocked'
  return 'locked'
}
```

**视觉效果**:
- ✅ 已完成：绿色勾选，淡化显示
- ▶️ 可学习：高亮显示，呼吸光效
- 🔒 锁定：灰显，模糊处理，显示锁图标

#### 2.2 单日课程详情页 (`/courses/listening/[day]`)

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回Day列表]  Day 3: 倾听内在的声音                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  进度导航：                                              │
│  Day1[✅] → Day2[✅] → Day3[👁] → Day4[🔒] ...          │
│                                                          │
│  ┌────────────── 标签页切换 ──────────────┐            │
│  │ [📖原文] [💡解读] [🧘冥想] [🌱练习] [✍️感悟]│            │
│  └─────────────────────────────────────────┘            │
│                                                          │
│  【📖 原文摘录】(当前选中)                               │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  "除非你能倾听自己内在最深处的声音，           │    │
│  │   否则你将永远无法理解别人所说的话..."         │    │
│  │                                                 │    │
│  │  [展开完整原文]                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [继续阅读解读 →]                                        │
│                                                          │
│  🎵 冥想音频播放器：                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  ▶️ Day 3冥想引导  [●────────] 5:32 / 15:00    │    │
│  │  [1.0x] [循环] [下载]                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**标签页内容**:

1. **📖 原文摘录**
   - 克里希那穆提的原文
   - 优雅的排版（大字号、行间距适中）
   - 支持滚动高亮

2. **💡 深度解读**
   - 分段解读
   - 使用渐变背景卡片
   - 关键词高亮

3. **🧘 冥想引导**
   - 音频播放器
   - 引导文字同步显示
   - 计时器

4. **🌱 生活练习**
   - 本日练习任务
   - 可打卡完成
   - 显示完成状态

5. **✍️ 今日感悟**
   - 文本输入框
   - 支持上传图片
   - 提交后不可修改（可追加）

**提交感悟后的流程**:
```
用户点击[提交感悟]
  ↓
弹出庆祝动画（粒子效果、音效）
  ↓
显示意识树成长提示："您的树干增长了3点稳定度！"
  ↓
自动跳转到下一天（或返回列表）
```

---

### 3. 欢迎来到地球课程页 (`/courses/earth`)

#### 3.1 课程入口页（6阶段地图）

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回]  欢迎来到地球                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🌍 探索我们感官之外的世界                                │
│  跟随威尔·史密斯，开启6段奇妙的认知升级之旅               │
│                                                          │
│  阶段进度：                                              │
│  [●──○──○──○──○──○] 1/6 (17%)                        │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  🎬 Stage 1: 无形的咆哮（声音）  [✅ 已完成]   │      │
│  │  ┌─────────────────────────────────────┐    │      │
│  │  │  主题：探索感官之外的声音世界        │    │      │
│  │  │  知识点：5个  |  苏格拉底问题：9个   │    │      │
│  │  │  完成时间：2025-10-25               │    │      │
│  │  │  [重新观看]                          │    │      │
│  │  └─────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  🎬 Stage 2: 黑暗中的光明（光）  [▶️ 开始探索]│      │
│  │  ┌─────────────────────────────────────┐    │      │
│  │  │  主题：生物如何利用光生存            │    │      │
│  │  │  预计时长：60分钟                    │    │      │
│  │  │  [立即开始]                          │    │      │
│  │  └─────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  🎬 Stage 3: ？？？              [🔒 锁定]     │      │
│  │  完成Stage 2后解锁                            │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ... (Stage 4-6，全部锁定)                               │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 单阶段学习页 (`/courses/earth/[stage]`)

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回]  Stage 2: 黑暗中的光明                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  阶段导航：                                              │
│  S1[✅] → S2[👁] → S3[🔒] → S4[🔒] → S5[🔒] → S6[🔒]   │
│                                                          │
│  ┌────────────── 学习流程 ──────────────┐              │
│  │ [📺纪录片] [💡知识点] [❓启发] [📝作业]│              │
│  └───────────────────────────────────────┘              │
│                                                          │
│  【📺 观看纪录片】(当前步骤)                             │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │        [YouTube视频嵌入播放器]                  │    │
│  │                                                 │    │
│  │  Welcome to Earth S01E02 - "Into the Dark"     │    │
│  │  [▶️播放]  [⏸暂停]  [全屏]                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  观前引导：                                              │
│  "在这一集中，威尔将深入海洋深处，探索那里的生物...      │
│   请特别注意：光在水中的传播规律、生物发光现象..."       │
│                                                          │
│  [开始观看] →                                            │
└─────────────────────────────────────────────────────────┘
```

**观看完成后自动跳转到"知识点"页面**:

```
┌─────────────────────────────────────────────────────────┐
│  【💡 知识点探索】                                        │
│                                                          │
│  ┌─────────────── 知识点1 ───────────────┐            │
│  │  🔬 光谱与颜色的物理原理               │            │
│  │  ┌──────────────────────────────┐    │            │
│  │  │  [展开/收起 ▼]                │    │            │
│  │  │                               │    │            │
│  │  │  光是一种电磁波，不同波长对应   │    │            │
│  │  │  不同颜色...                   │    │            │
│  │  │                               │    │            │
│  │  │  [互动演示：光谱分解器]        │    │            │
│  │  └──────────────────────────────┘    │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  ┌─────────────── 知识点2 ───────────────┐            │
│  │  🌊 深海的物理规则                    │            │
│  │  ... (同上结构)                       │            │
│  └────────────────────────────────────────┘            │
│                                                          │
│  ... (共5个知识点)                                       │
│                                                          │
│  全部阅读完成后：[继续到启发式提问 →]                    │
└─────────────────────────────────────────────────────────┘
```

**启发式提问页面**（苏格拉底式对话）:

```
┌─────────────────────────────────────────────────────────┐
│  【❓ 启发式提问】                                         │
│                                                          │
│  请思考以下问题，并写下你的答案：                         │
│                                                          │
│  📖 课前思考：                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  Q1: 你认为在完全黑暗的深海，生物是如何生存的？│    │
│  │                                                 │    │
│  │  [文本框]                                       │    │
│  │  ┌─────────────────────────────────────┐       │    │
│  │  │ 我觉得深海生物可能...                │       │    │
│  │  └─────────────────────────────────────┘       │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  📺 观看中的思考：                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  Q2: 威尔说他能"感觉"到火山的咆哮，这是什么意思│    │
│  │  ... (类似上面)                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  💭 课后反思：                                            │
│  ... (2-3个深度问题)                                     │
│                                                          │
│  [提交思考]                                              │
└─────────────────────────────────────────────────────────┘
```

**提交后进入作业页面**:

```
┌─────────────────────────────────────────────────────────┐
│  【📝 课后思辨作业】                                      │
│                                                          │
│  综合本阶段所学，完成以下探究：                           │
│                                                          │
│  作业题目：                                              │
│  "基于你对光和颜色的理解，设计一个实验来验证......"       │
│                                                          │
│  要求：                                                  │
│  1. 实验设计（至少300字）                                │
│  2. 预期结果分析                                         │
│  3. 可以上传图片、视频等附件                             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  [富文本编辑器]                                 │    │
│  │                                                 │    │
│  │  我的实验设计是...                              │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  附件：                                                  │
│  [📎 上传文件]  [📷 拍照]                                │
│                                                          │
│  [提交作业]  [保存草稿]                                  │
└─────────────────────────────────────────────────────────┘
```

**提交作业后**:
- 显示庆祝动画
- 提示："您的意识树长出了新的枝叶！"
- 自动解锁下一阶段
- 返回课程列表

---

### 4. 探索者联盟（PBL）页面 (`/courses/pbl`)

#### 4.1 项目矩阵页面

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回]  探索者联盟 - 伊卡洛斯计划                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🚀 探索现实的边缘 - 基于问题的学习（PBL）                │
│                                                          │
│  筛选：[全部模块▼]  [全部难度▼]  [我参与的]              │
│                                                          │
│  ┌──────────── 模块一：无形的纽带 ────────────┐        │
│  │                                               │        │
│  │  ┌─────────┬─────────┬─────────┬─────────┐  │        │
│  │  │ 选项A   │ 选项B   │ 选项C   │ 选项D   │  │        │
│  │  │ (入门)  │ (进阶)  │ (深入)  │ (专家)  │  │        │
│  │  ├─────────┼─────────┼─────────┼─────────┤  │        │
│  │  │ 声音的  │ 家庭声音│ 跨文化  │ 声音与  │  │        │
│  │  │ 旅行日记│ 博物馆  │ 音乐探索│ 神经科学│  │        │
│  │  │         │         │         │         │  │        │
│  │  │ 👥 5人  │ 👥 3人  │ 👥 2人  │ 👥 1人  │  │        │
│  │  │ [查看]  │ [查看]  │ [查看]  │ [🔒锁定]│  │        │
│  │  └─────────┴─────────┴─────────┴─────────┘  │        │
│  └───────────────────────────────────────────────┘        │
│                                                          │
│  ┌──────────── 模块二：现实的边缘 ────────────┐        │
│  │  ... (同上4×1矩阵)                         │        │
│  └───────────────────────────────────────────────┘        │
│                                                          │
│  ┌──────────── 模块三：未来的种子 ────────────┐        │
│  │  ... (同上4×1矩阵)                         │        │
│  └───────────────────────────────────────────────┘        │
│                                                          │
│  💡 提示：完成"欢迎来到地球"Stage 3后，解锁专家级项目    │
└─────────────────────────────────────────────────────────┘
```

**解锁逻辑**:
```typescript
function getProjectUnlockStatus(difficulty: string, userProgress: UserProgress) {
  switch(difficulty) {
    case 'option_a': // 入门，默认解锁
      return 'unlocked'
    case 'option_b': // 进阶，完成1个入门项目解锁
      return userProgress.completedPBLCount >= 1 ? 'unlocked' : 'locked'
    case 'option_c': // 深入，完成Stage 1-3解锁
      return userProgress.earthStageCompleted >= 3 ? 'unlocked' : 'locked'
    case 'option_d': // 专家，完成Stage 1-6 + 2个PBL项目解锁
      return (userProgress.earthStageCompleted >= 6 && userProgress.completedPBLCount >= 2)
        ? 'unlocked'
        : 'locked'
  }
}
```

#### 4.2 项目详情页 (`/courses/pbl/[projectId]`)

```
┌─────────────────────────────────────────────────────────┐
│  [← 返回项目列表]  声音的旅行日记                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎯 项目概述                                             │
│  ┌────────────────────────────────────────────────┐    │
│  │  • 难度：⭐ 入门级（选项A）                     │    │
│  │  • 时长：8周                                    │    │
│  │  • 参与人数：5人                                │    │
│  │  • 核心问题："声音如何塑造我们的记忆和情感？"  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  📚 学习目标                                             │
│  • 理解声音的物理和心理学原理                            │
│  • 掌握基本的声音采集和编辑技能                          │
│  • 培养跨学科思考能力                                    │
│                                                          │
│  📅 项目周计划（可展开）                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  Week 1: 感知与觉察  [▼]                       │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  目标：建立对声音的敏感度               │     │    │
│  │  │  任务：                                 │     │    │
│  │  │  - Day 1: 团队组建会议                  │     │    │
│  │  │  - Day 3: 采集10种不同环境的声音        │     │    │
│  │  │  - Day 5: 小组分享与讨论                │     │    │
│  │  │  交付物：声音样本库 + 观察笔记         │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │                                                 │    │
│  │  Week 2: 探索与分析  [▼]                       │    │
│  │  ... (类似展开结构)                            │    │
│  │                                                 │    │
│  │  Week 3-8: ...                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  你的状态：                                              │
│  • [未加入]  或  [已加入 - Week 3进行中]                 │
│                                                          │
│  [加入项目]  [查看成员]  [查看作品展示]                  │
└─────────────────────────────────────────────────────────┘
```

**加入项目后**：
- 解锁"项目工作台"页面
- 显示周任务清单
- 可以提交周报
- 可以查看队友进度
- 显示项目聊天室

---

## 游戏化机制设计

### 1. 解锁系统（核心机制）

#### 解锁规则表

| 课程/项目 | 解锁条件 | 视觉效果 |
|----------|---------|---------|
| 自在聆听 Day 1 | 默认解锁 | 高亮、呼吸光效 |
| 自在聆听 Day 2-14 | 完成前一天 | 依次解锁 |
| 欢迎来到地球 | 完成自在聆听 Day 7 | 蓝色光环闪烁 |
| 地球 Stage 2-6 | 完成前一阶段 | 依次解锁 |
| 探索者联盟（选项A） | 完成自在聆听 Day 3 | 金色光环 |
| 探索者联盟（选项B） | 完成1个选项A项目 | 金色光环增强 |
| 探索者联盟（选项C） | 完成地球 Stage 3 | 光环+粒子效果 |
| 探索者联盟（选项D） | 完成地球全部 + 2个PBL | 史诗级光效 |

#### 锁定状态设计

**视觉层面**:
```css
.locked-content {
  opacity: 0.3;
  filter: grayscale(100%) blur(2px);
  pointer-events: none;
  position: relative;
}

.locked-content::before {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
}

.locked-content:hover {
  /* 锁定状态不响应hover */
}
```

**交互反馈**:
- 点击锁定内容：弹出提示框
  ```
  🔒 此内容尚未解锁

  解锁条件：
  • 完成自在聆听第2天的学习
  • 提交第2天的冥想感悟

  [查看进度] [返回]
  ```

### 2. 进度可视化

#### 2.1 课程进度条

```html
<!-- 自在聆听整体进度 -->
<div class="progress-bar">
  <div class="progress-fill" style="width: 14%">
    <span class="progress-text">2/14</span>
  </div>
  <div class="progress-milestones">
    <span style="left: 50%" class="milestone">🎯 7天里程碑</span>
  </div>
</div>
```

**里程碑奖励**:
- Day 7: 解锁地球课程 + 意识树开出第一朵花
- Day 14: 获得"聆听大师"徽章 + 意识树结果

#### 2.2 意识树实时成长

在每个学习页面的右上角显示一个"意识树小窗口"：

```
┌──────────────────┐
│  🌳 你的意识树    │
│                  │
│  [迷你树可视化]   │
│                  │
│  最近成长：       │
│  +5 根系深度     │
│  +3 树干稳定度   │
│                  │
│  [查看详情]       │
└──────────────────┘
```

点击后全屏显示完整的意识树。

### 3. 成就系统

#### 徽章设计

```
┌─────────────── 你的徽章墙 ───────────────┐
│                                          │
│  🏆 聆听大师    🌍 地球探险家  🚀 探索先锋│
│  (已获得)      (未获得)       (未获得)   │
│                                          │
│  🌱 初心者      🌿 成长者      🌳 智者    │
│  (已获得)      (已获得)       (未获得)   │
│                                          │
│  💎 罕见成就：                            │
│  • 连续学习30天                          │
│  • 首位完成某个PBL项目                   │
│  • 获得"世界种子"（创造全新问题）         │
└──────────────────────────────────────────┘
```

### 4. 即时反馈动画

**完成任务时**:
```typescript
function celebrateCompletion() {
  // 1. 粒子爆炸动画
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })

  // 2. 声音效果
  playSound('achievement.mp3')

  // 3. 成长提示
  showNotification({
    title: '🎉 恭喜完成！',
    message: '你的意识树长出了新的枝叶',
    icon: '🌿',
    duration: 3000
  })

  // 4. 等级提升动画（如果有）
  if (levelUp) {
    showLevelUpAnimation(oldLevel, newLevel)
  }
}
```

**示例**（Level Up动画）:
```
┌───────────────────────────────┐
│                               │
│    ✨ 意识等级提升！ ✨        │
│                               │
│         Lv 1 → Lv 2          │
│                               │
│    🌳 你的意识树更加繁茂      │
│                               │
│    [查看详情] [继续探索]      │
│                               │
└───────────────────────────────┘
```

---

## 解锁系统详解

### 数据库设计

```sql
-- user_progress 表存储解锁状态
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  progress_type TEXT, -- 'course_unlock', 'lesson_complete', 'stage_complete', 'pbl_join'
  ref_item_id UUID,   -- 关联的课程/阶段/项目ID
  progress_value INTEGER, -- 进度值（0-100）
  completed_at TIMESTAMPTZ,
  metadata JSONB       -- 额外数据
);

-- 索引
CREATE INDEX idx_user_progress_user_type ON user_progress(user_id, progress_type);
```

### 解锁检查函数

```typescript
// 检查用户是否可以访问某个课程内容
async function checkContentAccess(
  userId: string,
  contentId: string
): Promise<{ canAccess: boolean; reason?: string }> {
  const supabase = createClient()

  // 1. 获取内容信息
  const { data: content } = await supabase
    .from('course_contents')
    .select('*, course_systems(*)')
    .eq('id', contentId)
    .single()

  if (!content) {
    return { canAccess: false, reason: '内容不存在' }
  }

  // 2. 检查前置条件
  const prerequisites = content.prerequisites || []

  for (const prereq of prerequisites) {
    if (prereq.type === 'complete_previous') {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('ref_item_id', prereq.content_id)
        .single()

      if (!progress) {
        return {
          canAccess: false,
          reason: `需要先完成前置内容`
        }
      }
    }

    if (prereq.type === 'min_level') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('consciousness_level')
        .eq('id', userId)
        .single()

      if (profile.consciousness_level < prereq.level) {
        return {
          canAccess: false,
          reason: `需要意识等级达到 Lv ${prereq.level}`
        }
      }
    }
  }

  return { canAccess: true }
}
```

### 前端路由守卫

```typescript
// 在课程页面的 useEffect 中检查权限
useEffect(() => {
  async function checkAccess() {
    const { canAccess, reason } = await checkContentAccess(userId, contentId)

    if (!canAccess) {
      // 显示解锁提示
      setShowLockModal(true)
      setLockReason(reason)
    } else {
      setShowLockModal(false)
    }
  }

  checkAccess()
}, [userId, contentId])
```

---

## 交互动画设计

### 1. 页面过渡动画

使用 Framer Motion:

```typescript
// 页面进入动画
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

function CoursePage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      {/* 页面内容 */}
    </motion.div>
  )
}
```

### 2. 卡片悬停效果

```typescript
const cardVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
    transition: { duration: 0.2 }
  }
}

<motion.div
  className="course-card"
  variants={cardVariants}
  initial="rest"
  whileHover="hover"
>
  {/* 卡片内容 */}
</motion.div>
```

### 3. 解锁动画

```typescript
// 解锁时的动画序列
async function playUnlockAnimation(element: HTMLElement) {
  // 1. 锁图标晃动
  await animate(element, { rotate: [-5, 5, -5, 5, 0] }, { duration: 0.5 })

  // 2. 锁打开
  await animate('.lock-icon', { scale: [1, 1.2, 0] }, { duration: 0.3 })

  // 3. 内容从模糊变清晰
  await animate(
    element,
    { filter: ['blur(5px) grayscale(100%)', 'blur(0px) grayscale(0%)'] },
    { duration: 0.5 }
  )

  // 4. 光效扩散
  animate('.glow-effect', { opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }, { duration: 1 })
}
```

### 4. 滚动视差效果

```typescript
// 使用 Intersection Observer
function useScrollReveal() {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

// 使用
function ContentSection() {
  const [ref, isVisible] = useScrollReveal()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* 内容 */}
    </motion.div>
  )
}
```

---

## 响应式适配

### 断点设计

```scss
$breakpoints: (
  'mobile': 320px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1440px
);
```

### 移动端优化

**1. 课程卡片布局**:
```scss
// 桌面端：3列网格
@media (min-width: 1024px) {
  .course-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

// 平板端：2列
@media (min-width: 768px) and (max-width: 1023px) {
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

// 移动端：1列
@media (max-width: 767px) {
  .course-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

**2. 触摸优化**:
```css
/* 增大移动端的可点击区域 */
@media (max-width: 767px) {
  .button,
  .card-link {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 20px;
  }
}
```

**3. 字体响应式**:
```css
html {
  font-size: 16px;
}

@media (max-width: 767px) {
  html {
    font-size: 14px;
  }
}

h1 {
  font-size: 2.5rem; /* 自动根据根字号缩放 */
}
```

---

## 性能优化

### 1. 图片懒加载

```typescript
import Image from 'next/image'

<Image
  src="/course-thumbnail.jpg"
  alt="课程封面"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

### 2. 组件懒加载

```typescript
import dynamic from 'next/dynamic'

const ConsciousnessTree = dynamic(
  () => import('@/components/ConsciousnessTree'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // 树可视化不需要SSR
  }
)
```

### 3. 代码分割

```typescript
// 按路由自动分割
// /courses/listening -> listening.chunk.js
// /courses/earth -> earth.chunk.js
// /courses/pbl -> pbl.chunk.js
```

---

## 可访问性（A11y）

### 1. 键盘导航

```html
<!-- 所有交互元素都可通过Tab键访问 -->
<button
  class="course-card"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && navigate()}
>
  课程内容
</button>
```

### 2. 屏幕阅读器支持

```html
<div role="navigation" aria-label="课程进度">
  <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
    已完成 {progress}%
  </div>
</div>
```

### 3. 色盲友好

- 不仅依赖颜色传递信息
- 锁定状态：颜色 + 图标 + 文字说明
- 完成状态：颜色 + ✅ + "已完成"文字

---

## 下一步

完成本文档的设计后，继续查看：
- **文档3**: 意识树可视化设计方案
- **文档4**: 技术实现路线图与API设计

---

**文档版本**: v1.0
**最后更新**: 2025-10-29
**负责人**: Claude + 杜富陶