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

### UI/UX 重新设计 (2024-11)
- [x] Portal 页面导航重构（用户下拉菜单）
- [x] 课程卡片炫彩边框动画效果
- [x] 所有课程页面统一宇宙背景
- [x] 倾听课程地图节点优化
- [x] 盖亚对话系统 V3.2（单对话模式）

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
