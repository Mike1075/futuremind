# 数据库架构文档

## 概述

FutureMind Institute使用PostgreSQL数据库（通过Supabase托管），包含5个核心表和完整的RLS（行级安全）策略。

## 核心表结构

### 1. profiles - 用户信息表

存储所有用户的基本信息和意识树数据。

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  consciousness_level INTEGER DEFAULT 1,
  composite_score NUMERIC DEFAULT 0,
  percentile_rank NUMERIC,
  consciousness_tree_view JSONB,
  level_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id` - 主键，关联auth.users表
- `email` - 用户邮箱（唯一）
- `full_name` - 用户全名
- `avatar_url` - 头像URL
- `role` - 角色：`student` | `teacher` | `principal`
- `consciousness_level` - 意识等级（1-100）
- `composite_score` - 综合得分
- `percentile_rank` - 百分位排名
- `consciousness_tree_view` - 意识树可视化数据（JSON）
- `level_updated_at` - 等级更新时间

**RLS策略**:
```sql
-- 用户可以查看自己的完整信息
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户可以查看他人的公开信息
CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true);

-- 用户可以更新自己的信息
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**索引**:
```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
```

---

### 2. course_systems - 课程体系表

存储课程的元信息和结构配置。

```sql
CREATE TABLE course_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  system_key TEXT NOT NULL UNIQUE,
  structure_type TEXT NOT NULL,
  description TEXT,
  teaching_goals TEXT,
  guidance_keywords TEXT[],
  total_units INTEGER,
  display_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  is_system_course BOOLEAN DEFAULT false,
  allow_collaboration BOOLEAN DEFAULT false,
  structure_config JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id` - 主键
- `title` - 课程标题
- `system_key` - 系统唯一标识（URL友好）
- `structure_type` - 课程结构类型：
  - `daily_sequential` - 日序列（如Listening课程）
  - `module_matrix` - 模块矩阵
  - `stage_sequential` - 阶段序列（如Earth课程）
- `description` - 课程描述
- `teaching_goals` - 教学目标
- `guidance_keywords` - 引导关键词数组
- `total_units` - 总单元数
- `display_order` - 显示顺序
- `is_active` - 是否激活
- `is_system_course` - 是否为系统课程
- `allow_collaboration` - 是否允许协作
- `structure_config` - 结构配置（JSON）
- `created_by` - 创建者ID

**RLS策略**:
```sql
-- 所有用户可以查看激活的课程
CREATE POLICY "Users can view active courses"
  ON course_systems FOR SELECT
  USING (is_active = true);

-- 教师和校长可以管理课程
CREATE POLICY "Teachers can manage courses"
  ON course_systems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'principal')
    )
  );
```

**索引**:
```sql
CREATE UNIQUE INDEX idx_course_systems_key ON course_systems(system_key);
CREATE INDEX idx_course_systems_active ON course_systems(is_active);
CREATE INDEX idx_course_systems_order ON course_systems(display_order);
```

---

### 3. course_contents - 课程内容表

存储课程的具体内容单元。

```sql
CREATE TABLE course_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  sequence_number INTEGER NOT NULL,
  content_type TEXT NOT NULL,

  -- Listening课程字段
  original_text TEXT,
  deep_interpretation TEXT,
  meditation_guide TEXT,
  life_practice TEXT,

  -- Earth课程字段
  documentary_url TEXT,
  pre_watch_guide TEXT,
  knowledge_points JSONB,
  socratic_questions JSONB,
  post_reflection JSONB,

  -- PBL课程字段
  week_plan JSONB,
  day_plan JSONB,

  -- 通用字段
  goals TEXT,
  main_content TEXT,
  tips TEXT,
  duration TEXT,
  estimated_duration INTEGER,
  resources JSONB,
  prerequisites JSONB,
  is_published BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(system_id, sequence_number)
);
```

**字段说明**:

**基础字段**:
- `id` - 主键
- `system_id` - 所属课程体系
- `title` - 内容标题
- `subtitle` - 副标题
- `sequence_number` - 序列号（排序用）
- `content_type` - 内容类型

**Listening课程专用**:
- `original_text` - 原始文本
- `deep_interpretation` - 深度解读
- `meditation_guide` - 冥想引导
- `life_practice` - 生活实践

**Earth课程专用**:
- `documentary_url` - 纪录片链接
- `pre_watch_guide` - 观前指南
- `knowledge_points` - 知识点数组（JSON）
- `socratic_questions` - 苏格拉底式问题（JSON）:
  ```json
  {
    "pre_watch": ["问题1", "问题2"],
    "during_watch": ["问题3", "问题4"],
    "post_watch": ["问题5", "问题6"]
  }
  ```
- `post_reflection` - 课后反思问题数组

**PBL课程专用**:
- `week_plan` - 周计划（JSON）
- `day_plan` - 日计划（JSON）

**通用字段**:
- `goals` - 学习目标
- `main_content` - 主要内容
- `tips` - 学习提示
- `duration` - 预计时长
- `estimated_duration` - 预计时长（分钟）
- `resources` - 资源列表（JSON）:
  ```json
  [
    {
      "type": "audio",
      "title": "冥想音频",
      "url": "https://...",
      "duration": "10分钟",
      "description": "..."
    }
  ]
  ```
- `prerequisites` - 前置课程ID数组
- `is_published` - 是否发布

**RLS策略**:
```sql
-- 所有用户可以查看已发布的内容
CREATE POLICY "Users can view published contents"
  ON course_contents FOR SELECT
  USING (is_published = true);

-- 教师可以查看和管理所有内容
CREATE POLICY "Teachers can manage contents"
  ON course_contents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'principal')
    )
  );
```

**索引**:
```sql
CREATE INDEX idx_course_contents_system ON course_contents(system_id);
CREATE INDEX idx_course_contents_sequence ON course_contents(system_id, sequence_number);
CREATE INDEX idx_course_contents_published ON course_contents(is_published);
```

---

### 4. user_progress - 用户进度表

跟踪用户的学习进度。

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ref_item_id UUID NOT NULL, -- 可以引用course_contents或其他项目
  progress_type TEXT NOT NULL,
  progress_value INTEGER DEFAULT 0,
  consciousness_growth INTEGER DEFAULT 0,
  current_day INTEGER,
  daily_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_tasks TEXT[],
  note TEXT,
  season_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, ref_item_id, progress_type)
);
```

**字段说明**:
- `id` - 主键
- `user_id` - 用户ID
- `ref_item_id` - 引用项ID（课程内容/项目等）
- `progress_type` - 进度类型：
  - `reading` - 阅读进度
  - `meditation` - 冥想进度
  - `pbl` - PBL项目进度
  - `insight` - 洞察记录
  - `artifact` - 作品进度
- `progress_value` - 进度值（0-100）
- `consciousness_growth` - 意识成长点数
- `current_day` - 当前天数（用于daily_sequential）
- `daily_records` - 每日记录（JSON数组）
- `completed_tasks` - 已完成任务列表
- `note` - 用户笔记
- `season_id` - 季度ID（未来功能）

**RLS策略**:
```sql
-- 用户只能访问自己的进度
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON user_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own progress"
  ON user_progress FOR UPDATE
  USING (user_id = auth.uid());

-- 教师可以查看所有学生进度
CREATE POLICY "Teachers can view all progress"
  ON user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'principal')
    )
  );
```

**索引**:
```sql
CREATE UNIQUE INDEX idx_user_progress_unique
  ON user_progress(user_id, ref_item_id, progress_type);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_item ON user_progress(ref_item_id);
```

---

### 5. user_submissions - 用户提交表

存储学生作业提交和评估结果。

```sql
CREATE TABLE user_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_content_id UUID REFERENCES course_contents(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  status TEXT DEFAULT 'pending',
  score INTEGER,
  feedback TEXT,
  consciousness_growth_points INTEGER DEFAULT 0,
  reviewer_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id` - 主键
- `user_id` - 提交学生ID
- `course_content_id` - 关联的课程内容ID
- `submission_type` - 提交类型：
  - `reflection` - 学习反思
  - `homework` - 作业
  - `project` - 项目
  - `essay` - 论文
- `content` - 提交内容（文本）
- `attachments` - 附件列表（JSON）
- `status` - 状态：
  - `pending` - 待评估
  - `evaluated` - 已评估
  - `revision` - 需修订
- `score` - 评分（0-100）
- `feedback` - AI或教师反馈
- `consciousness_growth_points` - 获得的意识成长点数
- `reviewer_id` - 评估者ID（AI或教师）
- `submitted_at` - 提交时间
- `reviewed_at` - 评估时间

**RLS策略**:
```sql
-- 学生只能查看自己的提交
CREATE POLICY "Students can view own submissions"
  ON user_submissions FOR SELECT
  USING (user_id = auth.uid());

-- 学生可以创建提交
CREATE POLICY "Students can create submissions"
  ON user_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 学生可以删除自己的提交
CREATE POLICY "Students can delete own submissions"
  ON user_submissions FOR DELETE
  USING (user_id = auth.uid());

-- 教师可以查看和评估所有提交
CREATE POLICY "Teachers can view all submissions"
  ON user_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'principal')
    )
  );

CREATE POLICY "Teachers can update submissions"
  ON user_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'principal')
    )
  );
```

**索引**:
```sql
CREATE INDEX idx_user_submissions_user ON user_submissions(user_id);
CREATE INDEX idx_user_submissions_content ON user_submissions(course_content_id);
CREATE INDEX idx_user_submissions_status ON user_submissions(status);
CREATE INDEX idx_user_submissions_submitted ON user_submissions(submitted_at DESC);
```

---

## 其他重要表

### student_course_assignments - 学生课程分配表

管理学生的课程选修关系。

```sql
CREATE TABLE student_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',

  UNIQUE(student_id, course_system_id)
);
```

### student_groups - 学生分组表

用于班级、小组管理。

```sql
CREATE TABLE student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT DEFAULT 'global',
  member_ids UUID[],
  course_id UUID REFERENCES course_systems(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### gaia_conversations - Gaia对话记录表

存储AI导师的对话历史。

```sql
CREATE TABLE gaia_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### gaia_context_variables - Gaia上下文缓存表

缓存个性化上下文，优化AI对话性能。

```sql
CREATE TABLE gaia_context_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id),
  course_content_id UUID REFERENCES course_contents(id),
  context_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_system_id, course_content_id)
);
```

---

## 数据库触发器

### 1. 自动更新updated_at

所有表都有自动更新`updated_at`字段的触发器：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. 意识树生长触发器

当作业评估完成时，触发意识树更新：

```sql
CREATE OR REPLACE FUNCTION trigger_consciousness_tree_growth()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新用户的consciousness_level和composite_score
  -- 调用calculate-relative-level边缘函数
  PERFORM net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/calculate-relative-level',
    body := json_build_object('user_id', NEW.user_id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_evaluated
  AFTER UPDATE ON user_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'evaluated' AND OLD.status != 'evaluated')
  EXECUTE FUNCTION trigger_consciousness_tree_growth();
```

---

## 数据迁移策略

### 版本控制

所有数据库迁移文件存储在 `supabase/migrations/` 目录，使用时间戳命名：

```
supabase/migrations/
  ├── 20240101000000_initial_schema.sql
  ├── 20240115000000_add_consciousness_tree.sql
  └── 20240201000000_add_gaia_tables.sql
```

### 迁移命令

```bash
# 创建新迁移
supabase migration new migration_name

# 应用迁移
supabase db push

# 回滚迁移
supabase db reset
```

---

## 性能优化建议

1. **复合索引** - 为常用查询组合添加复合索引
2. **分区表** - 对大表（如conversations）考虑按时间分区
3. **物化视图** - 为复杂统计查询创建物化视图
4. **定期清理** - 定期归档旧数据，保持表性能

---

## 备份策略

Supabase自动提供：
- 每日自动备份
- 7天保留期（免费版）
- 30天保留期（付费版）

手动备份：
```bash
pg_dump -h db.[project-ref].supabase.co -U postgres dbname > backup.sql
```
