-- 性能优化：添加关键索引
-- 执行时间：约30-60秒（取决于数据量）
-- 影响：显著提升查询性能

-- ==========================================
-- 1. gaia_conversations 表索引
-- ==========================================

-- 用户对话查询（按更新时间排序）
CREATE INDEX IF NOT EXISTS idx_gaia_conversations_user_updated
  ON gaia_conversations(user_id, updated_at DESC)
  WHERE is_active = true;

-- 会话ID查询
CREATE INDEX IF NOT EXISTS idx_gaia_conversations_session
  ON gaia_conversations(session_id)
  WHERE session_id IS NOT NULL;

-- ==========================================
-- 2. user_submissions 表索引
-- ==========================================

-- 用户提交记录查询（最常用）
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_content
  ON user_submissions(user_id, course_content_id);

-- 按状态筛选
CREATE INDEX IF NOT EXISTS idx_user_submissions_status
  ON user_submissions(user_id, status)
  WHERE status IN ('pending', 'evaluated');

-- 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_user_submissions_created
  ON user_submissions(user_id, created_at DESC);

-- ==========================================
-- 3. course_contents 表索引
-- ==========================================

-- 课程内容查询（按体系和序号）
CREATE INDEX IF NOT EXISTS idx_course_contents_system_published
  ON course_contents(system_id, is_published, sequence_number)
  WHERE is_published = true;

-- 阶段查询
CREATE INDEX IF NOT EXISTS idx_course_contents_stage
  ON course_contents(stage_id, sequence_number)
  WHERE stage_id IS NOT NULL;

-- ==========================================
-- 4. discussion_messages 表索引
-- ==========================================

-- 讨论消息查询
CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion_role
  ON discussion_messages(discussion_id, role, created_at DESC);

-- 用户消息查询
CREATE INDEX IF NOT EXISTS idx_discussion_messages_user
  ON discussion_messages(user_id, created_at DESC);

-- ==========================================
-- 5. user_progress 表索引
-- ==========================================

-- 用户进度查询
CREATE INDEX IF NOT EXISTS idx_user_progress_user_ref
  ON user_progress(user_id, ref_item_id);

-- 课程进度查询
CREATE INDEX IF NOT EXISTS idx_user_progress_course
  ON user_progress(user_id, ref_item_type, ref_item_id)
  WHERE ref_item_type IN ('course_content', 'pbl_project');

-- ==========================================
-- 6. user_selected_projects 表索引
-- ==========================================

-- 用户项目选择查询
CREATE INDEX IF NOT EXISTS idx_user_selected_projects_user_status
  ON user_selected_projects(user_id, status)
  WHERE status = 'active';

-- 项目参与者查询
CREATE INDEX IF NOT EXISTS idx_user_selected_projects_project
  ON user_selected_projects(project_id, status)
  WHERE status = 'active';

-- ==========================================
-- 7. profiles 表索引
-- ==========================================

-- 角色查询（用于权限验证）
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role)
  WHERE role IN ('teacher', 'principal');

-- 邮箱查询
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email)
  WHERE email IS NOT NULL;

-- ==========================================
-- 8. chat_history 表索引
-- ==========================================

-- 用户聊天历史
CREATE INDEX IF NOT EXISTS idx_chat_history_user_created
  ON chat_history(user_id, created_at DESC);

-- 项目相关聊天
CREATE INDEX IF NOT EXISTS idx_chat_history_project
  ON chat_history(project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

-- ==========================================
-- 9. organizations 表索引
-- ==========================================

-- 组织成员查询
CREATE INDEX IF NOT EXISTS idx_organizations_created
  ON organizations(created_at DESC);

-- ==========================================
-- 10. projects 表索引
-- ==========================================

-- 组织项目查询
CREATE INDEX IF NOT EXISTS idx_projects_organization
  ON projects(organization_id, created_at DESC);

-- 可见性查询
CREATE INDEX IF NOT EXISTS idx_projects_visibility
  ON projects(is_public, created_at DESC);

-- ==========================================
-- 验证索引创建
-- ==========================================

-- 查看所有新创建的索引
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 查看表大小和索引大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                 pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
