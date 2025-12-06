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

#### 5. 开关组件 (Toggle Switch)
- **关闭态**: `bg-white/20`（❌ 不要用 `bg-gray-600`）
- **开启态**: `bg-emerald-500`（统一用翠绿色表示开启）
- **焦点环**: `focus:ring-purple-500 focus:ring-offset-black`
- **状态标签**:
  - 开启: `bg-emerald-500/20 text-emerald-400`
  - 关闭: `bg-white/10 text-starlight-muted`

```jsx
// 标准开关组件示例
<button
  onClick={() => setEnabled(!enabled)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black
    ${enabled ? 'bg-emerald-500' : 'bg-white/20'}`}
>
  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
    ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
</button>
```

#### 6. Toast 提示
- 位置: 屏幕正中央（`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`）
- 样式: 玻璃透明背景 + 对应状态的边框颜色

#### 7. 进度条
- 使用 `progress-ethereal` + `progress-ethereal-bar` 类
- 彩虹渐变效果

#### 8. 用户头像图标 - 炫彩边框效果（2025-12-05 更新：移除旋转）
- **结构**: 外层炫彩渐变边框 + 内层黑色剪影
- **渐变**: `from-blue-400 via-purple-500 to-pink-500`（蓝→紫→粉）
- **动画**: **无旋转**（之前的 `animate-spin-slow` 已移除，避免视觉晕眩）
- **内层**: 黑色背景 + 彩色首字母

```jsx
// 标准用户头像图标示例
<div className="relative">
  {/* 炫彩边框层（不旋转） */}
  <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-75 blur-[2px]"></div>
  {/* 黑色剪影层 */}
  <div className="relative w-7 h-7 bg-black rounded-lg flex items-center justify-center">
    <span className="text-blue-400 font-bold text-xs">
      {userName.charAt(0)}
    </span>
  </div>
</div>
```

**变体**：
- **星星图标**: 渐变用 `from-amber-400 via-orange-500 to-pink-500`（金→橙→粉），**保留旋转**
- **圆形头像**: `rounded-full` 替代 `rounded-lg`
- **不同尺寸**: 调整 `w-7 h-7` 和字体大小

#### 9. 音频播放器 - 透明炫彩风格（2025-12-05 更新）

**组件**: `components/courses/AudioPlayer.tsx`（客户端组件，带调试日志）

**设计规范**:
- **外层容器**: `audio-section-wrapper`（悬停显示炫彩边框，`::after` 伪元素 + `mask-composite: exclude`）
- **内层容器**: `audio-section-inner`（纯黑背景 `#000`，隔绝外部颜色）
- **悬停效果**: **只有边框炫彩**，内部保持纯黑，不要有彩色光晕渗透
- **进度条**: 三色渐变（粉→紫→青）`from-pink-500 via-purple-500 to-cyan-500`
- **播放按钮**: 圆形 `bg-white/10 hover:bg-white/20`，加载时显示旋转动画

**关键 CSS**:
```css
.audio-section-wrapper::after {
  z-index: 10;  /* 确保边框在内容之上 */
  /* mask-composite: exclude 只显示边框 */
}
.audio-section-inner {
  background: #000;  /* 纯黑背景，完全隔绝外部颜色 */
  z-index: 1;
}
```

**使用方式**:
```tsx
import { AudioPlayer } from '@/components/courses/AudioPlayer'

// 在课程页面中
<AudioPlayer src={resource.url} title={resource.title} />
```

**注意事项**:
- 直接在 `<audio>` 元素上设置 `src` 属性，不要用 `<source>` 子元素
- 组件包含详细的控制台调试日志（`[AudioPlayer]` 前缀）
- 显示错误信息和音频 URL 方便诊断问题

#### 10. 登录界面 - 炫彩统一风格（2025-12-06 更新）

**两个登录入口**：
- `app/login/page.tsx` - 独立登录页面（直接访问 /login）
- `components/AuthModal.tsx` - 登录弹窗（从首页点击登录按钮）

**设计规范**：

**标题区域**（与首页"第一季：声音的交响"风格统一）：
```tsx
<h2 className="font-sacred text-2xl md:text-3xl text-white tracking-wide mb-3">
  欢迎回来
</h2>
<p className="text-starlight-dim text-sm">
  登录以继续你的意识觉醒之旅
</p>
```

**输入框**：
```tsx
className="w-full bg-white/5 border border-amber-500/30 rounded-xl py-3 pl-12 pr-4
  text-white placeholder-white/40
  focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40
  focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]
  transition-all backdrop-blur-sm"
```

**输入框图标**：
```tsx
<Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 z-10" />
```

**按钮**：使用 `btn-stardust w-full py-3`

**切换链接**（登录/注册）：
```tsx
className="text-sm text-transparent bg-clip-text bg-gradient-to-r
  from-amber-400 via-purple-400 to-cyan-400
  hover:from-amber-300 hover:via-purple-300 hover:to-cyan-300
  transition-all font-medium"
```

**图标颜色**：`text-purple-400`

**❌ 禁止**：
- 不要添加顶部星星图标（已移除）
- 不要使用 `bg-cosmic-800/50` 等旧样式
- 不要使用 `bg-gradient-cosmic` 按钮样式

---

## AI 聊天系统架构

### 统一的 AI 聊天系统 (2025-12-03 重构)

| 系统 | 用途 | 组件 | API 路由 |
|------|------|------|---------|
| **探索者联盟 AIP** | 项目协作 | `FloatingChatBot` | `/api/aip/chat` |
| **盖亚对话** | 个人成长 | `GlobalGaiaV3` | `/api/gaia/chat` |

> **重要**：`GaiaDialog` 和 `/api/n8n/chat` 已于 2025-12-03 删除，全站统一使用 `GlobalGaiaV3`。
> - `GlobalGaiaV3` 通过 `app/layout.tsx` → `DynamicGaiaWrapper` 全局加载
> - 首页和其他页面通过 `window.dispatchEvent(new CustomEvent('openGaia'))` 触发打开

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
| **Rerank** | ⏳ 待实现 | N8N Cohere Reranker 节点 | 见下方实现指南 |
| **流式输出** | ⚠️ 伪流式 | 前端打字机效果 | 见下方真流式方案 |

---

## Rerank 实现指南（2025-12-03 调研）

> **参考文档**：
> - [n8n Reranker Cohere 节点文档](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.rerankercohere/)
> - [n8n Blog: 在 AI 工作流中实现 Rerankers](https://blog.n8n.io/implementing-rerankers-in-your-ai-workflows/)
> - [社区：终极 RAG 架构（含 Reranking）](https://community.n8n.io/t/building-the-ultimate-rag-setup-with-contextual-summaries-sparse-vectors-and-reranking/54861)

### 什么是 Rerank？

Reranker 提供检索的**第二遍处理**：向量搜索返回候选文档后，Reranker 基于**语义相关性**重新计算评分并排序，将最相关的文档排在前面。

### 在 N8N 中添加 Rerank 的位置

```
hybrid_search 返回 8-10 条候选文档
         ↓
   Cohere Reranker（重新排序，取 Top 3-5）
         ↓
      整合上下文
         ↓
      LLM 生成回复
```

### 两种实现方式

**方式 1：使用 n8n 原生 Reranker Cohere 节点（推荐）**
- 需要 n8n **1.98+** 版本
- 在 Vector Store Retriever 子节点中添加 Reranker
- 自动与 LangChain 生态集成

**方式 2：使用 HTTP Request 节点直接调用 Cohere API**
```javascript
// 在"合并搜索结果"之后添加 HTTP Request 节点
POST https://api.cohere.ai/v1/rerank
{
  "model": "rerank-english-v3.0",  // 或 rerank-multilingual-v3.0（支持中文）
  "query": "{{ $json.query }}",
  "documents": {{ $json.search_results }},
  "top_n": 5
}
```

### 对性能的影响

| 操作 | 耗时 | 说明 |
|-----|------|------|
| Cohere Rerank API | 100-300ms | 取决于文档数量 |
| 总体增加 | 约 10-15% | 相比不加 Rerank |

**建议**：先在 AIP 工作流测试，效果好再推广到盖亚。

---

## 真正的流式输出实现指南（2025-12-03 深度调研）

> **重要发现**：n8n **原生不支持**真正的流式输出！
>
> 参考文档：
> - [社区讨论：功能请求状态](https://community.n8n.io/t/stream-ai-responses-on-http-responses-llm-chains-and-ai-agents-nodes/52084) - 虽标注 "GOT CREATED" 但实际**未实现**
> - [真流式解决方案（使用 Supabase）](https://demodomain.dev/2025/06/13/finally-real-llm-streaming-with-n8n-heres-how-with-a-little-help-from-supabase/)
> - [AI Agent vs Basic LLM Chain 对比](https://docs.n8n.io/advanced-ai/examples/agent-chain-comparison/)

### ⚠️ 关键事实（已更正）

1. **Basic LLM Chain 不支持流式** - 等待完整响应后才传递
2. **AI Agent 支持流式！** - 需要 n8n **1.106.3+** 版本
3. **配置要求**：Webhook `Response Mode = Streaming` + AI Agent 默认启用

参考：[AI Agent 流式教程](https://community.n8n.io/t/ai-agent-streaming-tutorial-complete-guide-workflows-scripts-included/167369)

### 当前状态：伪流式（推荐保持）

```
N8N 等待 LLM 完整响应 → 一次性返回 → 前端 50ms 打字机效果
```

| 指标 | 值 |
|-----|-----|
| 首字延迟 | 4-8 秒 |
| 优点 | 简单、稳定、聊天记录保存正常 |
| 用户体验 | 等待 → 快速打字机显示 |

### 真流式方案：Supabase Edge Functions（复杂度高）

如果必须要真流式（首字延迟 0.5-1 秒），需要借助外部服务：

```
┌─────────────────────────────────────────────────────────────┐
│ 方案架构                                                      │
├─────────────────────────────────────────────────────────────┤
│ UI → n8n(业务逻辑/RAG) → Supabase Edge Function → LLM API   │
│                                    ↓                        │
│                         流式写入数据库表                      │
│                                    ↓                        │
│ UI ← Supabase Realtime 订阅 ← 数据库表                       │
└─────────────────────────────────────────────────────────────┘
```

**实现步骤**：
1. n8n 处理业务逻辑（RAG 检索、用户画像等）
2. 调用 Supabase Edge Function（传递上下文 + prompt）
3. Edge Function 直接调用 LLM API 并**流式写入**数据库表
4. 前端订阅 Supabase Realtime，实时渲染

**所需组件**：
- Supabase Edge Functions（Deno 运行时）
- Supabase Realtime（实时数据推送）
- 自定义前端逻辑（订阅 + 渲染）

**代价**：
- 架构复杂度大幅增加
- 需要维护 Edge Functions 代码
- 调试难度增加

### 结论与建议

| 方案 | 首字延迟 | 复杂度 | 建议 |
|-----|---------|-------|------|
| **伪流式（当前）** | 4-8 秒 | 低 | ✅ 推荐保持 |
| 真流式（Supabase） | 0.5-1 秒 | 高 | ⚠️ 仅在体验要求极高时考虑 |
| 改回 AI Agent | 更慢 | 中 | ❌ 不推荐（响应 13 秒 vs 2.5 秒）|

---

## 分支开发环境指南（2025-12-03）

### 1. Git 代码分支（已创建）

```bash
# 已创建 worktree 分支
git worktree add ../futuremind-streaming-rerank -b feature/streaming-rerank

# 分支目录：D:\CursorWork\FutureMindInstitute\futuremind-streaming-rerank
```

### 2. N8N 工作流分支

N8N **没有原生分支功能**，推荐做法：

**方法 A：复制工作流（推荐）**
1. 在 N8N 中复制现有工作流
2. 重命名为 `[测试] 盖亚聊天 - AI Agent 流式`
3. 修改 Webhook URL（自动生成新的）
4. 在代码分支中使用新的 Webhook URL

**方法 B：使用 Source Control**
- N8N 支持 Git 集成（Source Control 功能）
- 可将工作流导出为 JSON，提交到 Git 分支

参考：[n8n 工作流版本控制最佳实践](https://ones.com/blog/mastering-n8n-workflow-version-control-best-practices/)

### 3. Supabase 数据库分支

> **Supabase Branching 2.0**：可直接从 Dashboard 创建，无需 Git！
>
> 参考：[Supabase Branching 官方文档](https://supabase.com/docs/guides/deployment/branching)

**创建步骤**：
1. 登录 Supabase Dashboard
2. 点击右上角用户图标 → 启用 "Branching via dashboard"
3. 点击顶部项目名称旁的箭头 → "Create branch"
4. 分支会有**独立的 API 凭证**（Project URL + Anon Key）

**在代码分支中使用**：
```env
# .env.local（futuremind-streaming-rerank 目录）
NEXT_PUBLIC_SUPABASE_URL=https://xxx-branch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...（分支的 key）
```

**限制**：
- 目前是 Public Alpha 状态
- 分支只能合并到 main，不能合并到其他分支
- 新分支不会复制生产数据（保护隐私）

### 4. 完整的分支开发流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Git 分支                                                  │
│    futuremind-streaming-rerank/                              │
│    - 修改前端代码适配流式                                      │
│    - 修改 API 路由处理 SSE                                    │
├─────────────────────────────────────────────────────────────┤
│ 2. N8N 测试工作流                                            │
│    [测试] 盖亚聊天 - AI Agent 流式                            │
│    - 复制原工作流                                             │
│    - 改用 AI Agent 节点                                       │
│    - 配置 Webhook Response Mode = Streaming                  │
│    - 添加 Cohere Reranker                                    │
├─────────────────────────────────────────────────────────────┤
│ 3. Supabase 分支                                             │
│    develop-streaming                                         │
│    - 测试数据隔离                                             │
│    - 独立 API 凭证                                           │
└─────────────────────────────────────────────────────────────┘
```

### 5. AI Agent 流式 + Rerank 改造要点

**N8N 工作流修改**：
```
Webhook (Response Mode = Streaming)
    ↓
Edit Fields
    ↓
并行：Embeddings + 用户画像 + 聊天记录
    ↓
hybrid_search_gaia
    ↓
🆕 Cohere Reranker（HTTP Request）
    ↓
整合上下文
    ↓
🆕 AI Agent（替代 Basic LLM Chain，支持流式）
    ↓
Respond to Webhook (enableStreaming: true)
```

**前端修改**：
- 处理真正的 SSE（Server-Sent Events）流
- 替换当前的伪打字机效果

---

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

1. **✅ 盖亚聊天系统统一重构**
   - 问题：首页使用旧的 `GaiaDialog` 组件，其他页面使用 `GlobalGaiaV3`，两套系统不一致
   - 修复：删除 `GaiaDialog` 和 `/api/n8n/chat`，全站统一使用 `GlobalGaiaV3`
   - 删除文件：`components/GaiaDialog.tsx`、`app/api/n8n/chat/route.ts`
   - 修改文件：`app/page.tsx`、`components/pbl/MainDashboard.tsx`
   - 添加事件：`GlobalGaiaV3` 监听 `openGaia` 事件，支持外部触发打开

2. **✅ 盖亚聊天 UI 修复**
   - 问题 1：错误时一直转圈
   - 修复：显示实际错误信息（`❌ ${errorMessage}`），停止加载状态
   - 问题 2：多余盖亚图标出现
   - 修复：过滤空的 assistant 消息（当 isLoading 为 false 时）
   - 问题 3：输入框清除延迟 2 秒
   - 修复：使用 `flushSync` 强制同步清除输入框
   - 问题 4：打字机效果速度不一致
   - 修复：统一为 50ms 间隔（与探索者联盟一致）

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

5. **✅ 组织管理功能 (2025-12-03)**
   - 新增：校长（principal）可以创建新组织，设置公开/私有可见性
   - 新增：组织所有者可以编辑和删除自己创建的组织
   - 保护：系统组织（社区项目、我的项目、系统）不可编辑/删除
   - 删除组织前需先删除该组织下的所有项目
   - **涉及文件**：
     - `app/api/aip/create-organization/route.ts` - 创建组织 API（使用 service role）
     - `app/api/aip/organization/[id]/route.ts` - 组织 CRUD API
     - `lib/aip/api.ts` - 添加 `updateOrganization`、`deleteOrganization` 函数
     - `components/aip/OrganizationList.tsx` - 添加编辑/删除按钮
     - `components/aip/EditOrganizationModal.tsx` - 编辑组织弹窗
     - `components/aip/CreateOrganizationModal.tsx` - UI 优化（玻璃效果、开关颜色统一）

6. **✅ 作业可见性逻辑和 UI 修复 (2025-12-03)**
   - **问题 1**：用户选择"公开"但分数<90，系统显示"私密"，应该保持显示"公开"
   - **修复**：始终显示用户的选择，分数不足时显示提示"(分数未达90，暂不展示)"
   - **问题 2**：开关组件关闭态使用 `bg-gray-600`，不符合玻璃透明设计规范
   - **修复**：统一改为 `bg-white/20`（关闭态）、`bg-emerald-500`（开启态）
   - **涉及文件**：
     - `app/courses/[system_key]/[content_id]/SubmissionDialog.tsx`
     - `app/courses/[system_key]/[content_id]/SubmissionHistory.tsx`
     - `components/courses/EarthContentDetail.tsx`
     - `components/courses/PBLProjectDetail.tsx`

7. **✅ 伊卡洛斯项目进度条不更新 (2025-12-04)**
   - **问题**：提交作业后显示"已完成"，但进度条始终为 0%
   - **原因**：
     - 数据库中旧数据的 `progress` 字段存储布尔值 `true`，而非分数
     - 前端代码只检查 `typeof score === 'number'`，忽略了布尔值
     - 导致"已完成"标签显示正常（`true > 0` 为真），但进度计算为 0%
   - **修复**：
     - 前端进度计算逻辑现在同时支持布尔值和数字两种格式
     - 布尔值 `true` 视为默认分数 80 进行计算
     - 数据库旧数据通过 SQL 更新为实际分数
   - **涉及文件**：`components/courses/PBLProjectDetail.tsx`
   - **数据库修复**：`user_selected_projects.progress` 中的布尔值已转换为数字

8. **✅ 伊卡洛斯项目多项 UI 和功能优化 (2025-12-04)**
   - **问题 1**：提交对话框按钮未使用 `btn-stardust` 风格
   - **修复**：统一使用 `btn-stardust`，移除渐变背景
   - **问题 2**：公开/私密状态在分数<90时未正确显示
   - **修复**：始终显示用户选择，分数不足时显示"(分数未达90，暂不展示)"
   - **问题 3**：删除所有提交记录后，按钮仍显示"再次提交"
   - **修复**：删除最后一条记录时同时清除 `userProgress` 中的对应条目
   - **问题 4**：AI 评语缺少改进建议
   - **修复**：边缘函数 prompt 添加 `suggestions` 字段，分数<90时给出具体可操作建议
   - **问题 5**：上传等待时间约 20 秒但无提示
   - **修复**：添加"请耐心等待，不要关闭对话框，大约需要 30 秒左右"提示
   - **涉及文件**：
     - `components/courses/PBLProjectDetail.tsx` - 按钮样式、可见性逻辑、等待提示
     - `supabase/functions/evaluate-pbl-task/index.ts` - AI 改进建议
     - `app/api/pbl/clear-day-progress/route.ts` - 新增清除进度 API
   - **✅ 边缘函数已部署**（如需重新部署：`npx supabase functions deploy evaluate-pbl-task --no-verify-jwt`）

9. **✅ 伊卡洛斯项目 UI 优化续 (2025-12-04)**
   - **问题 1**："查看详情"按钮未使用 `btn-stardust` 炫彩样式
   - **修复**：所有操作按钮统一使用 `btn-stardust`
   - **问题 2**：删除确认框使用原生 `confirm()`，样式丑陋
   - **修复**：改用自定义 `ConfirmDialog` 组件，居中显示美观对话框
   - **问题 3**：提交90分作业后"优秀作业"列表未刷新
   - **修复**：提交成功且分数>=90时触发 `publicSubmissionsRefreshKey` 更新
   - **问题 4**：用户选择公开但显示私密
   - **调查**：数据库显示 `is_public=false`，添加调试日志追踪
   - **日志位置**：前端 `handleSubmitTask` + 边缘函数 `evaluate-pbl-task`
   - **涉及文件**：
     - `components/courses/PBLProjectDetail.tsx`
     - `supabase/functions/evaluate-pbl-task/index.ts`

10. **✅ 优秀作业展示和开关组件优化 (2025-12-04)**
    - **问题 1**：优秀作业展示尺寸过大，应显示4列
    - **修复**：改为 `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`，缩小卡片尺寸
    - **问题 2**：星星图标和用户头像需要炫彩边框
    - **修复**：星星图标添加琥珀色渐变旋转边框，用户头像添加蓝紫粉渐变边框 + 蓝色首字母
    - **问题 3**：删除优秀作业后列表不刷新
    - **修复**：`handleDeleteSubmission` 检测被删除作业是否公开，若是则触发 `publicSubmissionsRefreshKey`
    - **问题 4**：90分作业的开关不显示
    - **修复**：开关始终显示，分数<90时禁用（`disabled`），鼠标悬停显示提示
    - **问题 5**：AI 改进建议不明确
    - **修复**：优化边缘函数提示词，提供更具体的 JSON 示例
    - **新增动画**：`globals.css` 添加 `.animate-spin-slow`（4秒旋转）
    - **涉及文件**：
      - `components/courses/PublicSubmissions.tsx` - 尺寸缩小、炫彩边框
      - `components/courses/PBLProjectDetail.tsx` - 删除同步刷新、开关始终显示
      - `app/courses/[system_key]/[content_id]/SubmissionHistory.tsx` - 开关始终显示
      - `supabase/functions/evaluate-pbl-task/index.ts` - 优化 AI 提示词
      - `app/globals.css` - 添加 `animate-spin-slow` 动画

11. **✅ 意识树和音频播放器 UI 修复 (2025-12-04)**
    - **问题 1**：Portal 意识树预览只显示部分树，不是完整缩略图
    - **修复**：`ConsciousnessTreeCanvas` 预览模式使用 600x600 虚拟尺寸 + CSS 缩放显示完整树
    - **问题 2**：点击"查看完整意识树"时先显示种子，再加载真实数据
    - **修复**：添加 `useConsciousnessTreeCache` 缓存机制，登录时预加载，详情页优先显示缓存
    - **问题 3**：聆听课程音频播放器背景白色/浅色，点不动，不美观
    - **修复**：
      - `audio-player-custom` 重写样式：透明背景 + 炫彩渐变进度条 + 发光效果
      - `audio-section-inner` 改为透明玻璃效果（`bg-white/3 backdrop-blur`）
    - **涉及文件**：
      - `components/consciousness/ConsciousnessTreeCanvas.tsx` - 预览缩放逻辑
      - `components/consciousness/ConsciousnessTreeView.tsx` - 缓存优先加载
      - `lib/hooks/useConsciousnessTreeCache.ts` - 新增意识树数据缓存 hook
      - `app/globals.css` - 音频播放器透明炫彩样式

12. **✅ 意识树居中 + 音频播放器完善 + 管理后台宽度 (2025-12-05)**
    - **问题 1**：意识树详情页树偏右，未居中显示
    - **修复**：`ConsciousnessTreeCanvas` 使用 flexbox 居中（`display: flex; align-items: center; justify-content: center`）
    - **问题 2**：音频播放器悬停时内部有彩色光晕，应只有边框炫彩
    - **修复**：
      - 移除 `::before` 外发光效果
      - `::after` 添加 `z-index: 10` 确保边框在内容之上
      - `audio-section-inner` 使用纯黑背景 `#000` 隔绝颜色渗透
    - **问题 3**：音频播放报错 `MEDIA_ERR_SRC_NOT_SUPPORTED`
    - **修复**：直接在 `<audio>` 元素设置 `src` 属性，不用 `<source>` 子元素
    - **问题 4**：管理后台内容区域太窄
    - **修复**：移除 `max-w-4xl` 限制，改为 `w-full max-w-none`，输入框添加 `w-full`
    - **涉及文件**：
      - `components/consciousness/ConsciousnessTreeCanvas.tsx` - 居中布局
      - `components/consciousness/ConsciousnessTreeClient.tsx` - 缓存支持
      - `components/courses/AudioPlayer.tsx` - 新客户端组件
      - `app/admin/courses/listening/page.tsx` - 宽度修复
      - `app/globals.css` - 炫彩边框 CSS 优化

13. **✅ AI批改改进建议优化 (2025-12-05)**
    - **需求**：所有分数段的作业都需要改进建议，不同分数用不同话术
    - **设计**：五档话术体系（0-30 / 30-60 / 60-80 / 80-90 / 90-100）
    - **核心原则**：
      - 每次回复要有变化，像真人老师一样自然亲切
      - 高分用户给予肯定+进阶挑战
      - 低分用户给予理解+清晰指引
    - **修改文件**：
      - `supabase/functions/evaluate-submission/index.ts` - 聆听课程（冥想内省类话术）
      - `supabase/functions/evaluate-pbl-task/index.ts` - 地球小探险家+伊卡洛斯项目（探究实践类话术）
      - `app/courses/[system_key]/[content_id]/SubmissionDialog.tsx` - 聆听课程等待提示
      - `components/courses/EarthContentDetail.tsx` - 地球课程等待提示
    - **部署命令**：
      ```bash
      npx supabase functions deploy evaluate-submission --no-verify-jwt
      npx supabase functions deploy evaluate-pbl-task --no-verify-jwt
      ```

14. **✅ 个人资料可见性系统 (2025-12-05)**
    - **需求**：实现双开关隐私控制系统
    - **数据库变更**：`profiles` 表添加 `profile_public` 字段（boolean，默认 false）
    - **两个开关**：
      - **公开个人资料**：开启后，其他人点击头像可查看资料
      - **愿意被邀请参与项目**：开启后，在邀请列表可见且资料可被查看
    - **基本资料可见性规则**：
      - **姓名**：公开显示（其他用户可见）
      - **邮箱、年龄、性别**：仅自己可见，不会公开
      - **扩展资料（职业、爱好、简介）**：根据隐私设置决定是否公开
    - **可见性逻辑矩阵**：
      | 公开资料 | 愿意参与项目 | 平时点头像 | 邀请成员时 |
      |---------|-------------|-----------|----------|
      | ✅ 开启 | ✅ 开启 | ✅ 看到资料 | ✅ 出现+看到资料 |
      | ✅ 开启 | ❌ 关闭 | ✅ 看到资料 | ❌ 不出现 |
      | ❌ 关闭 | ✅ 开启 | ❌ 提示不公开 | ✅ 出现+看到资料 |
      | ❌ 关闭 | ❌ 关闭 | ❌ 提示不公开 | ❌ 不出现 |
    - **新增组件**：
      - `components/ViewProfileModal.tsx` - 查看他人资料弹窗（支持 `isInviteContext` 参数）
    - **修改文件**：
      - `components/UserProfileModal.tsx` - 添加公开资料开关+修改提示文案+可见性说明
      - `components/courses/PublicSubmissions.tsx` - 点击头像/用户名查看资料
      - `components/aip/InviteModal.tsx` - 使用 ViewProfileModal（邀请场景）
      - `app/api/submissions/public/route.ts` - 返回 studentId 字段
    - **迁移文件**：`add_profile_public_field`

15. **✅ 全局下拉框样式修复 (2025-12-05)**
    - **问题 1**：下拉框选项背景白色，文字看不见
    - **修复**：`globals.css` 添加全局 select/option 样式（zinc-900 背景）
    - **问题 2**：下拉框点击行为异常（鼠标移开就收回）
    - **修复**：使用 `appearance-none` + 自定义下拉箭头 SVG
    - **涉及文件**：
      - `app/globals.css` - 全局下拉框样式
      - `components/UserProfileModal.tsx` - 性别下拉框样式优化

16. **✅ 基本信息可见性开关 (2025-12-05)**
    - **需求**：邮箱、年龄、性别支持独立的可见性开关，用户可自主选择是否公开
    - **数据库变更**：`profiles` 表添加三个字段
      - `email_public` (boolean, 默认 false)
      - `age_public` (boolean, 默认 false)
      - `gender_public` (boolean, 默认 false)
    - **UI 设计**：
      - 每个字段右侧显示小型开关（h-5 w-9）
      - 开关旁显示状态标签（公开/私密）
      - 关闭态：`bg-white/20`，开启态：`bg-emerald-500`
    - **ViewProfileModal 显示逻辑**：
      - 只显示用户设置为公开的字段
      - 邮箱：蓝色邮件图标 + 完整邮箱
      - 年龄：绿色日历图标 + "XX 岁"
      - 性别：粉色用户图标 + 男/女/其他
    - **涉及文件**：
      - `components/UserProfileModal.tsx` - 添加三个可见性开关 UI + 保存逻辑
      - `components/ViewProfileModal.tsx` - 根据可见性设置条件显示基本信息
    - **迁移文件**：`add_profile_visibility_fields`

17. **✅ 用户头像移除旋转动画 (2025-12-05)**
    - **需求**：用户头像炫彩边框不需要旋转，转圈太晕，只保留星星图标旋转
    - **修复**：移除用户头像的 `animate-spin-slow` 类，保留静态炫彩边框
    - **涉及文件**：
      - `components/courses/PublicSubmissions.tsx` - 两处用户头像移除旋转
      - `components/ViewProfileModal.tsx` - 查看资料弹窗头像移除旋转

18. **✅ 登录页面 UI 优化 (2025-12-05)**
    - **问题 1**：顶部星星图标丑陋，使用了错误的 TreePine 图标
    - **修复**：改用 Sparkles 图标 + 炫彩边框效果
    - **问题 2**：输入框、按钮样式不符合宇宙主题
    - **修复**：
      - `.input-ethereal` 更新为深色玻璃效果（`rgba(255, 255, 255, 0.05)`）
      - 统一标签颜色为 `text-gray-300`
      - 按钮使用 `btn-stardust` 样式
    - **涉及文件**：
      - `app/login/page.tsx` - 图标、标签、按钮样式
      - `app/globals.css` - `.input-ethereal` 类优化

19. **✅ 优秀作业刷新机制统一优化 (2025-12-05)**
    - **问题**：删除/新增 90 分以上作业后，优秀作业展示未即时刷新
    - **设计**：全部课程统一使用**局部刷新**机制（`publicSubmissionsRefreshKey` 状态变量）
    - **刷新触发条件**：
      1. 删除公开且分数 >= 90 的作业
      2. 新增公开且分数 >= 90 的作业
    - **各课程刷新机制**：
      | 课程类型 | 组件文件 | 刷新方式 |
      |---------|---------|---------|
      | 聆听课程 | `SubmissionButton.tsx` + `SubmissionDialog.tsx` + `SubmissionHistory.tsx` | 局部刷新 |
      | 地球课程 | `EarthContentDetail.tsx` | 局部刷新 |
      | 伊卡洛斯项目 | `PBLProjectDetail.tsx` | 局部刷新 |
    - **回调传递模式**：
      - `onSuccess(score, isPublic)` - 新增作业时传递分数和公开状态
      - `onVisibilityChanged()` - 删除作业时触发刷新
    - **涉及文件**：
      - `app/courses/[system_key]/[content_id]/SubmissionButton.tsx` - handleSuccess 接收 score 和 isPublic
      - `app/courses/[system_key]/[content_id]/SubmissionDialog.tsx` - onSuccess 传递分数和公开状态
      - `app/courses/[system_key]/[content_id]/SubmissionHistory.tsx` - 删除时触发刷新
      - `components/courses/EarthContentDetail.tsx` - 删除和新增时触发刷新

20. **✅ 原生对话框替换为自定义 UI + 消息盒子优化 (2025-12-06)**
    - **问题 1**：申请加入项目使用原生 `prompt()` 对话框，样式丑陋
    - **修复**：创建 `PromptDialog` 组件，替换所有原生 prompt 调用
    - **问题 2**：消息盒子未读数不即时更新（需等待数秒）
    - **修复**：
      - `useUnreadCount` 添加全局事件机制 `triggerUnreadCountRefresh()`
      - `InteractionLog` 操作后触发事件立即刷新未读数
    - **问题 3**：Portal 页面无法访问消息盒子
    - **修复**：
      - 用户头像添加红色小铃铛（有未读时显示）
      - 下拉菜单添加"消息盒子"入口，显示未读数量徽章
      - 点击打开与探索者联盟相同的 InteractionLog 弹窗
    - **新增组件**：
      - `components/ui/PromptDialog.tsx` - 文本输入对话框（支持单行/多行）
    - **涉及文件**：
      - `lib/aip/useUnreadCount.ts` - 添加 `triggerUnreadCountRefresh()` 函数和事件监听
      - `components/aip/InteractionLog.tsx` - 使用 triggerUnreadCountRefresh 替换 onUnreadCountChange
      - `app/explorer-alliance/organizations/[organizationId]/page.tsx` - 使用 PromptDialog
      - `components/portal/PortalClient.tsx` - 添加消息盒子入口和红色铃铛
    - **消息盒子功能同步**：Portal 和探索者联盟的消息盒子完全同步，共享同一个通知系统
    - **快捷操作按钮**（2025-12-06 补充）：
      - 邀请/申请/审核类通知在卡片上直接显示"接受/拒绝"按钮
      - 无需展开即可快速响应
      - 按钮显示条件：通知状态为待处理（unread/pending）
    - **首页消息盒子**（2025-12-06 补充）：
      - 首页使用独立的用户菜单代码（非 UnifiedNavbar）
      - 已同步添加消息盒子入口和红色铃铛
      - 涉及文件：`app/page.tsx`
    - **原生 alert 替换为 Toast**（2025-12-06 补充）：
      - 问题：提交申请后显示原生浏览器 alert 对话框
      - 修复：使用已有的 `Toast` 组件替换所有 `alert()` 调用
      - 涉及文件：
        - `app/explorer-alliance/organizations/[organizationId]/page.tsx`
        - `components/aip/InteractionLog.tsx`
      - Toast 类型：success（绿色）、error（红色）、warning（黄色）、info（蓝色）

### AI批改话术设计规范

#### 聆听课程（冥想内省类）

| 分数段 | 风格 | 示例 |
|-------|------|------|
| **90-100** | 充分肯定 + 深化练习 | "你的觉察力让我印象深刻！接下来可以试试在日常中保持这份觉知..." |
| **80-89** | 赞赏深度 + 细化体验 | "这份反思很有深度。如果能再描述一下身体的感受..." |
| **60-79** | 鼓励连接 + 练习方向 | "你正在建立与内在的连接！下次可以试着..." |
| **30-59** | 理解过程 + 降低压力 | "冥想需要慢慢适应，别着急。建议找个安静的时刻重新听一遍..." |
| **0-29** | 温和引导 + 强调真诚 | "别担心，找个安静的时间，写下一句真实感受就好..." |

#### 探究实践类（地球小探险家 + 伊卡洛斯）

| 分数段 | 风格 | 示例 |
|-------|------|------|
| **90-100** | 肯定探究 + 延伸探索 | "你的观察力让我惊喜！可以试试把发现和其他现象联系起来..." |
| **80-89** | 赞赏观察 + 深化分析 | "很棒的探究！如果能补充更多细节或从不同角度分析..." |
| **60-79** | 鼓励好奇 + 探究方法 | "你迈出了第一步！下次可以多问几个为什么，动手试一试..." |
| **30-59** | 理解困难 + 具体步骤 | "探究需要一点耐心。建议先看看项目要求，从一个小问题开始..." |
| **0-29** | 温和鼓励 + 降低门槛 | "别担心，选一个感兴趣的角度，观察一下、写下来就好..." |

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

### 组织管理权限优化 (2025-12-03)

**需求**：只有校长可以创建组织，并可设置组织是否公开可见

**数据库变更**：
- 添加 `organizations.is_public` 字段（boolean，默认 false）
- 修改 INSERT RLS 策略：只有 `principal` 可以创建（移除 `teacher`）
- 修改 SELECT RLS 策略：可查看公开组织 OR 自己所属的组织

**组织可见性**：
| 组织名 | is_public | 说明 |
|-------|-----------|------|
| 社区项目 | ✅ true | 所有人可见 |
| 我的项目 | ❌ false | 仅成员可见 |
| 系统 | ❌ false | 仅管理员可见（盖亚知识库等） |

**前端变更**：
- `CreateOrganizationModal.tsx` 添加"公开可见"开关
- `lib/aip/api.ts` 权限检查改为仅 `principal`
- `lib/aip/types.ts` 添加 `is_public?: boolean`

**迁移文件**：`organization_visibility_and_rls`

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
