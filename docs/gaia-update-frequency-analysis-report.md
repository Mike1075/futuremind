# Gaia 数据更新频率分析报告

> 本报告分析当前摘要/缓存数据的更新机制，并提出基于用户活跃度的动态更新策略。

## 1. 当前状态诊断

### 1.1 实际配置的定时任务

通过查询 `cron.job` 表，发现**只有一个**定时任务被配置：

```sql
SELECT jobname, schedule FROM cron.job;
```

| 任务名 | 计划 | 状态 |
|--------|------|------|
| `daily-learning-summary` | `0 23 * * *`（每天 23:00） | 已配置 |
| `generate-student-summary-weekly` | `0 3 * * 0`（每周日 03:00） | **未配置** |
| `generate-gaia-variables-weekly` | `0 4 * * 0`（每周日 04:00） | **未配置** |
| `summarize-user-activity` | - | **未配置（需手动调用）** |

### 1.2 数据表实际状态

#### student_summaries 表

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     student_summaries 数据分析                           │
├──────────────────────────────────────────────────────────────────────────┤
│  记录数: 6 条                                                            │
│  最新更新: 2025-11-25                                                    │
│  更新模式: 手动触发（非定时）                                             │
│                                                                          │
│  问题: 部分记录的 dialogue_last_update 为 NULL，                         │
│        说明对话摘要从未生成过                                             │
└──────────────────────────────────────────────────────────────────────────┘
```

#### gaia_context_variables 表

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  gaia_context_variables 数据分析                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                          ⚠️ 表为空 ⚠️                                    │
│                                                                          │
│  generate-gaia-variables 函数从未被执行过！                              │
│  所有课程上下文变量（teaching_goals, guidance_keywords）均不存在         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 用户活跃度分析（最近30天）

| 用户 | 对话数 | 消息总数 | 最后活跃 | 活跃等级 |
|------|--------|----------|----------|----------|
| 用户A | 1 | 19 | 2025-11-25 | 高 |
| 用户B | 1 | 11 | 2025-11-25 | 中高 |
| 用户C | 1 | 9 | 2025-11-24 | 中 |
| 用户D | 1 | 7 | 2025-11-24 | 中 |
| 用户E | 1 | 5 | 2025-11-25 | 低 |

**发现**：用户活跃度差异明显（5-19条消息），但当前系统对所有用户一视同仁。

## 2. 当前机制的问题

### 2.1 问题总结

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          当前问题矩阵                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  问题1: 定时任务未配置                                                  │
│  ├─ generate-gaia-variables-weekly 未配置                               │
│  ├─ generate-student-summary-weekly 未配置                              │
│  └─ 导致：gaia_context_variables 表为空，上下文缓存完全不可用           │
│                                                                         │
│  问题2: 固定频率更新策略                                                │
│  ├─ 文档设计：每周日更新所有用户                                        │
│  ├─ 高频用户问题：每天聊10+条，却要等一周才更新摘要                     │
│  └─ 低频用户问题：一个月不来，也每周白白执行更新                        │
│                                                                         │
│  问题3: 资源浪费                                                        │
│  ├─ 每次更新都遍历所有用户 × 所有课程                                   │
│  ├─ AI API 调用成本（GPT-4o-mini）                                      │
│  └─ 不活跃用户占用大量无效计算资源                                      │
│                                                                         │
│  问题4: 时效性差                                                        │
│  ├─ 用户刚聊完一段深度对话，AI 看不到最新摘要                           │
│  └─ 要等到下个更新周期才能反映最新行为                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 比喻说明

```
当前机制：
  就像一个健身房，不管你来不来锻炼，
  教练每周日都给你写一份训练报告。

  - 天天来的会员：报告总是过时的（周一到周六的进步看不到）
  - 一年不来的会员：教练还是每周写报告（浪费时间）

理想机制：
  教练在你每次锻炼后，根据训练强度决定何时更新报告。

  - 高强度训练后：当天就更新
  - 偶尔来一次：下次来之前更新即可
```

## 3. 推荐方案：事件驱动 + 智能调度

### 3.1 核心设计原则

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      动态更新策略设计原则                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   原则1: 事件驱动（Event-Driven）                                       │
│   └─ 用户产生新行为时，触发更新评估                                     │
│                                                                         │
│   原则2: 增量阈值（Delta Threshold）                                    │
│   └─ 只有当新数据量达到阈值时，才真正执行 AI 摘要                       │
│                                                                         │
│   原则3: 时间衰减（Time Decay）                                         │
│   └─ 数据越旧，更新优先级越高                                           │
│                                                                         │
│   原则4: 延迟执行（Lazy Evaluation）                                    │
│   └─ 在用户发起对话时检查并更新，而非定时全量更新                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 方案架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     动态更新架构                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      触发器层（Triggers）                        │  │
│   │                                                                  │  │
│   │   用户行为事件:                                                  │  │
│   │   ├─ 对话消息发送 → 更新 messages_since_last_summary 计数器     │  │
│   │   ├─ 作业提交 → 更新 submissions_since_last_summary             │  │
│   │   └─ 项目活动 → 更新 activities_since_last_summary              │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    更新检查层（Check Layer）                     │  │
│   │                                                                  │  │
│   │   在 /api/gaia/chat 调用时:                                      │  │
│   │   ┌─────────────────────────────────────────────────────────┐   │  │
│   │   │  shouldUpdateSummary(userId) {                          │   │  │
│   │   │    // 检查增量数据量                                     │   │  │
│   │   │    if (messages_since_last_summary >= 10) return true;  │   │  │
│   │   │                                                          │   │  │
│   │   │    // 检查时间衰减                                       │   │  │
│   │   │    if (daysSinceLastSummary >= 7 &&                      │   │  │
│   │   │        messages_since_last_summary >= 3) return true;    │   │  │
│   │   │                                                          │   │  │
│   │   │    // 检查是否完全没有摘要                               │   │  │
│   │   │    if (!hasSummary) return true;                         │   │  │
│   │   │                                                          │   │  │
│   │   │    return false;                                         │   │  │
│   │   │  }                                                       │   │  │
│   │   └─────────────────────────────────────────────────────────┘   │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    异步更新层（Async Update）                    │  │
│   │                                                                  │  │
│   │   if (shouldUpdate) {                                            │  │
│   │     // 异步触发更新，不阻塞当前对话                              │  │
│   │     triggerAsyncSummaryUpdate(userId);                           │  │
│   │                                                                  │  │
│   │     // 当前对话仍使用旧摘要（或无摘要）                          │  │
│   │     // 下次对话时使用新摘要                                      │  │
│   │   }                                                              │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 更新阈值设计

| 条件 | 阈值 | 说明 |
|------|------|------|
| **消息数量触发** | 10 条新消息 | 高频用户，对话量大，需要及时更新 |
| **时间 + 消息触发** | 7天 + 3条新消息 | 中频用户，有一定活跃度 |
| **时间触发** | 30天（无论消息数） | 兜底策略，防止摘要过于陈旧 |
| **首次触发** | 1条消息 | 新用户，需要立即生成画像 |

### 3.4 实现方案

#### 方案 A：数据库触发器 + 计数器（推荐）

```sql
-- 1. 添加计数器字段到 student_summaries 表
ALTER TABLE student_summaries ADD COLUMN IF NOT EXISTS
  messages_since_last_summary INTEGER DEFAULT 0;

ALTER TABLE student_summaries ADD COLUMN IF NOT EXISTS
  last_checked_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 创建触发器：对话消息增加时更新计数器
CREATE OR REPLACE FUNCTION increment_message_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新该用户的消息计数器
  UPDATE student_summaries
  SET messages_since_last_summary = messages_since_last_summary + 1
  WHERE user_id = NEW.user_id;

  -- 如果记录不存在，创建新记录
  IF NOT FOUND THEN
    INSERT INTO student_summaries (user_id, messages_since_last_summary)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET messages_since_last_summary = student_summaries.messages_since_last_summary + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 绑定触发器到 gaia_conversations 表的更新
CREATE TRIGGER on_conversation_updated
AFTER UPDATE OF messages ON gaia_conversations
FOR EACH ROW
EXECUTE FUNCTION increment_message_counter();
```

#### 方案 B：API 层检查（轻量级）

```typescript
// 在 /api/gaia/chat 中添加检查逻辑
async function checkAndTriggerSummaryUpdate(userId: string, supabase: any) {
  // 获取用户摘要状态
  const { data: summary } = await supabase
    .from('student_summaries')
    .select('generated_at, messages_since_last_summary')
    .eq('user_id', userId)
    .maybeSingle()

  const shouldUpdate = evaluateShouldUpdate(summary)

  if (shouldUpdate) {
    // 异步触发更新（不等待结果）
    fetch(`${SUPABASE_URL}/functions/v1/summarize-user-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ userId })
    }).catch(err => console.error('Async summary update failed:', err))
  }
}

function evaluateShouldUpdate(summary: any): boolean {
  if (!summary) return true  // 无摘要，需要生成

  const messageCount = summary.messages_since_last_summary || 0
  const daysSinceUpdate = summary.generated_at
    ? (Date.now() - new Date(summary.generated_at).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity

  // 阈值判断
  if (messageCount >= 10) return true           // 消息量大
  if (daysSinceUpdate >= 7 && messageCount >= 3) return true  // 中频
  if (daysSinceUpdate >= 30) return true        // 兜底

  return false
}
```

### 3.5 资源优化对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         资源使用对比                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   场景: 100 个注册用户，其中 10 个活跃用户                              │
│                                                                         │
│   【当前方案：固定每周全量更新】                                        │
│   ├─ 每周 AI 调用次数: 100 用户 × 3 维度 = 300 次                       │
│   ├─ 每月 AI 调用次数: 300 × 4 = 1200 次                                │
│   └─ 浪费比例: 90%（90 个不活跃用户的无效更新）                         │
│                                                                         │
│   【优化方案：事件驱动 + 阈值】                                         │
│   ├─ 每周 AI 调用次数: ~10 活跃用户 × 3 维度 × 1-2 次 = 30-60 次        │
│   ├─ 每月 AI 调用次数: ~120-240 次                                      │
│   └─ 节省比例: 80-90%                                                   │
│                                                                         │
│   【额外好处】                                                          │
│   ├─ 高频用户：摘要更及时（每 10 条消息更新，而非每周）                 │
│   ├─ 低频用户：不浪费资源（只在活跃时更新）                             │
│   └─ 新用户：立即生成画像（无需等到下周日）                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4. 实施建议

### 4.1 紧急优先级（立即执行）

1. **配置缺失的 cron 任务**（如果决定保留定时更新作为兜底）
   ```sql
   -- 配置 generate-gaia-variables（课程上下文缓存）
   SELECT cron.schedule(
     'generate-gaia-variables-weekly',
     '0 4 * * 0',
     $$ SELECT net.http_post(...) $$
   );
   ```

2. **手动执行一次 generate-gaia-variables**
   - 当前 `gaia_context_variables` 表为空
   - 所有课程上下文缓存不可用

### 4.2 中期优化（1-2周内）

1. 实现消息计数器机制（方案 A 或 B）
2. 在 `/api/gaia/chat` 中添加更新检查逻辑
3. 测试动态更新效果

### 4.3 长期演进

1. 添加用户活跃度评分系统
2. 实现更智能的更新调度（机器学习预测）
3. 监控和分析更新效果，持续优化阈值

## 5. 总结

### 5.1 关键发现

| 发现 | 影响 |
|------|------|
| `gaia_context_variables` 表为空 | 课程上下文缓存完全不可用 |
| 定时任务未完整配置 | 设计的自动更新机制失效 |
| 固定频率更新策略 | 高频用户时效性差，低频用户浪费资源 |

### 5.2 核心建议

**从"固定频率"转向"事件驱动"**：

```
用户活跃 → 行为计数 → 阈值检查 → 触发更新 → 重置计数
     ↑                                          │
     └──────────────────────────────────────────┘
```

**好处**：
- 高频用户：摘要更及时（每 10 条消息更新 vs 每周更新）
- 低频用户：按需更新，节省资源
- 新用户：立即生成，无需等待

---

*报告生成时间：2025-01-26*
*目的：供 Opus 4.5 评估更新频率优化方案*
