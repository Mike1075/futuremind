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
- **关键 CSS 类**: `btn-stardust`、`portal-card-wrapper`、`gaia-icon`、`card-glass`

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
| **项目知识库** | 用户上传文档 | `document_chunks` | ✅ 已实现 |
| **组织知识库** | 管理员上传 | `document_chunks (project_id=NULL)` | ⏳ 架构已有 |
| **项目智慧库** | 聊天 AI 提取 | `documents (title='项目智慧库')` | ✅ 测试通过 |
| **组织智慧库** | 智慧聚合 | `documents (title='组织智慧库')` | ⏳ 待触发 |

### 智慧沉淀系统

**核心概念**：
- 从聊天记录提取高质量 Q&A（质量分数 >= 80）
- 智慧库是**补充知识来源**，不是缓存快答
- 边缘函数：`project-wisdom-accumulation`、`organization-wisdom-accumulation`

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
- [x] 完整流程验证通过
- [ ] **进行中**：后端 API 存入文件内容到 documents.content
- [ ] N8N 工作流添加 parent_document_id 到 metadata
- [ ] hybrid_search_gaia 支持返回父文档内容
- [ ] 添加 Rerank 重排序
- [ ] 重构 N8N 盖亚聊天工作流（并行 + Basic LLM Chain + 聊天记录）

**N8N 盖亚聊天工作流新架构**（待实现）：
```
Webhook (streaming)
    ↓
Edit Fields
    ↓
┌─────────────────────────────────┐
│       并行执行 (3路)             │
├───────────┬───────────┬─────────┤
│ Embeddings│ 用户名    │ 用户画像│
│ (HTTP Req)│ (Postgres)│(Postgres)│
└───────────┴───────────┴─────────┘
    ↓
HTTP Request → hybrid_search_gaia
    ↓
Code (整合上下文)
    ↓
Basic LLM Chain (快！)
    ↓
Respond to Webhook
```

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
- `document_chunks` - 向量化文档块
- `documents` - 父文档 + 智慧库
- `student_summaries` - 用户画像
- `project_files` - 文件审核（review_status 字段）

## 关键 RPC 函数
- `hybrid_search` - AIP 混合搜索（支持多项目 ID、区分项目/组织文档）
- `hybrid_search_gaia` - 盖亚混合搜索（查询 document_chunks，用 project_id 过滤）

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
