-- 意识树触发器迁移
-- 创建时间: 2024-12-27
-- 描述: 创建自动调用evaluate-and-grow-tree边缘函数的触发器

-- 1. 创建新的触发器函数，调用我们的新边缘函数
CREATE OR REPLACE FUNCTION public.trigger_consciousness_tree_evaluation()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    user_messages INTEGER;
    should_evaluate BOOLEAN := FALSE;
BEGIN
    -- 计算总消息数
    message_count := jsonb_array_length(NEW.messages);

    -- 计算用户消息数（排除Gaia的回复）
    SELECT COUNT(*)::INTEGER INTO user_messages
    FROM jsonb_array_elements(NEW.messages) AS msg
    WHERE (msg->>'isGaia')::boolean = false;

    -- 记录触发器调用
    INSERT INTO trigger_log (message, conversation_id)
    VALUES (
        FORMAT('Consciousness Tree Trigger - Total: %s, User: %s', message_count, user_messages),
        NEW.id
    );

    -- 检查触发条件：用户消息达到10的倍数，且至少有10条
    IF user_messages >= 10 AND user_messages % 10 = 0 THEN
        should_evaluate := TRUE;
    END IF;

    -- 如果需要评估，异步调用边缘函数
    IF should_evaluate THEN
        -- 使用net.http_post调用我们的新边缘函数
        PERFORM net.http_post(
            'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/evaluate-and-grow-tree',
            json_build_object('user_id', NEW.user_id)::text,
            'application/json',
            json_build_object(
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc'
            )::jsonb,
            5000
        );

        INSERT INTO trigger_log (message, conversation_id)
        VALUES (
            FORMAT('Consciousness tree evaluation triggered for user: %s (message count: %s)', NEW.user_id, user_messages),
            NEW.id
        );
    ELSE
        INSERT INTO trigger_log (message, conversation_id)
        VALUES (
            FORMAT('Evaluation conditions not met - User messages: %s (need multiple of 10, >=10)', user_messages),
            NEW.id
        );
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- 静默处理错误，不影响主流程
    INSERT INTO trigger_log (message, conversation_id)
    VALUES (
        FORMAT('Consciousness tree trigger error: %s', SQLERRM),
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 删除旧的意识分析触发器（如果存在）
DROP TRIGGER IF EXISTS consciousness_analysis_trigger_n8n ON public.gaia_conversations;

-- 3. 创建新的意识树评估触发器
CREATE TRIGGER consciousness_tree_evaluation_trigger
    AFTER UPDATE ON public.gaia_conversations
    FOR EACH ROW
    WHEN (OLD.messages IS DISTINCT FROM NEW.messages)
    EXECUTE FUNCTION public.trigger_consciousness_tree_evaluation();

-- 4. 授予执行权限
GRANT EXECUTE ON FUNCTION public.trigger_consciousness_tree_evaluation() TO authenticated;

-- 5. 创建评论
COMMENT ON FUNCTION public.trigger_consciousness_tree_evaluation() IS '当用户对话达到评估条件时，自动触发意识树评估的触发器函数';

-- 迁移完成通知
DO $$
BEGIN
    RAISE NOTICE '意识树触发器迁移完成！';
    RAISE NOTICE '- 创建了新的触发器函数 trigger_consciousness_tree_evaluation()';
    RAISE NOTICE '- 删除了旧的意识分析触发器';
    RAISE NOTICE '- 创建了新的意识树评估触发器';
    RAISE NOTICE '- 触发条件：用户消息数达到10的倍数（≥10条）';
END $$;