-- 清理旧的意识分析触发器和函数
-- 创建时间: 2024-12-27
-- 描述: 删除不再需要的旧触发器函数

-- 1. 删除旧的触发器函数（如果存在）
DROP FUNCTION IF EXISTS public.trigger_consciousness_analysis_n8n() CASCADE;

-- 2. 删除其他可能的旧函数
DROP FUNCTION IF EXISTS public.call_consciousness_assessment(UUID, UUID, TEXT) CASCADE;

-- 3. 检查并删除相关的配置表（如果存在且不再需要）
DROP TABLE IF EXISTS public.consciousness_trigger_config CASCADE;

-- 4. 验证当前的触发器状态
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
BEGIN
    -- 检查意识树相关的触发器数量
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%consciousness%';

    -- 检查意识树相关的函数数量
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname LIKE '%consciousness%'
    AND proname NOT LIKE '%tree%';

    RAISE NOTICE '清理完成！';
    RAISE NOTICE '- 当前意识相关触发器数量: %', trigger_count;
    RAISE NOTICE '- 当前意识相关函数数量（非tree）: %', function_count;

    IF function_count > 0 THEN
        RAISE NOTICE '注意：仍有 % 个意识相关函数存在，请手动检查', function_count;
    END IF;
END $$;

-- 5. 显示当前的意识树相关函数
SELECT
    proname as function_name,
    CASE
        WHEN proname LIKE '%tree%' THEN '✅ 意识树相关'
        WHEN proname LIKE '%consciousness%' THEN '⚠️ 可能需要清理'
        ELSE '其他'
    END as status
FROM pg_proc
WHERE proname LIKE '%consciousness%' OR proname LIKE '%tree%' OR proname LIKE '%exploration%'
ORDER BY proname;