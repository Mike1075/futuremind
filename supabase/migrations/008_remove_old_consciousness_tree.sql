-- 删除旧的意识树字段
-- 创建时间: 2024-12-27
-- 描述: 清理不再使用的consciousness_tree_old字段

-- 删除旧的consciousness_tree_old字段
ALTER TABLE public.profiles DROP COLUMN IF EXISTS consciousness_tree_old;

-- 验证删除结果
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'consciousness_tree_old'
    ) THEN
        RAISE NOTICE '✅ consciousness_tree_old 字段已成功删除';
    ELSE
        RAISE NOTICE '⚠️ consciousness_tree_old 字段仍然存在';
    END IF;

    -- 确认新字段存在
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'consciousness_tree_view'
    ) THEN
        RAISE NOTICE '✅ consciousness_tree_view 字段正常存在';
    ELSE
        RAISE NOTICE '❌ consciousness_tree_view 字段缺失';
    END IF;
END $$;