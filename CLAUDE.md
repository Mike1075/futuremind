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
  ├── courses/         # 课程相关组件
  ├── portal/          # 门户组件
  ├── ui/              # 通用 UI 组件
  └── admin/           # 管理后台组件
lib/                   # 工具库和配置
supabase/              # Supabase 配置和迁移
types/                 # TypeScript 类型定义
```

## 课程体系
1. **地球课程 (Earth)** - 基础课程，PBL 项目制学习
2. **伊卡洛斯三角 (Icarus Triangle)** - 进阶课程
3. **倾听课程 (Listening)** - 14天音频课程，耳朵形状的学习地图
4. **盖亚对话 (Gaia Dialog)** - AI 对话系统

## 用户角色
- `student` - 学生
- `teacher` - 老师
- `principal` - 校长/管理员

## 设计风格
- **主题**: 宇宙/星空风格 (Cosmic theme)
- **背景**: `bg-cosmic-void` + 渐变覆盖层
- **动画**: 极光边框效果、星光闪烁、悬停动画
- **颜色**: 深紫色、金色、星光白

## 重要配置
- 环境变量在 `.env.local` 中配置
- Supabase 项目 ID 和 URL 在环境变量中
- AI API keys 需要配置

## 当前工作分支
- `master` - 主分支
- `feature/ui-ux-redesign` - UI/UX 重新设计分支（使用 git worktree）

## 最近完成的工作

### AIP 智慧沉淀系统 V2 (2024-11-29)
- [x] **事件驱动总结触发**：优化 `increment_message_counter` 触发器
  - 当用户消息数达到阈值（20条）时自动触发 `summarize-user-activity`
  - 使用 pg_net 异步调用，不阻塞主流程
- [x] **智慧存储统一到 documents 表**（与 N8N 工作流兼容）：
  - `title='项目智慧库'` - 项目级智慧（从聊天提取的 Q&A）
  - `title='组织智慧库'` - 组织级智慧（聚合后的总结）
  - N8N 聊天工作流可直接查询这些智慧
- [x] **边缘函数部署**（事件驱动，非定时）：
  - `project-wisdom-accumulation` - 项目聊天达30条消息时自动触发
  - `organization-wisdom-accumulation` - 项目智慧达10条时自动触发聚合
- [x] **数据库触发器**：
  - `increment_project_message_counter()` - 跟踪项目聊天消息，达阈值触发智慧提取
  - `trigger_organization_wisdom_aggregation()` - 项目智慧累积后触发组织智慧聚合
- [x] **辅助表**：
  - `project_message_counters` - 项目消息计数
  - `system_config` - 存储 service_role_key（替代 vault）

**关键设计**：
- 所有智慧存储在 `documents` 表，通过 `title` 字段区分类型
- 事件驱动而非定时任务，按实际用户活动触发
- N8N 工作流无需修改，可直接查询智慧库

### AIP 用户画像集成 (2024-11-29)
- [x] **API 层**：修改 `app/api/aip/chat/route.ts`
  - 并行查询 `student_summaries` 获取盖亚分析的用户画像
  - 查询 `profiles` 获取用户名
  - 传入 N8N：`student_profile`（画像文本）、`user_name`（用户名）
- [x] **N8N 工作流**：修改 `1-Parse-Input-Parameters` 节点
  - 解析新字段：`student_profile`、`user_name`、`chat_history_text`
- [x] **N8N Prompt**：修改 `6-Final-AI-Answer` 节点
  - 添加用户画像引用：`{{ $('1-Parse-Input-Parameters').item.json.student_profile }}`
  - 添加用户名引用：个性化称呼
- [x] **数据库触发器**：`trigger_aip_message_counter`
  - AIP 聊天每 10 条消息触发 `summarize-user-activity`
  - AIP 活动现在也能贡献到用户画像和意识树

**架构闭环**：
```
AIP 聊天 → chat_history 表 → 触发器(每10条) → summarize-user-activity
    ↓                                                    ↓
 N8N 读取 student_profile ← student_summaries 表 ← AI 更新用户画像
```

### 伊卡洛斯项目修复 (2024-11-29)
- [x] 修复周计划排序：第一周现在显示在最上面
  - 文件：`components/courses/PBLProjectDetail.tsx:673`
  - 修改：`.sort((a, b) => a.week - b.week)` 按周数升序排列

### UI 优化 (2024-11-29)
- [x] 删除探索者联盟"欢迎回来"概览卡片（两个页面）
- [x] 删除加载界面文字提示，只保留动画

### 系统清理与UI优化 (2024-11-29)
- [x] 清理废弃边缘函数：删除 `proxy-gaia-dialogue`、`generate-gaia-variables`（本地代码已删除，线上需手动删除）
- [x] 删除废弃数据库表：`gaia_context_variables`（已被 `student_summaries` 替代）
- [x] UI优化：盖亚浮动按钮图标从 MessageCircle 改为 History
- [x] UI优化：AIP 浮动按钮图标从 Bot 改为 History
- [x] 新功能：盖亚侧边栏支持拖动调整宽度（320px-800px）
- [x] AIP 流式输出优化：添加视觉缓冲队列实现打字机效果
- [x] AIP 聊天历史修复：关闭对话框后消息不再丢失

**边缘函数 vs N8N 架构说明**：
- N8N 负责 AI 聊天核心流程（向量检索 → Reranker → AI 生成）
- 边缘函数负责辅助功能（学生摘要更新、评估等）
- `summarize-user-activity`：事件驱动更新学生摘要（使用中）
- `generate-student-summary`：每周定时生成 AI 评价（使用中，建议改为事件驱动）

**关键文件变更**：
- `components/GlobalGaiaV3.tsx`：图标改为 History，添加侧边栏拖动功能
- `components/aip/FloatingChatBot.tsx`：图标改为 History，添加打字机效果

### 探索者联盟文件审核系统 (2024-11-28)
- [x] 数据库迁移：添加 `review_status`, `reviewed_by`, `reviewed_at`, `review_comment` 字段到 `project_files` 表
- [x] 修改上传 API：基于用户角色设置审核状态（owner/manager 自动通过，member 需审核）
- [x] 创建审核 API `/api/aip/review-document`：支持通过/拒绝文档，发送通知
- [x] 修改 FileUploadModal：添加审核状态显示、审核操作按钮、待审核文件筛选
- [x] 修改项目详情页：所有成员可上传，显示审核状态徽章

**关键设计决策**:
- 只有审核通过的文件才会发送到 N8N 进入知识库
- 使用 TypeScript `as any` 绕过类型检查（新数据库字段未同步到类型文件）
- 通知系统利用现有的 `notifications` 表

### UI/UX 重新设计 (2024-11 ~ 2024-12)
- [x] Portal 页面导航重构（用户下拉菜单）
- [x] 课程卡片炫彩边框动画效果
- [x] 所有课程页面统一宇宙背景
- [x] 倾听课程地图节点优化
- [x] 盖亚对话系统 V3.2（单对话模式）
- [x] 全局 Toast 通知系统（替代 alert）
- [x] 全局确认对话框系统（替代 confirm）
- [x] Portal 课程卡片炫彩边框修复（2024-12-01）
### ✅ UI/UX 进一步优化 (2024-12-01 下午)#### 探索者联盟 AI 聊天（FloatingChatBot）- [x] 浮动按钮改为炫彩旋转边框样式（`gaia-icon`）- [x] 对话头部图标改为炫彩样式（`gaia-icon-small`）- [x] 消息图标改为炫彩样式（`gaia-icon-tiny`）- [x] 对话背景改为透明玻璃效果（`bg-cosmic-void/90 backdrop-blur-xl`）- [x] 垃圾桶按钮替换为编辑和历史记录按钮- [x] 发送按钮改为炫彩边框样式（`btn-stardust`）#### 课程内容页面资源展示- [x] 修复 `renderResources()` 语法错误（移除多余的 `</div>` 标签）- [x] 移除"📦 课程资源"标题和时长显示- [x] 资源卡片改为透明玻璃背景- [x] 统一资源图标样式（渐变背景 + 边框）#### 音频播放器样式- [x] 新增 `audio-player-glass` CSS 类- [x] 使用 `filter: invert(1) hue-rotate(180deg)` 实现深色主题

### ✅ UI 修复与文档管理优化 (2024-12-01 晚)

#### Bug 修复
- [x] **删除文档"显示失败但实际删除"问题**：
  - 文件：`components/aip/FileUploadModal.tsx:241-315`
  - 原因：RPC 返回 void 被错误当作失败
  - 修复：检查 `chunksError.code !== 'PGRST116'`，使用更简单的删除查询

#### UI 布局修复
- [x] **文档标题过长挤掉按钮**：
  - 文件：`app/explorer-alliance/projects/[projectId]/page.tsx:704-740`
  - 修复：标题最大宽度改为 `max-w-[120px] sm:max-w-[150px] lg:max-w-[180px]`
  - 添加 `flex-wrap` 和 `flex-shrink-0` 确保按钮不被挤掉

#### 按钮样式优化
- [x] **社区项目按钮**：
  - 文件：`components/aip/ProjectGrid.tsx:257-283`
  - "申请加入"：`bg-gradient-to-r from-blue-600 to-cyan-600` + 发光阴影
  - "进入项目"：`bg-gradient-to-r from-emerald-600 to-green-600` + 发光阴影
- [x] **创建项目按钮**：
  - 文件：`app/explorer-alliance/organizations/[organizationId]/page.tsx:400-406`
  - 渐变背景 + 发光阴影效果

### ✅ UI 修复完成 (2024-12-01)
以下问题在 feature 分支合并到 master 后丢失，已全部修复：

- [x] **首页用户菜单** - 左上角用户菜单（包含个人资料、修改密码、管理后台、退出登录）
- [x] **首页按钮样式** - 所有按钮使用 `btn-stardust` 炫彩边框效果
- [x] **盖亚对话框背景** - 使用透明玻璃效果 `bg-cosmic-void/80 backdrop-blur-xl`
- [x] **盖亚对话框交互** - 使用 `useToast` 和 `useConfirm` 替代原生对话框
- [x] **GlobalGaiaV3 浮动按钮** - 使用炫彩旋转边框 `gaia-icon` 样式
- [x] **Portal 个性化推荐** - 移除暂未上线的"个性化推荐"区域
- [x] **Portal 探索课程按钮** - 使用 `btn-stardust` 炫彩边框效果
- [x] **Portal 进度条** - 使用 `progress-ethereal` 炫彩渐变样式
- [x] **用户头像图标** - 使用 `user-avatar-icon` 炫彩旋转边框样式
- [x] **用户资料弹窗** - 透明玻璃背景 + 炫彩保存按钮
- [x] **GaiaDialog 图标** - 头部和消息中的盖亚图标使用炫彩样式
- [x] **GlobalGaiaV3 侧边栏** - 透明玻璃背景 + 炫彩图标和按钮

**设计系统关键样式类**：
- `btn-stardust` - 炫彩边框按钮
- `portal-card-wrapper` + `portal-card-inner` - 卡片炫彩边框
- `card-glass` - 玻璃效果卡片
- `collapsible-section-wrapper` - 折叠区域炫彩边框
- `user-avatar-icon` + `user-avatar-icon-inner` - 用户头像炫彩边框
- `gaia-icon` / `gaia-icon-small` / `gaia-icon-tiny` - 盖亚图标炫彩边框

### 向量知识库优化 - 父子分块实现 (2025-11-30)

#### 已完成
- [x] **父子分块架构实现**：
  - `documents` 表存储父文档（完整文件内容）
  - `document_chunks` 表存储子分块（向量化后的小块）
  - 通过 `parent_document_id` 外键关联

- [x] **N8N 文档上传工作流修复** (`aip上传文档-未来教育`)：
  - 修复 JSON body 特殊字符问题：在 Code 节点使用 `JSON.stringify()` 预构建请求体
  - HTTP Request 改为 "Using JSON" 模式，使用 `={{ $json.request_body }}`
  - Default Data Loader 从 Binary 改为 JSON 模式
  - Edit Fields 表达式从 `$json[0].id` 改为 `$json.id`
  - 添加 metadata：`project_id`, `user_id`, `title`, `parent_document_id`, `organization_id`

- [x] **数据库迁移** (`fix_document_chunks_constraints`)：
  - 修改 `document_chunks` 表约束：`parent_document_id` 和 `chunk_index` 改为可空
  - 创建触发器 `set_chunk_parent_document_id()`：自动从 metadata 填充独立列

- [x] **前端 API 修复** (`app/api/aip/upload-document/route.ts`)：
  - 放宽 N8N 响应检查：从 `!n8nResponse.ok` 改为只检查 4xx 错误
  - N8N 的 lastNode 模式返回格式不标准，不能简单检查 ok 属性

- [x] **数据清理**：
  - 删除 112 条 `parent_document_id` 为 null 的旧 chunks
  - 删除重复的 documents 记录

- [x] **AIP 聊天工作流修改** (`aip聊天助手-未来教育 探索者联盟`)：
  - `supabase vector search` 节点：Table Name 从 `documents` 改为 `document_chunks`

#### 待完成（用户需在 N8N 中手动修改）
- [ ] **Execute a SQL query pro** 节点 SQL 修改：
  ```sql
  -- WHERE 条件改为同时支持独立列和 metadata
  WHERE (project_id::text = $1 OR metadata->>'project_id' = $1)
  ```
- [ ] **Execute a SQL query org** 节点 SQL 修改：
  ```sql
  -- WHERE 条件改为同时支持独立列和 metadata
  WHERE (organization_id::text = $1 OR metadata->>'organization_id' = $1)
  ```

**问题说明**：新上传的文档 `project_id`/`organization_id` 存储在独立列中，但 SQL 查询使用 `metadata->>'project_id'` 导致匹配不到。

### AIP 聊天工作流修复 (2025-11-30)

#### 已完成
- [x] **N8N `1-Parse-Input-Parameters` 修复**：
  - 数据获取从 `$input.first().json` 改为 `$input.first().json.body || $input.first().json`
  - 确保正确解析 `organization_id`、`project_id` 等字段

- [x] **N8N `Create a row` 节点修复**：
  - `$('Webhook')` 改为 `$('1-Parse-Input-Parameters')`
  - `$('6-Final-AI-Answer old')` 改为 `$('6-Final-AI-Answer')`

- [x] **前端 `FloatingChatBot.tsx` 修复**：
  - 修复 project_id 传递逻辑：只有选择项目时才传 project_id
  - 不选项目时只传 organization_id（组织级别查询）

#### 发现的问题
- **AI Agent 没有调用工具**：N8N Logs 显示 "None of your tools were used in this run"
- **响应慢**：7-10 秒，因为 Agent 模式有决策开销
- **知识库未被使用**：Agent 自己决定不调用向量搜索

---

### 🚀 N8N 工作流重构 - 向量搜索 + Hybrid Search (2025-12-01) - 进行中

#### 第一阶段：基础向量搜索优化 ✅ 已完成

##### 已完成配置
- [x] **Vector-项目知识** 节点配置：
  - Operation Mode: Get Many
  - Table Name: `document_chunks`
  - Limit: 10
  - Metadata Filter: `project_id` = `{{ $('1-Parse-Input-Parameters').item.json.project_id }}`
  - Include Metadata: ✅ 开启
  - Rerank Results: ✅ 开启（连接 Reranker Cohere1）

- [x] **Vector-组织知识** 节点配置：
  - Operation Mode: Get Many
  - Table Name: `document_chunks`
  - Limit: 10
  - Metadata Filter: `organization_id` = `{{ $('1-Parse-Input-Parameters').item.json.organization_id }}`
  - Include Metadata: ✅ 开启
  - Rerank Results: ✅ 开启（连接 Reranker Cohere）

- [x] **Reranker Cohere** 节点配置（两个）：
  - Model: `rerank-multilingual-v3.0`（支持中文）
  - Top N: 6

- [x] **获取用户画像** 节点：从 `student_summaries` 表获取

- [x] **合并搜索结果** (Merge 节点)：3个输入

- [x] **整合上下文** (Code 节点)：整合项目知识、组织知识、用户画像

- [x] **6-Final-AI-Answer** (Agent 节点)：优化后的 Prompt

##### 当前工作流架构
```
Webhook
    ↓
Code (调试) → 1-Parse-Input-Parameters
    ↓
┌─────────────────────────────────────────────────────────────┐
│                   并行执行                                   │
├──────────────────────────┬──────────────────┬───────────────┤
│ Embeddings OpenAI        │                  │               │
│        ↓                 │                  │               │
│ Vector-项目知识          │ Embeddings OpenAI│ 获取用户画像  │
│ (Metadata Filter:        │        ↓         │               │
│  project_id)             │ Vector-组织知识  │               │
│        ↓                 │ (Metadata Filter:│               │
│ Reranker Cohere1         │  organization_id)│               │
│                          │        ↓         │               │
│                          │ Reranker Cohere  │               │
└──────────────────────────┴──────────────────┴───────────────┘
                    ↓
              合并搜索结果 (Merge)
                    ↓
              整合上下文 (Code)
                    ↓
              6-Final-AI-Answer (Agent + Gemini)
                    ↓
              Code1 → If → Create a row → Respond to Webhook
```

#### 第二阶段：Hybrid Search（混合检索）🚧 进行中

##### ⚠️ N8N Metadata Filter Bug（2024-12 确认仍存在）

**问题**：N8N Supabase Vector Store 节点的 Metadata Filter 在 "Get Many" 模式下**不生效**
- [GitHub Issue #21271](https://github.com/n8n-io/n8n/issues/21271)：确认 filter 参数没有被发送到 Supabase
- [社区报告](https://community.n8n.io/t/impossible-to-filter-a-supabase-vector-store-via-metadata/75895)：多人遇到同样问题
- 状态：标记为 "in linear"，但尚未修复

**影响**：配置的 `project_id` / `organization_id` 过滤器无效，向量搜索会返回所有文档

##### 什么是 Hybrid Search？
混合检索 = **向量搜索** + **全文搜索**，结合两种方法的优点：

| 搜索方式 | 原理 | 优点 | 缺点 | 速度 |
|---------|------|------|------|------|
| **向量搜索** | 语义相似度 | 搜"苹果手机"能找到"iPhone" | 对编号、代码不敏感 | ~3秒 |
| **全文搜索** | 关键词匹配 | 精确匹配"ISO-16220" | 不理解语义 | ~0.3秒 |
| **混合搜索** | RRF 融合 | 取长补短，更精准 | 需要额外开发 | ~3秒（并行） |

##### 为什么需要 Hybrid Search？（同时解决 Metadata Filter Bug）

1. **精准度提升**：
   - 纯向量搜索可能把"苹果公司"和"苹果水果"混淆
   - 混合搜索：全文精确匹配 + 向量语义理解 = 更精准

2. **绕过 N8N Bug**：
   - 用 **Postgres 节点** 替代 Vector Store 节点
   - Postgres 节点的 SQL 可以正常使用 WHERE 条件过滤
   - 同时实现 Hybrid Search 和 Metadata 过滤

##### 方案对比与推荐

| 对比项 | 方案 A（废弃）<br>N8N 并行节点 | 方案 B（推荐）✅<br>Postgres + RPC |
|--------|-------------------------------|-----------------------------------|
| **Metadata Filter** | ❌ 不生效（N8N Bug） | ✅ SQL WHERE 正常工作 |
| **速度** | ~3秒 | ~3秒（并行执行） |
| **精准度** | ❌ 返回所有文档 | ✅ 只返回目标项目/组织文档 |
| **实现复杂度** | 低 | 中（需要创建 RPC 函数） |
| **可维护性** | 低（依赖有 Bug 的节点） | ✅ 高（SQL 逻辑清晰） |

##### ✅ 确定方案：HTTP Request + Postgres + hybrid_search RPC

**核心思路**：
1. 用 **HTTP Request 节点**调用 OpenAI Embeddings API 生成向量（因为 Embeddings 子节点不能独立使用）
2. 用 **Postgres 节点**调用 `hybrid_search` RPC 函数实现混合搜索 + Metadata 过滤

##### 新架构图
```
Webhook → Code(调试) → 1-Parse-Input-Parameters
                              ↓
                    HTTP Request (OpenAI Embeddings)
                              ↓
         ┌──────────────┬──────────────┬────────────────┐
         ↓              ↓              ↓
   Hybrid-项目知识  Hybrid-组织知识  获取用户画像
   (Postgres+RPC)   (Postgres+RPC)  (Supabase)
         ↓              ↓              ↓
         └──────────────┴──────────────┘
                              ↓
                    合并搜索结果 (Merge 3输入)
                              ↓
                        整合上下文 (Code)
                              ↓
                    6-Final-AI-Answer (Gemini)
                              ↓
                         Code1 → If → Create a row → Respond
```

##### 已完成的准备工作
- [x] **修复数据**：`document_chunks` 表的 `organization_id` 已填充（80条记录）
- [x] **创建 RPC 函数**：`hybrid_search` 函数已部署到 Supabase
- [x] **创建触发器**：`auto_fill_organization_id` 确保以后上传的文档自动填充

##### N8N 修改步骤（共6步）

**第1步：添加 HTTP Request 节点（调用 OpenAI Embeddings API）**
- 节点名称：`生成向量`
- 位置：`1-Parse-Input-Parameters` 之后
- 配置：
  - Method: `POST`
  - URL: `https://api.openai.com/v1/embeddings`
  - Authentication: Header Auth
    - Name: `Authorization`
    - Value: `Bearer sk-xxx`（你的 OpenAI API Key）
  - Body: JSON
    ```json
    {
      "input": "{{ $json.chatInput }}",
      "model": "text-embedding-3-small"
    }
    ```
- 连接：从 `1-Parse-Input-Parameters` 连接到此节点

**第2步：添加 Hybrid-项目知识 节点（HTTP Request 调用 Supabase RPC）**

> ⚠️ **重要发现**：Postgres 节点的 Query Parameters 用逗号分隔参数，但向量数组内部有 1536 个逗号，会被错误拆分！
> 根据 [Supabase GitHub 讨论 #28113](https://github.com/orgs/supabase/discussions/28113)，向量参数必须作为**字符串格式** `"[0.1,0.2,...]"` 传递。
>
> **解决方案**：用 HTTP Request 节点调用 Supabase RPC，用 JSON 格式传参数，避免逗号分隔问题。

- 节点类型：`HTTP Request`
- 节点名称：`Hybrid-项目知识`
- 配置：
  - Method: `POST`
  - URL: `https://usnfslkxsqosvkomqrdz.supabase.co/rest/v1/rpc/hybrid_search`
  - Authentication: `Predefined Credential Type`
  - Credential Type: `Supabase API`
  - Credential: 选择已有的 Supabase 凭证
  - Send Headers: ✅ 开启
    - Header 1: `Content-Type` = `application/json`
    - Header 2: `Prefer` = `return=representation`
  - Send Body: ✅ 开启
  - Body Content Type: `JSON`
  - Specify Body: `Using JSON`
  - JSON:
    ```json
    {
      "query_text": "{{ $('1-Parse-Input-Parameters').item.json.chatInput }}",
      "query_embedding": "[{{ $('生成向量').item.json.data[0].embedding.join(',') }}]",
      "filter_project_id": "{{ $('1-Parse-Input-Parameters').item.json.project_id }}",
      "match_count": 10
    }
    ```
- 连接：从 `生成向量` 连接到此节点

> **注意**：`query_embedding` 的值是**字符串**格式 `"[0.1,0.2,...]"`，不是数组！

**第3步：添加 Hybrid-组织知识 节点（HTTP Request 调用 Supabase RPC）**
- 节点类型：`HTTP Request`
- 节点名称：`Hybrid-组织知识`
- 配置：
  - Method: `POST`
  - URL: `https://usnfslkxsqosvkomqrdz.supabase.co/rest/v1/rpc/hybrid_search`
  - Authentication: `Predefined Credential Type`
  - Credential Type: `Supabase API`
  - Credential: 选择已有的 Supabase 凭证
  - Send Headers: ✅ 开启
    - Header 1: `Content-Type` = `application/json`
    - Header 2: `Prefer` = `return=representation`
  - Send Body: ✅ 开启
  - Body Content Type: `JSON`
  - Specify Body: `Using JSON`
  - JSON:
    ```json
    {
      "query_text": "{{ $('1-Parse-Input-Parameters').item.json.chatInput }}",
      "query_embedding": "[{{ $('生成向量').item.json.data[0].embedding.join(',') }}]",
      "filter_organization_id": "{{ $('1-Parse-Input-Parameters').item.json.organization_id }}",
      "match_count": 10
    }
    ```
- 连接：从 `生成向量` 连接到此节点

**第4步：修改连接**
- `获取用户画像` 改为从 `1-Parse-Input-Parameters` 连接（保持不变）
- `合并搜索结果` 改为 3 个输入：
  - Input 0: `Hybrid-项目知识`
  - Input 1: `Hybrid-组织知识`
  - Input 2: `获取用户画像`

**第5步：删除旧节点**
- 删除 `Vector-项目知识`（被 HTTP Request + RPC 替代）
- 删除 `Vector-组织知识`（被 HTTP Request + RPC 替代）
- 删除 `Embeddings OpenAI`（被 HTTP Request 直接调用 API 替代）
- 删除 `Embeddings OpenAI1`（同上）
- 删除 `Reranker Cohere`（RRF 融合在 hybrid_search RPC 中完成）
- 删除 `Reranker Cohere1`（同上）
- 删除 `全文搜索`（功能已合并到 hybrid_search RPC）
- 删除刚才创建的 `Hybrid-项目知识` Postgres 节点（改用 HTTP Request）

**第6步：修改 整合上下文 Code 节点**
```javascript
// 整合 hybrid_search 结果
const allItems = $input.all();
const parts = [];
let studentProfile = '';

for (const item of allItems) {
  const data = item.json;

  // hybrid_search 返回格式（可能是数组）
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row.content) parts.push(row.content);
    }
    continue;
  }

  // 单条 hybrid_search 结果
  if (data.content && data.similarity !== undefined) {
    parts.push(data.content);
    continue;
  }

  // 用户画像格式
  if (data.summary_text) {
    studentProfile = data.summary_text;
    continue;
  }
}

return [{
  json: {
    context: parts.length > 0 ? parts.join('\n\n---\n\n') : '(无相关知识库内容)',
    student_profile: studentProfile
  }
}];
```

##### 技术说明

**为什么用 HTTP Request 而不是 Embeddings 子节点？**
- N8N 的 Embeddings OpenAI 是**子节点**，只能连接到 Vector Store 等根节点
- 我们要绕过有 Bug 的 Vector Store 节点，所以直接调用 API

**OpenAI Embeddings API 格式**：
```
POST https://api.openai.com/v1/embeddings
Headers: Authorization: Bearer sk-xxx
Body: {"input": "text", "model": "text-embedding-3-small"}
Response: {"data": [{"embedding": [0.1, 0.2, ...], "index": 0}]}
```

**hybrid_search RPC 优势**：
1. 向量搜索 + 全文搜索 + RRF 融合
2. 支持 project_id / organization_id 过滤
3. 一次调用完成所有操作

#### 参考资源
- [N8N Supabase Vector Store 文档](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoresupabase/)
- [Hybrid RAG Trick for AI Agents](https://www.theaiautomators.com/hybrid-rag-trick-for-more-ai-agents-reliability/)
- [Supabase Hybrid Search 讨论](https://github.com/orgs/supabase/discussions/29712)
- [Supabase pgvector 官方文档](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Azure AI Search - Hybrid 性能测试](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-ai-search-outperforming-vector-search-with-hybrid-retrieval-and-reranking/3929167)

---

## 待办事项 - AI 对话优化计划 (优先级高)

### 涉及的系统
1. **探索者联盟 AIP 聊天** - N8N 工作流：`aip聊天助手-未来教育 探索者联盟`
2. **盖亚对话** - N8N 工作流：通过 `N8N_CHAT_WEBHOOK_URL` 调用（需检查是否有同样问题）

### ✅ 第一阶段：基础向量搜索优化（已完成）

- [x] 配置 Vector Store Metadata Filter（按 project_id/organization_id 过滤）
- [x] 配置 Cohere Reranker（rerank-multilingual-v3.0，Top N=6）
- [x] 工作流架构：并行执行 + 强制检索（不依赖 AI 决策）

### 🚧 第二阶段：Hybrid Search（混合检索）- HTTP Request + RPC 方案进行中

> ⚠️ **方案变更**：原计划用 Postgres 节点，但发现其 Query Parameters 用逗号分隔，向量（1536维）的逗号被错误拆分。
> 改用 HTTP Request 节点调用 Supabase RPC，用 JSON 格式传参数。

- [x] 创建 `hybrid_search` RPC 函数（向量+全文搜索+RRF融合）
- [x] 修复 `document_chunks.organization_id` 数据（80条）
- [x] 创建 `auto_fill_organization_id` 触发器
- [x] 修复 `hybrid_search` 函数空字符串问题（2024-12-02）
  - 问题：N8N 传递空 `project_id` 时报错 `invalid input syntax for type uuid: ""`
  - 原因：UUID 类型不接受空字符串
  - 解决：参数类型从 `UUID` 改为 `TEXT`，内部用 `NULLIF(filter_project_id, '')::uuid` 处理
- [x] N8N 第1步：添加 HTTP Request 节点调用 OpenAI Embeddings API ✅
- [x] N8N 第2步：添加 HTTP Request 节点调用 `hybrid_search` RPC（项目知识）✅
  - URL: `https://lvjezsnwesyblnlkkirz.supabase.co/rest/v1/rpc/hybrid_search`
  - 认证：Supabase API 凭证
  - Body: JSON 格式，包含 query_text, query_embedding, filter_project_id
- [x] N8N 第3步：添加 HTTP Request 节点调用 `hybrid_search` RPC（组织知识）✅
- [x] N8N 第4步 + 第5步：删除旧节点 + 修改连接 ✅

**已删除的节点（共7个）：**
| 节点名称 | 类型 | 原因 |
|---------|------|------|
| `Vector-项目知识` | Supabase Vector Store | 被 Hybrid-项目知识1 替代 |
| `Embeddings OpenAI` | 子节点 | 被 生成向量 HTTP Request 替代 |
| `Reranker Cohere` | 子节点 | RRF融合已在 hybrid_search RPC 中完成 |
| `Vector-组织知识` | Supabase Vector Store | 被 Hybrid-组织知识 替代 |
| `Embeddings OpenAI1` | 子节点 | 被 生成向量 HTTP Request 替代 |
| `Reranker Cohere1` | 子节点 | RRF融合已在 hybrid_search RPC 中完成 |
| `全文搜索` | Postgres | 功能已合并到 hybrid_search RPC |

**要保留的节点：**
- `1-Parse-Input-Parameters` - 解析输入
- `获取用户画像` - 获取学生摘要
- `合并搜索结果` - Merge 节点
- `整合上下文` - Code 节点
- `6-Final-AI-Answer` 及后续节点
- `生成向量`（新）
- `Hybrid-项目知识1`（新）
- `Hybrid-组织知识`（新）

**新连接方式：**
```
1-Parse-Input-Parameters
    ↓              ↓
生成向量      获取用户画像
    ↓              ↓
┌───┴───┐          ↓
↓       ↓          ↓
Hybrid- Hybrid-    ↓
项目知识 组织知识   ↓
    ↓       ↓      ↓
    └───┬───┴──────┘
        ↓
  合并搜索结果 (3个输入)
        ↓
    整合上下文
        ↓
  6-Final-AI-Answer
```

- [x] N8N 第6步：修改 整合上下文 Code 节点 ✅
  - 更新代码以处理 hybrid_search 返回的数据格式
  - 分离项目知识库和组织知识库内容
- [x] 端到端测试验证效果 ✅
  - 知识库检索成功，返回相关内容
  - 发现问题：回答质量需优化、响应速度慢（~13秒）

### 🔧 优化阶段（2024-12-02 进行中）

#### 问题1：AI 回答质量不理想
- **现象**：AI 说"没有直接标记为'第三天'的内容"，但知识库确实有相关内容
- **原因**：Prompt 需要优化，让 AI 更好地利用检索到的内容
- **解决**：优化 Prompt，强调"仔细阅读知识库内容"

#### 问题2：响应速度慢（~13秒）
- **瓶颈分析**：
  | 步骤 | 耗时 |
  |------|------|
  | 生成向量 (OpenAI) | ~1秒 |
  | Hybrid 搜索 x2 | ~2秒（已并行）|
  | Gemini Agent | **~10秒** ← 主要瓶颈 |

- **优化方案**：
  - 方案 A：换成 `gemini-2.5-flash` 模型 ✅ 已实施
  - 方案 B：改用 **Basic LLM Chain** 节点替代 Agent 节点 ✅ 已实施

- **实施结果**（2024-12-02）：
  - 将 `6-Final-AI-Answer` 从 AI Agent 节点改为 Basic LLM Chain 节点
  - 原因：[N8N 社区确认](https://community.n8n.io/t/why-is-the-ai-agent-in-n8n-is-extremely-slow-when-processing-data/73442) AI Agent 节点有性能问题，同样的模型 Agent 需要 20-27秒，Basic LLM Chain 只需 ~4秒
  - 效果：执行时间从 ~13秒 降到 **~2.5秒** ✅

- **注意事项**：
  - Basic LLM Chain 输出字段是 `text`，不是 `output`
  - 后续节点引用需要从 `$('6-Final-AI-Answer').first().json.output` 改为 `$('新节点名').first().json.text`

#### 优化后的 Prompt（推荐）
```
你是「探索者联盟」的AI智能助手，名叫"小探"。

## 用户信息
- 用户名：{{ $('1-Parse-Input-Parameters').first().json.user_name }}

## 用户画像
{{ $('整合上下文').first().json.student_profile }}

## 知识库检索结果
以下是与用户问题相关的知识库内容，请仔细阅读并用于回答：
---
{{ $('整合上下文').first().json.context }}
---

## 历史对话
{{ $('1-Parse-Input-Parameters').first().json.chat_history_text }}

## 用户当前问题
{{ $('1-Parse-Input-Parameters').first().json.chatInput }}

## 回复指南
1. 【最重要】仔细阅读上面的知识库内容，从中提取信息直接回答用户问题
2. 如果知识库内容包含答案，直接引用并组织成清晰的回答
3. 不要说"知识库中没有"、"没有找到"等否定词，直接给出最佳回答
4. 回复要友好、简洁、有条理
5. 适当使用 emoji 让对话更生动 😊
6. 结合用户画像进行个性化回答（如果有）
```

### ✅ 第三阶段：前端响应解析修复（2024-12-02）

#### 问题：前端无法显示 AI 回答
- **现象**：N8N 返回成功，但前端显示"抱歉，我无法回答这个问题"
- **原因**：N8N 返回 **NDJSON 格式**（每行一个独立 JSON），而非单个 JSON 对象
- **N8N 返回格式**：
  ```
  {"type":"begin","metadata":{...}}
  {"type":"item","content":"实际的AI回答内容"}
  {"type":"done",...}
  ```

#### 修复记录
- [x] **修复1**：`app/api/aip/chat/route.ts` - 支持多种 N8N 返回格式（ai_content/text/output）
- [x] **修复2**：正确解析 NDJSON 格式 - 按行分割，提取 `type: "item"` 的 content
- [x] **修复3**：关闭 N8N Streaming，改用单 JSON 返回格式
- [x] **修复4（2024-12-02）**：修复 N8N 返回**数组格式**导致解析失败
  - **问题**：N8N `Respond to Webhook` 返回数组格式 `[{ ai_content: '...' }]`
  - **原因**：代码直接读取 `json.ai_content`，但数组没有这个属性
  - **解决**：检测数组格式，自动提取第一个元素
  - **提交**：`c8c518f`

- [x] **修复5（2024-12-02）**：N8N 响应为空 - Webhook 触发器配置问题
  - **现象**：N8N 执行成功，Respond to Webhook 有输出，但 API 收到空响应
  - **根因**：**Webhook 触发器节点的 Respond 设置不正确**
  - **关键发现**（来自 [N8N 官方文档](https://automategeniushub.com/mastering-the-n8n-webhook-node-part-a/)）：
    > ⚠️ `Respond to Webhook` 节点**只有在 Webhook 触发器配置为 "Using Respond to Webhook Node" 时才生效**！
  - **解决方案**：
    1. 点击 N8N 工作流的 **Webhook 触发器节点**（最左边）
    2. 找到 **Respond** 设置
    3. 改为 **"Using 'Respond to Webhook' Node"**
  - **配置对比**：
    | Respond 设置 | 行为 |
    |-------------|------|
    | Immediately | 立即返回空 200，忽略 Respond to Webhook ❌ |
    | When Last Node Finishes | 返回最后节点输出，格式可能不对 ⚠️ |
    | **Using 'Respond to Webhook' Node** | 使用 Respond to Webhook 节点 ✅ |

- [x] **修复5.1（2024-12-02）**：Code1 节点输出为空
  - **原因**：Code1 代码不支持 Basic LLM Chain 的 `{ text: "..." }` 格式
  - **解决**：添加对 `data.text` 的处理

### 🚧 第四阶段：性能优化 + 真流式输出（待完成）

#### 当前问题
- **响应慢**：~12-15秒（之前 Basic LLM Chain 是 ~2.5秒）
- **假流式**：后端等待 N8N 完整响应后才发送给前端

#### 根因分析（基于 [N8N 官方文档](https://docs.n8n.io/workflows/streaming/)）

| 节点类型 | 支持流式输出 | 响应速度 |
|---------|-------------|---------|
| **AI Agent** | ✅ 支持 | 慢（10-15秒）|
| **Basic LLM Chain** | ❌ 不支持 | 快（2-3秒）|

**关键发现**：
1. N8N 的流式输出 **只有 AI Agent 节点支持**
2. Basic LLM Chain 不支持流式，即使开启 streaming 也没用
3. 当前配置可能导致超时等待

#### 解决方案选择

**方案 A：关闭 N8N Streaming（推荐，恢复快速响应）**
- 在 N8N "Respond to Webhook" 节点**关闭** "Enable Streaming"
- 保持 Basic LLM Chain
- 预期效果：~2-3秒响应，前端打字机效果模拟流式

**方案 B：使用 AI Agent + 真流式（复杂，速度较慢）**
- 把 Basic LLM Chain 改回 AI Agent
- 开启 Respond to Webhook 的 "Enable Streaming"
- 后端代码改为真正的流式转发
- 预期效果：10-15秒，但是真正的逐字显示

#### N8N 配置检查清单

**如果选择方案 A（关闭 streaming）：**
1. [ ] 打开 N8N 工作流 `aip聊天助手-未来教育 探索者联盟`
2. [ ] 找到 "Respond to Webhook" 节点
3. [ ] 在 Options 中**关闭** "Enable Streaming"
4. [ ] 保存并激活工作流

**如果选择方案 B（真流式）：**
1. [ ] 把 Basic LLM Chain 改回 AI Agent
2. [ ] 在 Respond to Webhook 节点**开启** "Enable Streaming"
3. [ ] 在 Webhook 触发节点设置 "Respond using 'Respond to Webhook' node"
4. [ ] 修改后端代码处理真正的流式数据

#### 参考资源
- [N8N Streaming Responses 官方文档](https://docs.n8n.io/workflows/streaming/)
- [N8N Chat Streaming 配置](https://n8nchatui.com/docs/configuration/chat-streaming)
- [社区讨论：AI Agent 流式输出](https://community.n8n.io/t/i-want-to-make-my-agentic-chat-as-streaming-output/158179)

---

## 技术说明

### Agent 模式 vs Chain 模式

| 对比项 | Agent 模式 | Chain 模式 |
|-------|-----------|-----------|
| 决策方式 | AI 自己决定调用哪些工具 | 预定义流程，每步必执行 |
| 工具调用 | 可能 0-N 次，不确定 | 固定调用，可预测 |
| 速度 | 慢（7-20秒） | 快（3-5秒） |
| 可控性 | 低 | 高 |
| 适用场景 | 复杂任务需要多轮推理 | 固定流程的问答 |

### 向量搜索原理

1. 用户问题转换为向量（embedding）
2. 在数据库中找"最相似"的向量（余弦相似度）
3. 返回 Top K 个结果（不管相不相关，总会返回）
4. Reranker 重新排序，过滤不相关内容
5. LLM 判断搜索结果是否有用，生成回答

---

## 代码规范
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 或 PascalCase
- 使用 Tailwind CSS 进行样式设计
- 动画优先使用 Framer Motion
- 数据库操作通过 Supabase client

## 常用命令
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 代码检查
```

---

## Claude 行为指令

> **重要**: 在完成重要任务后，Claude 应该主动更新此文件，记录：
> - 新完成的功能或修复
> - 重要的代码变更
> - 未完成的待办事项
> - 关键决策和原因
>
> 不需要用户每次提醒，自动保持此文件的更新。

---
*此文件帮助 Claude 在对话压缩后保持项目上下文*
