-- 检查数据库状态
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 检查 insights 表是否存在
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insights') 
        THEN '✅ insights 表存在' 
        ELSE '❌ insights 表不存在' 
    END as table_status;

-- 2. 如果表存在，检查表结构
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insights') THEN
        RAISE NOTICE 'insights 表结构:';
        RAISE NOTICE '列名: %', (
            SELECT string_agg(column_name || ' (' || data_type || ')', ', ')
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'insights'
        );
    END IF;
END $$;

-- 3. 检查 RLS 是否启用
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'insights';

-- 4. 检查 RLS 策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'insights';

-- 5. 检查当前用户权限
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

