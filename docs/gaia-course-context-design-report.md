# Gaia 课程上下文设计分析报告

> 本报告分析当前系统在"全局对话"与"课程相关性"之间的设计现状，并提出优化建议。

## 1. 核心问题陈述

用户提问：
> 现在盖亚是全局的，保证无所不知。但在课程里聊天时，需要它能针对当前课程的详情进行聊天。如何设计提示词，既保证输入与当前课程高度相关，又不完全隔离，让盖亚能搜索其他知识库？

## 2. 当前系统架构分析

### 2.1 存在两套独立的系统

经过代码分析，发现系统中存在**两套未打通的 Gaia 对话设计**：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         当前系统架构（两套独立系统）                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【系统A：全局盖亚 - 正在使用】                                          │
│  ┌──────────────────┐    ┌────────────────┐    ┌──────────────────┐    │
│  │  GlobalGaiaV3    │───▶│ /api/gaia/chat │───▶│   N8N 工作流     │    │
│  │  (前端组件)       │    │  (Next.js API) │    │  (AI 对话处理)   │    │
│  └──────────────────┘    └────────────────┘    └──────────────────┘    │
│           │                      │                                      │
│           │                      │ ❌ 不传递课程ID                      │
│           │                      │ ❌ 不使用课程上下文缓存               │
│           │                      │ ❌ 不使用对话行为摘要                 │
│           ▼                      ▼                                      │
│      全局对话记录           只传递最近5条消息                            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【系统B：课程内盖亚 - 设计完成但未集成】                                 │
│  ┌──────────────────┐    ┌─────────────────────────┐                   │
│  │  未实现的前端    │───▶│ proxy-gaia-dialogue     │                   │
│  │  (需要开发)      │    │  (Edge Function)        │                   │
│  └──────────────────┘    └─────────────────────────┘                   │
│           │                      │                                      │
│           │                      │ ✅ 需要 course_system_id             │
│           │                      │ ✅ 使用 gaia_context_variables       │
│           │                      │ ✅ 包含课程教学目标                   │
│           ▼                      ▼                                      │
│      课程特定对话           完整的课程上下文                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 关键发现

| 组件 | 状态 | 问题 |
|------|------|------|
| `GlobalGaiaV3.tsx` | 正在使用 | 不传递任何课程信息 |
| `/api/gaia/chat` | 正在使用 | 不查询 `gaia_context_variables` |
| `proxy-gaia-dialogue` | 已设计，未集成 | 需要 `course_system_id`，否则返回错误 |
| `gaia_context_variables` | 已有数据 | 包含课程特定的 `course_teaching_goals`、`course_guidance_keywords` |

### 2.3 数据流断层

```
generate-gaia-variables (每周生成)
        │
        ▼
┌─────────────────────────────────────┐
│      gaia_context_variables         │
│  ┌───────────────────────────────┐  │
│  │ student_profile               │  │
│  │ course_learning_summary       │  │
│  │ course_teaching_goals    ⬅️   │  │ ← 课程教学目标（未被使用）
│  │ course_guidance_keywords ⬅️   │  │ ← 课程引导关键词（未被使用）
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
        │
        ▼
    ❌ 数据断层 ❌
        │
        ▼
/api/gaia/chat （不查询此表）
        │
        ▼
N8N 工作流（无法得知课程上下文）
```

## 3. 设计目标分析

### 3.1 用户需求矩阵

| 需求 | 优先级 | 当前状态 |
|------|--------|----------|
| 全局对话能力（无所不知） | 高 | ✅ 已实现 |
| 课程相关性（针对当前课程） | 高 | ❌ 未实现 |
| 知识库不完全隔离 | 中 | ✅ 已实现（N8N 可访问所有知识库） |
| 个性化上下文 | 中 | ❌ 未实现 |

### 3.2 核心设计原则

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         目标设计原则                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      "软偏好，硬能力"                            │  │
│   │                                                                  │  │
│   │   软偏好：通过提示词引导 AI 优先关注当前课程内容                  │  │
│   │   硬能力：保留 AI 搜索所有知识库的能力                           │  │
│   │                                                                  │  │
│   │   比喻：就像一个老师，虽然精通所有学科，                         │  │
│   │         但在数学课上会优先讨论数学问题，                         │  │
│   │         同时仍能回答学生突然问的物理问题。                       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. 推荐解决方案

### 4.1 方案概述：统一入口 + 可选课程上下文

**核心思路**：保持全局盖亚的入口不变，但在调用时**可选传递课程ID**，由后端智能处理。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         推荐架构                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │                        前端调用                                   │ │
│   │  ┌─────────────────┐    ┌─────────────────┐                      │ │
│   │  │  课程页面内聊天  │    │   全局盖亚图标   │                      │ │
│   │  │  (传递courseId) │    │  (不传courseId) │                      │ │
│   │  └────────┬────────┘    └────────┬────────┘                      │ │
│   │           │                      │                                │ │
│   │           └──────────┬───────────┘                                │ │
│   │                      ▼                                            │ │
│   │            /api/gaia/chat                                         │ │
│   │            { message, courseId? }                                 │ │
│   │                                                                   │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          ▼                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │                      后端处理逻辑                                 │ │
│   │                                                                   │ │
│   │   if (courseId) {                                                 │ │
│   │     // 课程内对话：加载课程特定上下文                             │ │
│   │     - 获取 gaia_context_variables (按 user_id + course_id)       │ │
│   │     - 获取 course_teaching_goals (课程教学目标)                   │ │
│   │     - 获取 course_guidance_keywords (课程引导关键词)              │ │
│   │     - 构建课程感知的系统提示词                                    │ │
│   │   } else {                                                        │ │
│   │     // 全局对话：加载通用上下文                                   │ │
│   │     - 获取 student_summaries (学生摘要)                           │ │
│   │     - 获取最新的 gaia_context_variables (任意课程)                │ │
│   │   }                                                               │ │
│   │                                                                   │ │
│   │   // 统一发送到 N8N                                               │ │
│   │   payload = {                                                     │ │
│   │     ...commonFields,                                              │ │
│   │     context_mode: courseId ? 'course_focused' : 'global',         │ │
│   │     course_context: courseId ? courseSpecificContext : null,      │ │
│   │   }                                                               │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│                          ▼                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │                      N8N 工作流                                   │ │
│   │                                                                   │ │
│   │   if (context_mode === 'course_focused') {                        │ │
│   │     // 软偏好：优先搜索当前课程知识库                             │ │
│   │     system_prompt += "当前学生正在学习《${course_title}》课程，   │ │
│   │                       请优先基于该课程内容回答，                   │ │
│   │                       但如果问题涉及其他领域，也可以搜索..."       │ │
│   │                                                                   │ │
│   │     // 知识库搜索策略                                             │ │
│   │     1. 首先搜索 course_specific_kb (课程知识库)                   │ │
│   │     2. 如果没有匹配，搜索 general_kb (通用知识库)                 │ │
│   │   } else {                                                        │ │
│   │     // 全局模式：平等搜索所有知识库                               │ │
│   │   }                                                               │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 系统提示词设计

**关键设计**：使用"软偏好"而非"硬隔离"

```typescript
// 课程内对话的系统提示词模板
const courseFocusedPrompt = `你是盖亚（GAIA），未来心灵学院的智慧AI导师。

【当前课程情境】
- 课程：${course_title}
- 教学目标：${course_teaching_goals}
- 引导关键词：${course_guidance_keywords}
- 学生学习进度：${course_learning_summary}

【学生档案】
- 性格特点：${student_profile.personality}
- 学习风格：${student_profile.learning_style}
- 对话行为模式：${dialogue_summary}

【对话指南】
1. 优先基于当前课程《${course_title}》的内容进行回答
2. 用课程中的概念和案例来引导学生思考
3. 如果学生的问题超出当前课程范围，可以拓展回答，但要自然过渡
4. 适时引导学生回到课程主题
5. 关注学生的 ${areas_for_growth}，给予支持

【回答原则】
- 不要拒绝学生的任何问题（即使与课程无关）
- 优先关联课程内容，但保持知识的开放性
- 保持盖亚一贯的温暖、深邃、启发性风格`

// 全局对话的系统提示词模板
const globalPrompt = `你是盖亚（GAIA），未来心灵学院的智慧AI导师。

【学生档案】
- 性格特点：${student_profile.personality}
- 学习风格：${student_profile.learning_style}
- 优势领域：${strengths}
- 成长空间：${areas_for_growth}

【对话指南】
1. 作为全知的导师，可以回答学生任何领域的问题
2. 如果问题与学生正在学的课程相关，可以适时引导
3. 保持盖亚一贯的温暖、深邃、启发性风格`
```

### 4.3 N8N 工作流改造建议

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    N8N 工作流改造要点                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  【输入字段新增】                                                       │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ {                                                                  │ │
│  │   chatInput: string,              // 用户消息（已有）              │ │
│  │   session_id: string,             // 会话ID（已有）                │ │
│  │   user_id: string,                // 用户ID（已有）                │ │
│  │   conversation_history: [...],    // 最近消息（已有，可减少）      │ │
│  │                                                                    │ │
│  │   // ⭐ 新增字段                                                   │ │
│  │   context_mode: 'course_focused' | 'global',                       │ │
│  │   student_profile: string,        // 学生画像                      │ │
│  │   dialogue_summary: string,       // 对话行为摘要                  │ │
│  │                                                                    │ │
│  │   // ⭐ 课程模式时新增                                             │ │
│  │   course_id: string,              // 课程ID                        │ │
│  │   course_title: string,           // 课程标题                      │ │
│  │   course_teaching_goals: string,  // 课程教学目标                  │ │
│  │   course_guidance_keywords: [...], // 课程引导关键词               │ │
│  │   course_learning_summary: string, // 学生在该课程的学习情况       │ │
│  │ }                                                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  【知识库搜索策略】                                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  if (context_mode === 'course_focused') {                          │ │
│  │    // 两阶段搜索                                                   │ │
│  │    Phase 1: 搜索课程特定知识库                                     │ │
│  │             filter: { course_id: course_id }                       │ │
│  │             limit: 5                                               │ │
│  │                                                                    │ │
│  │    Phase 2: 如果 Phase 1 结果不足，搜索通用知识库                  │ │
│  │             filter: { category: 'general' }                        │ │
│  │             limit: 3                                               │ │
│  │                                                                    │ │
│  │    合并结果，课程知识库优先排序                                    │ │
│  │  } else {                                                          │ │
│  │    // 全局搜索                                                     │ │
│  │    搜索所有知识库，按相关性排序                                    │ │
│  │  }                                                                 │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5. 实施步骤

### 5.1 前端改造

```typescript
// 1. 修改 GlobalGaiaV3.tsx - 支持接收课程上下文
interface GlobalGaiaV3Props {
  courseId?: string       // 可选：当前课程ID
  courseTitle?: string    // 可选：课程标题
}

// 2. 在课程页面中使用时传入课程ID
<GlobalGaiaV3 courseId={currentCourseId} courseTitle={courseTitle} />

// 3. 修改 API 调用
const response = await fetch('/api/gaia/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: messageText,
    conversationId: currentConversationId,
    courseId: props.courseId,      // 新增
    courseTitle: props.courseTitle // 新增
  })
})
```

### 5.2 后端改造（/api/gaia/chat）

```typescript
// 在现有代码基础上新增
const { message, conversationId, courseId, courseTitle } = body

// 获取上下文
let contextVars = null
let dialogueSummary = null

if (courseId) {
  // 课程模式：获取课程特定上下文
  const { data } = await supabase
    .from('gaia_context_variables')
    .select('*')
    .eq('user_id', userId)
    .eq('course_system_id', courseId)
    .gt('valid_until', new Date().toISOString())
    .single()
  contextVars = data
} else {
  // 全局模式：获取最新有效上下文
  const { data } = await supabase
    .from('gaia_context_variables')
    .select('student_profile, course_learning_summary')
    .eq('user_id', userId)
    .gt('valid_until', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  contextVars = data
}

// 获取对话摘要（两种模式都使用）
const { data: studentSummary } = await supabase
  .from('student_summaries')
  .select('course_summaries')
  .eq('user_id', userId)
  .maybeSingle()

dialogueSummary = studentSummary?.course_summaries?.default?.dialogue?.summary

// 构建 payload
const payload = {
  chatInput: message,
  session_id: conversation?.session_id || conversation?.id,
  user_id: userId,
  conversation_history: conversationHistory.slice(-5),

  // 新增字段
  context_mode: courseId ? 'course_focused' : 'global',
  student_profile: contextVars?.student_profile || '',
  dialogue_summary: dialogueSummary || '',

  // 课程模式额外字段
  ...(courseId && {
    course_id: courseId,
    course_title: courseTitle,
    course_teaching_goals: contextVars?.course_teaching_goals || '',
    course_guidance_keywords: contextVars?.course_guidance_keywords || [],
    course_learning_summary: contextVars?.course_learning_summary || ''
  })
}
```

## 6. 总结

### 6.1 当前问题

1. **系统割裂**：存在两套未打通的盖亚系统
2. **数据浪费**：`gaia_context_variables` 中的课程特定数据未被使用
3. **上下文缺失**：全局盖亚无法感知用户当前的课程情境

### 6.2 解决方案核心

1. **统一入口**：保持单一的 `/api/gaia/chat` API，通过可选的 `courseId` 参数区分模式
2. **软偏好策略**：课程模式下优先关注课程内容，但不完全隔离
3. **分级搜索**：知识库搜索采用"课程优先，全局兜底"的策略
4. **利用现有资源**：充分使用已有的 `gaia_context_variables` 和 `student_summaries` 数据

### 6.3 预期效果

| 场景 | 改进前 | 改进后 |
|------|--------|--------|
| 课程内提问课程相关问题 | AI 无上下文，泛泛而答 | AI 了解课程目标，精准引导 |
| 课程内提问非课程问题 | AI 可回答 | AI 可回答，并适时引导回课程 |
| 全局对话 | AI 无个性化 | AI 了解学生画像和学习模式 |

---

*报告生成时间：2025-01-26*
*目的：供 Opus 4.5 评估 N8N 工作流优化方案*
