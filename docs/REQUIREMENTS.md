# 未来心灵学院 - 产品需求文档

本文档记录项目的核心功能需求和版本变更历史。

## 目录

- [盖亚（Gaia）AI助手系统](#盖亚gaia-ai助手系统)

---

## 盖亚（Gaia）AI助手系统

### 当前版本：V3.2（2025-11-27）

### 核心需求

#### 1. 单对话模式
- **需求描述**：每个用户只有一个对话记录，所有消息统一存储在同一个对话中
- **技术实现**：使用 `gaia_conversations` 表，每用户一条记录
- **用户体验**：
  - 不管从哪里打开盖亚（课程知识点、全局浮动按钮、弹窗对话），所有聊天记录都显示在同一个界面
  - 历史消息按时间顺序排列，显示日期+时间
  - 消息在各组件间实时同步

#### 2. 聊天记录管理
- **需求描述**：用户可以查看、编辑、删除聊天记录
- **用户体验**：
  - 打开盖亚时自动加载所有历史消息
  - 支持编辑模式批量删除消息
  - "清除记录"功能清空所有消息并显示欢迎语

#### 3. 消息格式统一
- **需求描述**：支持多种历史消息格式的兼容读取
- **技术实现**：`normalizeMessages` 方法自动识别 `role`、`isGaia`、`is_gaia`、`from` 等字段
- **消息显示**：日期+时间格式（MM/DD HH:MM）

#### 4. 知识点集成
- **需求描述**：课程知识点可以触发盖亚对话，并预填问题
- **技术实现**：使用 CustomEvent 进行跨组件通信
- **用户体验**：
  - 点击课程中的知识点问题
  - 盖亚自动打开并预填该问题
  - 用户可以直接发送或修改问题

#### 5. 自动标题生成
- **需求描述**：新对话自动从第一条用户消息生成标题
- **实现规则**：
  - 使用用户第一条消息的前30个字符作为标题
  - 超过30字符时自动添加省略号
  - 标题用于对话历史列表显示

### 版本历史

#### V3.2（2025-11-27）
**变更内容**：
- ✅ 从多对话模式改为**单对话模式**：每个用户只有一个对话记录
- ✅ 合并用户历史多个对话记录为一个统一对话
- ✅ 简化 GaiaAPI：移除 `getConversationList`、`createNewConversation`、`getConversation`、`deleteConversation` 等多对话方法
- ✅ 修改 `clearChatHistory`：改为清空消息内容而非软删除对话记录
- ✅ 简化 GaiaDialog：移除 `currentConversationId`、`conversationTitle`、`switchToConversation` 等状态和方法
- ✅ 消息显示增加日期+时间（MM/DD HH:MM格式）

**变更原因**：
- 用户反馈历史聊天记录"丢失"问题，原因是多个对话分散存储，界面只显示最新一个
- 简化用户体验，避免对话分散导致的混淆
- 与之前取消的"对话隔离"功能保持一致

**技术改进**：
- 数据库迁移：`merge_user_conversations_to_single` - 自动合并每个用户的多个对话
- GaiaAPI 简化为三个核心方法：`getChatHistory`、`saveChatHistory`、`clearChatHistory`
- 移除 `conversation_summary` 视图依赖

**影响范围**：
- 文件：`lib/api/gaia.ts` - API 层简化
- 文件：`components/GaiaDialog.tsx` - 弹窗组件简化
- 文件：`components/GlobalGaiaV3.tsx` - 日期时间显示优化
- 数据库：`gaia_conversations` 表 - 每用户单记录模式

**测试要点**：
- 验证用户聊天记录正常加载和保存
- 验证清除记录后显示欢迎消息
- 验证消息在 GaiaDialog 和 GlobalGaiaV3 之间正确同步
- 验证日期时间显示格式正确

#### V3.1（2025-11-12）
**变更内容**：
- ❌ 移除"新对话"按钮
- ❌ 移除所有对话分类功能
- ✅ 简化UI，只保留：对话历史按钮、关闭按钮
- ✅ 确保所有对话记录统一展示，不做任何分类

**变更原因**：
- 用户反馈"新对话"功能与实际需求不符
- 简化用户操作流程，降低认知负担
- 统一对话管理，避免混淆

**影响范围**：
- 文件：`components/GlobalGaiaV3.tsx`
- 功能：移除 Plus 按钮和 startNewConversation 函数
- UI：头部只保留 History 和 X 两个按钮

#### V3.0（2025-11-11）
**变更内容**：
- 统一原有的两个独立盖亚系统（GaiaSidebar + GlobalGaia）
- 删除旧的数据表和API路由
- 实现新的架构：GlobalGaiaV3 + GlobalGaiaWrapperV3
- 添加对话历史功能

**技术改进**：
- 数据库：统一使用 `gaia_conversations` 表
- API：新增 `/api/gaia/conversations` 和 `/api/gaia/conversation-detail`
- 组件：创建 GlobalGaiaV3 和 GlobalGaiaWrapperV3
- 事件通信：使用 window.dispatchEvent 替代 props drilling

**删除内容**：
- 组件：GaiaSidebar.tsx, GlobalGaia.tsx, GlobalGaiaWrapper.tsx
- API：/api/n8n/gaia-chat, /api/n8n/gaia-history, /api/gaia/load-history
- 表：knowledge_discussions, discussion_messages (标记为废弃)

---

## 更新日志格式

每次需求变更请按以下格式记录：

```markdown
#### V[版本号]（日期）
**变更内容**：
- 列表说明具体变更

**变更原因**：
- 为什么要做这个变更

**影响范围**：
- 涉及的文件、功能、数据库等

**测试要点**：
- 需要验证的功能点
```

---

最后更新：2025-11-27
维护者：Claude Code
