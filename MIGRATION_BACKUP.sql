-- ================================================================
-- 数据库架构重构 - 完整Migration备份
-- 执行时间: 2025-10-27
-- 状态: 已成功执行
-- ================================================================

-- ================================================================
-- Migration 003: 创建 course_systems 表
-- ================================================================

CREATE TABLE IF NOT EXISTS public.course_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  structure_type TEXT NOT NULL CHECK (structure_type IN ('daily_sequential', 'stage_sequential', 'module_matrix')),
  structure_config JSONB DEFAULT '{}'::jsonb,
  total_units INTEGER,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_systems_key ON public.course_systems(system_key);
CREATE INDEX IF NOT EXISTS idx_course_systems_active ON public.course_systems(is_active);

ALTER TABLE public.course_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active course systems" ON public.course_systems
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage course systems" ON public.course_systems
  FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO public.course_systems (system_key, title, description, structure_type, structure_config, total_units, display_order)
VALUES
  ('listening', '自在聆听·观音之旅', '14天的聆听练习，通过克里希那穆提的智慧引导，培养不带选择的觉察能力', 'daily_sequential', '{"unlock_mechanism": "sequential", "requires_completion": true, "can_repeat": true}'::jsonb, 14, 1),
  ('earth', '欢迎来到地球', '6个阶段的感官探索与科学思维培养，基于《欢迎来到地球》纪录片', 'stage_sequential', '{"unlock_mechanism": "sequential", "requires_completion": true, "can_repeat": true, "has_documentaries": true}'::jsonb, 6, 2),
  ('icarus', '伊卡洛斯计划：探索现实的边缘', '3个模块 × 4种难度的PBL项目体系，培养探索精神和实践能力', 'module_matrix', '{"modules": ["invisible_bonds", "reality_edge", "future_seeds"], "difficulty_levels": ["beginner", "intermediate", "advanced", "expert"], "unlock_mechanism": "flexible", "can_select_multiple": true}'::jsonb, 12, 3)
ON CONFLICT (system_key) DO NOTHING;

-- ================================================================
-- Migration 004: 创建 course_contents 表
-- ================================================================

CREATE TABLE IF NOT EXISTS public.course_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID REFERENCES public.course_systems(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('daily_lesson', 'stage', 'pbl_project')),
  sequence_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  original_text TEXT,
  deep_interpretation TEXT,
  meditation_guide TEXT,
  life_practice TEXT,
  documentary_url TEXT,
  pre_watch_guide TEXT,
  knowledge_points JSONB DEFAULT '[]'::jsonb,
  socratic_questions JSONB DEFAULT '[]'::jsonb,
  post_reflection JSONB DEFAULT '[]'::jsonb,
  week_plan JSONB DEFAULT '[]'::jsonb,
  day_plan JSONB DEFAULT '[]'::jsonb,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  estimated_duration INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(system_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_course_contents_system ON public.course_contents(system_id);
CREATE INDEX IF NOT EXISTS idx_course_contents_type ON public.course_contents(content_type);
CREATE INDEX IF NOT EXISTS idx_course_contents_published ON public.course_contents(is_published);
CREATE INDEX IF NOT EXISTS idx_course_contents_sequence ON public.course_contents(system_id, sequence_number);

ALTER TABLE public.course_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published content" ON public.course_contents
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can view all content" ON public.course_contents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage content" ON public.course_contents
  FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- Migration 005: 迁移 lessons 数据到 course_contents
-- ================================================================

INSERT INTO public.course_contents (
  system_id, content_type, sequence_number, title,
  original_text, deep_interpretation, meditation_guide, life_practice,
  is_published, created_at, updated_at
)
SELECT
  (SELECT id FROM public.course_systems WHERE system_key = 'listening'),
  'daily_lesson', l.day_number, l.title,
  l.original_text, l.deep_interpretation, l.meditation_guide, l.life_practice,
  true, l.created_at, l.updated_at
FROM public.lessons l
WHERE l.course_system = '自在聆听'
ON CONFLICT (system_id, sequence_number) DO NOTHING;

ALTER TABLE public.media_resources ADD COLUMN IF NOT EXISTS course_content_id UUID REFERENCES public.course_contents(id) ON DELETE CASCADE;

UPDATE public.media_resources mr
SET course_content_id = (
  SELECT cc.id FROM public.course_contents cc
  JOIN public.lessons l ON l.day_number = cc.sequence_number
  WHERE l.id = mr.lesson_id AND cc.system_id = (SELECT id FROM public.course_systems WHERE system_key = 'listening')
  LIMIT 1
)
WHERE mr.lesson_id IS NOT NULL;

-- ================================================================
-- Migration 006: 创建 user_submissions 表
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_content_id UUID REFERENCES public.course_contents(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('reflection', 'assignment', 'project_deliverable', 'meditation_note')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'needs_revision')),
  reviewer_id UUID REFERENCES public.profiles(id),
  feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  consciousness_growth_points INTEGER DEFAULT 0,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_content ON public.user_submissions(course_content_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.user_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewer ON public.user_submissions(reviewer_id);

ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON public.user_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON public.user_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update pending submissions" ON public.user_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'submitted');

CREATE POLICY "Reviewers can manage submissions" ON public.user_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('content_admin', 'content_editor'))
  );

-- ================================================================
-- Migration 007: 扩展 media_resources 表
-- ================================================================

ALTER TABLE public.media_resources
  ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'audio' CHECK (resource_type IN ('audio', 'video', 'document', 'external_link', 'image')),
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.media_resources
SET resource_type = CASE
  WHEN file_type LIKE '%audio%' THEN 'audio'
  WHEN file_type LIKE '%video%' THEN 'video'
  WHEN file_type LIKE '%image%' OR file_type LIKE '%png%' OR file_type LIKE '%jpg%' THEN 'image'
  WHEN file_type LIKE '%pdf%' OR file_type LIKE '%doc%' THEN 'document'
  ELSE 'audio'
END
WHERE resource_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_resources_content ON public.media_resources(course_content_id);
CREATE INDEX IF NOT EXISTS idx_media_resources_type ON public.media_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_media_resources_active ON public.media_resources(is_active);

-- ================================================================
-- Migration 008: 扩展 explorer_projects 表
-- ================================================================

ALTER TABLE public.explorer_projects
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.course_systems(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS module_name TEXT CHECK (module_name IN ('invisible_bonds', 'reality_edge', 'future_seeds') OR module_name IS NULL),
  ADD COLUMN IF NOT EXISTS difficulty_label TEXT CHECK (difficulty_label IN ('beginner', 'intermediate', 'advanced', 'expert') OR difficulty_label IS NULL),
  ADD COLUMN IF NOT EXISTS week_plan JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS day_plan JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_content_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assessment_criteria JSONB DEFAULT '[]'::jsonb;

UPDATE public.explorer_projects
SET system_id = (SELECT id FROM public.course_systems WHERE system_key = 'icarus')
WHERE system_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_explorer_projects_system ON public.explorer_projects(system_id);
CREATE INDEX IF NOT EXISTS idx_explorer_projects_module ON public.explorer_projects(module_name);
CREATE INDEX IF NOT EXISTS idx_explorer_projects_difficulty ON public.explorer_projects(difficulty_level);

-- ================================================================
-- Migration 009: 删除旧的 lessons 表
-- ================================================================

ALTER TABLE public.media_resources
  DROP CONSTRAINT IF EXISTS media_resources_lesson_id_fkey,
  DROP COLUMN IF EXISTS lesson_id;

DROP TABLE IF EXISTS public.lessons CASCADE;

ALTER TABLE public.media_resources
  ALTER COLUMN course_content_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_resources_course_content
  ON public.media_resources(course_content_id)
  WHERE course_content_id IS NOT NULL;

-- ================================================================
-- 重构完成！
-- ================================================================
