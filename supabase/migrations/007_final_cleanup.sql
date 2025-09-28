-- 最终清理：删除残留的旧配置函数
-- 创建时间: 2024-12-27
-- 描述: 删除最后的旧函数残留

-- 删除残留的旧配置函数
DROP FUNCTION IF EXISTS public.update_consciousness_trigger_config(TEXT, TEXT) CASCADE;

-- 验证清理完成
DO $$
DECLARE
    old_function_count INTEGER;
BEGIN
    -- 检查是否还有旧的意识相关函数（排除我们的新函数）
    SELECT COUNT(*) INTO old_function_count
    FROM pg_proc
    WHERE proname LIKE '%consciousness%'
    AND proname NOT IN (
        'trigger_consciousness_tree_evaluation',
        'update_exploration_and_tree_view',
        'handle_new_user_exploration_record'
    );

    RAISE NOTICE '🎉 最终清理完成！';
    RAISE NOTICE '- 剩余旧意识函数数量: %', old_function_count;

    IF old_function_count = 0 THEN
        RAISE NOTICE '✅ 所有旧函数已清理完成！';
    ELSE
        RAISE NOTICE '⚠️  仍有 % 个旧函数需要手动检查', old_function_count;
    END IF;
END $$;

-- 显示最终的意识树系统函数列表
SELECT
    proname as function_name,
    '✅ 意识树核心函数' as status
FROM pg_proc
WHERE proname IN (
    'trigger_consciousness_tree_evaluation',
    'update_exploration_and_tree_view',
    'handle_new_user_exploration_record'
)
ORDER BY proname;