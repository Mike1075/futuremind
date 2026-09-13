# 用户学习行为总结 Edge Function

## 功能概述

这个 Edge Function 用于定期总结用户的学习行为，为后续生成"意识进化树"提供原材料。

总结维度包括：

1. **对话维度 (Dialogue)** - 分析用户在盖亚对话和聊天系统中的表现
2. **作业维度 (Coursework)** - 分析用户的作业提交和课程互动情况
3. **项目维度 (Projects)** - 分析用户参与的PBL项目学习情况

## 技术架构

### 数据源表

| 维度 | 源表 | 说明 |
|------|------|------|
| 对话 | `gaia_conversations` | 盖亚AI对话记录 |
| 对话 | `chat_history` | 项目聊天历史 |
| 作业 | `user_submissions` | 用户作业提交记录 |
| 作业 | `user_content_interactions` | 用户内容互动追踪 |
| 项目 | `user_selected_projects` | 用户选择的PBL项目 |
| 项目 | `pbl_project_enrollments` | PBL项目注册记录 |

### 目标存储表

- `student_summaries.course_summaries` (JSONB字段)

### 数据结构

```typescript
{
  dialogue: {
    summary: string,              // AI生成的对话维度总结 (200-300字)
    last_summarized_at: string,   // 上次总结时间
    conversation_count: number,   // 对话数量
    message_count: number         // 消息数量
  },
  coursework: {
    summary: string,              // AI生成的作业维度总结 (200-300字)
    last_summarized_at: string,
    submission_count: number,     // 作业提交数量
    interaction_count: number     // 互动次数
  },
  projects: {
    summary: string,              // AI生成的项目维度总结 (200-300字)
    last_summarized_at: string,
    active_project_count: number, // 活跃项目数
    total_project_count: number   // 总项目数
  },
  last_full_update: string        // 上次完整更新时间
}
```

## 增量更新策略

Edge Function 采用增量更新策略，仅处理自 `last_summarized_at` 以来的新数据：

1. 读取 `student_summaries.course_summaries` 中的现有总结
2. 提取各维度的 `last_summarized_at` 时间戳
3. 仅查询该时间戳之后的数据
4. 使用 AI 生成新的总结
5. 更新 `last_summarized_at` 为当前时间

## AI Prompt 设计

### 对话维度 Prompt

```
你是一位资深的教育心理学家和对话分析专家。

任务: 分析学生的对话记录，总结其在对话中展现的特点。

分析维度:
1. 思维深度: 学生是否提出深刻的问题？是否能进行抽象思考？
2. 情感表达: 学生如何表达情感？是否开放、真诚？
3. 好奇心: 学生对哪些主题特别感兴趣？探索的广度和深度如何？
4. 反思能力: 学生是否能够自我反思和成长？

输出要求:
- 200-300字的总结
- 客观、具体，避免空洞的评价
- 用第三人称描述
- 重点关注亮点和特色
```

### 作业维度 Prompt

```
你是一位资深的教育评估专家。

任务: 分析学生的作业提交和课程互动情况，总结其学习表现。

分析维度:
1. 学习态度: 提交频率、完成质量、是否认真对待作业
2. 内容深度: 作业内容是否深入？是否有独特见解？
3. 学习习惯: 互动频率、浏览深度、是否主动探索
4. 成长轨迹: 从早期到近期，是否有明显进步？

输出要求:
- 200-300字的总结
- 客观、具体，基于数据说话
- 既要肯定优点，也要指出成长空间
```

### 项目维度 Prompt

```
你是一位资深的PBL项目导师和教育评估专家。

任务: 分析学生的PBL项目参与情况，总结其项目学习表现。

分析维度:
1. 项目选择: 学生选择了哪些类型的项目？是否多样化？
2. 参与深度: 项目进度如何？是否持续投入？
3. 完成质量: 已完成项目的质量和成果如何？
4. 学习策略: 是否同时参与多个项目？是否专注于某个领域？

输出要求:
- 200-300字的总结
- 客观、具体，基于数据说话
- 重点关注项目学习带来的成长
```

## 部署步骤

### 1. 确保环境变量已配置

在 Supabase Dashboard > Settings > Edge Functions 中配置：

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. 部署 Edge Function

```bash
# 进入项目目录
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 部署函数
npx supabase functions deploy summarize-user-activity
```

### 3. 测试函数

```bash
# 测试单个用户的所有维度
curl -X POST 'https://your-project.supabase.co/functions/v1/summarize-user-activity' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "user-uuid-here"}'

# 测试单个维度
curl -X POST 'https://your-project.supabase.co/functions/v1/summarize-user-activity' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "user-uuid-here", "dimensions": ["dialogue"]}'
```

## API 接口

### 请求格式

```typescript
POST /functions/v1/summarize-user-activity

{
  "userId": "uuid",                                    // 必需: 用户ID
  "dimensions": ["dialogue", "coursework", "projects"] // 可选: 要总结的维度，默认全部
}
```

### 响应格式

```typescript
{
  "success": true,
  "userId": "uuid",
  "dimensions": ["dialogue", "coursework", "projects"],
  "results": {
    "dialogue": { /* 对话总结 */ },
    "coursework": { /* 作业总结 */ },
    "projects": { /* 项目总结 */ },
    "last_full_update": "2025-01-21T12:00:00Z"
  }
}
```

## 调度建议

### 方式一: 使用 Supabase Cron Jobs (推荐)

创建一个 Database Function + Trigger 来定期调用 Edge Function：

```sql
-- 创建定时任务函数
CREATE OR REPLACE FUNCTION trigger_weekly_summaries()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- 遍历所有活跃用户
  FOR user_record IN
    SELECT DISTINCT id FROM profiles
    WHERE role = 'student'
  LOOP
    -- 调用 Edge Function (需要使用 pg_net 扩展)
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/summarize-user-activity',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('userId', user_record.id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用 pg_cron 每周日凌晨2点执行
SELECT cron.schedule(
  'weekly-user-summaries',
  '0 2 * * 0',  -- 每周日凌晨2点
  $$SELECT trigger_weekly_summaries()$$
);
```

### 方式二: 使用外部调度工具

- GitHub Actions
- Vercel Cron
- AWS EventBridge
- n8n Workflows

## 监控与日志

函数执行时会输出详细的控制台日志：

```
[开始总结] 用户ID: xxx, 维度: dialogue, coursework, projects
[现有总结] 存在
[对话维度] 开始处理...
[对话数据] 盖亚对话: 5条, 聊天历史: 23条
[对话总结] 完成, 长度: 287字
[作业维度] 开始处理...
[作业数据] 提交: 12条, 互动: 45条
[作业总结] 完成, 长度: 265字
[项目维度] 开始处理...
[项目数据] 选择项目: 3个, PBL注册: 2个
[项目总结] 完成, 长度: 298字
[总结完成] 用户ID: xxx
```

可以在 Supabase Dashboard > Functions > summarize-user-activity > Logs 中查看日志。

## 错误处理

- 如果 OpenAI API 调用失败，函数会返回 500 错误
- 如果用户ID不存在，会创建新的总结记录
- 如果某个维度无新数据，会跳过该维度的总结，保留旧数据
- 数据库操作失败会记录详细错误日志

## 注意事项

1. **API 费用**: 使用 GPT-4o-mini 生成总结，每次调用约消耗 0.001-0.003 美元
2. **执行时间**: 处理单个用户约需 5-10 秒，建议分批处理大量用户
3. **数据隐私**: 函数使用 Service Role Key，确保密钥安全
4. **增量更新**: 如需重新生成全部总结，可以手动删除 `student_summaries` 中的记录

## 后续优化

- [ ] 添加批量处理接口 (一次处理多个用户)
- [ ] 实现总结质量评分机制
- [ ] 支持自定义 AI Prompt
- [ ] 添加总结历史版本记录
- [ ] 实现总结差异对比功能
