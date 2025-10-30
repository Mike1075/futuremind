# 学员管理系统测试指南

> 如何测试Edge Functions和定时任务
> 创建日期：2025-10-30
> 状态：待执行

---

## 📋 测试概览

本文档说明如何在测试阶段手动触发定时任务和验证功能。

---

## 🧪 测试方法

### 方法一：使用curl手动触发（推荐用于测试）

#### 1. 获取Service Role Key

```bash
# 位置：Supabase Dashboard > Settings > API > Project API keys
# 复制 service_role (secret) 的值
```

#### 2. 手动触发Edge Functions

```bash
# 设置环境变量（Windows PowerShell）
$SERVICE_ROLE_KEY = "你的service_role_key"

# 或（Windows CMD）
set SERVICE_ROLE_KEY=你的service_role_key

# 或（Mac/Linux）
export SERVICE_ROLE_KEY="你的service_role_key"

# ========== 测试1：计算相对等级 ==========
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# ========== 测试2：生成AI综合评价 ==========
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-student-summary \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# ========== 测试3：生成盖亚N8N变量 ==========
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-gaia-variables \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Windows PowerShell版本**：
```powershell
# 测试1：计算相对等级
Invoke-WebRequest -Uri "https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
  }

# 测试2：生成AI综合评价
Invoke-WebRequest -Uri "https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-student-summary" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
  }

# 测试3：生成盖亚N8N变量
Invoke-WebRequest -Uri "https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-gaia-variables" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
  }
```

---

### 方法二：使用Supabase Dashboard测试

1. 进入 **Supabase Dashboard**
2. 导航到 **Edge Functions** 页面
3. 选择要测试的函数
4. 点击 **Invoke** 或 **Test** 按钮
5. 查看返回结果和日志

---

### 方法三：使用SQL直接调用

在Supabase SQL Editor中执行：

```sql
-- ========== 测试1：计算相对等级 ==========
SELECT net.http_post(
  url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);

-- ========== 测试2：生成AI综合评价 ==========
SELECT net.http_post(
  url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-student-summary',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);

-- ========== 测试3：生成盖亚N8N变量 ==========
SELECT net.http_post(
  url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-gaia-variables',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

---

### 方法四：使用Postman测试

1. **新建Request**
   - Method: `POST`
   - URL: `https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level`

2. **设置Headers**
   ```
   Authorization: Bearer 你的service_role_key
   Content-Type: application/json
   ```

3. **发送请求**，查看响应

---

## ✅ 验证步骤

### 1. 测试 calculate-relative-level

#### 执行前检查
```sql
-- 查看当前学员等级
SELECT id, full_name, consciousness_level, composite_score, percentile_rank, level_updated_at
FROM profiles
WHERE role != 'content_admin'
ORDER BY composite_score DESC
LIMIT 10;
```

#### 手动触发函数
```bash
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

#### 预期返回
```json
{
  "success": true,
  "timestamp": "2025-10-30T...",
  "total_students": 9,
  "updated_profiles": 9,
  "saved_history_records": 9,
  "level_distribution": {
    "1": 3,
    "2": 2,
    "3": 2,
    "4": 1,
    "5": 1
  },
  "message": "成功计算并更新了9位学员的意识等级"
}
```

#### 执行后验证
```sql
-- 1. 检查profiles表是否更新
SELECT id, full_name, consciousness_level, composite_score, percentile_rank, level_updated_at
FROM profiles
WHERE role != 'content_admin'
ORDER BY composite_score DESC;

-- 2. 检查历史记录表
SELECT user_id, consciousness_level, composite_score, recorded_at
FROM consciousness_level_history
ORDER BY recorded_at DESC
LIMIT 10;

-- 3. 验证等级分布是否合理
SELECT consciousness_level, COUNT(*) as count
FROM profiles
WHERE role != 'content_admin'
GROUP BY consciousness_level
ORDER BY consciousness_level;
```

---

### 2. 测试 generate-student-summary

#### 执行前检查
```sql
-- 查看是否已有AI评价
SELECT user_id, learning_style, generated_at, valid_until
FROM student_summaries
LIMIT 5;
```

#### 手动触发函数
```bash
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-student-summary \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

#### 预期返回
```json
{
  "success": true,
  "timestamp": "2025-10-30T...",
  "total_students": 9,
  "success_count": 9,
  "fail_count": 0,
  "message": "成功为9位学员生成AI综合评价"
}
```

#### 执行后验证
```sql
-- 1. 检查student_summaries表
SELECT
  user_id,
  learning_style,
  strengths,
  areas_for_growth,
  LENGTH(overall_summary) as summary_length,
  generated_at,
  valid_until
FROM student_summaries
LIMIT 5;

-- 2. 查看一个完整的AI评价
SELECT
  p.full_name,
  ss.personality_traits,
  ss.learning_style,
  ss.strengths,
  ss.areas_for_growth,
  ss.overall_summary,
  ss.course_summaries
FROM student_summaries ss
JOIN profiles p ON p.id = ss.user_id
LIMIT 1;
```

---

### 3. 测试 generate-gaia-variables

#### 执行前检查
```sql
-- 查看是否已有盖亚变量
SELECT user_id, course_system_id, generated_at, valid_until
FROM gaia_context_variables
LIMIT 5;
```

#### 手动触发函数
```bash
curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-gaia-variables \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

#### 预期返回
```json
{
  "success": true,
  "timestamp": "2025-10-30T...",
  "total_generated": 27,
  "message": "成功为9位学员生成盖亚N8N变量"
}
```

#### 执行后验证
```sql
-- 1. 检查gaia_context_variables表
SELECT
  gcv.user_id,
  p.full_name,
  cs.title as course_title,
  gcv.student_profile,
  gcv.course_learning_summary,
  gcv.course_teaching_goals,
  gcv.course_guidance_keywords,
  gcv.generated_at,
  gcv.valid_until
FROM gaia_context_variables gcv
JOIN profiles p ON p.id = gcv.user_id
JOIN course_systems cs ON cs.id = gcv.course_system_id
LIMIT 5;

-- 2. 查看一个学员在特定课程的完整变量
SELECT
  p.full_name,
  cs.title as course_title,
  gcv.student_profile,
  gcv.course_learning_summary,
  gcv.course_teaching_goals,
  gcv.course_guidance_keywords
FROM gaia_context_variables gcv
JOIN profiles p ON p.id = gcv.user_id
JOIN course_systems cs ON cs.id = gcv.course_system_id
WHERE cs.system_key = 'listening'
LIMIT 1;
```

---

## 🔍 查看日志

### Supabase CLI查看日志

```bash
# 实时查看日志（流式）
supabase functions logs calculate-relative-level --follow

# 查看最近的日志
supabase functions logs generate-student-summary --limit 100

# 查看所有函数的日志
supabase functions logs
```

### Supabase Dashboard查看日志

1. 进入 **Supabase Dashboard**
2. 导航到 **Edge Functions**
3. 选择函数
4. 点击 **Logs** 标签
5. 查看执行历史和错误信息

---

## 🐛 常见问题排查

### Q1: 函数返回401 Unauthorized
**原因**：Service Role Key错误或未提供
**解决**：
```bash
# 检查Service Role Key是否正确
echo $SERVICE_ROLE_KEY

# 重新设置
export SERVICE_ROLE_KEY="正确的key"
```

### Q2: 函数返回500错误
**原因**：函数内部错误
**解决**：
1. 查看函数日志：`supabase functions logs 函数名`
2. 检查环境变量是否正确配置
3. 检查数据库表是否存在

### Q3: AI评价生成失败
**原因**：OpenAI API Key错误或余额不足
**解决**：
1. 检查OPENAI_API_KEY是否正确
2. 检查OpenAI账户余额
3. 查看详细错误日志

### Q4: 等级计算结果全是Level 1
**原因**：没有学习数据
**解决**：这是正常的，因为测试环境中学员还没有提交作业、对话等数据。等有了真实数据后，等级会自动分布。

---

## 📊 测试数据验证

### 等级分布合理性检查

```sql
-- 应该符合赛斯理论的分布：
-- Level 1: 0-15%
-- Level 2: 16-30%
-- Level 3: 31-50%
-- Level 4: 51-70%
-- Level 5: 71-85%
-- Level 6: 86-95%
-- Level 7: 96-100%

WITH total AS (
  SELECT COUNT(*) as total_students
  FROM profiles
  WHERE role != 'content_admin'
)
SELECT
  consciousness_level,
  COUNT(*) as student_count,
  ROUND(COUNT(*) * 100.0 / total.total_students, 2) as percentage
FROM profiles, total
WHERE role != 'content_admin'
GROUP BY consciousness_level, total.total_students
ORDER BY consciousness_level;
```

### AI评价质量检查

```sql
-- 检查AI评价是否符合要求
SELECT
  p.full_name,
  LENGTH(ss.overall_summary) as summary_length,  -- 应该在200-300字
  jsonb_array_length(ss.strengths) as strengths_count,  -- 应该3-5项
  jsonb_array_length(ss.areas_for_growth) as growth_count,  -- 应该3-5项
  ss.learning_style,
  ss.generated_at
FROM student_summaries ss
JOIN profiles p ON p.id = ss.user_id;
```

---

## ✅ 完整测试清单

### Phase 1: 数据库测试
- [ ] 所有新表已创建
- [ ] RLS策略已启用
- [ ] 数据库函数运行正常
- [ ] 统计视图正常工作

### Phase 2: Edge Functions测试
- [ ] calculate-relative-level 手动触发成功
- [ ] generate-student-summary 手动触发成功
- [ ] generate-gaia-variables 手动触发成功
- [ ] 所有函数日志无错误

### Phase 3: 数据验证
- [ ] profiles表等级数据更新
- [ ] consciousness_level_history有记录
- [ ] student_summaries有AI评价
- [ ] gaia_context_variables有N8N变量
- [ ] 等级分布合理
- [ ] AI评价质量符合要求

### Phase 4: 定时任务测试
- [ ] 定时任务已配置
- [ ] 查看cron.job确认任务存在
- [ ] 等待自动执行或手动触发
- [ ] 查看cron.job_run_details确认执行成功

---

*文档版本：1.0*
*最后更新：2025-10-30*
*负责人：Claude Code*
