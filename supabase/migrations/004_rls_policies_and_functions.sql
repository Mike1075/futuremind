-- Migration: 004_rls_policies_and_functions.sql
-- Description: 配置RLS策略和数据库函数
-- Date: 2025-10-30
-- Phase 1 Day 2: RLS策略和函数

-- ============================================================
-- 第一部分：RLS策略（隐私保护核心）
-- ============================================================

-- ========== 学员基本信息访问策略 ==========

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果存在），避免冲突
DROP POLICY IF EXISTS "principals_view_all_students" ON profiles;
DROP POLICY IF EXISTS "teachers_view_assigned_students" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;

-- 用户可以查看自己的profile
CREATE POLICY "users_can_view_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

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

-- ========== 隐私数据保护策略（核心！）==========

-- 启用对话表的RLS
ALTER TABLE gaia_conversations ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "users_can_view_own_conversations" ON gaia_conversations;
DROP POLICY IF EXISTS "block_admins_view_conversations" ON gaia_conversations;

-- 完全阻止管理员查看对话内容，只允许学员自己查看
CREATE POLICY "users_can_view_own_conversations"
ON gaia_conversations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 启用作业表的RLS
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "users_can_view_own_submissions" ON user_submissions;
DROP POLICY IF EXISTS "block_admins_view_submission_content" ON user_submissions;

-- 完全阻止管理员查看作业内容，只允许学员自己查看
CREATE POLICY "users_can_view_own_submissions"
ON user_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ========== AI综合评价访问策略 ==========

-- 管理员可以查看AI生成的综合评价
ALTER TABLE student_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_view_student_summaries" ON student_summaries;
DROP POLICY IF EXISTS "users_view_own_summaries" ON student_summaries;

-- 学员可以查看自己的总结
CREATE POLICY "users_view_own_summaries"
ON student_summaries FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 管理员可以查看所有学员的总结
CREATE POLICY "admins_view_student_summaries"
ON student_summaries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- ========== 盖亚N8N变量访问策略 ==========

ALTER TABLE gaia_context_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_access_gaia_variables" ON gaia_context_variables;

-- 只允许service role访问（用于N8N和Edge Functions）
CREATE POLICY "service_role_access_gaia_variables"
ON gaia_context_variables FOR ALL
TO service_role
USING (true);

-- ========== 行为统计访问策略 ==========

ALTER TABLE user_behavior_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_view_behavior_stats" ON user_behavior_stats;
DROP POLICY IF EXISTS "users_view_own_stats" ON user_behavior_stats;

-- 学员查看自己的统计
CREATE POLICY "users_view_own_stats"
ON user_behavior_stats FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 管理员查看所有统计
CREATE POLICY "admins_view_behavior_stats"
ON user_behavior_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- ========== 等级历史访问策略 ==========

ALTER TABLE consciousness_level_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_level_history" ON consciousness_level_history;
DROP POLICY IF EXISTS "admins_view_level_history" ON consciousness_level_history;

-- 学员查看自己的等级历史
CREATE POLICY "users_view_own_level_history"
ON consciousness_level_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 管理员查看所有等级历史
CREATE POLICY "admins_view_level_history"
ON consciousness_level_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
  )
);

-- ============================================================
-- 第二部分：数据库函数
-- ============================================================

-- 函数1：计算所有学员的相对意识等级
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
    SELECT
      p.id,
      -- 五大领域平均深度（权重30%）
      COALESCE((
        SELECT AVG((domain_scores->domain->>'depth_score')::numeric)
        FROM user_domain_exploration ude,
             jsonb_each(ude.domain_scores) AS domain_scores(domain, scores)
        WHERE ude.user_id = p.id
      ), 0)::DECIMAL(5,2) AS domain_depth,

      -- 学习活跃度（权重25%）基于活跃天数
      LEAST(100, (
        SELECT COUNT(DISTINCT DATE(submitted_at)) * 2
        FROM user_submissions
        WHERE user_id = p.id
      ))::DECIMAL(5,2) AS activity,

      -- 作业质量（权重25%）平均分
      COALESCE((
        SELECT AVG(score)
        FROM user_submissions
        WHERE user_id = p.id AND status = 'approved'
      ), 0)::DECIMAL(5,2) AS quality,

      -- 对话深度（权重20%）基于对话轮次
      LEAST(100, (
        SELECT COALESCE(SUM(message_count), 0) / 10.0
        FROM gaia_conversations
        WHERE user_id = p.id
      ))::DECIMAL(5,2) AS dialogue_depth
    FROM profiles p
    WHERE p.role != 'content_admin'
  ),
  scored_students AS (
    SELECT
      id,
      domain_depth,
      activity,
      quality,
      dialogue_depth,
      (
        domain_depth * 0.30 +
        activity * 0.25 +
        quality * 0.25 +
        dialogue_depth * 0.20
      )::DECIMAL(5,2) AS composite
    FROM student_scores
  ),
  ranked_students AS (
    SELECT
      id,
      composite AS composite_score,
      PERCENT_RANK() OVER (ORDER BY composite)::DECIMAL(5,4) AS percentile,
      domain_depth AS domain_depth_score,
      activity AS activity_score,
      quality AS quality_score,
      dialogue_depth AS dialogue_depth_score
    FROM scored_students
  )
  SELECT
    id,
    CASE
      WHEN percentile < 0.15 THEN 1  -- 0-15%
      WHEN percentile < 0.30 THEN 2  -- 16-30%
      WHEN percentile < 0.50 THEN 3  -- 31-50%
      WHEN percentile < 0.70 THEN 4  -- 51-70%
      WHEN percentile < 0.85 THEN 5  -- 71-85%
      WHEN percentile < 0.95 THEN 6  -- 86-95%
      ELSE 7                          -- 96-100%
    END AS consciousness_level,
    composite_score,
    percentile AS percentile_rank,
    domain_depth_score,
    activity_score,
    quality_score,
    dialogue_depth_score
  FROM ranked_students;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_all_student_levels() IS '计算所有学员的相对意识等级（1-7），基于综合评分的百分位排名';

-- 函数2：自动创建/更新课程分组
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
  SET
    member_ids = EXCLUDED.member_ids,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_create_course_groups() IS '自动创建和更新按课程分组，每天运行一次';

-- 添加唯一约束到student_groups，用于ON CONFLICT
ALTER TABLE student_groups ADD CONSTRAINT student_groups_name_key UNIQUE (name);

-- ============================================================
-- 第三部分：统计视图
-- ============================================================

-- 创建分组统计视图
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
  SUM(ubs.total_online_minutes) as total_online_minutes

FROM student_groups sg
LEFT JOIN LATERAL unnest(sg.member_ids) AS member_id ON true
LEFT JOIN profiles p ON p.id = member_id
LEFT JOIN user_behavior_stats ubs ON ubs.user_id = p.id

GROUP BY sg.id, sg.name, sg.group_type;

COMMENT ON VIEW admin_group_statistics IS '分组统计视图，供管理员查看各分组的整体情况';
