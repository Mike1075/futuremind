-- Migration: 20251103000000_course_permissions_system.sql
-- Description: 添加课程权限系统 - 创建者、协作者、系统课程标记
-- Date: 2025-11-03

-- ============================================================
-- 第一部分：修改 course_systems 表，添加权限相关字段
-- ============================================================

-- 添加创建者字段
ALTER TABLE course_systems
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 添加系统课程标记（原有的三个课程：listening, earth, pbl）
ALTER TABLE course_systems
ADD COLUMN IF NOT EXISTS is_system_course BOOLEAN DEFAULT FALSE;

-- 添加协作编辑控制
ALTER TABLE course_systems
ADD COLUMN IF NOT EXISTS allow_collaboration BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN course_systems.created_by IS '课程创建者ID，校长/老师创建时自动记录';
COMMENT ON COLUMN course_systems.is_system_course IS '是否为系统课程（listening/earth/pbl），系统课程不可删除';
COMMENT ON COLUMN course_systems.allow_collaboration IS '是否允许协作编辑';

-- 标记现有的三个系统课程
UPDATE course_systems
SET is_system_course = TRUE
WHERE system_key IN ('listening', 'earth', 'pbl', 'icarus');

-- ============================================================
-- 第二部分：创建课程协作者表
-- ============================================================

CREATE TABLE IF NOT EXISTS course_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES course_systems(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  permission_level TEXT NOT NULL DEFAULT 'editor' CHECK (permission_level IN ('viewer', 'editor', 'admin')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  UNIQUE(course_id, collaborator_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_course ON course_collaborators(course_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON course_collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON course_collaborators(status);

COMMENT ON TABLE course_collaborators IS '课程协作者表，记录被邀请编辑课程的老师';
COMMENT ON COLUMN course_collaborators.permission_level IS '权限级别：viewer(只读), editor(编辑), admin(管理)';
COMMENT ON COLUMN course_collaborators.status IS '邀请状态：pending(待接受), accepted(已接受), declined(已拒绝)';

-- ============================================================
-- 第三部分：创建权限检查函数
-- ============================================================

-- 函数：检查用户是否可以编辑某个课程
CREATE OR REPLACE FUNCTION can_edit_course(
  p_user_id UUID,
  p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_created_by UUID;
  v_is_system_course BOOLEAN;
  v_is_collaborator BOOLEAN;
BEGIN
  -- 获取用户角色
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- 校长可以编辑所有课程
  IF v_user_role = 'principal' THEN
    RETURN TRUE;
  END IF;

  -- 获取课程信息
  SELECT created_by, is_system_course INTO v_created_by, v_is_system_course
  FROM course_systems
  WHERE id = p_course_id;

  -- 检查是否为创建者
  IF v_created_by = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- 检查是否为协作者（已接受邀请）
  SELECT EXISTS(
    SELECT 1 FROM course_collaborators
    WHERE course_id = p_course_id
      AND collaborator_id = p_user_id
      AND status = 'accepted'
      AND permission_level IN ('editor', 'admin')
  ) INTO v_is_collaborator;

  RETURN v_is_collaborator;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：检查用户是否可以删除某个课程
CREATE OR REPLACE FUNCTION can_delete_course(
  p_user_id UUID,
  p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_created_by UUID;
  v_is_system_course BOOLEAN;
BEGIN
  -- 获取用户角色
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- 获取课程信息
  SELECT created_by, is_system_course INTO v_created_by, v_is_system_course
  FROM course_systems
  WHERE id = p_course_id;

  -- 系统课程不可删除
  IF v_is_system_course = TRUE THEN
    RETURN FALSE;
  END IF;

  -- 校长可以删除非系统课程
  IF v_user_role = 'principal' THEN
    RETURN TRUE;
  END IF;

  -- 创建者可以删除自己创建的课程
  IF v_created_by = p_user_id THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 第四部分：RLS 策略
-- ============================================================

-- course_systems 表的删除策略
DROP POLICY IF EXISTS "用户可以删除自己创建的课程" ON course_systems;
CREATE POLICY "用户可以删除自己创建的课程"
ON course_systems FOR DELETE
USING (
  can_delete_course(auth.uid(), id)
);

-- course_systems 表的更新策略
DROP POLICY IF EXISTS "用户可以编辑有权限的课程" ON course_systems;
CREATE POLICY "用户可以编辑有权限的课程"
ON course_systems FOR UPDATE
USING (
  can_edit_course(auth.uid(), id)
);

-- course_collaborators 表的策略
ALTER TABLE course_collaborators ENABLE ROW LEVEL SECURITY;

-- 协作者可以查看自己的邀请
CREATE POLICY "用户可以查看自己的协作邀请"
ON course_collaborators FOR SELECT
USING (
  collaborator_id = auth.uid()
  OR invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'
  )
);

-- 课程创建者和校长可以邀请协作者
CREATE POLICY "创建者和校长可以邀请协作者"
ON course_collaborators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_systems cs
    WHERE cs.id = course_id
      AND (cs.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'
      ))
  )
);

-- 协作者可以接受/拒绝邀请
CREATE POLICY "协作者可以更新邀请状态"
ON course_collaborators FOR UPDATE
USING (
  collaborator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM course_systems cs
    WHERE cs.id = course_id
      AND (cs.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'
      ))
  )
);

-- 创建者和校长可以删除协作关系
CREATE POLICY "创建者和校长可以删除协作者"
ON course_collaborators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM course_systems cs
    WHERE cs.id = course_id
      AND (cs.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal'
      ))
  )
);
