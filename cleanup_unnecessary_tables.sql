-- 清理不必要的数据库表
-- 注意：执行前请确认这些表确实不需要

-- 1. 删除用户进度相关表（检测系统不需要）
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;

-- 2. 删除PBL项目相关表（检测系统不需要）
DROP TABLE IF EXISTS pbl_projects CASCADE;
DROP TABLE IF EXISTS project_participants CASCADE;

-- 3. 删除Gaia对话表（检测系统不需要存储对话）
DROP TABLE IF EXISTS gaia_conversations CASCADE;

-- 4. 删除用户档案表（检测系统不需要用户管理）
DROP TABLE IF EXISTS profiles CASCADE;

-- 5. 保留以下表（检测系统需要）：
-- - project_modules (模块配置)
-- - inspection_criteria (检测标准，如果存在)
-- - inspection_records (检测记录，如果存在)

-- 验证剩余表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;