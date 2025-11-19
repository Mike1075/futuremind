# 数据库架构重构计划

**执行时间**: 2025-10-27
**执行人**: Claude Code
**目标**: 统一课程体系架构，为三大课程（自在聆听、欢迎来到地球、伊卡洛斯计划）提供统一的数据基础

---

## 📋 重构概述

### 当前问题
1. **数据模型冗余**: lessons 表 vs content_module/content_item 系统并存
2. **缺少元数据层**: 三种课程结构未统一管理
3. **作业系统缺失**: user_progress 表功能不足
4. **媒体管理混乱**: media_resources vs media_asset 重叠
5. **解锁逻辑不清**: 缺少前置条件定义

### 重构目标
- ✅ 统一课程内容数据模型
- ✅ 建立课程体系元数据管理
- ✅ 完善作业提交和批改系统
- ✅ 统一媒体资源管理
- ✅ 支持PBL项目周/日计划

---

## 🗂️ 新数据库架构

### 1. course_systems（课程体系元数据表）
**用途**: 管理三大课程体系的基本信息和结构配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| system_key | TEXT | 唯一标识：'listening', 'earth', 'icarus' |
| title | TEXT | 显示名称 |
| description | TEXT | 描述 |
| structure_type | TEXT | 结构类型：'daily_sequential', 'stage_sequential', 'module_matrix' |
| structure_config | JSONB | 结构化配置 |
| total_units | INTEGER | 总单元数 |
| is_active | BOOLEAN | 是否激活 |
| display_order | INTEGER | 显示顺序 |

**初始数据**:
- 自在聆听（14天线性递进）
- 欢迎来到地球（6阶段递进）
- 伊卡洛斯计划（3模块×4难度矩阵）

---

### 2. course_contents（统一课程内容表）
**用途**: 替代原 lessons 表，支持所有课程体系的内容存储

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| system_id | UUID | 关联 course_systems |
| content_type | TEXT | 'daily_lesson', 'stage', 'pbl_project' |
| sequence_number | INTEGER | 序号（天数/阶段数） |
| title | TEXT | 标题 |
| subtitle | TEXT | 副标题 |
| original_text | TEXT | 原文摘录（自在聆听） |
| deep_interpretation | TEXT | 深度解读 |
| meditation_guide | TEXT | 冥想引导 |
| life_practice | TEXT | 生活练习 |
| documentary_url | TEXT | 纪录片链接（欢迎来到地球） |
| pre_watch_guide | TEXT | 观看前引导 |
| knowledge_points | JSONB | 知识点数组 |
| socratic_questions | JSONB | 启发式提问 |
| post_reflection | JSONB | 课后思辨 |
| week_plan | JSONB | 周计划（PBL） |
| day_plan | JSONB | 日计划（PBL） |
| prerequisites | JSONB | 前置条件 |
| estimated_duration | INTEGER | 预计学习时长（分钟） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

---

### 3. user_submissions（作业提交表）
**用途**: 管理学员的所有提交内容

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联 profiles |
| course_content_id | UUID | 关联 course_contents |
| submission_type | TEXT | 'reflection', 'assignment', 'project_deliverable' |
| content | TEXT | 提交内容 |
| attachments | JSONB | 附件信息 |
| submitted_at | TIMESTAMPTZ | 提交时间 |
| status | TEXT | 'submitted', 'under_review', 'approved', 'needs_revision' |
| reviewer_id | UUID | 批改人 |
| feedback | TEXT | 反馈 |
| score | INTEGER | 评分（0-100） |
| consciousness_growth_points | INTEGER | 意识树成长点数 |
| reviewed_at | TIMESTAMPTZ | 批改时间 |

---

### 4. media_resources（扩展）
**新增字段**:
- resource_type: 'audio', 'video', 'document', 'external_link'
- external_url: 外部链接（如YouTube）
- duration_seconds: 媒体时长
- metadata: 其他元数据（JSONB）

---

### 5. explorer_projects（扩展）
**新增字段**:
- module_name: 模块标识（'invisible_bonds', 'reality_edge', 'future_seeds'）
- difficulty_label: 难度标签（用于后台，不展示给用户）
- week_plan: 周计划（JSONB）
- day_plan: 日计划（JSONB）
- related_content_ids: 关联的课程内容ID（JSONB数组）

---

## 📝 迁移步骤

### Step 1: 创建新表
```sql
-- 003_refactor_course_structure.sql
-- 创建 course_systems, course_contents, user_submissions
-- 扩展 media_resources, explorer_projects
```

### Step 2: 数据迁移
```sql
-- 从 lessons 迁移到 course_contents
-- 保留所有现有数据（5条自在聆听记录）
```

### Step 3: 更新外键关系
```sql
-- 更新 media_resources.lesson_id → course_content_id
-- 更新 user_progress.ref_item_id 逻辑
```

### Step 4: RLS 策略配置
```sql
-- 为所有新表配置行级安全策略
-- 确保普通用户只能查看已发布内容
```

### Step 5: 删除旧表
```sql
-- 删除 lessons 表（数据已迁移）
```

---

## ✅ 验证清单

- [ ] course_systems 表创建成功，包含3条初始数据
- [ ] course_contents 表创建成功，自在聆听5天数据已迁移
- [ ] user_submissions 表创建成功
- [ ] media_resources 表字段扩展完成
- [ ] explorer_projects 表字段扩展完成
- [ ] 所有外键关系正确
- [ ] RLS 策略配置完成
- [ ] 现有功能（自在聆听后台）仍正常工作

---

## 🔄 回滚计划

如果重构失败，执行以下步骤：
1. 恢复 lessons 表（从备份）
2. 删除新创建的表
3. 使用 Git 回滚代码更改

**备份命令**:
```bash
supabase db dump -f backup_before_refactor.sql
```

---

## 📌 后续工作

重构完成后，需要更新的代码文件：
1. `/app/admin/courses/listening/page.tsx` - 更新表名和字段
2. Supabase 类型定义文件
3. API 路由（如有）

---

**状态**: 执行中
**预计完成时间**: 2025-10-27 22:00
