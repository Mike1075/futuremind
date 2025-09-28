-- 2025年现代化意识树触发器（无需JWT认证）
-- 创建时间: 2024-12-27
-- 描述: 使用2025年最新方法，通过config.toml禁用JWT验证

-- 现代化触发器函数，无需手动处理认证
CREATE OR REPLACE FUNCTION public.trigger_consciousness_tree_evaluation()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    user_messages INTEGER;
    should_evaluate BOOLEAN := FALSE;
    http_result extensions.http_response;
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

    -- 如果需要评估，异步调用边缘函数（无需认证）
    IF should_evaluate THEN
        BEGIN
            -- 使用2025年推荐方式：通过config.toml禁用JWT验证
            -- 这样就不需要传递任何认证header
            SELECT * INTO http_result FROM extensions.http_post(
                'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/evaluate-and-grow-tree',
                json_build_object('user_id', NEW.user_id)::text,
                'application/json'
            );

            INSERT INTO trigger_log (message, conversation_id)
            VALUES (
                FORMAT('Consciousness tree evaluation triggered for user: %s (message count: %s) - HTTP Status: %s, Response: %s',
                       NEW.user_id, user_messages, http_result.status,
                       COALESCE(LEFT(http_result.content, 200), 'No response content')),
                NEW.id
            );
        EXCEPTION WHEN OTHERS THEN
            -- 记录HTTP调用错误但不影响主流程
            INSERT INTO trigger_log (message, conversation_id)
            VALUES (
                FORMAT('HTTP call failed for user: %s - Error: %s', NEW.user_id, SQLERRM),
                NEW.id
            );
        END;
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

-- 迁移完成通知
DO $$
BEGIN
    RAISE NOTICE '✅ 2025年现代化意识树触发器已更新！';
    RAISE NOTICE '✅ 已在config.toml中配置 verify_jwt = false';
    RAISE NOTICE '✅ 不再需要手动管理JWT认证';
    RAISE NOTICE '✅ 符合Supabase 2025年最佳实践';
    RAISE NOTICE '💡 推荐：关闭Dashboard中的"Verify JWT with legacy secret"';
END $$;