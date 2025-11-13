-- ============================================
-- 为所有历史项目补充默认智慧库文档
-- 修复 N8N workflow "No item to return was found" 错误
-- ============================================

-- 1. 检查当前缺失文档的项目数量
SELECT
    COUNT(DISTINCT p.id) as missing_docs_count,
    '以上项目缺少默认文档' as note
FROM projects p
LEFT JOIN documents d
    ON p.id = d.project_id
    AND d.title = '项目智慧库'
WHERE d.id IS NULL;

-- 2. 查看具体哪些项目缺少文档（前10个）
SELECT
    p.id as project_id,
    p.name as project_name,
    p.organization_id,
    p.creator_id,
    p.created_at
FROM projects p
LEFT JOIN documents d
    ON p.id = d.project_id
    AND d.title = '项目智慧库'
WHERE d.id IS NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. 为所有缺少默认文档的项目补充文档
-- 注意：这将为每个项目创建一个空的"项目智慧库"文档
INSERT INTO documents (
    project_id,
    user_id,
    organization_id,
    title,
    content,
    metadata,
    embedding,
    created_at,
    updated_at
)
SELECT
    p.id as project_id,
    p.creator_id as user_id,
    p.organization_id,
    '项目智慧库' as title,
    '' as content,  -- 空字符串，与新建项目逻辑一致
    jsonb_build_object('type', 'project_knowledge_base', 'auto_created', true) as metadata,
    NULL as embedding,
    NOW() as created_at,
    NOW() as updated_at
FROM projects p
LEFT JOIN documents d
    ON p.id = d.project_id
    AND d.title = '项目智慧库'
WHERE d.id IS NULL;

-- 4. 验证修复结果 - 应该显示 0
SELECT
    COUNT(DISTINCT p.id) as still_missing_count,
    '如果为0则修复成功' as note
FROM projects p
LEFT JOIN documents d
    ON p.id = d.project_id
    AND d.title = '项目智慧库'
WHERE d.id IS NULL;

-- 5. 统计修复情况
SELECT
    '修复完成' as status,
    COUNT(*) as total_projects,
    COUNT(DISTINCT d.project_id) as projects_with_docs,
    COUNT(*) - COUNT(DISTINCT d.project_id) as still_missing
FROM projects p
LEFT JOIN documents d ON p.id = d.project_id AND d.title = '项目智慧库';

-- 6. 查看新创建的文档（最近10条）
SELECT
    d.id,
    d.project_id,
    p.name as project_name,
    d.title,
    d.metadata,
    d.created_at
FROM documents d
JOIN projects p ON d.project_id = p.id
WHERE d.title = '项目智慧库'
AND d.metadata->>'auto_created' = 'true'
ORDER BY d.created_at DESC
LIMIT 10;
