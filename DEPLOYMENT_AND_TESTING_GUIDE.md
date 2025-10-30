# 学员管理系统部署和检测指南

> 完整的部署步骤和功能测试清单
> 适用于：FutureMind学员管理系统重构（Phase 1-3）
> 更新日期：2025-10-30

---

## 📋 目录

1. [前置准备](#前置准备)
2. [Phase 1: 数据库迁移](#phase-1-数据库迁移)
3. [Phase 2: Edge Functions部署](#phase-2-edge-functions部署)
4. [Phase 3: 前端部署](#phase-3-前端部署)
5. [功能测试清单](#功能测试清单)
6. [常见问题排查](#常见问题排查)

---

## 前置准备

### 1. 确认环境

```bash
# 1. 检查Node.js版本（需要 >= 18）
node --version

# 2. 检查npm版本
npm --version

# 3. 检查Supabase CLI
supabase --version
```

### 2. 拉取最新代码

```bash
# 1. 拉取远程代码
git pull origin master

# 2. 确认在正确的分支
git branch

# 3. 查看最新提交
git log -1
```

### 3. 环境变量检查

确认 `.env.local` 文件包含以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Edge Functions 需要的额外变量
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
N8N_WEBHOOK_URL=your-n8n-webhook-url
```

---

## Phase 1: 数据库迁移

### 步骤1: 连接到Supabase项目

```bash
# 1. 登录Supabase（如果还没登录）
supabase login

# 2. 链接到你的项目
supabase link --project-ref your-project-ref
```

> **如何获取 project-ref**：
> - 登录 Supabase Dashboard
> - 进入你的项目
> - 在 Settings > General > Reference ID 中找到

### 步骤2: 应用数据库迁移

```bash
# 1. 应用第一个迁移（学员管理系统重构）
supabase db push --include-all

# 或者单独应用每个迁移
supabase db push supabase/migrations/003_student_management_system_refactor.sql
supabase db push supabase/migrations/004_rls_policies_and_functions.sql
```

### 步骤3: 验证迁移成功

前往 Supabase Dashboard > Database > Tables，确认以下表已创建：

**新增的8个表**：
- [x] `admins` - 管理员表
- [x] `student_groups` - 学员分组表
- [x] `course_assignments` - 课程分配表（分组级别）
- [x] `student_course_assignments` - 学员个人课程分配表
- [x] `student_summaries` - AI学员评价表
- [x] `gaia_context_variables` - Gaia上下文变量表
- [x] `user_behavior_stats` - 用户行为统计表
- [x] `consciousness_level_history` - 意识等级历史表

**修改的表**：
- [x] `profiles` - 新增字段：`composite_score`, `percentile_rank`, `level_updated_at`
- [x] `course_systems` - 新增字段：`teaching_goal`, `evaluation_strategy`

### 步骤4: 检查RLS策略

前往 Supabase Dashboard > Authentication > Policies，确认以下策略已创建：

- [x] 管理员可以查看学员列表（不含隐私字段）
- [x] 管理员不能查看对话内容（messages）
- [x] 管理员不能查看作业内容（content）
- [x] 学员只能查看自己的数据

### 步骤5: 检查数据库函数

前往 Supabase Dashboard > Database > Functions，确认以下函数已创建：

- [x] `calculate_all_student_levels()` - 计算所有学员的综合评分和相对等级
- [x] `auto_create_course_groups()` - 自动创建课程等级分组

---

## Phase 2: Edge Functions部署

### 步骤1: 设置Edge Functions环境变量

```bash
# 1. 设置OpenAI API Key
supabase secrets set OPENAI_API_KEY=your-openai-api-key

# 2. 设置N8N Webhook URL
supabase secrets set N8N_WEBHOOK_URL=your-n8n-webhook-url

# 3. 验证secrets已设置
supabase secrets list
```

### 步骤2: 部署Edge Functions

```bash
# 部署所有Edge Functions
supabase functions deploy calculate-relative-level
supabase functions deploy generate-student-summary
supabase functions deploy generate-gaia-variables
```

### 步骤3: 验证Edge Functions部署成功

```bash
# 查看已部署的函数列表
supabase functions list
```

你应该看到3个函数：
- [x] `calculate-relative-level`
- [x] `generate-student-summary`
- [x] `generate-gaia-variables`

### 步骤4: 配置定时任务（pg_cron）

前往 Supabase Dashboard > Database > Extensions，启用 `pg_cron` 扩展。

然后在 SQL Editor 中执行以下SQL：

```sql
-- 每天凌晨2点计算所有学员的等级
SELECT cron.schedule(
  'calculate-student-levels-daily',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/calculate-relative-level',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 验证定时任务已创建
SELECT * FROM cron.job;
```

---

## Phase 3: 前端部署

### 步骤1: 安装依赖

```bash
npm install
```

### 步骤2: 本地开发测试

```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

### 步骤3: 创建管理员账号

在Supabase Dashboard > Authentication > Users 中：

1. 创建一个新用户（或使用现有用户）
2. 复制用户的 UUID
3. 前往 Database > Tables > `admins` 表
4. 插入一条新记录：

```sql
INSERT INTO admins (id, full_name, email, role, can_manage_teachers, permissions)
VALUES (
  'your-user-uuid',
  '管理员姓名',
  'admin@example.com',
  'principal',
  true,
  jsonb_build_object(
    'view_students', true,
    'manage_groups', true,
    'assign_courses', true,
    'view_analytics', true
  )
);
```

### 步骤4: 测试管理员登录

1. 访问 `http://localhost:3000/login`
2. 使用刚创建的管理员账号登录
3. 登录后应该自动跳转到 `/admin` 页面

### 步骤5: 构建生产版本（可选）

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## 功能测试清单

### 1. 学员管理（/admin/students）

**列表页面测试**：
- [ ] 页面正常加载，显示学员列表
- [ ] 搜索功能：输入姓名或邮箱可以搜索
- [ ] 等级筛选：选择Level 1-7可以过滤
- [ ] 排序功能：按评分排序、按注册时间排序
- [ ] 分页功能：上一页、下一页按钮正常工作
- [ ] 点击学员卡片可以进入详情页

**详情页面测试**：
- [ ] 页面正常加载，显示学员详细信息
- [ ] Tab 1 - 概览：显示AI评价、性格特点、学习风格
- [ ] Tab 2 - 统计：显示行为统计表格
- [ ] Tab 3 - 进度：显示课程进度百分比条
- [ ] Tab 4 - 历程：显示等级变化历史
- [ ] 顶部卡片显示：综合评分、对话数、作业数、课程进度
- [ ] **隐私保护验证**：不显示对话内容、不显示作业内容

### 2. 分组管理（/admin/groups）

**列表页面测试**：
- [ ] 页面正常加载，显示分组列表
- [ ] 搜索功能：输入分组名称或描述可以搜索
- [ ] 创建分组：点击"创建分组"按钮，填写表单，成功创建
- [ ] 分组卡片显示：名称、类型、学员数、课程数
- [ ] 点击分组卡片可以进入详情页

**详情页面测试**：
- [ ] 页面正常加载，显示分组详细信息
- [ ] Tab 1 - 学员列表：显示分组内所有学员
- [ ] Tab 2 - 课程分配：显示分配给该分组的课程
- [ ] Tab 3 - 统计数据：显示等级分布条形图
- [ ] 编辑分组：点击编辑按钮，修改名称和描述，成功保存
- [ ] 删除分组：点击删除按钮（空分组可删除，有学员的分组不可删除）
- [ ] 系统自动分组（auto_level）不可编辑和删除

### 3. 课程分配（/admin/assignments）

**分组分配测试**：
- [ ] 页面正常加载，显示分组分配列表
- [ ] 创建分配：选择分组、选择课程、添加备注、成功创建
- [ ] 分配列表显示：课程名称、分组名称、学员数
- [ ] 显示分配人和分配时间
- [ ] 删除分配：点击删除按钮，确认后成功删除
- [ ] 重复分配保护：同一课程不能重复分配给同一分组

**个人分配测试**：
- [ ] 切换到"个人分配"Tab
- [ ] 创建分配：选择学员、选择课程、添加备注、成功创建
- [ ] 分配列表显示：课程名称、学员姓名、等级
- [ ] 删除分配：点击删除按钮，确认后成功删除
- [ ] 重复分配保护：同一课程不能重复分配给同一学员

### 4. 统计看板（/admin/dashboard）

**整体统计测试**：
- [ ] 页面正常加载，显示统计数据
- [ ] 4个统计卡片正确显示：
  - 总学员数 + 平均等级
  - 分组数量 + 课程分配数
  - 对话总数
  - 作业总数 + 平均分

**数据可视化测试**：
- [ ] 意识等级分布：7个等级的条形图正确显示
- [ ] 最近等级变化：显示最近10条等级变化记录
- [ ] 最近7天活跃度：显示每天的在线时长和完成课程数
- [ ] 课程统计：显示每门课程的个人分配和分组分配数量

---

## Edge Functions手动测试

### 1. 测试calculate-relative-level

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-relative-level' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

**预期结果**：
- 返回 `{ "success": true, "users_updated": N }`
- 数据库中学员的 `consciousness_level` 和 `percentile_rank` 已更新
- `consciousness_level_history` 表中有新记录

### 2. 测试generate-student-summary

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-student-summary' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "your-student-uuid"}'
```

**预期结果**：
- 返回 `{ "success": true }`
- `student_summaries` 表中插入了新记录
- 记录包含AI生成的评价（overall_summary, learning_style等）

### 3. 测试generate-gaia-variables

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-gaia-variables' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "your-student-uuid", "course_system_id": "your-course-uuid"}'
```

**预期结果**：
- 返回 `{ "success": true }`
- `gaia_context_variables` 表中插入了新记录
- N8N webhook接收到了变量数据

---

## 常见问题排查

### 问题1: 数据库迁移失败

**错误信息**：`ERROR: relation "admins" already exists`

**解决方案**：
```sql
-- 检查表是否已经存在
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 如果表已存在，删除后重新迁移（注意：会丢失数据）
DROP TABLE IF EXISTS admins CASCADE;
-- 然后重新运行迁移
```

### 问题2: RLS策略阻止访问

**错误信息**：`new row violates row-level security policy`

**解决方案**：
1. 检查当前用户是否在 `admins` 表中
2. 确认RLS策略已正确创建
3. 使用Service Role Key测试（绕过RLS）

### 问题3: Edge Functions部署失败

**错误信息**：`Function already exists`

**解决方案**：
```bash
# 删除现有函数后重新部署
supabase functions delete function-name
supabase functions deploy function-name
```

### 问题4: 前端API调用失败

**错误信息**：`Forbidden - Not an admin`

**解决方案**：
1. 确认当前登录用户在 `admins` 表中
2. 检查 `.env.local` 中的Supabase配置
3. 清除浏览器缓存，重新登录

### 问题5: AI评价生成失败

**错误信息**：`OpenAI API error`

**解决方案**：
1. 检查 `OPENAI_API_KEY` 是否正确设置
2. 确认OpenAI账户有足够的余额
3. 检查Edge Function日志：
```bash
supabase functions logs generate-student-summary
```

---

## 性能优化建议

### 1. 数据库索引

确认以下索引已创建（应该在迁移中自动创建）：

```sql
-- 检查索引
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

### 2. Edge Functions冷启动

Edge Functions首次调用可能需要几秒钟（冷启动）。可以设置定时预热：

```sql
-- 每小时预热一次
SELECT cron.schedule(
  'warmup-edge-functions',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/calculate-relative-level',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  )$$
);
```

### 3. 前端缓存

考虑使用SWR或React Query缓存API响应：

```bash
npm install swr
# 或
npm install @tanstack/react-query
```

---

## 后续步骤

✅ **恭喜！**如果所有测试都通过，你已经成功部署了学员管理系统。

**接下来可以做的事情**：

1. **添加测试数据**：
   - 创建几个测试学员账号
   - 创建几个分组
   - 分配课程
   - 观察统计数据变化

2. **运行Edge Functions**：
   - 手动触发 `calculate-relative-level` 计算等级
   - 为几个学员生成AI评价
   - 检查生成的Gaia变量

3. **监控和优化**：
   - 查看Supabase Dashboard > Logs
   - 查看API响应时间
   - 检查数据库查询性能

4. **安全加固**：
   - 启用数据库备份
   - 设置RLS策略审计
   - 定期检查权限配置

---

## 支持和文档

**相关文档**：
- `PHASE_1_2_COMPLETION_REPORT.md` - Phase 1和2详细报告
- `PHASE_3_PROGRESS.md` - Phase 3前端开发进度
- `EDGE_FUNCTIONS_DEPLOYMENT.md` - Edge Functions部署详细说明
- `TESTING_GUIDE.md` - 手动测试详细指南
- `DATABASE_REFACTOR_REPORT.md` - 数据库重构说明

**遇到问题？**
- 检查Supabase Dashboard日志
- 查看浏览器控制台错误
- 检查Edge Functions日志
- 参考上面的"常见问题排查"部分

---

*文档版本：1.0*
*最后更新：2025-10-30*
*作者：Claude Code*
