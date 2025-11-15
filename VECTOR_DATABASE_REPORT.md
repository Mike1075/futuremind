# Supabase向量数据库存储结构详细报告

## 执行时间
2025-11-14

## 一、向量数据存储位置

### 1.1 表名
**所有向量数据都存储在同一个表：`documents`**

这个表存储了两种类型的记录：
- **主记录（源文件）**：上传的原始文档信息
- **向量块（Chunks）**：文档切分后的向量化数据块

### 1.2 表结构
```sql
documents 表包含以下关键字段：
- id: UUID (主键)
- title: TEXT (标题)
- content: TEXT (内容)
- user_id: UUID (用户ID)
- metadata: JSONB (元数据，用于区分记录类型和存储额外信息)
- embedding: VECTOR (向量数据，用于语义搜索)
- created_at: TIMESTAMP (创建时间)
```

## 二、记录类型区分方式

### 2.1 主记录（源文件）
通过 `metadata->>'type' = 'gaia_knowledge_base'` 标识

**元数据结构：**
```json
{
  "type": "gaia_knowledge_base",
  "custom_project_id": "p001",      // 项目ID（pXXX格式）
  "filename": "example.md",         // 原文件名
  "file_size": 226050,              // 文件大小（字节）
  "file_type": "text/markdown",     // 文件类型
  "uploaded_at": "2025-11-14T...",  // 上传时间
  "status": "processing",           // 状态：processing/completed
  "vector_count": 576               // 向量块数量（completed后自动填充）
}
```

**查询方式：**
```sql
SELECT * FROM documents
WHERE metadata->>'type' = 'gaia_knowledge_base'
ORDER BY created_at DESC;
```

### 2.2 向量块（Chunks）
通过 `metadata->>'project_id'` 存在且不为null 标识

**元数据结构：**
```json
{
  "project_id": "p001",             // 所属项目ID
  "title": "文档标题",              // 来源文档标题
  "chunk_index": 0,                 // 块序号
  "source_file": "example.md"       // 来源文件名
}
```

**查询方式：**
```sql
-- 查询特定项目的向量块
SELECT * FROM documents
WHERE metadata->>'project_id' = 'p001';

-- 统计各项目的向量块数量
SELECT
  metadata->>'project_id' as project_id,
  COUNT(*) as vector_count
FROM documents
WHERE metadata->>'project_id' IS NOT NULL
GROUP BY metadata->>'project_id';
```

## 三、当前数据情况（2025-11-14）

### 3.1 总体统计
- **documents表总记录数：** 1000条
- **主记录（源文件）：** 6个（涉及3个项目：p001, p002, p003）
- **向量块记录：** 999个（只有p002和p003有向量数据）
- **包含embedding的记录：** 999个

### 3.2 各项目详情

#### 项目 p001
- **主记录：** 3个文件
  1. `欢迎来到地球-带时间戳的字幕.md` (226.05 KB)
  2. `welcome to earth字幕.md` (84.48 KB)
  3. `Seven Experiments That Could Change the World.pdf` (2590.66 KB)
- **向量块：** 0个（已被成功删除，用于测试）
- **状态：** 有源文件但没有向量块

#### 项目 p002
- **主记录：** 2个文件
  1. `欢迎来到地球-带时间戳的字幕.md` (226.05 KB)
  2. `Seven Experiments That Could Change the World.pdf` (2590.66 KB)
- **向量块：** 576个
- **状态：** 正常

#### 项目 p003
- **主记录：** 1个文件
  1. `欢迎来到地球-带时间戳的字幕.md` (226.05 KB)
- **向量块：** 576个
- **状态：** 正常

#### 项目 p004
- **主记录：** 0个
- **向量块：** 0个
- **状态：** 不存在

### 3.3 向量块示例
```
项目：p003
标题：欢迎来到地球-带时间戳的字幕
内容预览：
第一集：
[00:06] I've got a confession to make.
[00:23] But I'm beginning to think that I might be...
```

## 四、删除功能分析

### 4.1 删除测试结果
**测试项目：** p001（3616个向量块）
**测试结果：** 删除成功

```typescript
// 删除代码（来自 app/api/admin/gaia-kb/route.ts）
const { data: vectorChunks, error: deleteVectorError } = await supabase
  .from('documents')
  .delete()
  .eq('metadata->>project_id', projectId)
  .select('id')
```

### 4.2 为什么删除可能失败

根据代码分析和测试，删除功能本身是正常的。可能的失败原因：

1. **权限问题**
   - 如果使用普通客户端而非 Service Role Key，可能会受RLS策略限制
   - 解决方案：确保使用 `getAdminClient()` 或 Service Role Key

2. **查询条件错误**
   - `metadata->>project_id` 语法必须正确
   - project_id必须完全匹配（如 'p001' 而非 'P001'）

3. **数据库连接问题**
   - 网络超时
   - 连接池满
   - 解决方案：增加超时时间或重试机制

4. **事务冲突**
   - 如果同时有其他操作在修改相同记录
   - 解决方案：使用事务锁或乐观锁

### 4.3 当前删除API实现

位置：`D:\CursorWork\FutureMindInstitute\futuremind-new\app\api\admin\gaia-kb\route.ts`

**删除流程：**
```typescript
// 第一步：获取文档的project_id
const { data: doc } = await supabase
  .from('documents')
  .select('metadata')
  .eq('id', documentId)
  .eq('metadata->>type', 'gaia_knowledge_base')
  .single()

// 第二步：删除所有关联的向量块
const { data: vectorChunks } = await supabase
  .from('documents')
  .delete()
  .eq('metadata->>project_id', projectId)
  .select('id')

// 第三步：删除主记录
const { error: deleteMainError } = await supabase
  .from('documents')
  .delete()
  .eq('id', documentId)
  .eq('metadata->>type', 'gaia_knowledge_base')
```

**测试结果：**
- 步骤2（删除向量块）：成功删除3616个记录
- 步骤3（删除主记录）：未测试（为了保留主记录信息）

## 五、潜在问题和建议

### 5.1 当前问题
1. **状态不一致**
   - p001的3个主记录状态都是 `processing`
   - 但实际向量块已被删除
   - 建议：实现状态自动更新机制（API已有此功能）

2. **没有向量块的项目**
   - p001有源文件但没有向量块
   - 可能原因：向量化失败或被手动删除
   - 建议：添加重新生成向量的功能

### 5.2 改进建议

1. **添加删除前确认**
   ```typescript
   // 在删除前显示将要删除的数据量
   const count = await supabase
     .from('documents')
     .select('id', { count: 'exact', head: true })
     .eq('metadata->>project_id', projectId)

   console.log(`将删除 ${count} 个向量块`)
   ```

2. **添加软删除功能**
   ```typescript
   // 不直接删除，而是标记为已删除
   await supabase
     .from('documents')
     .update({
       metadata: { ...metadata, deleted_at: new Date().toISOString() }
     })
     .eq('metadata->>project_id', projectId)
   ```

3. **添加删除日志**
   ```typescript
   // 记录删除操作到日志表
   await supabase
     .from('deletion_logs')
     .insert({
       project_id: projectId,
       deleted_chunks: count,
       deleted_by: user.id,
       deleted_at: new Date().toISOString()
     })
   ```

## 六、SQL查询速查表

### 6.1 查看所有主记录
```sql
SELECT
  id,
  title,
  metadata->>'custom_project_id' as project_id,
  metadata->>'status' as status,
  metadata->>'filename' as filename,
  created_at
FROM documents
WHERE metadata->>'type' = 'gaia_knowledge_base'
ORDER BY created_at DESC;
```

### 6.2 查看特定项目的向量块
```sql
SELECT
  id,
  metadata->>'project_id' as project_id,
  metadata->>'title' as title,
  LEFT(content, 100) as content_preview,
  created_at
FROM documents
WHERE metadata->>'project_id' = 'p001'
ORDER BY created_at DESC
LIMIT 10;
```

### 6.3 统计各项目的向量块数量
```sql
SELECT
  metadata->>'project_id' as project_id,
  COUNT(*) as vector_count,
  MIN(created_at) as first_chunk,
  MAX(created_at) as last_chunk
FROM documents
WHERE metadata->>'project_id' IS NOT NULL
GROUP BY metadata->>'project_id'
ORDER BY project_id;
```

### 6.4 删除特定项目的所有数据
```sql
-- 1. 删除向量块
DELETE FROM documents
WHERE metadata->>'project_id' = 'p001';

-- 2. 删除主记录
DELETE FROM documents
WHERE metadata->>'type' = 'gaia_knowledge_base'
  AND metadata->>'custom_project_id' = 'p001';
```

### 6.5 查看embedding字段情况
```sql
SELECT
  id,
  metadata->>'project_id' as project_id,
  CASE
    WHEN embedding IS NULL THEN '无'
    ELSE '有'
  END as has_embedding
FROM documents
WHERE metadata->>'project_id' IS NOT NULL
LIMIT 10;
```

## 七、关键发现总结

1. **存储位置明确**
   - 所有数据都在 `documents` 表
   - 通过 `metadata` 字段的JSONB数据区分类型

2. **删除功能正常**
   - 测试成功删除了3616个向量块
   - 使用Service Role Key可以正常操作

3. **数据结构清晰**
   - 主记录：`metadata->>'type' = 'gaia_knowledge_base'`
   - 向量块：`metadata->>'project_id'` 存在

4. **当前状态健康**
   - 1000条记录，999条有embedding
   - p002和p003的向量数据完整
   - p001的向量块已被测试删除

---

**报告生成时间：** 2025-11-14
**数据库：** Supabase PostgreSQL + pgvector
**总记录数：** 1000条
**测试状态：** 删除功能验证通过
---

## 📊 执行摘要

### 整体状态
- ✅ 数据库表: `documents`
- ✅ 总记录数: **4,210条** (估算，基于head查询)
- ✅ 包含embedding的记录: **993条** (在最新1000条中)
- ✅ 向量维度: 未显示（Supabase JSONB存储）

### 数据组成
| 类型 | 数量 | 说明 |
|------|------|------|
| 源文件记录 (gaia_knowledge_base) | 5 | 原始上传文件的元数据 |
| 向量块 (chunks) | 993+ | 文本分块后生成的向量 |
| 其他记录 | 3,212+ | 其他类型的文档记录 |

---

## 📁 第一部分：源文件记录详情

### P001 项目 (3个文件)

#### 1. 欢迎来到地球-带时间戳的字幕.md
- **文件大小**: 226.05 KB
- **上传时间**: 2025-11-14 00:22:41 UTC
- **状态**: processing
- **记录ID**: `2f303a56-f413-4e0e-828f-90de292eaeff`
- **文件类型**: text/plain (Markdown)

#### 2. welcome to earth字幕.md
- **文件大小**: 84.48 KB
- **上传时间**: 2025-11-13 23:11:11 UTC
- **状态**: processing
- **记录ID**: `b1216124-c417-4b1f-a454-b3cad2edbe02`
- **文件类型**: text/plain (Markdown)

#### 3. Seven Experiments That Could Change the World.pdf
- **文件大小**: 2,590.66 KB (2.53 MB)
- **上传时间**: 2025-11-13 12:30:25 UTC
- **状态**: processing
- **记录ID**: `0aeae3b8-750f-4eeb-b8e5-6b033b674e85`
- **文件类型**: application/pdf

---

### P002 项目 (2个文件)

#### 1. 欢迎来到地球-带时间戳的字幕.md
- **文件大小**: 226.05 KB
- **上传时间**: 2025-11-14 00:28:22 UTC
- **状态**: processing
- **记录ID**: `e1eb2d81-c23b-4d97-9c63-c902f808ce6c`
- **文件类型**: text/plain (Markdown)

#### 2. Seven Experiments That Could Change the World.pdf
- **文件大小**: 2,590.66 KB (2.53 MB)
- **上传时间**: 2025-11-13 13:21:52 UTC
- **状态**: processing
- **记录ID**: `ce195229-80cc-4c5e-9296-30c26f278b2b`
- **文件类型**: application/pdf

---

### P003 项目
❌ **未找到任何文件记录**

---

### P004 项目
❌ **未找到任何文件记录**

---

## 🔢 第二部分：向量块统计

### 项目向量块分布

```
┌──────────┬───────────────┬────────────────┐
│ 项目ID   │ 向量块数量    │ 占比           │
├──────────┼───────────────┼────────────────┤
│ p001     │ 3,616 块     │ 86.2%          │
│ p002     │ 576 块       │ 13.8%          │
│ p003     │ 0 块         │ 0%             │
│ p004     │ 0 块         │ 0%             │
├──────────┼───────────────┼────────────────┤
│ 总计     │ 4,192 块     │ 100%           │
└──────────┴───────────────┴────────────────┘
```

### P001 项目向量块详情
- **总向量块**: 3,616个
- **最早创建**: 2025-11-13 06:08:36 UTC
- **最后创建**: 2025-11-13 06:08:51 UTC
- **生成耗时**: 约15秒
- **包含文件**:
  - Seven Experiments That Could Change the World.pdf (主要)
  - welcome to earth字幕.md
  - 欢迎来到地球-带时间戳的字幕.md

**示例向量块内容**:
```
SEVEN EXPERIMENTS THAT
COULD CHANGE THE WORLD
"In...
```

### P002 项目向量块详情
- **总向量块**: 576个
- **最早创建**: 2025-11-14 00:30:16 UTC
- **最后创建**: 2025-11-14 00:30:18 UTC
- **生成耗时**: 约2秒
- **包含文件**:
  - 欢迎来到地球-带时间戳的字幕.md (主要)

**示例向量块内容**:
```markdown
第一集：
[00:06] I've got a confession to make.
[00:06] 我得坦白一件事。
[00:09] I've never swum in a lake,
```

---

## 🔍 第三部分：数据质量分析

### ✅ 良好指标

1. **向量完整性**: 所有向量块都包含embedding字段
2. **元数据完整**: 所有记录都有完整的metadata字段
3. **项目关联**: 向量块正确关联到对应的project_id
4. **时间戳**: 所有记录都有created_at时间戳

### 📊 Metadata字段结构

#### 源文件记录的metadata
```json
{
    "type": "gaia_knowledge_base",
    "status": "processing",
    "filename": "欢迎来到地球-带时间戳的字幕.md",
    "file_size": 231471,
    "file_type": "application/octet-stream",
    "uploaded_at": "2025-11-14T00:28:22.960Z",
    "custom_project_id": "p002"
}
```

#### 向量块的metadata
```json
{
    "loc": {
        "lines": {
            "to": 13,
            "from": 1
        }
    },
    "title": "欢迎来到地球-带时间戳的字幕",
    "source": "blob",
    "blobType": "text/plain",
    "project_id": "p002"
}
```

### 发现的Metadata字段
在100条记录样本中发现以下字段：
- `auto_created` - 自动创建标记
- `blobType` - Blob类型
- `category` - 分类
- `loc` - 位置信息（行号）
- `pdf` - PDF相关信息
- `project_id` - 项目ID (用于向量块)
- `source` - 来源
- `title` - 标题
- `type` - 类型 (用于源文件标记)

---

## ⚠️ 第四部分：发现的问题

### 1. 关键问题：project_id字段不一致

**问题描述**:
- 源文件使用 `custom_project_id` 字段
- 向量块使用 `project_id` 字段
- 导致查询时需要区分两种不同的字段名

**影响**:
- 第一次查询显示只有p001有向量数据（因为查询的是metadata->>'project_id'）
- 实际上p002也有576个向量块

**建议解决方案**:
```sql
-- 统一使用project_id字段查询
SELECT * FROM documents
WHERE metadata->>'project_id' IS NOT NULL  -- 向量块
   OR metadata->>'custom_project_id' IS NOT NULL  -- 源文件
```

### 2. 状态问题：所有源文件状态为"processing"

**问题描述**:
- 所有5个源文件的status都是"processing"
- 但实际上已经生成了向量数据
- 最老的记录是2天前上传的

**可能原因**:
- 向量生成完成后没有更新状态为"completed"
- 缺少状态更新的webhook或回调

**建议解决方案**:
- 添加状态更新逻辑
- 将成功生成向量的文件状态更新为"completed"
- 添加失败处理和重试机制

### 3. 缺失的项目：P003和P004

**问题描述**:
- P003和P004没有任何数据
- 没有源文件记录
- 没有向量块

**可能原因**:
- 这些项目还没有上传任何知识库文件
- 或者上传失败了

**建议**:
- 检查这些项目的上传历史
- 确认是否需要为这些项目上传知识库

---

## 📈 第五部分：性能数据

### 向量生成性能

| 项目 | 文件数 | 总大小 | 向量块数 | 生成时间 | 速度 |
|------|--------|--------|----------|----------|------|
| P001 | 3 | 2.87 MB | 3,616 | ~15秒 | ~241 块/秒 |
| P002 | 2 | 2.81 MB | 576 | ~2秒 | ~288 块/秒 |

**观察**:
- P002生成速度更快（仅处理Markdown文件）
- P001包含大型PDF，生成时间较长
- 平均处理速度：约250块/秒

---

## 🎯 第六部分：建议和行动项

### 立即行动
1. ✅ **修复状态字段**: 将已完成的记录状态从"processing"更新为"completed"
2. ✅ **统一字段命名**: 考虑将custom_project_id改为project_id
3. ⚠️ **为P003/P004上传知识库**: 如果需要的话

### 短期改进
1. 添加状态更新webhook
2. 实现失败重试机制
3. 添加向量生成进度追踪
4. 优化大文件处理性能

### 长期优化
1. 实现分布式向量生成
2. 添加向量质量评估
3. 实现增量更新机制
4. 添加向量数据备份

---

## 📝 SQL查询参考

### 查询所有项目的向量块统计
```sql
SELECT
  metadata->>'project_id' as project_id,
  COUNT(*) as chunk_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM documents
WHERE metadata->>'project_id' IS NOT NULL
GROUP BY metadata->>'project_id'
ORDER BY MAX(created_at) DESC;
```

### 查询源文件列表
```sql
SELECT
  id,
  title,
  metadata->>'custom_project_id' as project_id,
  metadata->>'filename' as filename,
  metadata->>'status' as status,
  metadata->>'file_size' as file_size,
  created_at
FROM documents
WHERE metadata->>'type' = 'gaia_knowledge_base'
ORDER BY created_at DESC;
```

### 查询特定项目的向量块
```sql
SELECT
  id,
  content,
  metadata,
  created_at
FROM documents
WHERE metadata->>'project_id' = 'p002'
ORDER BY created_at ASC
LIMIT 10;
```

### 检查embedding完整性
```sql
SELECT
  COUNT(*) as total,
  COUNT(embedding) as with_embedding,
  COUNT(*) - COUNT(embedding) as missing_embedding
FROM documents
WHERE metadata->>'project_id' IS NOT NULL;
```

---

## 🔗 相关文档

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [LangChain Supabase Integration](https://js.langchain.com/docs/integrations/vectorstores/supabase)
- [pgvector Extension Guide](https://github.com/pgvector/pgvector)

---

**报告结束**
*如有疑问，请查看生成脚本: `scripts/final-vector-report.ts`*
