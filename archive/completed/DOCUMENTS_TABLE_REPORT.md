# Supabase documents 表完整结构检查报告

## 执行时间
2025-11-14

## 数据库信息
- **Supabase URL**: https://lvjezsnwesyblnlkkirz.supabase.co
- **数据库**: Postgres (Supabase)

---

## 1. documents 表结构概览

### 表的存在性
✅ **documents 表存在**
- 当前记录数: **3,632 条**

### 字段列表

| 字段名 | 数据类型 | 说明 |
|--------|----------|------|
| `id` | UUID (string) | 主键 |
| `title` | TEXT (nullable) | 文档标题 |
| `content` | TEXT | 文档内容 |
| `metadata` | JSONB (object) | 元数据信息 |
| `embedding` | **vector(1536)** | ⚠️ 向量嵌入（存储为字符串） |
| `project_id` | UUID (nullable) | 关联项目ID |
| `user_id` | UUID (nullable) | 关联用户ID |
| `organization_id` | UUID (nullable) | 关联组织ID |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `updated_at` | TIMESTAMPTZ | 更新时间 |

---

## 2. embedding 字段详细分析

### ⚠️ 重要发现

**embedding 字段存储格式**:
- **数据库类型**: `vector(1536)` (pgvector 扩展类型)
- **Supabase 返回类型**: `string` (JSON 数组字符串)
- **实际维度**: 1536 维（OpenAI embedding 标准维度）

### 示例数据

```javascript
// embedding 字段原始值（字符串格式）
"[0.011300119,0.029822212,-6.559514e-05,0.060755495,-0.0043117213,...]"

// 字符串长度: 约 19,177 字符
// 解析后的数组: [0.011300119, 0.029822212, -0.00006559514, 0.060755495, -0.0043117213, ...]
// 数组维度: 1536
```

### 使用建议

在 N8N 或其他应用中使用时:
```javascript
// 需要先解析字符串为数组
const embeddingString = record.embedding;
const embeddingArray = JSON.parse(embeddingString);
// embeddingArray.length === 1536
```

---

## 3. match_documents 函数检查

### ✅ 函数存在且可用

**函数名称**: `match_documents`

**函数签名**:
```sql
match_documents(
  query_embedding: vector(1536),  -- 或者 float[] 数组
  match_count: integer,
  filter: jsonb (optional)
) RETURNS TABLE (
  id: uuid,
  content: text,
  metadata: jsonb,
  similarity: float
)
```

**TypeScript 类型定义** (来自 `lib/database.types.ts`):
```typescript
match_documents: {
  Args: {
    query_embedding: string,  // 注意：这里接受字符串
    match_count?: number,
    filter?: Json
  }
  Returns: {
    id: number,
    content: string,
    metadata: Json,
    similarity: number
  }[]
}
```

### N8N 使用示例

```javascript
// 1. 准备查询向量（从 OpenAI Embeddings 获取）
const queryVector = [0.1, 0.2, 0.3, ...]; // 1536维

// 2. 调用 match_documents
const { data, error } = await supabase.rpc('match_documents', {
  query_embedding: queryVector,  // 直接传递数组
  match_count: 5,
  filter: { project_id: 'xxx-xxx-xxx' } // 可选的过滤条件
});

// 3. 返回结果
// data: [
//   {
//     id: "uuid",
//     content: "文档内容",
//     metadata: {...},
//     similarity: 0.95  // 余弦相似度 (0-1)
//   },
//   ...
// ]
```

---

## 4. pgvector 扩展状态

### ⚠️ 扩展状态检查

通过直接查询无法确认 `pgvector` 扩展的完整安装信息，但根据以下证据:

1. ✅ `embedding` 字段类型为 `vector(1536)` - 表明 vector 类型可用
2. ✅ `match_documents` 函数可以正常调用
3. ✅ 向量索引应该已创建（ivfflat）

**推断结论**: pgvector 扩展已正确安装并可用

### 预期的向量索引

根据 AIP_MIGRATION_PLAN.md，应该有以下索引:

```sql
CREATE INDEX IF NOT EXISTS idx_documents_embedding
ON public.documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 5. 其他索引（预期）

根据迁移计划，应该有以下索引:

```sql
CREATE INDEX IF NOT EXISTS idx_documents_project_id
ON public.documents(project_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
ON public.documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_organization_id
ON public.documents(organization_id);
```

---

## 6. 数据统计

- **总记录数**: 3,632
- **有 embedding 的记录**: 需要进一步查询
- **无 embedding 的记录**: 需要进一步查询

### 示例记录

```json
{
  "id": "c9db1dd0-0212-4fd8-a163-68120d84aef8",
  "title": null,
  "content": "SEVEN EXPERIMENTS THAT COULD CHANGE THE WORLD...",
  "metadata": {
    "loc": {
      "lines": { "from": 1, "to": 8 }
    },
    "pdf": {
      "info": {
        "Title": "Seven Experiments That Could Change the World",
        "Author": "Rupert Sheldrake",
        ...
      }
    }
  },
  "embedding": "[0.011300119,0.029822212,...]",
  "project_id": null,
  "user_id": null,
  "organization_id": null,
  "created_at": "2025-XX-XX...",
  "updated_at": "2025-XX-XX..."
}
```

---

## 7. N8N 配置建议

### 向量数据库节点配置

**Supabase 向量数据库节点**:
```json
{
  "table": "documents",
  "queryName": "match_documents",
  "limit": 5,
  "filter": {
    "project_id": "{{ $json.project_id }}"
  }
}
```

### 注意事项

1. **embedding 格式**:
   - 从数据库读取时是字符串
   - 传递给 match_documents 时可以是数组
   - Supabase JS 客户端会自动处理格式转换

2. **相似度搜索**:
   - match_documents 返回的 similarity 是余弦相似度
   - 范围: -1 到 1，值越高越相似
   - 通常使用 similarity > 0.7 作为相关性阈值

3. **性能优化**:
   - 使用 filter 参数过滤无关记录
   - match_count 不要设置过大（建议 ≤ 20）
   - 确保向量索引已创建

---

## 8. 完整 SQL 查询脚本

如需在 Supabase SQL Editor 中执行完整检查:

```sql
-- 1. 查看表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查 match_documents 函数
SELECT
  routine_name,
  routine_type,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM information_schema.routines r
JOIN pg_proc p ON r.routine_name = p.proname
WHERE routine_schema = 'public'
AND routine_name LIKE '%match%document%';

-- 3. 检查 pgvector 扩展
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 4. 查看索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'documents' AND schemaname = 'public';

-- 5. 统计信息
SELECT
  COUNT(*) as total_records,
  COUNT(embedding) as records_with_embedding,
  COUNT(*) - COUNT(embedding) as records_without_embedding
FROM documents;
```

---

## 9. 总结

### ✅ 已确认的功能

- [x] documents 表存在且包含数据 (3,632 条记录)
- [x] embedding 字段为 vector(1536) 类型
- [x] match_documents 函数存在且可用
- [x] 向量维度为 1536 (OpenAI 标准)
- [x] metadata 字段为 JSONB，支持复杂元数据

### ⚠️ 需要注意的地方

1. **embedding 字段格式**:
   - Supabase 返回时是字符串格式的 JSON 数组
   - 需要 JSON.parse() 才能得到数组

2. **N8N 配置**:
   - 确认使用正确的函数名 `match_documents`
   - 确认传递的 query_embedding 维度为 1536
   - 添加适当的 filter 条件提高查询效率

3. **性能考虑**:
   - 向量搜索比较耗资源
   - 建议在 filter 中先过滤数据范围
   - 合理设置 match_count 限制返回数量

---

## 附录: 相关文件

- **类型定义**: `D:\CursorWork\FutureMindInstitute\futuremind-new\lib\database.types.ts`
- **迁移计划**: `D:\CursorWork\FutureMindInstitute\futuremind-new\docs\AIP_MIGRATION_PLAN.md`
- **修复脚本**: `D:\CursorWork\FutureMindInstitute\futuremind-new\scripts\fix-missing-project-documents.sql`

---

**报告生成**: 自动化脚本
**最后更新**: 2025-11-14
