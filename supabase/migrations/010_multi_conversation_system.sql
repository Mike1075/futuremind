-- 多对话管理系统迁移
-- 创建时间: 2024-12-27
-- 描述: 为gaia_conversations表添加多对话支持

-- 1. 为gaia_conversations表添加新字段
ALTER TABLE public.gaia_conversations
ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '新对话',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- 2. 移除user_id的唯一约束（如果存在）
-- 这样每个用户可以有多个对话
DROP INDEX IF EXISTS gaia_conversations_user_id_unique;

-- 3. 创建复合索引以优化查询
CREATE INDEX IF NOT EXISTS idx_gaia_conversations_user_active
ON public.gaia_conversations(user_id, is_active, updated_at DESC);

-- 4. 创建函数：自动生成对话标题
CREATE OR REPLACE FUNCTION generate_conversation_title(messages_param jsonb)
RETURNS varchar(255) AS $$
DECLARE
    first_user_message text;
    title varchar(255);
BEGIN
    -- 获取第一条用户消息
    SELECT (msg->>'content') INTO first_user_message
    FROM jsonb_array_elements(messages_param) AS msg
    WHERE (msg->>'isGaia')::boolean = false
    LIMIT 1;

    -- 如果有用户消息，从中提取标题
    IF first_user_message IS NOT NULL THEN
        -- 取前30个字符作为标题
        title := LEFT(first_user_message, 30);
        -- 如果超过30字符，添加省略号
        IF LENGTH(first_user_message) > 30 THEN
            title := title || '...';
        END IF;
    ELSE
        title := '新对话';
    END IF;

    RETURN title;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器：自动更新message_count和title
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新消息数量
    NEW.message_count := jsonb_array_length(NEW.messages);

    -- 如果是新对话或标题为默认值，自动生成标题
    IF OLD.title IS NULL OR OLD.title = '新对话' OR NEW.message_count = 1 THEN
        NEW.title := generate_conversation_title(NEW.messages);
    END IF;

    -- 更新时间戳
    NEW.updated_at := now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建触发器
DROP TRIGGER IF EXISTS update_conversation_metadata_trigger ON public.gaia_conversations;
CREATE TRIGGER update_conversation_metadata_trigger
    BEFORE INSERT OR UPDATE ON public.gaia_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_metadata();

-- 7. 更新现有记录（为旧对话添加标题）
UPDATE public.gaia_conversations
SET title = generate_conversation_title(messages)
WHERE title IS NULL OR title = '新对话';

-- 8. 创建视图：对话摘要
CREATE OR REPLACE VIEW conversation_summary AS
SELECT
    id,
    user_id,
    title,
    message_count,
    is_active,
    created_at,
    updated_at,
    -- 最后一条消息预览
    COALESCE(
        (
            SELECT msg->>'content'
            FROM jsonb_array_elements(messages) AS msg
            ORDER BY (msg->>'timestamp')::timestamp DESC
            LIMIT 1
        ),
        '暂无消息'
    ) AS last_message
FROM public.gaia_conversations;

-- 9. 授予权限
GRANT SELECT ON conversation_summary TO authenticated;
GRANT EXECUTE ON FUNCTION generate_conversation_title(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_metadata() TO authenticated;

-- 10. 添加注释
COMMENT ON COLUMN public.gaia_conversations.title IS '对话标题，自动从第一条用户消息生成';
COMMENT ON COLUMN public.gaia_conversations.is_active IS '对话是否活跃，用于软删除';
COMMENT ON COLUMN public.gaia_conversations.message_count IS '消息数量，自动更新';
COMMENT ON FUNCTION generate_conversation_title(jsonb) IS '从消息中自动生成对话标题';
COMMENT ON VIEW conversation_summary IS '对话摘要视图，包含最后一条消息预览';

-- 迁移完成通知
DO $$
BEGIN
    RAISE NOTICE '多对话管理系统迁移完成！';
    RAISE NOTICE '- 添加了title, is_active, message_count字段';
    RAISE NOTICE '- 创建了自动标题生成功能';
    RAISE NOTICE '- 创建了对话摘要视图';
    RAISE NOTICE '- 现在支持每个用户多个对话';
END $$;