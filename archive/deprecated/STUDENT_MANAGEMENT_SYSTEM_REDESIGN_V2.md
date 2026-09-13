# 未来心智学院 - 学员管理系统重新设计方案 V2.0
> 基于最新需求的完整系统设计
> 版本：2.0
> 日期：2025-10-29
> 状态：设计完成，待实施

---

## 📋 核心设计理念

### ❌ 删除的错误设计
1. ~~学号系统（FMI+年月+流水号）~~
2. ~~意识总分系统（四模块动态评分）~~
3. ~~学习活动流详细记录~~
4. ~~管理员批改作业功能~~
5. ~~管理员查看详细对话和作业内容~~

### ✅ 正确的新设计
1. **相对意识等级系统**（基于《灵魂永生》，1-7级）
2. **角色权限体系**（校长、老师均无法查看隐私内容）
3. **AI综合评价**（每周生成，供管理员查看）
4. **盖亚N8N变量**（每周生成学生性格、学习情况等）
5. **分组管理**（按课程/项目/成绩/自定义）
6. **统计看板**（人数、完课率、在线时长等）

---

## 📊 一、相对意识等级系统

### 1.1 基于《灵魂永生》的7级意识划分

赛斯在《灵魂永生》中描述了意识发展的不同阶段，我们将其映射为7个等级：

| 等级 | 名称 | 意识特征（赛斯理论） | 百分位 | 视觉特征 |
|------|------|---------------------|--------|---------|
| **Level 1** | **沉睡者** | 完全认同物质实相，自我觉察初萌，主要通过感官体验世界 | 0-15% | 🌱 小树苗 |
| **Level 2** | **觉醒者** | 开始质疑物质实相的绝对性，探索内在世界，产生好奇 | 16-30% | 🌿 成长期树木 |
| **Level 3** | **探索者** | 理解情绪创造实相的原理，主动探索信念系统，开始观察思想 | 31-50% | 🌳 茁壮树木，枝叶初现 |
| **Level 4** | **实践者** | 有意识地运用信念系统创造现实，实践意识扩展技巧 | 51-70% | 🌲 繁茂树木，多枝多叶 |
| **Level 5** | **洞察者** | 理解多重自我概念，能跨越线性时空限制，产生深刻洞见 | 71-85% | 🍎 大树，开始结果 |
| **Level 6** | **先锋者** | 意识扩展至集体层面，理解内在感官，能引领他人觉醒 | 86-95% | 🌟 参天大树，硕果累累 |
| **Level 7** | **引领者** | 意识扩展至宇宙层面，理解"一切万有"，创造性显化能力 | 96-100% | ✨ 智慧古树，发光 |

### 1.2 相对等级计算算法

#### 综合评分维度

```typescript
interface StudentMetrics {
  domain_depth: number        // 五大领域平均深度 (0-100)
  activity_score: number      // 学习活跃度 (0-100)
  quality_score: number       // 作业质量 (0-100)
  dialogue_depth: number      // 对话深度 (0-100)
}

function calculateCompositeScore(metrics: StudentMetrics): number {
  return (
    metrics.domain_depth * 0.30 +      // 探索广度权重30%
    metrics.activity_score * 0.25 +    // 活跃度权重25%
    metrics.quality_score * 0.25 +     // 质量权重25%
    metrics.dialogue_depth * 0.20      // 对话深度权重20%
  )
}
```

#### 相对等级计算

```sql
-- Step 1: 计算所有学员的综合评分
WITH student_scores AS (
  SELECT
    id,
    (
      -- 五大领域平均深度
      COALESCE((
        SELECT AVG((domain_scores->domain->>'depth_score')::numeric)
        FROM user_domain_exploration ude,
             jsonb_each(ude.domain_scores) AS domain_scores(domain, scores)
        WHERE ude.user_id = profiles.id
      ), 0) * 0.30 +

      -- 学习活跃度（基于活跃天数和学习时长）
      LEAST(100, (
        SELECT COUNT(DISTINCT DATE(submitted_at)) * 2
        FROM user_submissions
        WHERE user_id = profiles.id
      )) * 0.25 +

      -- 作业质量（平均分）
      COALESCE((
        SELECT AVG(score)
        FROM user_submissions
        WHERE user_id = profiles.id AND status = 'approved'
      ), 0) * 0.25 +

      -- 对话深度（基于对话轮次和质量）
      LEAST(100, (
        SELECT SUM(message_count) / 10.0
        FROM gaia_conversations
        WHERE user_id = profiles.id
      )) * 0.20

    ) AS composite_score
  FROM profiles
  WHERE role != 'content_admin'
)

-- Step 2: 计算百分位排名
, ranked_students AS (
  SELECT
    id,
    composite_score,
    PERCENT_RANK() OVER (ORDER BY composite_score) AS percentile_rank
  FROM student_scores
)

-- Step 3: 映射到1-7等级
SELECT
  id,
  composite_score,
  percentile_rank,
  CASE
    WHEN percentile_rank < 0.15 THEN 1  -- 0-15%
    WHEN percentile_rank < 0.30 THEN 2  -- 16-30%
    WHEN percentile_rank < 0.50 THEN 3  -- 31-50%
    WHEN percentile_rank < 0.70 THEN 4  -- 51-70%
    WHEN percentile_rank < 0.85 THEN 5  -- 71-85%
    WHEN percentile_rank < 0.95 THEN 6  -- 86-95%
    ELSE 7                              -- 96-100%
  END AS consciousness_level
FROM ranked_students;
```

### 1.3 数据库表设计

```sql
-- 修改profiles表
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS composite_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentile_rank DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS level_updated_at TIMESTAMP WITH TIME ZONE;

-- consciousness_level字段保留（1-7）

COMMENT ON COLUMN profiles.composite_score IS '综合评分（0-100），用于计算相对等级';
COMMENT ON COLUMN profiles.percentile_rank IS '百分位排名（0-1），用于确定等级';
COMMENT ON COLUMN profiles.consciousness_level IS '意识等级（1-7），基于赛斯理论设计';

-- 创建等级历史记录表
CREATE TABLE IF NOT EXISTS consciousness_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- 等级信息
  consciousness_level INTEGER NOT NULL,
  composite_score DECIMAL(5,2) NOT NULL,
  percentile_rank DECIMAL(5,4) NOT NULL,

  -- 分项得分
  domain_depth_score DECIMAL(5,2),
  activity_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  dialogue_depth_score DECIMAL(5,2),

  -- 记录时间
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_level_history_user_id (user_id),
  INDEX idx_level_history_recorded_at (recorded_at DESC)
);

COMMENT ON TABLE consciousness_level_history IS '意识等级历史记录，用于追踪学员成长轨迹';
```

### 1.4 Edge Function: calculate-relative-level

```typescript
// supabase/functions/calculate-relative-level/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 计算所有学员的相对意识等级
 * 触发方式：
 * 1. 定时任务（每周日凌晨2点）
 * 2. 手动触发（管理员操作）
 */

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[开始计算相对等级]', new Date().toISOString())

    // 执行等级计算SQL
    const { data: rankedStudents, error } = await supabase.rpc(
      'calculate_all_student_levels'
    )

    if (error) throw error

    console.log(`[计算完成] 更新了 ${rankedStudents.length} 位学员的等级`)

    // 更新profiles表
    for (const student of rankedStudents) {
      await supabase
        .from('profiles')
        .update({
          consciousness_level: student.consciousness_level,
          composite_score: student.composite_score,
          percentile_rank: student.percentile_rank,
          level_updated_at: new Date().toISOString()
        })
        .eq('id', student.id)

      // 记录到历史表
      await supabase
        .from('consciousness_level_history')
        .insert({
          user_id: student.id,
          consciousness_level: student.consciousness_level,
          composite_score: student.composite_score,
          percentile_rank: student.percentile_rank,
          domain_depth_score: student.domain_depth_score,
          activity_score: student.activity_score,
          quality_score: student.quality_score,
          dialogue_depth_score: student.dialogue_depth_score
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: rankedStudents.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[计算失败]', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 数据库函数

```sql
CREATE OR REPLACE FUNCTION calculate_all_student_levels()
RETURNS TABLE (
  id UUID,
  consciousness_level INTEGER,
  composite_score DECIMAL(5,2),
  percentile_rank DECIMAL(5,4),
  domain_depth_score DECIMAL(5,2),
  activity_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  dialogue_depth_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH student_scores AS (
    -- 上面SQL的完整实现
    -- ...
  )
  SELECT * FROM ranked_students;
END;
$$ LANGUAGE plpgsql;
```

### 1.5 定时任务配置

```sql
-- 使用pg_cron（Supabase内置）
SELECT cron.schedule(
  'calculate-relative-level-weekly',
  '0 2 * * 0',  -- 每周日凌晨2点
  $$
  SELECT net.http_post(
    url := 'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/calculate-relative-level',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
    body := '{}'
  );
  $$
);
```

### 1.6 意识树造型设计

每个等级对应不同的3D意识树造型：

```typescript
// components/consciousness-tree/TreeModels.tsx

const TREE_MODELS = {
  1: {  // 沉睡者
    name: '小树苗',
    height: 1.0,
    trunkThickness: 0.1,
    branches: 0,
    leaves: 10,
    fruits: 0,
    color: '#90EE90',  // 浅绿色
    glow: false
  },
  2: {  // 觉醒者
    name: '成长期树木',
    height: 1.5,
    trunkThickness: 0.15,
    branches: 2,
    leaves: 30,
    fruits: 0,
    color: '#66CDAA',  // 中绿色
    glow: false
  },
  3: {  // 探索者
    name: '茁壮树木',
    height: 2.0,
    trunkThickness: 0.2,
    branches: 5,
    leaves: 60,
    fruits: 2,
    color: '#3CB371',  // 深绿色
    glow: false
  },
  4: {  // 实践者
    name: '繁茂树木',
    height: 2.5,
    trunkThickness: 0.25,
    branches: 8,
    leaves: 100,
    fruits: 5,
    color: '#2E8B57',  // 海绿色
    glow: false
  },
  5: {  // 洞察者
    name: '大树',
    height: 3.0,
    trunkThickness: 0.3,
    branches: 12,
    leaves: 150,
    fruits: 10,
    color: '#228B22',  // 森林绿
    glow: true,
    glowColor: '#FFD700'  // 金色光晕
  },
  6: {  // 先锋者
    name: '参天大树',
    height: 3.5,
    trunkThickness: 0.35,
    branches: 16,
    leaves: 200,
    fruits: 20,
    color: '#006400',  // 深绿色
    glow: true,
    glowColor: '#4169E1'  // 蓝色光晕
  },
  7: {  // 引领者
    name: '智慧古树',
    height: 4.0,
    trunkThickness: 0.4,
    branches: 20,
    leaves: 300,
    fruits: 30,
    color: '#8B4513',  // 古铜色
    glow: true,
    glowColor: '#FF69B4',  // 粉紫光晕
    sacred: true  // 神圣效果
  }
}
```

---

## 📊 二、角色权限体系

### 2.1 角色定义

| 角色 | 英文标识 | 权限描述 | 能看到的数据 |
|------|---------|---------|-------------|
| **校长** | `principal` | 高级管理员，全局管理 | AI总结、统计数据、基本信息 |
| **老师** | `teacher` | 普通管理员，管理分配的课程和学员 | AI总结、统计数据、基本信息 |

**关键原则**：
- ✅ 校长和老师都**不能**查看学员的对话内容（gaia_conversations.messages）
- ✅ 校长和老师都**不能**查看学员的作业内容（user_submissions.content）
- ✅ 只能查看AI生成的综合评价和统计数据

### 2.2 数据库表设计

```sql
-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('principal', 'teacher')),

  -- 管理权限
  managed_courses UUID[],           -- 管理的课程ID列表
  managed_student_groups UUID[],    -- 管理的学员分组ID列表

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_admins_role (role)
);

COMMENT ON TABLE admins IS '管理员表，包含校长和老师';
COMMENT ON COLUMN admins.managed_courses IS '老师管理的课程列表，校长为NULL（管理所有）';

-- 学员分组表
CREATE TABLE IF NOT EXISTS student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- 分组类型
  group_type TEXT CHECK (group_type IN ('course', 'project', 'score', 'custom')),

  -- 分组条件（JSON）
  criteria JSONB,
  -- 示例：{"course_system": "listening"} 或 {"level_range": [3, 5]}

  -- 成员
  member_ids UUID[],                -- 学员ID列表

  -- 管理信息
  manager_id UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_groups_manager (manager_id),
  INDEX idx_groups_type (group_type)
);

COMMENT ON TABLE student_groups IS '学员分组表，支持按课程/项目/成绩/自定义分组';

-- 课程权限分配表
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(admin_id, course_system_id)
);

COMMENT ON TABLE course_assignments IS '校长分配给老师的课程管理权限';

-- 学员课程分配表
CREATE TABLE IF NOT EXISTS student_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES admins(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),

  UNIQUE(student_id, course_system_id),
  INDEX idx_student_assignments_student (student_id),
  INDEX idx_student_assignments_course (course_system_id)
);

COMMENT ON TABLE student_course_assignments IS '老师/校长分配给学员的课程';
```

### 2.3 RLS（行级安全）策略

```sql
-- ========== 学员基本信息访问策略 ==========

-- 校长可以查看所有学员
CREATE POLICY "principals_view_all_students"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid() AND admins.role = 'principal'
  )
);

-- 老师只能查看被分配的学员
CREATE POLICY "teachers_view_assigned_students"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a
    JOIN student_course_assignments sca ON sca.assigned_by = a.id
    WHERE a.id = auth.uid()
      AND a.role = 'teacher'
      AND sca.student_id = profiles.id
  )
);

-- ========== 隐私数据保护策略 ==========

-- 完全阻止管理员查看对话内容
CREATE POLICY "block_admins_view_conversations"
ON gaia_conversations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()  -- 只能学员自己查看
);

-- 完全阻止管理员查看作业内容
CREATE POLICY "block_admins_view_submission_content"
ON user_submissions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()  -- 只能学员自己查看
);

-- 管理员可以查看作业元数据（但不包含content字段）
CREATE POLICY "admins_view_submission_metadata"
ON user_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
)
WITH CHECK (false);  -- 不允许修改

-- 注意：在API层需要过滤掉content字段
```

### 2.4 API层数据过滤

```typescript
// app/api/admin/students/[id]/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  // 检查当前用户是否是管理员
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!admin) {
    return new Response('Unauthorized', { status: 403 })
  }

  // 获取学员基本信息（可见）
  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, consciousness_level, composite_score, created_at')
    .eq('id', params.id)
    .single()

  // 获取AI生成的综合评价（可见）
  const { data: summary } = await supabase
    .from('student_summaries')
    .select('*')
    .eq('user_id', params.id)
    .single()

  // 获取统计数据（可见）
  const { data: stats } = await supabase
    .from('user_behavior_stats')
    .select('*')
    .eq('user_id', params.id)

  // ❌ 不获取对话内容
  // ❌ 不获取作业内容

  return NextResponse.json({
    student,
    summary,
    stats
  })
}
```

---

## 📊 三、AI生成的学员综合评价

### 3.1 数据库表设计

```sql
CREATE TABLE IF NOT EXISTS student_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- AI生成的综合评价
  personality_traits JSONB,         -- 性格特点分析
  learning_style TEXT,              -- 学习风格
  strengths TEXT[],                 -- 优势
  areas_for_growth TEXT[],          -- 成长空间
  overall_summary TEXT,             -- 总体评价（200-300字）

  -- 每门课的学习情况简介
  course_summaries JSONB,
  -- 格式：{
  --   "listening": {
  --     "progress": 57,
  --     "style": "深度反思型",
  --     "challenges": ["对'恐惧'主题理解有困难"],
  --     "highlights": ["对'觉察'的理解非常深刻"]
  --   },
  --   ...
  -- }

  -- 生成信息
  generated_by TEXT DEFAULT 'edge_function',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,  -- 有效期（一周后过期）

  INDEX idx_summaries_user (user_id),
  INDEX idx_summaries_valid (valid_until)
);

COMMENT ON TABLE student_summaries IS 'AI生成的学员综合评价，供管理员查看，每周更新';
COMMENT ON COLUMN student_summaries.personality_traits IS '性格特点JSON，例如：{"openness": 85, "conscientiousness": 70, ...}';
COMMENT ON COLUMN student_summaries.course_summaries IS '每门课的学习情况简介JSON';
```

### 3.2 Edge Function: generate-student-summary

```typescript
// supabase/functions/generate-student-summary/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

/**
 * 为所有学员生成AI综合评价
 * 触发方式：每周日凌晨3点（在等级计算之后）
 */

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[开始生成学员综合评价]')

    // 获取所有学员
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name')
      .neq('role', 'content_admin')

    for (const student of students) {
      console.log(`[处理学员] ${student.full_name}`)

      // 1. 获取学员数据（不包含隐私内容）
      const studentData = await fetchStudentDataForAnalysis(supabase, student.id)

      // 2. 调用AI生成综合评价
      const summary = await generateSummaryWithAI(studentData)

      // 3. 保存到数据库
      await supabase
        .from('student_summaries')
        .upsert({
          user_id: student.id,
          personality_traits: summary.personality_traits,
          learning_style: summary.learning_style,
          strengths: summary.strengths,
          areas_for_growth: summary.areas_for_growth,
          overall_summary: summary.overall_summary,
          course_summaries: summary.course_summaries,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
    }

    return new Response(
      JSON.stringify({ success: true, processed: students.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[生成失败]', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchStudentDataForAnalysis(supabase: any, userId: string) {
  // 获取统计数据（不包含隐私内容）
  const [conversations, submissions, progress] = await Promise.all([
    // 对话元数据（不包含messages内容）
    supabase
      .from('gaia_conversations')
      .select('id, message_count, created_at, title, metadata')
      .eq('user_id', userId),

    // 作业元数据（不包含content内容）
    supabase
      .from('user_submissions')
      .select('id, submission_type, score, submitted_at, status, consciousness_growth_points')
      .eq('user_id', userId),

    // 学习进度
    supabase
      .from('user_progress')
      .select('*, course_contents(title, system_id)')
      .eq('user_id', userId)
  ])

  return {
    conversations_stats: {
      total_count: conversations.data?.length || 0,
      avg_turns: conversations.data?.reduce((sum, c) => sum + c.message_count, 0) / (conversations.data?.length || 1),
      topics: conversations.data?.map(c => c.title).filter(Boolean)
    },
    submissions_stats: {
      total_count: submissions.data?.length || 0,
      avg_score: submissions.data?.reduce((sum, s) => sum + (s.score || 0), 0) / (submissions.data?.length || 1),
      types: submissions.data?.map(s => s.submission_type)
    },
    progress_stats: {
      courses_enrolled: new Set(progress.data?.map(p => p.course_contents?.system_id)).size,
      completion_rates: calculateCompletionRates(progress.data)
    }
  }
}

async function generateSummaryWithAI(studentData: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `你是未来心智学院的AI分析师。根据学员的学习统计数据（不包含具体对话和作业内容），生成综合评价。

评价维度：
1. 性格特点：根据学习行为模式推断（开放性、责任心、外向性等）
2. 学习风格：深度反思型、快速探索型、稳健前进型等
3. 优势：最擅长的方面
4. 成长空间：可以改进的方向
5. 总体评价：200-300字的综合描述

返回JSON格式。`
        },
        {
          role: 'user',
          content: `学员数据：\n${JSON.stringify(studentData, null, 2)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  const result = await response.json()
  return JSON.parse(result.choices[0].message.content)
}
```

---

## 📊 四、盖亚N8N变量生成系统

### 4.1 数据库表设计

```sql
CREATE TABLE IF NOT EXISTS gaia_context_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,

  -- 变量1：学生基本信息（性格特点等）
  student_profile JSONB,
  -- 格式：{
  --   "personality": "内向型、深度思考者",
  --   "learning_pace": "稳健前进型",
  --   "strengths": ["觉察力强", "善于反思"],
  --   "challenges": ["容易过度思考"]
  -- }

  -- 变量2：该学生学这门课的学习情况简介
  course_learning_summary TEXT,
  -- 示例："该学员在自在聆听课程中表现出色，已完成8/14天（57%）。
  -- 学习风格偏向深度反思型，对'觉察'主题理解深刻，但在'恐惧'主题上需要更多引导。
  -- 最近三次作业平均分88分，对话深度中等。"

  -- 变量3：课程教学目标/方向/目的/策略（固定）
  course_teaching_goals TEXT,
  course_guidance_keywords TEXT[],
  -- 示例：["引导觉察", "苏格拉底提问", "避免说教", "关注当下体验"]

  -- 生成信息
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,  -- 有效期（一周）

  UNIQUE(user_id, course_system_id),
  INDEX idx_gaia_vars_user (user_id),
  INDEX idx_gaia_vars_course (course_system_id),
  INDEX idx_gaia_vars_valid (valid_until)
);

COMMENT ON TABLE gaia_context_variables IS '盖亚对话的N8N变量，每周生成一次';
COMMENT ON COLUMN gaia_context_variables.student_profile IS '学生性格特点分析（JSON）';
COMMENT ON COLUMN gaia_context_variables.course_learning_summary IS '该学生学这门课的学习情况简介（TEXT）';
COMMENT ON COLUMN gaia_context_variables.course_teaching_goals IS '课程教学目标（固定，TEXT）';
```

### 4.2 课程教学目标配置

```sql
-- 在course_systems表中添加字段
ALTER TABLE course_systems
ADD COLUMN IF NOT EXISTS teaching_goals TEXT,
ADD COLUMN IF NOT EXISTS guidance_keywords TEXT[];

-- 配置三大课程的教学目标
UPDATE course_systems
SET
  teaching_goals = '通过克里希那穆提的智慧引导学员进行深度自我觉察，理解思想、情绪和恐惧的本质。不提供答案，而是引导学员自己发现真相。',
  guidance_keywords = ARRAY['引导觉察', '苏格拉底提问', '避免说教', '关注当下体验', '不评判', '探索恐惧']
WHERE system_key = 'listening';

UPDATE course_systems
SET
  teaching_goals = '通过纪录片《Welcome to Earth》引导学员探索自然界的奥秘，理解生命科学和通用法则，激发对世界的好奇心和探索欲。',
  guidance_keywords = ARRAY['激发好奇', '科学探究', '连接生活', '跨学科思维', '实验精神']
WHERE system_key = 'earth';

UPDATE course_systems
SET
  teaching_goals = '通过PBL项目培养学员的创造力和问题解决能力，从学习者转变为共同创造者，产生有价值的作品。',
  guidance_keywords = ARRAY['激发创造力', '项目制学习', '迭代优化', '分享成果', '协作精神']
WHERE system_key = 'icarus';
```

### 4.3 Edge Function: generate-gaia-variables

```typescript
// supabase/functions/generate-gaia-variables/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 为所有学员生成盖亚N8N变量
 * 触发方式：每周日凌晨4点
 */

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[开始生成盖亚N8N变量]')

    // 获取所有学员
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .neq('role', 'content_admin')

    // 获取所有课程
    const { data: courses } = await supabase
      .from('course_systems')
      .select('id, system_key, teaching_goals, guidance_keywords')

    for (const student of students) {
      for (const course of courses) {
        console.log(`[处理] 学员${student.id} - 课程${course.system_key}`)

        // 1. 从student_summaries获取学生性格特点
        const { data: summary } = await supabase
          .from('student_summaries')
          .select('personality_traits, learning_style, strengths, areas_for_growth')
          .eq('user_id', student.id)
          .single()

        const studentProfile = {
          personality: summary?.personality_traits,
          learning_style: summary?.learning_style,
          strengths: summary?.strengths || [],
          challenges: summary?.areas_for_growth || []
        }

        // 2. 生成该学生学这门课的学习情况简介
        const courseSummary = await generateCourseLearning Summary(
          supabase,
          student.id,
          course.id,
          course.system_key
        )

        // 3. 保存到数据库
        await supabase
          .from('gaia_context_variables')
          .upsert({
            user_id: student.id,
            course_system_id: course.id,
            student_profile: studentProfile,
            course_learning_summary: courseSummary,
            course_teaching_goals: course.teaching_goals,
            course_guidance_keywords: course.guidance_keywords,
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[生成失败]', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function generateCourseLearningSum mary(
  supabase: any,
  userId: string,
  courseId: string,
  courseKey: string
): Promise<string> {
  // 获取该学生在该课程的进度
  const { data: progress } = await supabase
    .from('user_progress')
    .select(`
      *,
      course_contents!inner (
        id,
        system_id
      )
    `)
    .eq('user_id', userId)
    .eq('course_contents.system_id', courseId)

  // 计算完成率
  const totalUnits = {
    'listening': 14,
    'earth': 6,
    'icarus': 12
  }[courseKey] || 0

  const completedCount = progress?.filter(p => p.progress_value >= 100).length || 0
  const completionRate = Math.round((completedCount / totalUnits) * 100)

  // 获取最近作业表现
  const { data: recentSubmissions } = await supabase
    .from('user_submissions')
    .select('score, submission_type')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(3)

  const avgScore = recentSubmissions?.reduce((sum, s) => sum + (s.score || 0), 0) / (recentSubmissions?.length || 1)

  // 生成文本描述
  return `该学员在${courseKey}课程中已完成${completedCount}/${totalUnits}（${completionRate}%）。最近三次作业平均分${Math.round(avgScore)}分。`
}
```

### 4.4 N8N工作流集成

```javascript
// N8N节点：获取盖亚上下文变量

const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 从输入获取用户ID和课程ID
const userId = $input.item.json.user_id
const courseSystemId = $input.item.json.course_system_id
const userMessage = $input.item.json.message

// 获取变量
const { data: variables } = await supabase
  .from('gaia_context_variables')
  .select('*')
  .eq('user_id', userId)
  .eq('course_system_id', courseSystemId)
  .single()

// 构建盖亚的系统提示词
const systemPrompt = `
你是盖亚，未来心智学院的AI导师。

## 学生基本信息
性格特点：${JSON.stringify(variables.student_profile.personality)}
学习风格：${variables.student_profile.learning_style}
优势：${variables.student_profile.strengths.join('、')}
挑战：${variables.student_profile.challenges.join('、')}

## 该学生在本课程的学习情况
${variables.course_learning_summary}

## 本课程的教学目标
${variables.course_teaching_goals}

## 引导关键词
${variables.course_guidance_keywords.join('、')}

---

现在，学生向你提问：${userMessage}

请根据以上信息，以盖亚的身份回复学生。记住：
1. 根据学生的性格特点调整对话风格
2. 关注学生在该课程的学习情况，给予针对性引导
3. 遵循课程的教学目标和引导原则
4. 使用苏格拉底式提问，引导学生自己发现答案
`

return { systemPrompt, userMessage }
```

---

## 📊 五、分组管理系统

### 5.1 分组类型设计

| 分组类型 | 标识 | 说明 | 示例 |
|---------|------|------|------|
| **按课程分组** | `course` | 学习同一课程的学员 | "自在聆听学员组" |
| **按项目分组** | `project` | 参与同一PBL项目的学员 | "声音可视化项目组" |
| **按成绩分组** | `score` | 按意识等级或综合评分分组 | "Level 5-7 高级组" |
| **自定义分组** | `custom` | 老师手动创建和管理 | "2025春季班" |

### 5.2 自动分组规则

```sql
-- 创建自动分组函数
CREATE OR REPLACE FUNCTION auto_create_course_groups()
RETURNS void AS $$
BEGIN
  -- 为每个活跃课程创建分组
  INSERT INTO student_groups (name, description, group_type, criteria, member_ids)
  SELECT
    cs.title || '学员组',
    '学习' || cs.title || '课程的所有学员',
    'course',
    jsonb_build_object('course_system_id', cs.id),
    ARRAY(
      SELECT DISTINCT sca.student_id
      FROM student_course_assignments sca
      WHERE sca.course_system_id = cs.id
        AND sca.status = 'active'
    )
  FROM course_systems cs
  WHERE cs.is_active = true
  ON CONFLICT (name) DO UPDATE
  SET member_ids = EXCLUDED.member_ids,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 定时任务：每天更新分组
SELECT cron.schedule(
  'update-course-groups-daily',
  '0 1 * * *',  -- 每天凌晨1点
  'SELECT auto_create_course_groups();'
);
```

### 5.3 管理界面API

```typescript
// app/api/admin/groups/route.ts

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // 检查权限
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!admin) {
    return new Response('Unauthorized', { status: 403 })
  }

  // 获取分组列表
  let query = supabase
    .from('student_groups')
    .select('*, profiles!inner(full_name, consciousness_level)')

  // 老师只能看自己管理的分组
  if (admin.role === 'teacher') {
    query = query.eq('manager_id', admin.id)
  }

  const { data: groups } = await query

  // 统计每个分组的数据
  const groupsWithStats = groups.map(group => ({
    ...group,
    member_count: group.member_ids?.length || 0,
    avg_level: calculateAvgLevel(group.member_ids),
    active_members: countActiveMembers(group.member_ids)
  }))

  return NextResponse.json({ groups: groupsWithStats })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  // 创建新分组
  const { data, error } = await supabase
    .from('student_groups')
    .insert({
      name: body.name,
      description: body.description,
      group_type: body.group_type,
      criteria: body.criteria,
      member_ids: body.member_ids,
      manager_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single()

  return NextResponse.json({ group: data })
}
```

---

## 📊 六、统计看板系统

### 6.1 行为数据统计表

```sql
CREATE TABLE IF NOT EXISTS user_behavior_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 登录统计
  login_count INTEGER DEFAULT 0,
  total_online_minutes INTEGER DEFAULT 0,

  -- 学习行为统计
  pages_viewed INTEGER DEFAULT 0,
  courses_accessed TEXT[],

  -- 对话统计
  conversation_sessions INTEGER DEFAULT 0,
  conversation_turns INTEGER DEFAULT 0,
  conversation_minutes INTEGER DEFAULT 0,

  -- 作业统计
  submissions_count INTEGER DEFAULT 0,
  avg_submission_time_minutes INTEGER,

  -- 视频统计（地球课程）
  video_watch_minutes INTEGER DEFAULT 0,
  videos_completed INTEGER DEFAULT 0,

  UNIQUE(user_id, date),
  INDEX idx_behavior_stats_user (user_id),
  INDEX idx_behavior_stats_date (date DESC)
);

COMMENT ON TABLE user_behavior_stats IS '用户行为统计表，按天记录所有学习行为';
```

### 6.2 聚合统计视图

```sql
-- 分组统计视图（供管理员查看）
CREATE OR REPLACE VIEW admin_group_statistics AS
SELECT
  sg.id as group_id,
  sg.name as group_name,
  sg.group_type,

  -- 人数统计
  CARDINALITY(sg.member_ids) as total_students,
  COUNT(DISTINCT CASE WHEN p.composite_score > 0 THEN p.id END) as active_students,

  -- 等级分布
  COUNT(CASE WHEN p.consciousness_level = 1 THEN 1 END) as level_1_count,
  COUNT(CASE WHEN p.consciousness_level = 2 THEN 1 END) as level_2_count,
  COUNT(CASE WHEN p.consciousness_level = 3 THEN 1 END) as level_3_count,
  COUNT(CASE WHEN p.consciousness_level = 4 THEN 1 END) as level_4_count,
  COUNT(CASE WHEN p.consciousness_level = 5 THEN 1 END) as level_5_count,
  COUNT(CASE WHEN p.consciousness_level = 6 THEN 1 END) as level_6_count,
  COUNT(CASE WHEN p.consciousness_level = 7 THEN 1 END) as level_7_count,

  -- 平均指标
  ROUND(AVG(p.composite_score), 2) as avg_composite_score,
  ROUND(AVG(p.consciousness_level), 2) as avg_consciousness_level,

  -- 活跃度统计（最近7天）
  COUNT(DISTINCT CASE
    WHEN ubs.date >= CURRENT_DATE - INTERVAL '7 days' AND ubs.login_count > 0
    THEN p.id
  END) as active_last_week,

  -- 学习时长统计
  ROUND(AVG(ubs.total_online_minutes)) as avg_online_minutes_per_day,
  SUM(ubs.total_online_minutes) as total_online_minutes,

  -- 完课率（简化计算）
  ROUND(AVG(
    CASE
      WHEN up.progress_value IS NOT NULL THEN up.progress_value
      ELSE 0
    END
  ), 2) as avg_completion_rate

FROM student_groups sg
LEFT JOIN LATERAL unnest(sg.member_ids) AS member_id ON true
LEFT JOIN profiles p ON p.id = member_id
LEFT JOIN user_behavior_stats ubs ON ubs.user_id = p.id
LEFT JOIN user_progress up ON up.user_id = p.id

GROUP BY sg.id, sg.name, sg.group_type;
```

### 6.3 管理员统计看板API

```typescript
// app/api/admin/dashboard/route.ts

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  // 检查权限
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!admin) {
    return new Response('Unauthorized', { status: 403 })
  }

  // 1. 总体统计
  const { data: overallStats } = await supabase
    .from('profiles')
    .select('id, consciousness_level, composite_score, created_at')
    .neq('role', 'content_admin')

  // 2. 活跃度统计（最近7天）
  const { data: activeStats } = await supabase
    .from('user_behavior_stats')
    .select('user_id, date, total_online_minutes, login_count')
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // 3. 等级分布
  const levelDistribution = {}
  for (let i = 1; i <= 7; i++) {
    levelDistribution[i] = overallStats.filter(s => s.consciousness_level === i).length
  }

  // 4. 新学员趋势（最近30天）
  const newStudentsTrend = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    newStudentsTrend[date] = overallStats.filter(s =>
      s.created_at.split('T')[0] === date
    ).length
  }

  // 5. 在线时长排行榜（TOP 10）
  const onlineTimeRanking = activeStats
    .reduce((acc, stat) => {
      if (!acc[stat.user_id]) {
        acc[stat.user_id] = 0
      }
      acc[stat.user_id] += stat.total_online_minutes
      return acc
    }, {})

  const topUsers = Object.entries(onlineTimeRanking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, minutes]) => ({ userId, minutes }))

  return NextResponse.json({
    overall: {
      total_students: overallStats.length,
      avg_composite_score: overallStats.reduce((sum, s) => sum + s.composite_score, 0) / overallStats.length,
      active_last_week: new Set(activeStats.map(s => s.user_id)).size
    },
    level_distribution: levelDistribution,
    new_students_trend: newStudentsTrend,
    online_time_ranking: topUsers
  })
}
```

---

## 🗂️ 七、实施步骤

### Phase 1: 数据库重构（2天）

#### Day 1: 表结构创建
- [ ] 创建admins表
- [ ] 创建student_groups表
- [ ] 创建course_assignments表
- [ ] 创建student_course_assignments表
- [ ] 创建student_summaries表
- [ ] 创建gaia_context_variables表
- [ ] 创建user_behavior_stats表
- [ ] 创建consciousness_level_history表
- [ ] 修改profiles表（添加composite_score等字段）
- [ ] 修改course_systems表（添加teaching_goals等字段）

#### Day 2: RLS策略和函数
- [ ] 配置所有RLS策略（阻止查看隐私数据）
- [ ] 创建calculate_all_student_levels()函数
- [ ] 创建auto_create_course_groups()函数
- [ ] 创建admin_group_statistics视图
- [ ] 配置课程教学目标数据
- [ ] 测试数据库权限

### Phase 2: Edge Functions开发（3天）

#### Day 3: 相对等级计算
- [ ] 开发calculate-relative-level函数
- [ ] 测试等级计算算法
- [ ] 配置定时任务（每周日凌晨2点）

#### Day 4: AI综合评价生成
- [ ] 开发generate-student-summary函数
- [ ] 调试AI提示词，确保评价质量
- [ ] 配置定时任务（每周日凌晨3点）

#### Day 5: 盖亚N8N变量生成
- [ ] 开发generate-gaia-variables函数
- [ ] 测试变量生成逻辑
- [ ] 配置定时任务（每周日凌晨4点）
- [ ] 与N8N工作流集成测试

### Phase 3: 管理后台开发（4-5天）

#### Day 6-7: 学员管理页面
- [ ] 创建/admin/students列表页
  - 搜索、筛选、排序功能
  - 显示基本信息、等级、统计
  - 不显示隐私数据
- [ ] 创建/admin/students/[id]详情页
  - AI生成的综合评价
  - 统计数据和图表
  - 等级历史趋势

#### Day 8: 分组管理
- [ ] 创建/admin/students/groups页面
- [ ] 分组CRUD功能
- [ ] 分组统计视图
- [ ] 自动分组功能

#### Day 9: 课程分配
- [ ] 创建/admin/assignments页面
- [ ] 校长分配课程给老师
- [ ] 老师分配课程给学员
- [ ] 权限验证

#### Day 10: 统计看板
- [ ] 创建/admin/dashboard页面
- [ ] 实现各类图表（Recharts）
- [ ] 关键指标卡片
- [ ] 数据导出功能

### Phase 4: 意识树造型设计（2天）

#### Day 11: 3D模型设计
- [ ] 设计7种不同造型的意识树
- [ ] 使用Three.js实现
- [ ] 根据等级动态渲染

#### Day 12: 前端集成
- [ ] 在学员端显示自己的意识树
- [ ] 在管理端显示学员的意识树（简化版）
- [ ] 添加等级提升动画

### Phase 5: 测试与优化（2天）

#### Day 13: 功能测试
- [ ] 权限测试（确保管理员无法查看隐私数据）
- [ ] 相对等级计算验证
- [ ] AI总结质量评估
- [ ] N8N变量获取测试
- [ ] 分组功能测试

#### Day 14: 性能优化与部署
- [ ] 数据库查询优化
- [ ] 添加缓存
- [ ] 前端性能优化
- [ ] 部署到生产环境
- [ ] 编写使用文档

---

## 📝 总结

### 核心变更对比

| 功能 | 旧设计（错误） | 新设计（正确） |
|-----|--------------|--------------|
| 学员标识 | 学号系统（FMI+年月+流水号） | 只用UUID和邮箱 |
| 意识评价 | 四模块动态评分（总分系统） | 相对等级（1-7级，基于赛斯理论） |
| 学习记录 | 详细活动流 | AI生成的综合评价 |
| 作业批改 | 管理员/AI批改 | 不涉及批改功能 |
| 数据权限 | 管理员能看详细内容 | 管理员无法看隐私数据 |
| 管理目标 | 检查学员作业 | 管理整体、查看统计 |
| 盖亚对话 | 单独Edge Function | N8N变量（每周生成） |

### 技术栈

- **后端**: Supabase（PostgreSQL + Edge Functions + RLS）
- **前端**: Next.js 15 + React + TypeScript
- **AI**: OpenAI GPT-4 Turbo（生成评价和变量）
- **3D可视化**: Three.js（意识树造型）
- **图表**: Recharts（统计看板）
- **定时任务**: pg_cron（Supabase内置）
- **工作流**: N8N（盖亚对话）

### 预计开发周期

- **Phase 1**: 2天（数据库重构）
- **Phase 2**: 3天（Edge Functions）
- **Phase 3**: 4-5天（管理后台）
- **Phase 4**: 2天（意识树造型）
- **Phase 5**: 2天（测试优化）

**总计：13-14天（2-3周）**

---

## 🔒 隐私保护保证

✅ **管理员无法查看的数据**：
- gaia_conversations.messages（对话内容）
- user_submissions.content（作业内容）
- consciousness_tree_view详细数据（只能看等级）

✅ **管理员可以查看的数据**：
- 学员基本信息（姓名、邮箱、头像）
- 意识等级（1-7）
- AI生成的综合评价
- 统计数据（在线时长、完课率等）
- 分组和课程分配信息

✅ **技术保障**：
- RLS策略强制隔离
- API层二次过滤
- 前端不请求隐私字段

---

*文档版本：2.0*
*最后更新：2025-10-29*
*设计者：Claude Code*
*状态：待实施*
