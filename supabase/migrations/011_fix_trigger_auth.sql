-- 修复意识树触发器的认证问题
-- 创建时间: 2024-12-27
-- 描述: 更新触发器中的Service Role Key以解决401错误

-- 注意：需要将YOUR_SERVICE_ROLE_KEY替换为实际的Service Role Key
-- 可以在Supabase Dashboard > Settings > API 中找到

CREATE OR REPLACE FUNCTION public.trigger_consciousness_tree_evaluation()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    user_messages INTEGER;
    should_evaluate BOOLEAN := FALSE;
    http_result extensions.http_response;
    service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY'; -- 需要替换为实际的Service Role Key
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
        BEGIN
            -- 使用正确的extensions.http_post调用边缘函数
            SELECT * INTO http_result FROM extensions.http_post(
                'https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/evaluate-and-grow-tree',
                json_build_object('user_id', NEW.user_id)::text,
                'application/json',
                json_build_object(
                    'Authorization', 'Bearer ' || service_role_key,
                    'Content-Type', 'application/json'
                )::jsonb
            );

            INSERT INTO trigger_log (message, conversation_id)
            VALUES (
                FORMAT('Consciousness tree evaluation triggered for user: %s (message count: %s) - HTTP Status: %s, Response: %s',
                       NEW.user_id, user_messages, http_result.status, http_result.content),
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
    RAISE NOTICE '意识树触发器认证修复完成！';
    RAISE NOTICE '注意：需要在Supabase Dashboard中手动替换Service Role Key';
    RAISE NOTICE '位置：Settings > API > Service Role Key (secret)';
    RAISE NOTICE '然后在此SQL中将YOUR_SERVICE_ROLE_KEY替换为实际值';
END $$;