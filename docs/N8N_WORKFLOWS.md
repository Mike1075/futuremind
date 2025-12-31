# N8N 工作流配置指南

> AIP 和盖亚聊天系统的 N8N 工作流配置详情

## 系统架构概览

```
用户提问
    ↓
生成向量 (HTTP Request → OpenAI Embeddings)
    ↓
┌────────────────────────────────────┐
│           并行查询 (3路)            │
├────────────┬────────────┬──────────┤
│ Hybrid-    │ Hybrid-    │ 获取     │
│ 项目知识   │ 组织知识   │ 用户画像 │
└────────────┴────────────┴──────────┘
    ↓
合并搜索结果 → 整合上下文 → Basic LLM Chain
    ↓
Respond to Webhook
```

**关键技术决策**：
- 用 HTTP Request 替代 Vector Store 节点（绕过 N8N Metadata Filter Bug）
- 用 `hybrid_search` RPC 函数实现向量+全文混合搜索
- 用 Basic LLM Chain 替代 AI Agent（响应从 13秒 → 2.5秒）

---

## 四种知识来源

| 类型 | 来源 | 存储 | 状态 |
|------|------|------|------|
| **项目知识库** | 用户上传文档 | `documents` + `document_chunks` | ✅ 已实现 |
| **组织知识库** | 管理员上传 | `documents (project_id=NULL)` | ⏳ 架构已有 |
| **项目智慧库** | 聊天 AI 提取 | `wisdom_entries (wisdom_type='project')` | ✅ 已实现 |
| **组织智慧库** | 智慧聚合 | `wisdom_entries (wisdom_type='organization')` | ⏳ 待触发 |

**注意**：
- `documents` 表没有 embedding，只存完整文档
- `document_chunks` 才有 embedding，用于向量搜索

---

## 智慧沉淀系统

**核心概念**：
- 从聊天记录提取高质量 Q&A（质量分数 >= 80）
- 智慧库是**补充知识来源**，不是缓存快答
- 边缘函数：`project-wisdom-accumulation`、`organization-wisdom-accumulation`

**N8N 智慧库查询配置**（aip聊天助手工作流）：

| 节点 | SQL 查询 |
|------|---------|
| **项目智慧库** | `FROM wisdom_entries WHERE wisdom_type='project'` |
| **组织智慧库** | `FROM wisdom_entries WHERE wisdom_type='organization'` |

**wisdom_entries 表结构**：
```sql
id, project_id, organization_id, content, summary, topic,
wisdom_type ('project'/'organization'), source_type ('chat'),
quality_score, metadata, created_at, updated_at
```

---

## AIP 聊天工作流架构

```
Webhook → 1-Parse-Input-Parameters → 生成向量 (HTTP Request)
                                          ↓
                         ┌────────────────┼────────────────┐
                         ↓                ↓                ↓
                   Hybrid-项目知识  Hybrid-组织知识   获取用户画像
                         ↓                ↓                ↓
                         └────────────────┼────────────────┘
                                          ↓
                                    合并搜索结果
                                          ↓
                                    整合上下文 (Code)
                                          ↓
                                  Basic LLM Chain (Gemini)
                                          ↓
                                   Respond to Webhook
```

---

## 盖亚聊天工作流架构

```
Webhook1 (streaming)
    ↓
Edit Fields (提取 user_id, chatInput, session_id)
    ↓
┌───────────────────────────────────────────────────────────────┐
│                      并行执行 (4路)                            │
├─────────────────┬───────────┬───────────┬─────────────────────┤
│ Embeddings      │ 用户名    │ 用户画像  │ 聊天记录            │
│ + hybrid_search │ (Postgres)│ (Postgres)│ (Postgres, 5条)     │
│ (串行)          │           │           │                     │
└─────────────────┴───────────┴───────────┴─────────────────────┘
    ↓
合并数据 (Merge, 4 inputs)
    ↓
整合上下文 (Code: userName, userProfile, chatContext, knowledgeBase, query)
    ↓
盖亚回复 (Basic LLM Chain, GPT-4o)
    ↓
Respond to Webhook
```

---

## Hybrid Search 函数

### `hybrid_search` v3 返回字段

| 字段 | 说明 | 大小 |
|------|------|------|
| `content` | 匹配的 child chunk | ~400 字符 |
| `expanded_content` | 扩展上下文（chunk 前后各 1000 字符） | ~2000 字符 |
| `parent_title` | 父文档标题 | - |

**父子分块设计原理**（参考 LangChain ParentDocumentRetriever）：
- **Child chunks**: 400 字符（用于精确搜索）
- **Parent chunks**: ~2000 字符（用于提供上下文）
- **注意**：不是返回整个原始文档，会导致 Token 爆炸

---

## 整合上下文 Code 节点

```javascript
// 整合所有知识来源（5路输入）+ 扩展上下文
const allItems = $input.all();
const projectKnowledge = [];
const projectWisdom = [];
const orgWisdom = [];
let studentProfile = '';

// 收集扩展上下文（去重，按 parent_document_id）
const expandedContexts = new Map();

for (const item of allItems) {
  const data = item.json;
  if (!data || Object.keys(data).length === 0) continue;

  // hybrid_search 返回格式（数组）
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row.content) projectKnowledge.push(row.content);
      if (row.parent_document_id && row.expanded_content) {
        expandedContexts.set(row.parent_document_id, {
          title: row.parent_title,
          content: row.expanded_content
        });
      }
    }
    continue;
  }

  // 单条 hybrid_search 结果
  if (data.content && data.similarity !== undefined) {
    projectKnowledge.push(data.content);
    if (data.parent_document_id && data.expanded_content) {
      expandedContexts.set(row.parent_document_id, {
        title: data.parent_title,
        content: data.expanded_content
      });
    }
    continue;
  }

  // 项目智慧库
  if (data.content && data.summary !== undefined) {
    projectWisdom.push(data.content);
    continue;
  }

  // 组织智慧库
  if (data.content && data.topic !== undefined) {
    orgWisdom.push(data.content);
    continue;
  }

  // 用户画像
  if (data.summary_text) {
    studentProfile = data.summary_text;
    continue;
  }
}

// 构建分层上下文
const contextParts = [];

if (expandedContexts.size > 0) {
  const texts = Array.from(expandedContexts.values())
    .map(d => `📄 ${d.title}\n${d.content}`)
    .join('\n\n===\n\n');
  contextParts.push('【相关文档上下文】\n' + texts);
}

if (projectWisdom.length > 0) {
  contextParts.push('【项目智慧库】\n' + projectWisdom.join('\n\n---\n\n'));
}
if (orgWisdom.length > 0) {
  contextParts.push('【组织智慧库】\n' + orgWisdom.join('\n\n---\n\n'));
}

return [{
  json: {
    context: contextParts.length > 0 ? contextParts.join('\n\n') : '(无相关知识)',
    student_profile: studentProfile
  }
}];
```

---

## 流式输出说明

**当前状态：伪流式（推荐保持）**

```
N8N 等待 LLM 完整响应 → 一次性返回 → 前端 50ms 打字机效果
```

| 指标 | 值 |
|-----|-----|
| 首字延迟 | 4-8 秒 |
| 优点 | 简单、稳定、聊天记录保存正常 |

**真流式需要 Supabase Edge Functions + Realtime**，复杂度高，暂不实现。

---

## Rerank 实现指南（待实现）

**位置**：
```
hybrid_search 返回 8-10 条候选文档
         ↓
   Cohere Reranker（重新排序，取 Top 3-5）
         ↓
      整合上下文
```

**方式 1：n8n 原生 Reranker Cohere 节点**（需要 n8n 1.98+）

**方式 2：HTTP Request 调用 Cohere API**
```javascript
POST https://api.cohere.ai/v1/rerank
{
  "model": "rerank-multilingual-v3.0",
  "query": "{{ $json.query }}",
  "documents": {{ $json.search_results }},
  "top_n": 5
}
```

---

## 分支开发环境

### N8N 工作流分支

N8N 没有原生分支功能，推荐：
1. 复制现有工作流
2. 重命名为 `[测试] xxx`
3. 修改 Webhook URL
4. 在代码分支中使用新的 Webhook URL

### Supabase 数据库分支

1. 登录 Supabase Dashboard
2. 启用 "Branching via dashboard"
3. 点击顶部项目名称旁的箭头 → "Create branch"
4. 分支会有独立的 API 凭证

---

*最后更新: 2025-12-06*
