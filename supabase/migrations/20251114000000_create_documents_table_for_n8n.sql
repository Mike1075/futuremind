-- ============================================
-- AIP文档向量存储初始化SQL脚本
-- 用于N8N + Supabase集成
-- 创建时间：2025-11-14
-- ============================================

-- 1. 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建documents表（如果不存在）
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    content text,
    user_id uuid REFERENCES auth.users(id),
    project_id text,
    organization_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(1536),  -- OpenAI ada-002的embedding维度
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- 4. 为向量字段创建HNSW索引（加速相似度搜索）
-- HNSW (Hierarchical Navigable Small World) 是最适合高维向量搜索的索引类型
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents
USING hnsw (embedding vector_cosine_ops);

-- 5. 为metadata的特定字段创建GIN索引（加速JSON查询）
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin(metadata);

-- 6. 创建match_documents函数（向量相似度搜索）
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    AND (filter = '{}'::jsonb OR documents.metadata @> filter)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. 为match_documents函数添加注释
COMMENT ON FUNCTION match_documents IS '
向量相似度搜索函数
参数：
  - query_embedding: 查询向量（1536维）
  - match_threshold: 相似度阈值（0-1，默认0.78）
  - match_count: 返回结果数量（默认10）
  - filter: JSON过滤条件（可选，如 {"project_id": "p001"}）
返回：
  - id: 文档ID
  - content: 文档内容
  - metadata: 文档元数据
  - similarity: 相似度分数（0-1）
';

-- 8. 设置RLS策略（行级安全）

-- 启用RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 策略1：用户可以查看自己上传的文档
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (auth.uid() = user_id);

-- 策略2：用户可以插入自己的文档
CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 策略3：用户可以更新自己的文档
CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
USING (auth.uid() = user_id);

-- 策略4：用户可以删除自己的文档
CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (auth.uid() = user_id);

-- 策略5：同一项目的成员可以查看项目文档
CREATE POLICY "Project members can view project documents"
ON documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = documents.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- 策略6：Service Role可以绕过RLS（用于N8N等后台服务）
-- 注意：这是通过Service Role Key自动实现的，无需额外策略
