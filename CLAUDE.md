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

### 盖亚对话重构（进行中）

**核心设计决策**：
- 盖亚知识库不按课程区分，使用专属全局 project_id
- 环境变量：`GAIA_KB_PROJECT_ID`（固定 UUID）
- 复用 `hybrid_search` RPC 函数 + 父子结构检索

**重构步骤**：
- [x] 分析现有架构和数据库结构
- [ ] 创建盖亚专属 project_id 并更新环境变量
- [ ] 修改前端知识库管理界面（移除课程选择）
- [ ] 修改后端 API 使用固定 project_id
- [ ] 创建 `hybrid_search_gaia` 函数（支持父子结构）
- [ ] 重构 N8N 盖亚聊天工作流（并行 + Basic LLM Chain）
- [ ] 重构 N8N 上传文档工作流（父子结构分块）
- [ ] 测试验证并清理旧数据、重新上传

**N8N 盖亚聊天工作流新架构**：
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

### AIP 聊天 - 最近完成 (2024-12-02)
- [x] 修复 `hybrid_search` 函数空字符串问题（UUID 类型不接受空字符串）
- [x] N8N 添加 `项目智慧库`、`组织智慧库` Postgres 节点（5路输入）
- [x] 清理污染的聊天历史（candy 项目 + 无知识库项目）
- [x] API 添加项目信息传递（`project_name`、`project_description`）

### AIP 聊天 - 待完成
- [ ] N8N `1-Parse-Input-Parameters` 添加 `project_name`、`project_description` 解析
- [ ] N8N Prompt 优化：添加项目上下文，禁止编造内容

### 性能优化
- [ ] 检查 N8N Streaming 配置
- [ ] 考虑切换 AI 模型（通义千问 OpenAI 兼容接口）

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
- `hybrid_search` - 混合搜索（支持多项目 ID、区分项目/组织文档）

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
