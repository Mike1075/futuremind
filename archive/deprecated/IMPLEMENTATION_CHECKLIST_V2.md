# 学员管理系统重构 - 实施清单 V2.0
> 基于新设计方案的详细执行清单
> 对应设计文档：STUDENT_MANAGEMENT_SYSTEM_REDESIGN_V2.md

---

## 📋 使用说明

- 每完成一项任务，请在 `[ ]` 中打 `✓`
- 遇到问题记录在对应任务下方
- 完成每个Phase后进行阶段性测试

---

## Phase 1: 数据库重构（2天）

### Day 1: 表结构创建

#### 1.1 创建新表
- [ ] 创建`admins`表（管理员表）
  ```sql
  -- 执行SQL：见设计文档 "二、角色权限体系" 第2.2节
  ```
- [ ] 创建`student_groups`表（学员分组表）
- [ ] 创建`course_assignments`表（课程权限分配表）
- [ ] 创建`student_course_assignments`表（学员课程分配表）
- [ ] 创建`student_summaries`表（AI综合评价表）
- [ ] 创建`gaia_context_variables`表（盖亚N8N变量表）
- [ ] 创建`user_behavior_stats`表（行为统计表）
- [ ] 创建`consciousness_level_history`表（等级历史记录表）

#### 1.2 修改现有表
- [ ] 修改`profiles`表
  ```sql
  ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS composite_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percentile_rank DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS level_updated_at TIMESTAMP WITH TIME ZONE;
  ```
- [ ] 修改`course_systems`表
  ```sql
  ALTER TABLE course_systems
  ADD COLUMN IF NOT EXISTS teaching_goals TEXT,
  ADD COLUMN IF NOT EXISTS guidance_keywords TEXT[];
  ```

#### 1.3 配置课程教学目标
- [ ] 更新三大课程的`teaching_goals`和`guidance_keywords`
  ```sql
  -- 见设计文档 "四、盖亚N8N变量生成系统" 第4.2节
  ```

#### 1.4 验证
- [ ] 检查所有表是否创建成功
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'admins', 'student_groups', 'course_assignments',
    'student_course_assignments', 'student_summaries',
    'gaia_context_variables', 'user_behavior_stats',
    'consciousness_level_history'
  );
  ```
- [ ] 检查profiles表新字段
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  AND column_name IN ('composite_score', 'percentile_rank', 'level_updated_at');
  ```

---

### Day 2: RLS策略和函数

#### 2.1 配置RLS策略
- [ ] 校长查看所有学员策略（`principals_view_all_students`）
- [ ] 老师查看分配学员策略（`teachers_view_assigned_students`）
- [ ] **阻止管理员查看对话内容**（`block_admins_view_conversations`）
- [ ] **阻止管理员查看作业内容**（`block_admins_view_submission_content`）
- [ ] 启用RLS
  ```sql
  ALTER TABLE gaia_conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;
  ```

#### 2.2 创建数据库函数
- [ ] 创建`calculate_all_student_levels()`函数
  ```sql
  -- 见设计文档 "一、相对意识等级系统" 第1.2节
  ```
- [ ] 创建`auto_create_course_groups()`函数
  ```sql
  -- 见设计文档 "五、分组管理系统" 第5.2节
  ```

#### 2.3 创建视图
- [ ] 创建`admin_group_statistics`视图
  ```sql
  -- 见设计文档 "六、统计看板系统" 第6.2节
  ```

#### 2.4 测试权限
- [ ] 创建测试管理员账号
- [ ] 测试管理员无法查看对话内容
  ```sql
  -- 以管理员身份查询，应返回0条或报错
  SELECT messages FROM gaia_conversations LIMIT 1;
  ```
- [ ] 测试管理员无法查看作业内容
  ```sql
  SELECT content FROM user_submissions LIMIT 1;
  ```
- [ ] 确认测试通过 ✓

---

## Phase 2: Edge Functions开发（3天）

### Day 3: 相对等级计算

#### 3.1 开发Edge Function
- [ ] 创建目录`supabase/functions/calculate-relative-level/`
- [ ] 创建`index.ts`
  ```typescript
  // 复制设计文档 "一、相对意识等级系统" 第1.4节的代码
  ```
- [ ] 本地测试
  ```bash
  supabase functions serve calculate-relative-level
  ```

#### 3.2 部署
- [ ] 部署到Supabase
  ```bash
  supabase functions deploy calculate-relative-level
  ```
- [ ] 配置环境变量
  ```bash
  supabase secrets set SUPABASE_URL=你的URL
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=你的KEY
  ```

#### 3.3 配置定时任务
- [ ] 配置pg_cron定时任务（每周日凌晨2点）
  ```sql
  SELECT cron.schedule(
    'calculate-relative-level-weekly',
    '0 2 * * 0',
    $$ ... $$
  );
  ```

#### 3.4 手动测试
- [ ] 手动触发Edge Function
  ```bash
  curl -X POST https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level \
    -H "Authorization: Bearer YOUR_KEY"
  ```
- [ ] 检查profiles表是否更新了等级
  ```sql
  SELECT id, full_name, consciousness_level, composite_score, percentile_rank
  FROM profiles
  WHERE role != 'content_admin'
  ORDER BY composite_score DESC
  LIMIT 10;
  ```
- [ ] 检查consciousness_level_history是否有记录

---

### Day 4: AI综合评价生成

#### 4.1 开发Edge Function
- [ ] 创建目录`supabase/functions/generate-student-summary/`
- [ ] 创建`index.ts`
  ```typescript
  // 复制设计文档 "三、AI生成的学员综合评价" 第3.2节的代码
  ```

#### 4.2 配置OpenAI API
- [ ] 设置Secret
  ```bash
  supabase secrets set OPENAI_API_KEY=sk-xxx
  ```

#### 4.3 调试AI提示词
- [ ] 测试生成一个学员的总结
- [ ] 检查生成质量（是否符合200-300字要求）
- [ ] 检查性格特点分析是否合理
- [ ] 调整提示词直到满意

#### 4.4 部署
- [ ] 部署Edge Function
  ```bash
  supabase functions deploy generate-student-summary
  ```
- [ ] 配置定时任务（每周日凌晨3点）

#### 4.5 测试
- [ ] 手动触发生成
- [ ] 检查student_summaries表
  ```sql
  SELECT user_id, learning_style, overall_summary, generated_at
  FROM student_summaries
  LIMIT 5;
  ```

---

### Day 5: 盖亚N8N变量生成

#### 5.1 开发Edge Function
- [ ] 创建目录`supabase/functions/generate-gaia-variables/`
- [ ] 创建`index.ts`
  ```typescript
  // 复制设计文档 "四、盖亚N8N变量生成系统" 第4.3节的代码
  ```

#### 5.2 部署
- [ ] 部署Edge Function
  ```bash
  supabase functions deploy generate-gaia-variables
  ```
- [ ] 配置定时任务（每周日凌晨4点）

#### 5.3 测试
- [ ] 手动触发生成
- [ ] 检查gaia_context_variables表
  ```sql
  SELECT user_id, course_system_id,
         student_profile, course_learning_summary,
         course_teaching_goals
  FROM gaia_context_variables
  LIMIT 3;
  ```

#### 5.4 N8N集成测试
- [ ] 在N8N中创建测试工作流
- [ ] 测试获取变量
- [ ] 测试构建系统提示词
- [ ] 测试完整对话流程
- [ ] 确认变量正确传递 ✓

---

## Phase 3: 管理后台开发（4-5天）

### Day 6-7: 学员管理页面

#### 6.1 创建API路由
- [ ] 创建`app/api/admin/students/route.ts`（列表API）
  ```typescript
  // GET: 获取学员列表（带搜索、筛选、排序）
  // 注意：不返回隐私字段（conversations.messages, submissions.content）
  ```
- [ ] 创建`app/api/admin/students/[id]/route.ts`（详情API）
  ```typescript
  // GET: 获取学员详情
  // 返回：基本信息 + AI总结 + 统计数据
  // 不返回：对话内容、作业内容
  ```

#### 6.2 创建学员列表页
- [ ] 创建`app/admin/students/page.tsx`
- [ ] 实现搜索功能（姓名、邮箱）
- [ ] 实现筛选功能（等级、课程、活跃度）
- [ ] 实现排序功能（等级、评分、注册时间）
- [ ] 实现分页功能
- [ ] 表格显示字段：
  - [ ] 头像、姓名、邮箱
  - [ ] 意识等级（1-7）
  - [ ] 综合评分
  - [ ] 最后活跃时间
  - [ ] 操作按钮（查看详情）

#### 6.3 创建学员详情页
- [ ] 创建`app/admin/students/[id]/page.tsx`
- [ ] Tab 1: 概览
  - [ ] 显示AI生成的综合评价
  - [ ] 性格特点、学习风格
  - [ ] 优势和成长空间
- [ ] Tab 2: 统计数据
  - [ ] 在线时长图表
  - [ ] 完课率图表
  - [ ] 活跃度曲线
- [ ] Tab 3: 课程进度
  - [ ] 三大课程的进度百分比
  - [ ] 每门课的学习情况简介（来自AI）
- [ ] Tab 4: 成长历程
  - [ ] 意识等级变化趋势图
  - [ ] 综合评分变化图

#### 6.4 测试
- [ ] 测试列表页加载正常
- [ ] 测试搜索、筛选、排序功能
- [ ] 测试详情页4个Tab显示正常
- [ ] **重点测试：确认没有显示对话内容和作业内容**
- [ ] 测试移动端响应式

---

### Day 8: 分组管理

#### 8.1 创建API路由
- [ ] 创建`app/api/admin/groups/route.ts`
  ```typescript
  // GET: 获取分组列表
  // POST: 创建新分组
  ```
- [ ] 创建`app/api/admin/groups/[id]/route.ts`
  ```typescript
  // GET: 获取分组详情
  // PUT: 更新分组
  // DELETE: 删除分组
  ```

#### 8.2 创建分组管理页面
- [ ] 创建`app/admin/students/groups/page.tsx`
- [ ] 显示分组列表（卡片或表格）
- [ ] 每个分组显示：
  - [ ] 分组名称、类型
  - [ ] 成员数量
  - [ ] 平均等级
  - [ ] 活跃成员数
- [ ] 创建分组对话框
- [ ] 编辑分组功能
- [ ] 删除分组功能

#### 8.3 分组详情页
- [ ] 显示分组成员列表
- [ ] 添加/移除成员功能
- [ ] 分组统计数据（使用admin_group_statistics视图）

#### 8.4 自动分组
- [ ] 测试auto_create_course_groups()函数
- [ ] 确认每天凌晨1点自动更新分组

---

### Day 9: 课程分配

#### 9.1 创建API路由
- [ ] 创建`app/api/admin/assignments/route.ts`
  ```typescript
  // 校长分配课程给老师
  // 老师分配课程给学员
  ```

#### 9.2 创建课程分配页面
- [ ] 创建`app/admin/assignments/page.tsx`
- [ ] 校长功能：
  - [ ] 查看所有老师
  - [ ] 为老师分配课程
  - [ ] 查看老师管理的课程
- [ ] 老师功能：
  - [ ] 查看自己管理的课程
  - [ ] 为学员分配课程
  - [ ] 查看学员的课程

#### 9.3 权限验证
- [ ] 测试校长可以分配课程给老师
- [ ] 测试老师只能管理被分配的课程
- [ ] 测试老师无法分配未被授权的课程

---

### Day 10: 统计看板

#### 10.1 创建API路由
- [ ] 创建`app/api/admin/dashboard/route.ts`
  ```typescript
  // 返回各类统计数据
  // 使用admin_group_statistics视图
  ```

#### 10.2 创建统计看板页面
- [ ] 创建`app/admin/dashboard/page.tsx`
- [ ] 关键指标卡片：
  - [ ] 总学员数
  - [ ] 活跃学员数（最近7天）
  - [ ] 平均综合评分
  - [ ] 平均意识等级
- [ ] 等级分布图（饼图或柱状图）
- [ ] 新学员趋势图（折线图，最近30天）
- [ ] 在线时长排行榜（TOP 10）
- [ ] 各分组统计表格

#### 10.3 使用Recharts
- [ ] 安装Recharts
  ```bash
  npm install recharts
  ```
- [ ] 实现饼图组件
- [ ] 实现折线图组件
- [ ] 实现柱状图组件

#### 10.4 数据导出
- [ ] 添加导出Excel功能
  ```bash
  npm install xlsx
  ```
- [ ] 导出学员列表
- [ ] 导出分组统计

---

## Phase 4: 意识树造型设计（2天）

### Day 11: 3D模型设计

#### 11.1 安装Three.js
- [ ] 安装依赖
  ```bash
  npm install three @react-three/fiber @react-three/drei
  ```

#### 11.2 创建树模型组件
- [ ] 创建`components/consciousness-tree/TreeModels.tsx`
- [ ] 定义7种树造型配置（见设计文档 1.6节）
- [ ] 实现树干、枝干、叶子、果实的3D渲染
- [ ] 添加光晕效果（Level 5-7）

#### 11.3 测试渲染
- [ ] 测试Level 1（小树苗）
- [ ] 测试Level 4（繁茂树木）
- [ ] 测试Level 7（智慧古树，带发光效果）

---

### Day 12: 前端集成

#### 12.1 学员端意识树
- [ ] 在学员个人页面显示意识树
- [ ] 根据consciousness_level动态加载对应模型
- [ ] 添加交互功能（旋转、缩放）

#### 12.2 管理端意识树
- [ ] 在学员详情页显示简化版意识树
- [ ] 只显示等级对应的树型
- [ ] 不显示详细的根系、树干数据（隐私保护）

#### 12.3 等级提升动画
- [ ] 当等级提升时显示动画
- [ ] 使用Framer Motion
  ```bash
  npm install framer-motion
  ```
- [ ] 树木生长动画
- [ ] 等级数字跳动效果

---

## Phase 5: 测试与优化（2天）

### Day 13: 功能测试

#### 13.1 权限测试（最重要！）
- [ ] 创建测试管理员账号（校长、老师）
- [ ] **测试管理员无法查看对话内容**
  - [ ] 在Supabase Dashboard查询
  - [ ] 在前端API调用
  - [ ] 在管理界面查看
  - [ ] **必须全部拒绝访问** ✓
- [ ] **测试管理员无法查看作业内容**
  - [ ] 同上测试方式
  - [ ] **必须全部拒绝访问** ✓
- [ ] 测试校长和老师的权限边界
- [ ] 测试学员只能查看自己的数据

#### 13.2 相对等级计算验证
- [ ] 手动计算几个学员的综合评分
- [ ] 对比Edge Function计算结果
- [ ] 检查百分位排名是否正确
- [ ] 检查等级映射是否正确
- [ ] 查看等级分布是否合理（不应该全是Level 1或Level 7）

#### 13.3 AI总结质量评估
- [ ] 阅读10个学员的AI生成总结
- [ ] 检查是否符合200-300字要求
- [ ] 检查性格特点分析是否合理
- [ ] 检查学习风格是否准确
- [ ] 必要时调整提示词并重新生成

#### 13.4 N8N变量获取测试
- [ ] 在N8N工作流中获取变量
- [ ] 检查student_profile是否完整
- [ ] 检查course_learning_summary是否准确
- [ ] 检查course_teaching_goals是否正确
- [ ] 测试完整对话流程

#### 13.5 分组功能测试
- [ ] 创建自定义分组
- [ ] 测试自动分组功能
- [ ] 检查分组统计数据是否正确
- [ ] 测试添加/移除成员

#### 13.6 课程分配测试
- [ ] 校长分配课程给老师
- [ ] 老师分配课程给学员
- [ ] 检查权限验证
- [ ] 测试分配撤销

---

### Day 14: 性能优化与部署

#### 14.1 数据库优化
- [ ] 检查所有索引是否创建
  ```sql
  SELECT tablename, indexname FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'student_groups', 'user_behavior_stats', ...);
  ```
- [ ] 分析慢查询
  ```sql
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
  ```
- [ ] 优化慢查询（添加索引或改写SQL）

#### 14.2 添加缓存
- [ ] API层添加缓存
  ```typescript
  // 使用Next.js的缓存机制
  export const revalidate = 3600  // 1小时
  ```
- [ ] 统计数据缓存（避免每次查询都计算）

#### 14.3 前端性能优化
- [ ] 代码分割（动态导入）
  ```typescript
  const TreeVisualization = dynamic(() => import('@/components/ConsciousnessTree'))
  ```
- [ ] 图片优化（使用Next.js Image组件）
- [ ] 懒加载（React.lazy）

#### 14.4 部署到生产环境
- [ ] 前端部署到Vercel
  ```bash
  vercel --prod
  ```
- [ ] Edge Functions已在开发时部署
- [ ] 数据库迁移已完成
- [ ] 配置生产环境变量
- [ ] 配置自定义域名（如有）

#### 14.5 编写使用文档
- [ ] 管理员使用手册
  - [ ] 如何查看学员信息
  - [ ] 如何创建分组
  - [ ] 如何分配课程
  - [ ] 如何查看统计数据
- [ ] 权限说明
  - [ ] 校长 vs 老师的区别
  - [ ] 哪些数据不可见（隐私保护）
- [ ] 常见问题FAQ

---

## ✅ 最终验收标准

### 功能完整性
- [ ] 所有学员都有意识等级（1-7）
- [ ] 每周日自动重新计算相对等级
- [ ] 每周日自动生成AI综合评价
- [ ] 每周日自动生成盖亚N8N变量
- [ ] 管理员可以查看学员列表和详情
- [ ] 管理员可以创建和管理分组
- [ ] 校长可以分配课程给老师
- [ ] 老师可以分配课程给学员
- [ ] 统计看板显示正确数据
- [ ] 意识树造型根据等级动态显示

### 隐私保护（最重要！）
- [ ] **管理员无法在任何地方查看对话内容**
- [ ] **管理员无法在任何地方查看作业内容**
- [ ] RLS策略阻止隐私数据访问
- [ ] API层不返回隐私字段
- [ ] 前端不请求隐私数据

### 性能指标
- [ ] 列表页加载时间 < 1秒
- [ ] 详情页加载时间 < 2秒
- [ ] 统计看板加载时间 < 3秒
- [ ] 意识树渲染时间 < 2秒
- [ ] Edge Function执行时间 < 30秒

### 数据质量
- [ ] 相对等级分布合理（不全是Level 1或7）
- [ ] AI总结质量高（200-300字，内容准确）
- [ ] N8N变量完整且准确
- [ ] 统计数据计算正确

### 用户体验
- [ ] 界面清晰易用
- [ ] 移动端兼容
- [ ] 无明显bug
- [ ] 响应及时

---

## 📝 注意事项

1. **隐私保护是最高优先级**：在整个开发过程中，随时检查是否有隐私数据泄漏的可能。

2. **测试环境先行**：所有功能先在测试环境验证，确保无误后再部署到生产环境。

3. **数据备份**：在执行数据库迁移前，务必备份生产数据。

4. **分阶段上线**：可以先上线基础功能，再逐步上线高级功能。

5. **用户培训**：上线前对管理员进行培训，说明系统功能和限制。

---

## 🆘 遇到问题？

### 常见问题排查

**Q1: 管理员无法登录管理后台**
- 检查admins表是否有该用户记录
- 检查role字段是否正确（'principal' 或 'teacher'）

**Q2: 等级计算不正确**
- 手动运行calculate_all_student_levels()函数
- 检查composite_score是否有值
- 检查用户是否有学习数据

**Q3: AI总结生成失败**
- 检查OPENAI_API_KEY是否正确
- 检查API额度是否用完
- 查看Edge Function日志

**Q4: N8N无法获取变量**
- 检查gaia_context_variables表是否有数据
- 检查valid_until是否过期
- 检查N8N的Supabase连接配置

**Q5: RLS策略不生效**
- 确认表已启用RLS（ALTER TABLE ... ENABLE ROW LEVEL SECURITY）
- 检查策略名称和条件是否正确
- 测试时使用正确的auth.uid()

---

## 📚 相关文档

- **设计文档**: `STUDENT_MANAGEMENT_SYSTEM_REDESIGN_V2.md`
- **Supabase文档**: https://supabase.com/docs
- **Three.js文档**: https://threejs.org/docs
- **Recharts文档**: https://recharts.org/

---

*清单版本：2.0*
*最后更新：2025-10-29*
*预计完成时间：13-14天*
