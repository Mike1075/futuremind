# FutureMind Institute 项目上下文

## 项目概述
FutureMind Institute（未来心智研究院）是一个面向青少年的教育平台，提供多种创新课程体系。

## 技术栈
- **框架**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + Framer Motion
- **后端**: Supabase (Auth + Database + Storage)
- **AI**: OpenAI API, Google GenAI
- **语言**: TypeScript

## 项目结构
```
app/                    # Next.js App Router 页面
  ├── (auth)/          # 认证相关页面
  ├── admin/           # 管理后台
  ├── courses/         # 课程页面
  ├── portal/          # 用户门户
  └── api/             # API 路由
components/            # React 组件
lib/                   # 工具库和配置
supabase/              # Supabase 配置和迁移
types/                 # TypeScript 类型定义
```

## 课程体系
1. **地球课程 (Earth)** - 基础课程，PBL 项目制学习
2. **伊卡洛斯三角 (Icarus Triangle)** - 进阶课程
3. **倾听课程 (Listening)** - 14天音频课程
4. **盖亚对话 (Gaia Dialog)** - AI 对话系统

## 用户角色
- `student` - 学生
- `teacher` - 老师
- `principal` - 校长/管理员

## 设计风格
- **主题**: 宇宙/星空风格 (Cosmic theme)
- **关键 CSS 类**: `btn-stardust`、`portal-card-wrapper`、`gaia-icon`、`card-glass`、`card-rainbow-border`

### UI 设计规范（重要！）

#### 1. 全局星空背景
- 使用 `CosmicBackground` 组件（已在 `layout.tsx` 中引入）
- **所有页面容器不要使用 `bg-black`**，应保持透明以显示星空
- 加载状态也应透明，不遮挡背景

#### 2. 按钮样式 - `btn-stardust`
- **默认状态**: 透明背景 + 细线边框（金色半透明）
- **悬停状态**: 炫彩流光边框（金色→紫色→青色渐变动画）+ 发光效果
- **禁止**: 实心彩色背景，应始终保持透明玻璃质感

#### 3. 卡片样式 - `card-rainbow-border`
- **默认状态**: 透明玻璃背景（`bg-white/5 backdrop-blur`）+ 细线白色边框
- **悬停状态**: 只有边框显示炫彩流光，内部保持透明玻璃
- **关键技术**: 使用 CSS `mask-composite: exclude` 实现只显示边框渐变

#### 4. 弹窗/模态框
- 背景遮罩: `bg-black/60 backdrop-blur-md`（半透明，可见星空）
- 弹窗容器: `bg-white/5 backdrop-blur-xl border border-white/20`（玻璃效果）
- 关闭按钮: `bg-white/10 hover:bg-white/20`（透明风格）
- 输入框: `bg-white/5 border border-white/20`（玻璃透明效果）
- 禁用输入框: `bg-white/5 border border-white/10`（更淡的边框）
- 下拉框/select: `bg-white/5 border border-white/20`（与输入框一致）
- 开关（关闭态）: `bg-white/20`（不要用 `bg-gray-600`）

#### 5. Toast 提示
- 位置: 屏幕正中央（`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`）
- 样式: 玻璃透明背景 + 对应状态的边框颜色

#### 6. 进度条
- 使用 `progress-ethereal` + `progress-ethereal-bar` 类
- 彩虹渐变效果

---

## AI 聊天系统架构

### 两个独立的 AI 聊天系统

| 系统 | 用途 | 工作流名称 | API 路由 |
|------|------|-----------|---------|
| **探索者联盟 AIP** | 项目协作 | `aip聊天助手-未来教育 探索者联盟` | `/api/aip/chat` |
| **盖亚对话** | 个人成长 | 通过 `N8N_CHAT_WEBHOOK_URL` | `/api/gaia/chat` |

### Hybrid Search 架构（已在 AIP 实现）

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

### 四种知识来源

| 类型 | 来源 | 存储 | 状态 |
|------|------|------|------|
| **项目知识库** | 用户上传文档 | `documents` + `document_chunks` | ✅ 已实现 |
| **组织知识库** | 管理员上传 | `documents (project_id=NULL)` | ⏳ 架构已有 |
| **项目智慧库** | 聊天 AI 提取 | `wisdom_entries (wisdom_type='project')` | ✅ 已迁移 |
| **组织智慧库** | 智慧聚合 | `wisdom_entries (wisdom_type='organization')` | ⏳ 待触发 |

> **2025-12-02 架构调整**：
> - `hybrid_search` 函数查询 `document_chunks` 表（有 embedding 的向量化分块）
> - 智慧库数据迁移到独立的 `wisdom_entries` 表（AI 提取的 Q&A 智慧）
> - **注意**：`documents` 表没有 embedding，只存完整文档；`document_chunks` 才有 embedding

### 智慧沉淀系统

**核心概念**：
- 从聊天记录提取高质量 Q&A（质量分数 >= 80）
- 智慧库是**补充知识来源**，不是缓存快答
- 边缘函数：`project-wisdom-accumulation`、`organization-wisdom-accumulation`

**2025-12-02 智慧库分离重构**：
- 新建 `wisdom_entries` 表，独立存储 AI 提取的智慧
- 已迁移 3 条现有智慧记录
- 数据库触发器已更新：`trigger_organization_wisdom_aggregation` 改为监听 `wisdom_entries`
- N8N 工作流需要手动修改（见下方指南）

**N8N 智慧库查询修改指南**（aip聊天助手工作流）：

| 节点 | 原 SQL | 新 SQL |
|------|--------|--------|
| **项目智慧库** | `FROM documents WHERE title='项目智慧库'` | `FROM wisdom_entries WHERE wisdom_type='project'` |
| **组织智慧库** | `FROM documents WHERE title='组织智慧库'` | `FROM wisdom_entries WHERE wisdom_type='organization'` |

**注意**：字段变化
- 原：`metadata->>'summary' as summary` → 新：直接用 `summary`
- 原：`metadata->>'topic' as topic` → 新：直接用 `topic`

**不需要修改的**：
- `aip上传文档` 工作流（上传用户文档，继续写入 documents）
- 前端代码（创建组织/项目时的初始化模板保留在 documents）

**wisdom_entries 表结构**：
```sql
id, project_id, organization_id, content, summary, topic,
wisdom_type ('project'/'organization'), source_type ('chat'),
quality_score, metadata, created_at, updated_at
```

### AIP 聊天工作流问题修复 (2025-12-02)

**问题 1：`Create a row` 节点缺少 project_id**
- 症状：聊天记录保存后 `project_id` 为 null
- 原因：节点配置中没有添加 `project_id` 字段
- 修复：在 N8N 中打开 `Create a row` 节点，添加字段：
  - Field: `project_id`
  - Value: `={{ $('1-Parse-Input-Parameters').first().json.project_id || null }}`

**问题 2：`hybrid_search` 查询错误的表** ✅ 已修复
- 症状：向量搜索返回空结果
- 原因：函数查询 `documents` 表，但该表没有 embedding
- 修复：改为查询 `document_chunks` 表（已通过数据库迁移修复）

**问题 3：AI 检索到知识库但回答"找不到"** ⚠️ 已发现原因
- 症状：`整合上下文` 节点有内容，但 AI 说"没有找到相关内容"
- 原因分析（2025-12-02 晚）：
  1. **向量搜索语义不精确**：用户问"第三天"，知识库内容是"第3天"
  2. **project_id 过滤隔离**：用户在项目 A 问问题，但相关内容在项目 B
  3. **父文档内容未利用**：`hybrid_search` 返回 `parent_document_id`，但工作流没有去获取父文档完整内容

- **数据检查结果**：
  - "第3天 超越语言" 内容存在于 `document_chunks`
  - 属于项目 `b67d5f13-22e3-480a-856c-c332a9660f27` (测试风格)
  - 父文档：`自在聆听·观音之旅.txt`（14天冥想课程完整内容）

- **已修复（2025-12-03）**：
  1. ✅ **中文数字匹配**：`hybrid_search` 函数支持 "第三天" = "第3天" 自动转换
  2. ✅ **父文档获取函数**：`get_parent_documents(uuid[])` 可批量获取完整文档
  3. ⏳ **N8N 集成**：需要手动添加父文档获取节点（见下方指南）

**当前数据分布**：
| 表 | 记录数 | embedding |
|---|--------|-----------|
| `documents` | 5 | ❌ 0 条有 embedding |
| `document_chunks` | 609+ | ✅ 全部有 embedding |

**"测试风格"项目冥想内容**：
| 天数 | 主题 | chunks 数量 |
|------|------|------------|
| 第1天 | 自在地聆听 | 多条 |
| 第2天 | 放下心中的障碍 | 多条 |
| 第3天 | 超越语言 | 1条 |
| 第4天 | 安静地听 | 多条 |

### N8N 父子分块集成指南（符合 RAG 最佳实践）

**设计原理（参考 [LangChain ParentDocumentRetriever](https://python.langchain.com/docs/how_to/parent_document_retriever/)）**：
- **Child chunks**: 400 字符（用于精确搜索）
- **Parent chunks**: ~2000 字符（用于提供上下文）
- **注意**：不是返回整个原始文档！那样会导致 Token 爆炸

**`hybrid_search` v3 返回字段**：
| 字段 | 说明 | 大小 |
|------|------|------|
| `content` | 匹配的 child chunk | ~400 字符 |
| `expanded_content` | 扩展上下文（chunk 前后各 1000 字符） | ~2000 字符 |
| `parent_title` | 父文档标题 | - |

**当前架构（无需修改连接）**：
```
Hybrid-项目知识1 ──┐
                  ├──→ 合并搜索结果 → 整合上下文 → LLM
Hybrid-组织知识 ──┘
        ↑
   直接返回 expanded_content（~2000字符，零额外请求）
```

**你只需修改一个节点**：`整合上下文` Code 节点

**新版完整代码**：
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
      // 收集扩展上下文（~2000字符，去重）
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
      expandedContexts.set(data.parent_document_id, {
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

// 添加扩展上下文（~2000字符/篇，去重后）
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

## AIP 聊天系统功能实现状态 (2025-12-03 确认)

| 功能 | 状态 | 实现位置 | 说明 |
|-----|------|---------|------|
| **向量搜索** | ✅ 已实现 | `hybrid_search` → `semantic_search` CTE | 使用 pgvector 余弦距离 |
| **全文精准搜索** | ✅ 已实现 | `hybrid_search` → `keyword_search` CTE | 支持 ILIKE 模糊匹配 |
| **中文数字转换** | ✅ 已实现 | `normalize_chinese_numbers()` | 第三天 = 第3天 |
| **父子结构** | ✅ 已实现 | `documents`(父) ↔ `document_chunks`(子) | 返回 `expanded_content` |
| **混合搜索 (RRF)** | ✅ 已实现 | `hybrid_search` 中 RRF 公式融合 | 向量+全文双路融合 |
| **Rerank** | ❌ 未实现 | - | 被 RRF 排序替代，后续可加 Cohere |

**N8N 工作流架构**（注意：已删除 AI Agent，使用 Basic LLM Chain）：
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
                                  Basic LLM Chain (Gemini)  ← 不是 AI Agent!
                                          ↓
                                   Respond to Webhook
```

### Bug 修复 (2025-12-03)

1. **✅ 盖亚聊天 UI 修复**
   - 问题 1：错误时一直转圈
   - 修复：显示实际错误信息（`❌ ${errorMessage}`），停止加载状态
   - 问题 2：思考图标短暂重复显示
   - 原因：占位消息和加载动画分开渲染，导致短暂重叠
   - 修复：将加载动画整合到占位消息中，使用条件渲染

2. **✅ PDF 上传支持**
   - 问题：上传 PDF 报错 "unsupported Unicode escape sequence"
   - 原因：PDF 二进制文件被当作 UTF-8 文本处理
   - 修复：添加 `pdf-parse` 库，自动检测文件类型并解析

3. **✅ 聊天记录丢失问题**
   - 问题：用户聊天后切换页面，历史记录丢失
   - 原因：数据库保存是异步 fire-and-forget，用户导航离开前可能未完成
   - 修复：`app/api/aip/chat/route.ts` 改为同步 `await` 保存

2. **✅ 社区项目显示私有项目**
   - 问题：私有项目（如盖亚知识库）显示在"所有公开项目"列表
   - 修复：`lib/aip/api.ts` → `getOrganizationProjects` 添加 `is_public=true` 过滤

3. **✅ document_chunks.organization_id 为空**
   - 问题：部分分块 organization_id 为 null，导致搜索过滤失败
   - 修复：批量更新 SQL 填充正确的 organization_id

4. **✅ 垃圾数据清理**
   - 问题：4 条 document_chunks 内容为纯 UUID
   - 修复：DELETE 删除这些无效记录

### 盖亚知识库项目说明

| 项目 | 值 |
|-----|-----|
| **项目 ID** | `2ffbe00d-d17f-43f0-9c22-103b73617342` |
| **创建者** | 陶子 (principal) |
| **所属组织** | "系统"组织 (`00000000-0000-0000-0000-000000000001`) |
| **用途** | **系统级盖亚知识库**（仅管理后台可见） |
| **环境变量** | `GAIA_KB_PROJECT_ID=2ffbe00d-d17f-43f0-9c22-103b73617342` |
| **可见性** | 私有，不属于任何用户可见的组织 |

**设计原则**：
- "系统"组织无任何成员，所以不会出现在任何用户的组织列表
- 只能通过管理后台 `/admin/gaia-kb` 访问和上传文档

---

## 待办事项

### 盖亚知识库重构（2025-12-02 进行中）

**核心设计决策**：
- 盖亚知识库不按课程区分，使用专属全局 project_id
- 环境变量：`GAIA_KB_PROJECT_ID=2ffbe00d-d17f-43f0-9c22-103b73617342`
- 环境变量：`N8N_UPLOAD_WEBHOOK`（文档上传 webhook）

**父子架构设计**（复用 AIP 方案）：
```
documents 表：存完整文档内容（1本书）
    ↓
document_chunks 表：存子块 + parent_document_id（每一页 + 书架编号）
    ↓
检索时：找到子块 → 通过 parent_document_id 查完整原文
```

**为什么这样设计**：
- 完整内容只存一份，不浪费空间
- 小块和完整文档分开管理，数据干净
- 检索时多一次查询（几毫秒），换来架构清晰

**重构进度**：
- [x] 分析现有架构和数据库结构
- [x] 创建盖亚专属 project_id 并更新环境变量
- [x] 修改前端知识库管理界面（移除课程选择）
- [x] 修改后端 API 使用固定 project_id
- [x] 创建 `hybrid_search_gaia` 函数（查询 document_chunks）
- [x] N8N 上传工作流修改（tableName → document_chunks）
- [x] 后端状态检测/删除逻辑修正（查询 document_chunks）
- [x] 后端 API 存入文件内容到 documents.content
- [x] hybrid_search_gaia 支持返回 parent_content（父文档内容）
- [x] 父子架构测试通过（529子块 → 319,261字符父文档）
- [x] **已完成**：重构 N8N 盖亚聊天工作流（2025-12-03）
  - [x] 新建并配置 Embeddings 节点（HTTP Request → OpenAI）
  - [x] 新建并行 Postgres 节点（用户名、画像、聊天记录）
  - [x] 新建 hybrid_search_gaia 节点（HTTP Request + Supabase 凭证）
  - [x] 新建 Code 节点（整合上下文）
  - [x] 新建 Basic LLM Chain 节点（GPT-4o + Streaming）
  - [x] Merge 节点合并 4 路并行输入
  - [x] 删除旧的 AI Agent 相关节点
- [ ] **待测试**：从前端发起聊天测试新工作流

**N8N 盖亚聊天工作流新架构**（2025-12-03 已实现）：
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
盖亚回复 (Basic LLM Chain, GPT-4o, Streaming)
    ↓
Respond to Webhook
```

**Rerank 优化**：暂时跳过，后续可在 hybrid_search_gaia 之后添加 Cohere Rerank 节点

**⚠️ N8N 盖亚工作流待修复的 SQL 列名**：

| 节点 | 错误列名 | 正确列名 |
|-----|---------|---------|
| **聊天记录** | `chat_type` | `agent_type` |
| **用户画像** | `summary` | `overall_summary` |

请在 N8N 中手动修改这两个 Postgres 节点的 SQL 查询。

### AIP 聊天 - 最近完成 (2025-12-02)
- [x] 修复 `hybrid_search` 函数空字符串问题（UUID 类型不接受空字符串）
- [x] N8N 添加 `项目智慧库`、`组织智慧库` Postgres 节点（5路输入）
- [x] 清理污染的聊天历史（candy 项目 + 无知识库项目）
- [x] N8N Prompt 优化：使用 `||` 替代三元运算符（N8N 不支持 `? :`）
- [x] 修复多选项目支持：
  - `项目智慧库` SQL 用 `ANY(string_to_array(...))` 语法
  - `hybrid_search` RPC 已原生支持逗号分隔的多项目 ID
- [x] API 支持多项目信息传递：
  - 字段从 `project_name`/`project_description` 改为 `projects_info`（格式化文本）
  - 新增 `project_count` 字段
  - 支持单项目和多项目两种格式

### AIP 数据清理与架构修复 (2025-12-02 晚)

**问题发现**：
- `document_chunks` 表为空（0条记录）
- `documents` 表有 4066 条记录，但 4047 条是废弃的测试数据（无 project_id）
- `hybrid_search` 查询空表，导致 Hybrid 知识搜索无结果

**根因分析**：
- N8N 上传工作流的 Vector Store 节点写入 `document_chunks` 失败（但未报错）
- 大部分数据是"项目智慧库"由边缘函数直接写入 `documents`，不走上传工作流
- 用户真正上传的文档只有 4 个

**修复措施**：
- [x] 清理 4047 条废弃数据（无 project_id 的测试/旧数据）
- [x] 保留 19 条有效数据（都有 project_id 和 title）
- [x] **修改 `hybrid_search` 函数**：从查询 `document_chunks` 改为查询 `documents` 表
- [x] 测试验证：搜索"冥想"成功返回智慧库内容

**架构决策**：
```
当前数据流：
- 用户上传文档 → documents 表（父文档）→ document_chunks 表（失败/空）
- 智慧沉淀 → documents 表（直接存储）

修复后的搜索：
- hybrid_search → 查询 documents 表（统一入口）
- 智慧库查询 → 也查询 documents 表（通过 title 区分）
```

**后续待办**：
- [ ] 修复 N8N Vector Store 节点，确保上传能正确写入 `document_chunks`
- [ ] 或者统一使用 `documents` 表，放弃父子架构

### AIP 聊天 - 性能分析 (2025-12-02)
- **正常响应时间**：前端 6-7 秒 = N8N 4秒 + API开销 1-2秒 + 网络 0.5秒
- **添加了计时日志**：响应中包含 `serverTimings`（auth/db/n8n/total）
- **冷启动影响**：首次请求可能多 5-10 秒（Vercel 冷启动）
- **解决方案**：连续请求时正常，偶发慢是冷启动导致

### 性能优化 - 待办
- [ ] 考虑 Vercel Pro 的 Instant Start 功能（减少冷启动）
- [ ] 考虑切换 AI 模型提速（通义千问 OpenAI 兼容接口）

---

## 常用命令
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
```

## 数据库关键表
- `chat_history` - 聊天记录（content + ai_content 在同一行）
- `documents` - 父文档（用户上传的完整文档）
- `document_chunks` - 向量化文档块（子分块，关联 parent_document_id）
- `wisdom_entries` - AI 提取的智慧（从聊天中提取的 Q&A）
- `student_summaries` - 用户画像
- `project_files` - 文件审核（review_status 字段）

## 关键 RPC 函数
- `hybrid_search` - AIP 混合搜索 **v3**（2025-12-03 升级）
  - 查询 `document_chunks` 表
  - 支持多项目 ID（逗号分隔）
  - **支持中文数字自动转换**（第三天 = 第3天）
  - **返回扩展上下文** `expanded_content`（~2000字符，chunk 前后各 1000 字符）
  - 符合 [LangChain ParentDocumentRetriever 最佳实践](https://python.langchain.com/docs/how_to/parent_document_retriever/)
- `hybrid_search_gaia` - 盖亚混合搜索 **v2**（2025-12-03 升级）
  - 查询 `document_chunks` 表，用 `gaia_project_id` 过滤
  - **支持中文数字自动转换**（第三天 = 第3天）
  - **返回扩展上下文** `expanded_content`（~2000字符）
  - 返回 `parent_title`（父文档标题）
- `get_parent_documents` - 批量获取父文档（备用）
- `normalize_chinese_numbers` - 中文数字转阿拉伯数字（一→1，二→2，三→3...）

---

## Claude 行为指令

> 完成重要任务后，更新此文件，记录：
> - 新完成的功能
> - 关键决策
> - 待办事项
>
> 保持精简，不写具体代码。

---
*此文件帮助 Claude 在对话压缩后保持项目上下文*
