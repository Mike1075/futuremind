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

## 待办事项 - AI 对话优化计划 (优先级高)

### 涉及的系统
1. **探索者联盟 AIP 聊天** - N8N 工作流：`aip聊天助手-未来教育 探索者联盟`
2. **盖亚对话** - N8N 工作流：通过 `N8N_CHAT_WEBHOOK_URL` 调用（需检查是否有同样问题）

### 第一阶段：改成 Chain 模式（解决速度和知识库问题）

**目标**：3-5 秒响应，保证每次都使用知识库

- [ ] **重构 N8N 工作流架构**：
  ```
  当前（Agent 模式）：
  用户问题 → AI Agent（自己决定调不调工具）→ 回答（7-15秒）

  目标（Chain 模式）：
  用户问题 → 并行查询（向量搜索 + 历史）→ LLM 直接生成 → 回答（3-5秒）
  ```

- [ ] **修改 N8N 节点**：
  1. 删除或禁用 AI Agent 的工具连接
  2. 在 AI Agent 之前添加向量搜索节点（直接执行，不是作为工具）
  3. 把搜索结果合并到 Prompt 中
  4. 使用 Basic LLM Chain 或简化的 Agent

- [ ] **优化 Prompt 设计**：
  ```
  ## 回复规则
  1. 优先参考下方知识库内容回答
  2. 如果知识库内容不足，结合你的知识给出有帮助的回答
  3. 保持友好、专业的探索者伙伴形象
  4. 不需要说"知识库没有"，直接给出最佳回答即可

  ## 知识库内容
  {{ 向量搜索结果 }}

  ## 用户问题
  {{ chatInput }}
  ```

### 第二阶段：优化检索质量

- [ ] **混合检索 (Hybrid Search)**：
  - 创建全文检索索引：`CREATE INDEX ON documents USING gin(to_tsvector('chinese', content))`
  - 实现 BM25 关键词匹配
  - 融合策略：向量相似度 (0.7) + BM25 (0.3) 加权合并

- [ ] **Rerank 参数调优**：
  - 测试不同 topK/topN 组合（当前：topK=15, topN=6）
  - 添加相关性阈值过滤（score < 0.3 的结果丢弃）

### 第三阶段：监控和调试

- [ ] **添加知识库命中率监控**：
  - 记录每次查询的向量搜索结果数量
  - 记录 Rerank 后的结果数量和分数
  - 方便后续调优

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
