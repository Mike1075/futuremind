# 部署用户学习行为总结 Edge Function 指南

## 概述

本指南将帮助您部署 `summarize-user-activity` Edge Function，用于定期总结用户的学习行为数据。

## 前置准备

### 1. 确认环境变量

确保 Supabase 项目中已配置以下环境变量：

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**配置位置**: Supabase Dashboard → Settings → Edge Functions → Secrets

### 2. 安装 Supabase CLI

```bash
# 如果尚未安装
npm install -g supabase

# 登录 Supabase
npx supabase login
```

## 部署步骤

### 步骤 1: 确认文件结构

确保以下文件存在：

```
futuremind-new/
└── supabase/
    └── functions/
        └── summarize-user-activity/
            ├── index.ts
            └── README.md
```

### 步骤 2: 部署 Edge Function

```bash
# 进入项目根目录
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 链接到 Supabase 项目 (如果尚未链接)
npx supabase link --project-ref lvjezsnwesyblnlkkirz

# 部署函数
npx supabase functions deploy summarize-user-activity

# 查看部署状态
npx supabase functions list
```

**预期输出**:

```
Deploying Function summarize-user-activity (project ref: lvjezsnwesyblnlkkirz)
Bundled summarize-user-activity in 234ms
Deployed Function summarize-user-activity in 1.2s
Function URL: https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/summarize-user-activity
```

### 步骤 3: 测试函数

#### 3.1 获取测试用户 ID

```sql
-- 在 Supabase SQL Editor 中执行
SELECT id, email, full_name
FROM profiles
WHERE role = 'student'
LIMIT 1;
```

#### 3.2 测试 Edge Function

使用 curl 或 Postman 测试：

```bash
# 替换 YOUR_USER_ID 为实际用户 ID
# 替换 YOUR_ANON_KEY 为项目的 anon key

curl -X POST \
  'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/summarize-user-activity' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "YOUR_USER_ID",
    "dimensions": ["dialogue"]
  }'
```

**预期响应**:

```json
{
  "success": true,
  "userId": "...",
  "dimensions": ["dialogue"],
  "results": {
    "dialogue": {
      "summary": "该学生在对话中展现出...",
      "last_summarized_at": "2025-01-21T12:00:00Z",
      "conversation_count": 5,
      "message_count": 23
    },
    "coursework": null,
    "projects": null,
    "last_full_update": "2025-01-21T12:00:00Z"
  }
}
```

### 步骤 4: 验证数据库存储

```sql
-- 查看总结数据是否已保存
SELECT
  user_id,
  course_summaries,
  generated_at,
  valid_until
FROM student_summaries
WHERE user_id = 'YOUR_USER_ID';
```

## 配置定时调度

### 方案一: 使用 pg_cron (推荐)

#### 1. 启用 pg_cron 扩展

```sql
-- 在 Supabase SQL Editor 中执行
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

#### 2. 创建调度函数

```sql
-- 创建调用 Edge Function 的辅助函数
CREATE OR REPLACE FUNCTION call_summarize_user_activity(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_response jsonb;
BEGIN
  -- 使用 http 扩展调用 Edge Function
  SELECT content::jsonb INTO v_response
  FROM http((
    'POST',
    current_setting('app.supabase_url') || '/functions/v1/summarize-user-activity',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
    ],
    'application/json',
    jsonb_build_object('userId', p_user_id)::text
  ));

  RAISE NOTICE 'Summarized user %: %', p_user_id, v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建批量处理函数
CREATE OR REPLACE FUNCTION trigger_weekly_summaries()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- 遍历所有学生用户
  FOR user_record IN
    SELECT id FROM profiles
    WHERE role = 'student'
    ORDER BY id
  LOOP
    BEGIN
      PERFORM call_summarize_user_activity(user_record.id);
      processed_count := processed_count + 1;

      -- 每处理10个用户暂停1秒，避免 API 限流
      IF processed_count % 10 = 0 THEN
        PERFORM pg_sleep(1);
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to summarize user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Processed % users', processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. 配置环境变量 (在 Supabase Dashboard)

```sql
-- 设置应用配置
ALTER DATABASE postgres SET app.supabase_url = 'https://lvjezsnwesyblnlkkirz.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

#### 4. 创建定时任务

```sql
-- 每周日凌晨 2:00 执行
SELECT cron.schedule(
  'weekly-user-summaries',
  '0 2 * * 0',
  $$SELECT trigger_weekly_summaries()$$
);

-- 查看已创建的定时任务
SELECT * FROM cron.job;

-- 查看执行历史
SELECT * FROM cron.job_run_details
WHERE jobname = 'weekly-user-summaries'
ORDER BY start_time DESC
LIMIT 10;
```

#### 5. 测试定时任务

```sql
-- 立即执行一次 (用于测试)
SELECT trigger_weekly_summaries();

-- 或者针对单个用户测试
SELECT call_summarize_user_activity('YOUR_USER_ID'::UUID);
```

### 方案二: 使用 n8n Workflow

如果您已经在使用 n8n，可以创建一个 workflow：

1. **触发器**: Schedule Trigger (每周日 02:00)
2. **节点 1**: Supabase - 查询所有学生用户
3. **节点 2**: Split In Batches (每批10个)
4. **节点 3**: HTTP Request - 调用 Edge Function
5. **节点 4**: Wait (1秒)
6. **节点 5**: Loop

### 方案三: 使用 GitHub Actions

创建 `.github/workflows/weekly-summaries.yml`:

```yaml
name: Weekly User Summaries

on:
  schedule:
    - cron: '0 2 * * 0'  # 每周日 02:00 UTC
  workflow_dispatch:  # 允许手动触发

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/summarize-user-activity' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{"userId": "${{ secrets.USER_ID }}"}'
```

## 监控与维护

### 查看函数日志

**Supabase Dashboard**:
- Functions → summarize-user-activity → Logs

**CLI**:
```bash
npx supabase functions logs summarize-user-activity --tail
```

### 常见问题排查

#### 问题 1: OpenAI API 调用失败

**错误信息**: "Error: Failed to fetch OpenAI API"

**解决方案**:
1. 检查 `OPENAI_API_KEY` 是否正确配置
2. 检查 OpenAI 账户余额
3. 检查 API key 权限

#### 问题 2: 数据库查询超时

**错误信息**: "Error: Query timeout"

**解决方案**:
1. 添加查询限制 (LIMIT)
2. 优化查询索引
3. 分批处理大量数据

#### 问题 3: Edge Function 超时

**错误信息**: "Error: Function execution timed out"

**解决方案**:
- Edge Functions 有 150 秒的执行时间限制
- 建议分批处理用户，每次处理 10-20 个用户

### 性能优化建议

1. **批量处理**: 每周处理所有用户，而非实时处理
2. **限流控制**: 每处理 10 个用户暂停 1 秒
3. **数据采样**: 对话和互动数据较多时，仅分析最近 100 条
4. **缓存策略**: 利用 `last_summarized_at` 实现增量更新

## 成本估算

### OpenAI API 费用

- **模型**: GPT-4o-mini
- **每次调用**: 约 500 tokens (input) + 300 tokens (output)
- **费用**: 约 $0.002 per user per week
- **100 个用户/周**: 约 $0.20/week = $10/year

### Supabase Edge Function 费用

- **免费额度**: 500,000 invocations/month
- **超出费用**: $2 per 1M invocations
- **100 个用户/周 × 4 周**: 400 invocations/month (远低于免费额度)

## 下一步

- [ ] 测试单个用户总结
- [ ] 配置定时调度任务
- [ ] 监控首次批量执行
- [ ] 根据实际情况调整 AI Prompt
- [ ] 实现总结质量反馈机制

## 技术支持

如有问题，请联系开发团队或查看：
- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [pg_cron 文档](https://github.com/citusdata/pg_cron)
