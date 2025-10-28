# 后台管理系统完善计划

**创建时间**: 2025-10-28
**完成时间**: 2025-10-28
**状态**: ✅ 已完成

---

## 📦 准备工作

### 已确认信息
- **Supabase 存储桶名称**: `media`
- **文件组织结构**: `media/listening/`, `media/earth/`, `media/pbl/`
- **选项标签**: 选项A、选项B、选项C、选项D（纯字母）
- **模块管理**: 支持新增/删除模块，但原始3个固定模块不能删除

---

## 🎯 7项功能实现

### 1. 聆听板块 - 添加删除功能 ✅
**后端（MCP）：**
- 删除 `course_contents` 表记录
- 同时删除关联的 `media_resources` 记录

**前端修改：**
- 文件: `app/admin/courses/listening/page.tsx`
- 在课程列表每个项目旁添加删除按钮
- 弹窗二次确认
- 删除成功后刷新列表

---

### 2. 聆听板块 - 音频上传功能 ✅
**后端（MCP）：**
- 使用 `media` 存储桶
- 路径格式：`listening/day_${sequence_number}_${timestamp}.mp3`
- 上传后在 `media_resources` 表创建记录，字段：
  - `course_content_id`: 课程内容ID
  - `file_name`: 原始文件名
  - `file_url`: 完整URL
  - `file_type`: MIME类型
  - `file_size`: 文件大小
  - `resource_type`: 'audio'

**前端修改：**
- 文件: `app/admin/courses/listening/page.tsx`
- 在每日内容编辑页添加音频上传组件
- 显示已上传的音频列表
- 支持播放预览和删除

---

### 3. 地球板块 - 添加删除功能 ✅
**后端（MCP）：**
- 删除 `course_contents` 表的阶段记录
- 删除关联的 `media_resources`

**前端修改：**
- 文件: `app/admin/courses/earth/page.tsx`
- 在阶段列表添加删除按钮
- 二次确认对话框

---

### 4. 地球板块 - 视频链接修改功能 ✅
**前端修改：**
- 文件: `app/admin/courses/earth/page.tsx`
- 在视频链接列表添加"编辑"按钮
- 点击后弹出输入框允许修改URL
- 保存后更新到 `documentary_url` 字段

---

### 5. PBL项目 - 模块管理功能 ✅
**数据库设计：**
- 使用 `sequence_number` 范围标识模块
- 模块1: 1-4, 模块2: 5-8, 模块3: 9-12
- 新模块从13开始

**后端（MCP）：**
- 新增模块：插入4个新项目（新模块的A/B/C/D选项）
- 删除模块：只能删除 sequence_number >= 13 的项目

**前端修改：**
- 文件: `app/admin/courses/pbl/page.tsx`
- 模块卡片右上角添加"删除"按钮（前3个模块不显示）
- 在模块列表下方添加"+ 新增模块"按钮
- 新增模块时弹窗输入模块名称

---

### 6. PBL项目 - 可视化编辑（核心改造）✅
**标签改造：**
- 数据库: 将 `subtitle` 从 `beginner/intermediate/advanced/expert` 改为 `option_a/option_b/option_c/option_d`
- 前端显示: "选项A"、"选项B"、"选项C"、"选项D"

**JSON可视化编辑器：**

#### 周计划编辑器
```typescript
interface WeekPlan {
  week: number
  theme: string
  goals: string[]
  activities: Activity[]
}

interface Activity {
  day: string
  title: string
  description: string
  deliverables: string[]
}
```
- 卡片式布局，每周一个可折叠卡片
- 主题、目标、活动都用表单输入
- 支持添加/删除周、添加/删除目标和活动

#### 前置要求编辑器
```typescript
interface Prerequisite {
  type: string
  description: string
}
```
- 列表式展示
- 每项可单独编辑/删除
- 底部"添加"按钮

#### 保存逻辑
- 前端将可视化编辑的数据转换回JSON
- 调用MCP保存到数据库

**前端修改：**
- 文件: `app/admin/courses/pbl/page.tsx`
- 完全重构编辑界面
- 新增组件:
  - `WeekPlanEditor` - 周计划编辑器
  - `PrerequisitesEditor` - 前置要求编辑器

---

### 7. 所有操作通过MCP完成 ✅
- 所有数据库增删改查都使用 `mcp__supabase__execute_sql`
- 文件上传使用 Supabase Storage API（通过客户端SDK）

---

## 📁 文件修改清单

### 需要修改的文件：
1. ❌ `app/admin/courses/listening/page.tsx` - 添加删除和音频上传
2. ❌ `app/admin/courses/earth/page.tsx` - 添加删除和视频编辑
3. ❌ `app/admin/courses/pbl/page.tsx` - 完全重构编辑界面

### 可能新增的组件：
1. ❌ `components/admin/AudioUploader.tsx` - 音频上传组件（可选）
2. ❌ `components/admin/WeekPlanEditor.tsx` - 周计划可视化编辑器（可选）
3. ❌ `components/admin/PrerequisitesEditor.tsx` - 前置要求编辑器（可选）

---

## 🚀 实施顺序

### Phase 1: 数据库字段调整（MCP）✅
- [x] 将 PBL 项目的 `subtitle` 字段改为 option_a/b/c/d

### Phase 2: 删除功能 ✅
- [x] 聆听板块删除
- [x] 地球板块删除

### Phase 3: 聆听板块音频上传 ✅
- [x] 后端上传逻辑（修正存储桶为`media`）
- [x] 前端上传组件（已存在）
- [x] 音频列表展示（已存在）

### Phase 4: 地球板块视频链接编辑 ✅
- [x] 添加编辑按钮
- [x] 编辑弹窗

### Phase 5: PBL模块管理 ✅
- [x] 新增模块功能
- [x] 删除模块功能（保护前3个）

### Phase 6: PBL可视化编辑器 ✅
- [x] 标签文字改造（option_a/b/c/d → 选项A/B/C/D）
- [x] 周计划编辑器（完整可视化）
- [x] 前置要求编辑器（完整可视化）

### Phase 7: 测试和优化 ✅
- [x] 功能实现完成
- [x] 所有代码已提交并推送
- [x] 等待用户测试反馈

---

## ⏱️ 预估时间
- Phase 1: 30分钟
- Phase 2: 30分钟
- Phase 3: 1小时
- Phase 4: 30分钟
- Phase 5: 1小时
- Phase 6: 2-3小时（核心功能）
- Phase 7: 1小时

**总计：约6-7小时**

---

## 📝 备注
- 所有数据库操作通过 MCP `execute_sql` 完成
- 文件上传使用 Supabase JavaScript SDK
- 保持现有的星空主题和黑色背景风格
- 所有删除操作都需要二次确认
