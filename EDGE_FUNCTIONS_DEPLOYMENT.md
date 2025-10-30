# Edge Functions 部署指南

> 学员管理系统重构 - Edge Functions部署清单
> 创建日期：2025-10-30
> 状态：待执行

---

## 📋 部署前准备

### 1. 确认环境变量

在Supabase Dashboard中配置以下环境变量：

```bash
# 进入 Supabase Dashboard > Settings > Edge Functions > Manage secrets

# 已有的环境变量（自动配置）
SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key

# 需要手动添加的环境变量
OPENAI_API_KEY=sk-xxx（你的OpenAI API密钥）
```

**重要提示**：
- `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 通常已自动配置
- `OPENAI_API_KEY` 需要手动添加，用于AI生成学员综合评价

---

## 📦 Edge Functions 列表

### Function 1: calculate-relative-level
- **功能**：计算所有学员的相对意识等级（1-7级）
- **触发方式**：每周日凌晨2点自动运行 或 手动触发
- **依赖**：数据库函数 `calculate_all_student_levels()`
- **文件位置**：`supabase/functions/calculate-relative-level/index.ts`

### Function 2: generate-student-summary
- **功能**：为所有学员生成AI综合评价
- **触发方式**：每周日凌晨3点自动运行 或 手动触发
- **依赖**：OpenAI API (gpt-4o-mini)
- **文件位置**：`supabase/functions/generate-student-summary/index.ts`

### Function 3: generate-gaia-variables
- **功能**：为所有学员生成盖亚N8N对话变量
- **触发方式**：每周日凌晨4点自动运行 或 手动触发
- **依赖**：student_summaries表数据
- **文件位置**：`supabase/functions/generate-gaia-variables/index.ts`

---

## 🚀 部署步骤

### 方式一：使用Supabase CLI（推荐）

#### 前提条件
```bash
# 1. 确认已安装Supabase CLI
supabase --version

# 2. 如未安装，请先安装
# Windows:
scoop install supabase

# Mac:
brew install supabase/tap/supabase

# 3. 登录
supabase login
```

#### 部署命令

```bash
# 进入项目目录
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 部署所有Edge Functions（推荐）
supabase functions deploy calculate-relative-level
supabase functions deploy generate-student-summary
supabase functions deploy generate-gaia-variables

# 或者一次性部署所有
supabase functions deploy
```

#### 验证部署

```bash
# 查看已部署的函数列表
supabase functions list

# 查看函数日志
supabase functions logs calculate-relative-level
```

---

### 方式二：使用MCP工具部署（已完成）

**注意**：calculate-relative-level 已使用MCP工具部署成功。

如需重新部署或部署其他函数，可使用以下步骤：

```typescript
// 使用mcp__supabase__deploy_edge_function工具
// 参数：
// - name: 函数名称
// - entrypoint_path: "index.ts"
// - files: [{name: "index.ts", content: "文件内容"}]
```

---

## ⏰ 配置定时任务（pg_cron）

部署完Edge Functions后，需要配置定时任务自动执行。

### 执行SQL配置

在Supabase SQL Editor中执行以下SQL：

```sql
-- ========== 定时任务1：每周日凌晨2点计算相对等级 ==========
SELECT cron.schedule(
  'calculate-relative-level-weekly',
  '0 2 * * 0',  -- 每周日凌晨2点（cron表达式）
  $$
  SELECT net.http_post(
    url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ========== 定时任务2：每周日凌晨3点生成AI综合评价 ==========
SELECT cron.schedule(
  'generate-student-summary-weekly',
  '0 3 * * 0',  -- 每周日凌晨3点
  $$
  SELECT net.http_post(
    url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-student-summary',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ========== 定时任务3：每周日凌晨4点生成盖亚N8N变量 ==========
SELECT cron.schedule(
  'generate-gaia-variables-weekly',
  '0 4 * * 0',  -- 每周日凌晨4点
  $$
  SELECT net.http_post(
    url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/generate-gaia-variables',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings')::json->>'service_role_key',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ========== 定时任务4：每天凌晨1点更新课程分组 ==========
SELECT cron.schedule(
  'update-course-groups-daily',
  '0 1 * * *',  -- 每天凌晨1点
  'SELECT auto_create_course_groups();'
);
```

### 查看已配置的定时任务

```sql
-- 查看所有定时任务
SELECT * FROM cron.job;

-- 查看定时任务执行历史
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 删除定时任务（如需重新配置）

```sql
-- 删除指定任务
SELECT cron.unschedule('calculate-relative-level-weekly');
SELECT cron.unschedule('generate-student-summary-weekly');
SELECT cron.unschedule('generate-gaia-variables-weekly');
SELECT cron.unschedule('update-course-groups-daily');
```

---

## ✅ 部署验证清单

### 1. 环境变量检查
- [ ] SUPABASE_URL 已配置
- [ ] SUPABASE_SERVICE_ROLE_KEY 已配置
- [ ] OPENAI_API_KEY 已配置

### 2. Edge Functions部署检查
- [ ] calculate-relative-level 部署成功
- [ ] generate-student-summary 部署成功
- [ ] generate-gaia-variables 部署成功

### 3. 定时任务配置检查
- [ ] calculate-relative-level-weekly 已配置
- [ ] generate-student-summary-weekly 已配置
- [ ] generate-gaia-variables-weekly 已配置
- [ ] update-course-groups-daily 已配置

### 4. 功能测试（见TESTING_GUIDE.md）
- [ ] 手动触发等级计算成功
- [ ] 手动触发AI评价生成成功
- [ ] 手动触发N8N变量生成成功
- [ ] 查看执行日志无错误

---

## 🐛 常见问题

### Q1: 部署时提示 "Missing environment variables"
**解决**：检查Supabase Dashboard > Settings > Edge Functions > Manage secrets，确保所有环境变量已配置。

### Q2: 定时任务未执行
**解决**：
1. 检查 `SELECT * FROM cron.job` 确认任务已创建
2. 检查 `SELECT * FROM cron.job_run_details` 查看执行历史和错误信息
3. 确认Edge Function URL正确

### Q3: AI评价生成失败
**解决**：
1. 检查OPENAI_API_KEY是否正确
2. 检查OpenAI账户余额
3. 查看Edge Function日志：`supabase functions logs generate-student-summary`

### Q4: Service Role Key在哪里找？
**解决**：Supabase Dashboard > Settings > API > Project API keys > service_role (secret)

---

## 📝 部署后确认

部署完成后，请执行以下确认步骤（详见TESTING_GUIDE.md）：

1. 手动触发每个Edge Function，确认返回成功
2. 检查数据库表是否正确更新
3. 查看Edge Function执行日志
4. 确认定时任务已正确配置

---

*文档版本：1.0*
*最后更新：2025-10-30*
*负责人：Claude Code*
