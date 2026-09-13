-- 知识点讨论系统
-- 用于记录学生与盖亚的深度探讨

-- 创建知识讨论主题表
CREATE TABLE IF NOT EXISTS knowledge_discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES course_contents(id) ON DELETE CASCADE NOT NULL,
  knowledge_point_text text NOT NULL, -- 讨论的知识点或问题文本
  discussion_type text NOT NULL CHECK (discussion_type IN ('knowledge_point', 'question', 'reflection')), -- 讨论类型
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- 确保每个用户对同一个知识点只有一个讨论主题
  CONSTRAINT unique_user_knowledge_point UNIQUE (user_id, content_id, knowledge_point_text, discussion_type)
);

-- 创建讨论消息表
CREATE TABLE IF NOT EXISTS discussion_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id uuid REFERENCES knowledge_discussions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引加快查询
CREATE INDEX IF NOT EXISTS idx_knowledge_discussions_user_id ON knowledge_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_discussions_content_id ON knowledge_discussions(content_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion_id ON discussion_messages(discussion_id);

-- 启用RLS
ALTER TABLE knowledge_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能访问自己的讨论
CREATE POLICY "Users can view their own discussions"
  ON knowledge_discussions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own discussions"
  ON knowledge_discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions"
  ON knowledge_discussions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS策略：用户只能访问自己讨论的消息
CREATE POLICY "Users can view messages in their discussions"
  ON discussion_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_discussions
      WHERE id = discussion_messages.discussion_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their discussions"
  ON discussion_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_discussions
      WHERE id = discussion_messages.discussion_id
      AND user_id = auth.uid()
    )
  );

-- 添加触发器更新updated_at
CREATE OR REPLACE FUNCTION update_knowledge_discussions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_discussions_timestamp
  BEFORE UPDATE ON knowledge_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_discussions_timestamp();
