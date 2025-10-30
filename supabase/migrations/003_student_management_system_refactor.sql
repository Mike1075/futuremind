-- Migration: 003_student_management_system_refactor.sql
-- Description: 学员管理系统重构 - 创建新表并修改现有表
-- Date: 2025-10-30
-- Phase 1 Day 1: 表结构创建

-- ============================================================
-- 第一部分：修改现有表
-- ============================================================

-- 修改profiles表：添加相对等级系统字段
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS composite_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentile_rank DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS level_updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN profiles.composite_score IS '综合评分（0-100），用于计算相对等级';
COMMENT ON COLUMN profiles.percentile_rank IS '百分位排名（0-1），用于确定等级';
COMMENT ON COLUMN profiles.consciousness_level IS '意识等级（1-7），基于赛斯理论设计';

-- 修改course_systems表：添加教学目标字段
ALTER TABLE course_systems
ADD COLUMN IF NOT EXISTS teaching_goals TEXT,
ADD COLUMN IF NOT EXISTS guidance_keywords TEXT[];

COMMENT ON COLUMN course_systems.teaching_goals IS '课程教学目标和方向';
COMMENT ON COLUMN course_systems.guidance_keywords IS '引导关键词数组';

-- ============================================================
-- 第二部分：创建新表
-- ============================================================

-- 1. 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('principal', 'teacher')),

  -- 管理权限
  managed_courses UUID[],           -- 管理的课程ID列表
  managed_student_groups UUID[],    -- 管理的学员分组ID列表

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

COMMENT ON TABLE admins IS '管理员表，包含校长和老师';
COMMENT ON COLUMN admins.managed_courses IS '老师管理的课程列表，校长为NULL（管理所有）';

-- 2. 学员分组表
CREATE TABLE IF NOT EXISTS student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- 分组类型
  group_type TEXT CHECK (group_type IN ('course', 'project', 'score', 'custom')),

  -- 分组条件（JSON）
  criteria JSONB,

  -- 成员
  member_ids UUID[],                -- 学员ID列表

  -- 管理信息
  manager_id UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_manager ON student_groups(manager_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON student_groups(group_type);

COMMENT ON TABLE student_groups IS '学员分组表，支持按课程/项目/成绩/自定义分组';

-- 3. 课程权限分配表
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(admin_id, course_system_id)
);

COMMENT ON TABLE course_assignments IS '校长分配给老师的课程管理权限';

-- 4. 学员课程分配表
CREATE TABLE IF NOT EXISTS student_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES admins(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),

  UNIQUE(student_id, course_system_id)
);

CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_course_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_course ON student_course_assignments(course_system_id);

COMMENT ON TABLE student_course_assignments IS '老师/校长分配给学员的课程';

-- 5. AI综合评价表
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

  -- 生成信息
  generated_by TEXT DEFAULT 'edge_function',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE  -- 有效期（一周后过期）
);

CREATE INDEX IF NOT EXISTS idx_summaries_user ON student_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_valid ON student_summaries(valid_until);

COMMENT ON TABLE student_summaries IS 'AI生成的学员综合评价，供管理员查看，每周更新';
COMMENT ON COLUMN student_summaries.personality_traits IS '性格特点JSON，例如：{"openness": 85, "conscientiousness": 70, ...}';
COMMENT ON COLUMN student_summaries.course_summaries IS '每门课的学习情况简介JSON';

-- 6. 盖亚N8N变量表
CREATE TABLE IF NOT EXISTS gaia_context_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_system_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,

  -- 变量1：学生基本信息（性格特点等）
  student_profile JSONB,

  -- 变量2：该学生学这门课的学习情况简介
  course_learning_summary TEXT,

  -- 变量3：课程教学目标/方向/目的/策略（固定）
  course_teaching_goals TEXT,
  course_guidance_keywords TEXT[],

  -- 生成信息
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,  -- 有效期（一周）

  UNIQUE(user_id, course_system_id)
);

CREATE INDEX IF NOT EXISTS idx_gaia_vars_user ON gaia_context_variables(user_id);
CREATE INDEX IF NOT EXISTS idx_gaia_vars_course ON gaia_context_variables(course_system_id);
CREATE INDEX IF NOT EXISTS idx_gaia_vars_valid ON gaia_context_variables(valid_until);

COMMENT ON TABLE gaia_context_variables IS '盖亚对话的N8N变量，每周生成一次';
COMMENT ON COLUMN gaia_context_variables.student_profile IS '学生性格特点分析（JSON）';
COMMENT ON COLUMN gaia_context_variables.course_learning_summary IS '该学生学这门课的学习情况简介（TEXT）';
COMMENT ON COLUMN gaia_context_variables.course_teaching_goals IS '课程教学目标（固定，TEXT）';

-- 7. 行为统计表
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

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_behavior_stats_user ON user_behavior_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_stats_date ON user_behavior_stats(date DESC);

COMMENT ON TABLE user_behavior_stats IS '用户行为统计表，按天记录所有学习行为';

-- 8. 意识等级历史记录表
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
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_history_user_id ON consciousness_level_history(user_id);
CREATE INDEX IF NOT EXISTS idx_level_history_recorded_at ON consciousness_level_history(recorded_at DESC);

COMMENT ON TABLE consciousness_level_history IS '意识等级历史记录，用于追踪学员成长轨迹';

-- ============================================================
-- 第三部分：配置课程教学目标
-- ============================================================

-- 配置自在聆听课程
UPDATE course_systems
SET
  teaching_goals = '通过克里希那穆提的智慧引导学员进行深度自我觉察，理解思想、情绪和恐惧的本质。不提供答案，而是引导学员自己发现真相。',
  guidance_keywords = ARRAY['引导觉察', '苏格拉底提问', '避免说教', '关注当下体验', '不评判', '探索恐惧']
WHERE system_key = 'listening';

-- 配置认识地球课程
UPDATE course_systems
SET
  teaching_goals = '通过纪录片《Welcome to Earth》引导学员探索自然界的奥秘，理解生命科学和通用法则，激发对世界的好奇心和探索欲。',
  guidance_keywords = ARRAY['激发好奇', '科学探究', '连接生活', '跨学科思维', '实验精神']
WHERE system_key = 'earth';

-- 配置飞向伊卡洛斯课程
UPDATE course_systems
SET
  teaching_goals = '通过PBL项目培养学员的创造力和问题解决能力，从学习者转变为共同创造者，产生有价值的作品。',
  guidance_keywords = ARRAY['激发创造力', '项目制学习', '迭代优化', '分享成果', '协作精神']
WHERE system_key = 'icarus';
