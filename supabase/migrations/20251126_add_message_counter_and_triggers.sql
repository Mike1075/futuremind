-- Migration: add_message_counter_and_triggers
-- Description: 添加消息计数器字段和触发器，用于事件驱动的摘要更新
-- Date: 2025-11-26

-- 1. 添加消息计数器字段
ALTER TABLE student_summaries
ADD COLUMN IF NOT EXISTS messages_since_last_summary INTEGER DEFAULT 0;

-- 2. 添加最后检查时间字段
ALTER TABLE student_summaries
ADD COLUMN IF NOT EXISTS last_summary_check_at TIMESTAMPTZ DEFAULT NOW();

-- 3. 创建触发器函数：递增消息计数器
CREATE OR REPLACE FUNCTION increment_message_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE student_summaries
    SET messages_since_last_summary = COALESCE(messages_since_last_summary, 0) + 1
    WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
      INSERT INTO student_summaries (user_id, messages_since_last_summary, last_summary_check_at)
      VALUES (NEW.user_id, 1, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET messages_since_last_summary = COALESCE(student_summaries.messages_since_last_summary, 0) + 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 在gaia_conversations表的messages更新时触发
DROP TRIGGER IF EXISTS on_gaia_conversation_updated ON gaia_conversations;
CREATE TRIGGER on_gaia_conversation_updated
AFTER UPDATE OF messages ON gaia_conversations
FOR EACH ROW
EXECUTE FUNCTION increment_message_counter();

-- 5. 在gaia_conversations新对话创建时触发
DROP TRIGGER IF EXISTS on_gaia_conversation_inserted ON gaia_conversations;
CREATE TRIGGER on_gaia_conversation_inserted
AFTER INSERT ON gaia_conversations
FOR EACH ROW
EXECUTE FUNCTION increment_message_counter();

-- 6. 标记废弃表
COMMENT ON TABLE gaia_context_variables IS '【已废弃 2025-01-26】此表不再使用，由 student_summaries 替代。保留用于历史数据参考。';
