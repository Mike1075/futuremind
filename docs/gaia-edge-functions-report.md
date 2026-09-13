# Gaia 对话系统边缘函数技术报告

> 本报告旨在为 N8N 工作流优化提供完整的技术背景，展示现有基础设施能力。

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Gaia 对话系统架构                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│   │   用户界面    │────▶│  /api/gaia/chat  │────▶│   N8N 工作流     │   │
│   │  (前端聊天)   │◀────│   (Next.js API)  │◀────│  (AI 对话处理)   │   │
│   └──────────────┘     └──────────────────┘     └──────────────────┘   │
│                               │                                         │
│                               ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      Supabase 数据库                             │  │
│   │  ┌─────────────────┐  ┌────────────────────┐  ┌──────────────┐  │  │
│   │  │gaia_conversations│  │gaia_context_variables│ │student_summaries│ │
│   │  │ (对话历史存储)   │  │   (上下文缓存)      │  │ (行为摘要)   │  │  │
│   │  └─────────────────┘  └────────────────────┘  └──────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                               ▲                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    定时任务 Edge Functions                       │  │
│   │  ┌─────────────────────┐     ┌─────────────────────────────┐   │  │
│   │  │summarize-user-activity│────▶│generate-gaia-variables    │   │  │
│   │  │   (每日 4AM 运行)    │     │   (每周日 4AM 运行)         │   │  │
│   │  │ 生成三维度行为摘要   │     │ 生成课程上下文变量缓存      │   │  │
│   │  └─────────────────────┘     └─────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. 边缘函数详解

### 2.1 summarize-user-activity（用户行为摘要函数）

**运行频率**: 每日凌晨 4:00 (cron: `0 4 * * *`)

**核心功能**: 对用户学习行为进行三维度 AI 摘要分析

#### 三个摘要维度

| 维度 | 数据来源 | 输出内容 |
|------|----------|----------|
| **dialogue（对话）** | `gaia_conversations` + `chat_history` | 用户提问模式、关注领域、理解障碍 |
| **coursework（课程作业）** | `user_submissions` + `user_content_interactions` | 作业完成质量、学习偏好、进度 |
| **projects（项目）** | `user_selected_projects` + `pbl_project_enrollments` | 项目参与度、协作模式、实践能力 |

#### 增量更新策略

```typescript
// 关键代码：只处理上次摘要后的新数据
const lastSummarized = forceFullRefresh
  ? "1970-01-01"
  : (courseSummaries.dialogue?.last_summarized_at || "1970-01-01");

const { data: gaiaConversations } = await supabase
  .from("gaia_conversations")
  .select("id, messages, created_at, updated_at, title, message_count")
  .eq("user_id", userId)
  .eq("is_active", true)
  .gte("updated_at", lastSummarized)  // 只获取增量数据
```

#### AI 摘要生成（使用 GPT-4o-mini）

每个维度生成 200-300 字的摘要，存储结构：

```typescript
interface DimensionSummary {
  summary: string;           // AI 生成的摘要文本
  data_points: number;       // 分析的数据点数量
  last_summarized_at: string; // 本次摘要时间戳
  updated_at: string;        // 更新时间
}

// 存储位置：student_summaries.course_summaries (JSONB)
{
  "default": {  // 或具体课程 ID
    "dialogue": DimensionSummary,
    "coursework": DimensionSummary,
    "projects": DimensionSummary
  }
}
```

#### 调用方式

```bash
# 单用户摘要
POST /functions/v1/summarize-user-activity
{
  "userId": "user-uuid",
  "dimensions": ["dialogue", "coursework", "projects"],
  "forceFullRefresh": false
}

# 全量用户摘要（定时任务）
POST /functions/v1/summarize-user-activity
{
  "allUsers": true
}
```

---

### 2.2 generate-gaia-variables（上下文变量生成函数）

**运行频率**: 每周日凌晨 4:00 (cron: `0 4 * * 0`)

**核心功能**: 为每个学生-课程组合预生成个性化上下文变量

#### 数据流程

```
student_summaries ──┐
                    ├──▶ generate-gaia-variables ──▶ gaia_context_variables
user_submissions ───┘                                    │
                                                         ▼
                                                   有效期 7 天的缓存
```

#### 生成的上下文变量

| 变量名 | 内容 | 用途 |
|--------|------|------|
| `student_profile` | 学生性格特征、学习风格、优势、成长领域 | 个性化对话风格 |
| `course_learning_summary` | 课程学习进度、掌握程度、关注点 | 精准内容推荐 |

#### 关键代码

```typescript
// 生成课程学习摘要
async function generateCourseLearningSummary(
  supabase: any,
  userId: string,
  courseId: string,
  courseKey: string
): Promise<string> {
  // 1. 获取学生在该课程的提交记录
  const { data: submissions } = await supabase
    .from('user_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)

  // 2. 使用 AI 生成学习摘要
  // 3. 返回结构化的学习状态描述
}

// 缓存到 gaia_context_variables
await supabase.from('gaia_context_variables').upsert({
  user_id: userId,
  course_system_id: courseId,
  student_profile: studentProfile,
  course_learning_summary: courseSummary,
  valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 天有效期
})
```

---

### 2.3 proxy-gaia-dialogue（对话代理函数）

**运行方式**: 实时调用（非定时任务）

**核心功能**: 作为 Gaia 对话的安全网关，整合缓存上下文

#### 工作流程

```
1. 验证用户身份
2. 从 gaia_context_variables 获取预生成的上下文（如果存在且未过期）
3. 获取最近 20 条对话历史
4. 将请求转发到 N8N 或 OpenAI
5. 流式返回响应
```

#### 关键代码

```typescript
// 获取缓存的上下文变量
const { data: contextCache } = await supabase
  .from('gaia_context_variables')
  .select('*')
  .eq('user_id', user_id)
  .eq('course_system_id', course_system_id)
  .gt('valid_until', new Date().toISOString())  // 检查有效期
  .single()

// 获取最近 20 条对话历史
const recentHistory = dialogueHistory.slice(-20)

// 构建完整上下文发送给 AI
const fullContext = {
  student_profile: contextCache?.student_profile,
  course_learning_summary: contextCache?.course_learning_summary,
  conversation_history: recentHistory,
  current_message: userMessage
}
```

---

## 3. 当前 API 实现分析 (`/api/gaia/chat`)

### 3.1 现状

```typescript
// app/api/gaia/chat/route.ts 当前实现

const payload = {
  chatInput: message,
  session_id: conversation?.session_id || conversation?.id,
  user_id: userId,
  user_name: userName,
  // 只发送最近 5 条消息，未使用任何摘要数据
  conversation_history: conversationHistory.slice(-5).map((m: GaiaMessage) => ({
    role: m.role,
    content: m.content
  }))
}
```

### 3.2 问题分析

| 问题 | 影响 |
|------|------|
| **未使用 student_summaries** | AI 无法了解用户的学习模式和历史 |
| **未使用 gaia_context_variables** | 每次请求都缺乏个性化上下文 |
| **对话历史截断为 5 条** | 长对话中上下文丢失严重 |
| **无摘要传递机制** | N8N 工作流无法获取已生成的行为摘要 |

---

## 4. 数据库表结构

### 4.1 student_summaries（学生摘要表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `user_id` | uuid | 用户 ID |
| `personality_traits` | text | 性格特征（AI 分析） |
| `learning_style` | text | 学习风格 |
| `strengths` | text | 优势领域 |
| `areas_for_growth` | text | 成长空间 |
| `course_summaries` | jsonb | **三维度摘要数据**（对话/课程/项目） |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### 4.2 gaia_context_variables（上下文缓存表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `user_id` | uuid | 用户 ID |
| `course_system_id` | text | 课程系统 ID |
| `student_profile` | text | 学生画像文本 |
| `course_learning_summary` | text | 课程学习摘要 |
| `valid_until` | timestamp | 缓存有效期（7 天） |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### 4.3 gaia_conversations（对话记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `user_id` | uuid | 用户 ID |
| `session_id` | text | 会话标识 |
| `messages` | jsonb | 完整对话历史 |
| `message_count` | integer | 消息数量 |
| `is_active` | boolean | 是否活跃 |
| `title` | text | 对话标题 |

---

## 5. 当前数据统计

```sql
-- 活跃对话统计（2024 年数据）
SELECT
  COUNT(*) as total_conversations,           -- 19 个活跃对话
  AVG(message_count) as avg_messages,        -- 平均 10.4 条消息
  MAX(message_count) as max_messages         -- 最多 43 条消息
FROM gaia_conversations
WHERE is_active = true;
```

| 指标 | 数值 |
|------|------|
| 活跃对话数 | 19 |
| 平均消息数 | 10.4 |
| 最大消息数 | 43 |

---

## 6. N8N 工作流优化建议

### 6.1 可利用的现有基础设施

1. **student_summaries.course_summaries**
   - 已有每日更新的对话行为摘要
   - 包含用户提问模式、关注领域、理解障碍的 AI 分析
   - 可直接作为 N8N 工作流的系统提示词补充

2. **gaia_context_variables 缓存**
   - 已有每周更新的学生画像和学习摘要
   - 7 天有效期，可即时查询
   - 可作为对话开始时的上下文初始化

3. **增量摘要机制**
   - 只处理新数据，计算开销已优化
   - 可考虑在对话结束时触发增量更新

### 6.2 建议的优化方案

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       优化后的 N8N 工作流架构                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   用户消息 ──▶ /api/gaia/chat ──┐                                       │
│                                  │                                       │
│   ┌──────────────────────────────▼──────────────────────────────────┐   │
│   │                     上下文组装层                                 │   │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│   │  │gaia_context_vars │  │student_summaries│  │最近 N 条对话    │  │   │
│   │  │  (学生画像)      │  │ (行为摘要)      │  │  (实时历史)     │  │   │
│   │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │   │
│   │           └────────────────────┼────────────────────┘           │   │
│   │                                ▼                                 │   │
│   │                        组合系统提示词                            │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                        N8N 工作流                               │    │
│   │                                                                 │    │
│   │   输入：                                                        │    │
│   │   - student_profile（学生画像）                                 │    │
│   │   - dialogue_summary（对话行为摘要，200-300字）                 │    │
│   │   - recent_messages（最近 3-5 条完整消息）                      │    │
│   │   - current_message（当前用户消息）                             │    │
│   │                                                                 │    │
│   │   处理：                                                        │    │
│   │   - 无需处理大量历史记录                                        │    │
│   │   - AI 已有完整用户画像                                         │    │
│   │   - 响应时间大幅减少                                            │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 具体实施步骤

1. **修改 `/api/gaia/chat` 路由**
   ```typescript
   // 新增：获取预生成的上下文
   const { data: contextVars } = await supabase
     .from('gaia_context_variables')
     .select('student_profile, course_learning_summary')
     .eq('user_id', userId)
     .gt('valid_until', new Date().toISOString())
     .single()

   // 新增：获取对话行为摘要
   const { data: studentSummary } = await supabase
     .from('student_summaries')
     .select('course_summaries')
     .eq('user_id', userId)
     .single()

   const dialogueSummary = studentSummary?.course_summaries?.default?.dialogue?.summary

   // 修改 payload 结构
   const payload = {
     chatInput: message,
     session_id: sessionId,
     // 精简的历史记录（只需 3-5 条）
     conversation_history: conversationHistory.slice(-5),
     // 新增：预生成的上下文
     student_profile: contextVars?.student_profile,
     dialogue_summary: dialogueSummary,
     course_learning_summary: contextVars?.course_learning_summary
   }
   ```

2. **修改 N8N 工作流**
   - 接收新的 `student_profile`、`dialogue_summary` 字段
   - 将这些内容整合到系统提示词中
   - 减少对长历史记录的依赖

3. **优化效果预估**
   - Token 使用量：减少 60-80%（摘要代替完整历史）
   - 响应时间：预计减少 40-60%
   - 上下文质量：提升（AI 分析的摘要比原始记录更有价值）

---

## 7. 总结

### 现有资源清单

| 资源 | 状态 | 可用性 |
|------|------|--------|
| 用户行为三维度摘要 | 每日更新 | 可直接使用 |
| 学生画像缓存 | 每周更新 | 可直接使用 |
| 课程学习摘要 | 每周更新 | 可直接使用 |
| 增量更新机制 | 已实现 | 可扩展 |

### 未使用的能力

当前 `/api/gaia/chat` **完全没有使用**上述任何预生成数据，这是性能优化的最大机会点。

### 推荐的优化优先级

1. **高优先级**：在 API 层整合 `gaia_context_variables` 缓存
2. **中优先级**：传递 `dialogue_summary` 到 N8N 工作流
3. **低优先级**：考虑实时触发增量摘要更新（对话结束时）

---

*报告生成时间：2025-01-26*
*适用于：Opus 4.5 N8N 工作流优化决策参考*
