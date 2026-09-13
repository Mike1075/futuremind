-- 内容访问记录表
-- 轻量级设计：只记录访问时间，配合discussion_messages计算进度

CREATE TABLE IF NOT EXISTS content_visit_records (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES course_contents(id) ON DELETE CASCADE NOT NULL,
  last_visited_at timestamptz DEFAULT now() NOT NULL,

  PRIMARY KEY (user_id, content_id)
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_content_visit_records_user
  ON content_visit_records(user_id);

CREATE INDEX IF NOT EXISTS idx_content_visit_records_content
  ON content_visit_records(content_id);

-- 启用RLS
ALTER TABLE content_visit_records ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能访问自己的访问记录
CREATE POLICY "Users can view their own visit records"
  ON content_visit_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visit records"
  ON content_visit_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visit records"
  ON content_visit_records FOR UPDATE
  USING (auth.uid() = user_id);

-- 注释说明进度计算逻辑
COMMENT ON TABLE content_visit_records IS '内容访问记录。进度=浏览40%+讨论(>=2条消息)60%。讨论数据从discussion_messages计算';
