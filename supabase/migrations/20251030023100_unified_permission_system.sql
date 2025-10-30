-- Migration 005: 统一权限系统
-- 目标：将 profiles.role 和 admins 表合并为统一的权限模型
-- 作者：Claude Code
-- 日期：2025-10-30

-- ============================================================
-- 第1步：修改 profiles.role 枚举，添加 teacher 和 principal
-- ============================================================

-- 先删除旧的 CHECK 约束
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 添加新的 CHECK 约束，包含 teacher 和 principal
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text, 'principal'::text, 'content_viewer'::text, 'content_editor'::text, 'content_admin'::text]));

-- 添加注释说明
COMMENT ON COLUMN profiles.role IS '用户角色：student(学员), teacher(老师), principal(校长), content_viewer/editor/admin(内容管理，待废弃)';

-- ============================================================
-- 第2步：创建 teacher_assignments 表（老师的管理范围）
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  managed_student_ids UUID[] DEFAULT '{}',  -- 老师管理的学员UUID数组
  managed_course_ids UUID[] DEFAULT '{}',   -- 老师管理的课程UUID数组
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个老师只有一条记录
  CONSTRAINT teacher_assignments_teacher_id_unique UNIQUE (teacher_id),

  -- 确保 teacher_id 对应的 profiles.role 必须是 teacher
  CONSTRAINT teacher_assignments_role_check CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = teacher_id
      AND role = 'teacher'
    )
  )
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);

-- 添加注释
COMMENT ON TABLE teacher_assignments IS '老师管理范围表，记录每个老师管理的学员和课程';
COMMENT ON COLUMN teacher_assignments.managed_student_ids IS '该老师管理的学员UUID数组';
COMMENT ON COLUMN teacher_assignments.managed_course_ids IS '该老师管理的课程UUID数组';

-- ============================================================
-- 第3步：迁移现有数据
-- ============================================================

-- 3.1 将 content_admin 改为 principal（校长有最高权限）
UPDATE profiles
SET role = 'principal'
WHERE role = 'content_admin';

-- 3.2 将普通 user 改为 student
UPDATE profiles
SET role = 'student'
WHERE role = 'user';

-- ============================================================
-- 第4步：删除 admins 表及相关依赖
-- ============================================================

-- 4.1 先删除依赖 admins 表的外键约束

-- student_groups 表
ALTER TABLE student_groups DROP CONSTRAINT IF EXISTS student_groups_manager_id_fkey;
ALTER TABLE student_groups DROP COLUMN IF EXISTS manager_id;

-- course_assignments 表（这个表本身就要删除，因为逻辑改变了）
DROP TABLE IF EXISTS course_assignments CASCADE;

-- student_course_assignments 表
ALTER TABLE student_course_assignments DROP CONSTRAINT IF EXISTS student_course_assignments_assigned_by_fkey;
ALTER TABLE student_course_assignments
  ADD COLUMN IF NOT EXISTS assigned_by_role TEXT DEFAULT 'principal';

-- 修改 assigned_by 的注释
COMMENT ON COLUMN student_course_assignments.assigned_by IS '分配者UUID，可以是校长或老师';
COMMENT ON COLUMN student_course_assignments.assigned_by_role IS '分配者角色：principal 或 teacher';

-- 4.2 删除 admins 表
DROP TABLE IF EXISTS admins CASCADE;

-- ============================================================
-- 第5步：重建 student_groups 表的管理者关系
-- ============================================================

-- 添加 created_by 字段，指向创建者（校长或老师）
ALTER TABLE student_groups
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN student_groups.created_by IS '分组创建者（校长或老师）';

-- ============================================================
-- 第6步：更新 RLS 策略
-- ============================================================

-- 6.1 profiles 表的 RLS 策略

-- 删除旧策略
DROP POLICY IF EXISTS "Admins can view all student profiles" ON profiles;

-- 新策略：校长和老师可以查看学员资料
CREATE POLICY "Principals and teachers can view student profiles" ON profiles
  FOR SELECT
  USING (
    -- 自己可以查看自己
    auth.uid() = id
    OR
    -- 校长可以查看所有人
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'principal'
    )
    OR
    -- 老师可以查看自己管理的学员
    (
      role = 'student'
      AND
      EXISTS (
        SELECT 1 FROM teacher_assignments ta
        JOIN profiles p ON p.id = ta.teacher_id
        WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND id = ANY(ta.managed_student_ids)
      )
    )
  );

-- 6.2 student_summaries 表的 RLS 策略

DROP POLICY IF EXISTS "Admins can view student summaries" ON student_summaries;

CREATE POLICY "Principals and teachers can view student summaries" ON student_summaries
  FOR SELECT
  USING (
    -- 校长可以查看所有
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'principal'
    )
    OR
    -- 老师可以查看自己管理的学员
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      JOIN profiles p ON p.id = ta.teacher_id
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND user_id = ANY(ta.managed_student_ids)
    )
  );

-- 6.3 其他相关表的策略（consciousness_level_history, user_behavior_stats等）

DROP POLICY IF EXISTS "Admins can view level history" ON consciousness_level_history;

CREATE POLICY "Principals and teachers can view level history" ON consciousness_level_history
  FOR SELECT
  USING (
    -- 校长可以查看所有
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'principal'
    )
    OR
    -- 老师可以查看自己管理的学员
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      JOIN profiles p ON p.id = ta.teacher_id
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND user_id = ANY(ta.managed_student_ids)
    )
  );

DROP POLICY IF EXISTS "Admins can view behavior stats" ON user_behavior_stats;

CREATE POLICY "Principals and teachers can view behavior stats" ON user_behavior_stats
  FOR SELECT
  USING (
    -- 校长可以查看所有
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'principal'
    )
    OR
    -- 老师可以查看自己管理的学员
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      JOIN profiles p ON p.id = ta.teacher_id
      WHERE p.id = auth.uid()
      AND p.role = 'teacher'
      AND user_id = ANY(ta.managed_student_ids)
    )
  );

-- ============================================================
-- 第7步：创建辅助函数
-- ============================================================

-- 7.1 检查用户是否是校长或老师
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role IN ('principal', 'teacher')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 检查老师是否管理某个学员
CREATE OR REPLACE FUNCTION teacher_manages_student(teacher_id UUID, student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 校长管理所有学员
  IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_id AND role = 'principal') THEN
    RETURN TRUE;
  END IF;

  -- 检查老师的管理范围
  RETURN EXISTS (
    SELECT 1 FROM teacher_assignments
    WHERE teacher_assignments.teacher_id = teacher_manages_student.teacher_id
    AND student_id = ANY(managed_student_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 检查老师是否管理某个课程
CREATE OR REPLACE FUNCTION teacher_manages_course(teacher_id UUID, course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 校长管理所有课程
  IF EXISTS (SELECT 1 FROM profiles WHERE id = teacher_id AND role = 'principal') THEN
    RETURN TRUE;
  END IF;

  -- 检查老师的管理范围
  RETURN EXISTS (
    SELECT 1 FROM teacher_assignments
    WHERE teacher_assignments.teacher_id = teacher_manages_course.teacher_id
    AND course_id = ANY(managed_course_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 第8步：创建触发器，自动为新老师创建 teacher_assignments 记录
-- ============================================================

CREATE OR REPLACE FUNCTION create_teacher_assignment_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果角色变为 teacher，自动创建 teacher_assignments 记录
  IF NEW.role = 'teacher' AND (OLD.role IS NULL OR OLD.role != 'teacher') THEN
    INSERT INTO teacher_assignments (teacher_id, managed_student_ids, managed_course_ids)
    VALUES (NEW.id, '{}', '{}')
    ON CONFLICT (teacher_id) DO NOTHING;
  END IF;

  -- 如果角色从 teacher 变为其他，删除 teacher_assignments 记录
  IF OLD.role = 'teacher' AND NEW.role != 'teacher' THEN
    DELETE FROM teacher_assignments WHERE teacher_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_create_teacher_assignment ON profiles;
CREATE TRIGGER trigger_create_teacher_assignment
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_assignment_on_role_change();

-- ============================================================
-- 完成！
-- ============================================================

-- 输出迁移结果
DO $$
DECLARE
  principal_count INTEGER;
  teacher_count INTEGER;
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO principal_count FROM profiles WHERE role = 'principal';
  SELECT COUNT(*) INTO teacher_count FROM profiles WHERE role = 'teacher';
  SELECT COUNT(*) INTO student_count FROM profiles WHERE role = 'student';

  RAISE NOTICE '========================================';
  RAISE NOTICE '权限系统迁移完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '校长数量: %', principal_count;
  RAISE NOTICE '老师数量: %', teacher_count;
  RAISE NOTICE '学员数量: %', student_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '下一步：手动分配老师的管理范围';
  RAISE NOTICE 'UPDATE teacher_assignments SET managed_student_ids = ...';
  RAISE NOTICE '========================================';
END $$;
