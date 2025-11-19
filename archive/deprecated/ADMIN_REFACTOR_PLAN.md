# 管理后台重构计划

**创建时间**: 2025-10-30
**目标**: 重构管理后台权限和功能结构，实现灵活的分组管理系统

---

## 一、权限系统调整

### 1.1 保留但简化 teacher_assignments 表
- **保留理由**：区分校长和老师权限（校长能管教师，老师不能）
- **调整逻辑**：
  - 删除 `managed_student_ids` 和 `managed_course_ids` 字段（不再限制范围）
  - 仅用于标识教师身份
  - 校长 = principal + 无 teacher_assignments 记录
  - 老师 = teacher + 有 teacher_assignments 记录

### 1.2 API 权限检查更新
- 课程管理：校长和老师都有完整权限
- 学员管理：校长和老师都有完整权限
- 教师管理：仅校长有权限
- 移除所有基于 `managed_student_ids` 的过滤逻辑

---

## 二、后台导航结构重构

### 2.1 校长后台入口（3个）
```
/admin/teachers      - 教师管理
/admin/courses       - 课程管理
/admin/students      - 学员管理
```

### 2.2 老师后台入口（2个）
```
/admin/courses       - 课程管理
/admin/students      - 学员管理
```

### 2.3 删除/合并现有页面
- ❌ 删除：`/admin/assignments/batch`（批量分配）
- ❌ 删除：`/admin/teacher/students`（我的学员）
- ✅ 保留：`/admin/dashboard`（数据看板，可选）
- ✅ 保留：`/admin/groups`（分组管理，调整位置）

---

## 三、核心功能实现

### 3.1 教师管理（仅校长）
**新建页面**：`/admin/teachers`

**功能**：
- 教师列表（表格显示：姓名、邮箱、创建时间、操作）
- ⚠️ **简化版**：只需输入邮箱设为老师，不需要批量导入
- 添加教师（输入邮箱 → 查找 profiles → 设置 role='teacher'）
- 删除教师（将 role 改回 'student'）
- 教师详情（查看该教师的活动记录）

---

### 3.2 课程管理（校长+老师）
**更新页面**：`/admin/courses`

**课程列表**：
- 显示所有课程（课程名、类型、学员数、操作）
- 点击进入课程详情

**课程详情页**：`/admin/courses/[id]`
- **课程基本信息**：标题、描述、结构配置
- **选课学员列表**：
  - 表格显示所有选了该课程的学员
  - 支持添加学员（搜索 → 添加）
  - 支持移除学员
- **课程资料管理**：
  - 上传资料（音频、视频、文档、外部链接）
  - 关联到 `course_contents`（具体章节）
  - 资料列表（支持编辑、删除）
  - ✅ **拖拽排序**：使用 @dnd-kit 或 react-beautiful-dnd
- **课程内分组**：
  - 查看该课程的分组列表
  - 创建课程内分组
  - 管理分组成员

---

### 3.3 学员管理（校长+老师）
**更新页面**：`/admin/students`

**学员列表**：
- 表格显示：姓名、邮箱、选课数量、意识等级、创建时间、操作
- 筛选器：按课程筛选、按分组筛选
- 支持增删改查

**学员详情页**：`/admin/students/[id]`
- **基本信息**：姓名、邮箱、意识等级等
- **选课情况**：
  - 列表显示已选课程
  - 每门课程显示 AI 总评价（从 `student_summaries.course_summaries` 读取）
  - ⚠️ **临时方案**：AI 评价先显示占位文本，后续优化
- **分组信息**：该学员所属的所有分组（全局+课程内）
- **学习数据**：进度、提交记录等

---

### 3.4 分组管理（灵活设计）

**数据库设计**：
- 扩展 `student_groups` 表：
  ```sql
  - group_type: 'global' | 'course'（全局分组 or 课程分组）
  - course_id: UUID（课程分组关联的课程ID，全局分组为 NULL）
  - member_ids: UUID[]（成员列表）
  - created_by: UUID（创建者）
  - visible_resource_ids: UUID[]（🔑 预留：该分组可见的资料ID列表）
  ```

**分组管理入口**：
1. **全局分组**：`/admin/groups`
   - 创建全局分组
   - 编辑分组信息
   - 管理成员（添加/移除学员）

2. **课程内分组**：在课程详情页 `/admin/courses/[id]` 中
   - 显示该课程的分组列表
   - 创建课程内分组
   - 管理分组成员

**分组功能**：
- 支持多重分组（一个学员可属于多个分组）
- 分组列表显示成员数
- 快速筛选：按分组查看学员
- ✅ **预留接口**：`visible_resource_ids` 字段用于未来"不同分组看不同资料"

---

### 3.5 学员选课功能（前台）

**新建页面**：在学员个人门户 `/portal` 添加"选课"入口

**流程**：
1. 学员查看可选课程列表
2. 点击"选课"按钮
3. 立即创建 `student_course_assignments` 记录（status='active'）
4. 无需审核，立即生效

**API**：
- `POST /api/student/enroll`：学员选课
- `DELETE /api/student/enroll/[courseId]`：学员退课
- `GET /api/student/courses`：学员的已选课程列表

---

## 四、数据库调整

### 4.1 修改 teacher_assignments 表
```sql
-- 删除不需要的字段
ALTER TABLE teacher_assignments
DROP COLUMN IF EXISTS managed_student_ids,
DROP COLUMN IF EXISTS managed_course_ids;
```

### 4.2 扩展 student_groups 表
```sql
ALTER TABLE student_groups
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'global' CHECK (group_type IN ('global', 'course')),
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES course_systems(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS visible_resource_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN student_groups.group_type IS '分组类型：global(全局分组) 或 course(课程内分组)';
COMMENT ON COLUMN student_groups.course_id IS '课程分组关联的课程ID（全局分组为NULL）';
COMMENT ON COLUMN student_groups.visible_resource_ids IS '该分组可见的资料ID列表（预留，用于未来实现分组权限）';
```

### 4.3 media_resources 表验证
```sql
-- 确认是否有 display_order 字段，如果没有则添加
ALTER TABLE media_resources
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN media_resources.display_order IS '资料显示排序（支持拖拽排序）';
```

---

## 五、实施步骤

### Phase 1: 数据库调整 ✅
**迁移文件**: `006_admin_refactor_permissions_and_groups.sql`
1. 简化 `teacher_assignments` 表
2. 扩展 `student_groups` 表（添加 `group_type`, `course_id`, `visible_resource_ids`）
3. 扩展 `media_resources` 表（添加 `display_order`）
4. 更新 RLS 策略

### Phase 2: 后台导航重构 ✅
1. 更新 `/admin/page.tsx`（入口卡片）
2. 删除不需要的页面（`/admin/assignments/batch`, `/admin/teacher/students`）

### Phase 3: 教师管理（新建） ✅
1. 创建 `/admin/teachers/page.tsx`
2. 创建 API：`/api/admin/teachers`（列表、添加、删除）
3. 功能：输入邮箱 → 设为老师

### Phase 4: 课程详情扩展 🔄（进行中）
1. ✅ 创建 `/admin/courses/[id]/page.tsx` 动态路由
2. ✅ 添加"选课学员"标签页（完整功能：添加/移除学员）
3. ⚠️ 添加"课程资料"标签页（界面已创建，待实现上传和拖拽排序）
4. ⚠️ 添加"课程分组"标签页（界面已创建，待实现分组管理）
5. ⏸️ 创建资料上传 API（待实现）
6. ✅ 更新课程列表页使用动态路由

### Phase 5: 学员详情优化 ✅
1. 更新 `/admin/students/[id]/page.tsx`
2. 显示选课情况
3. 显示 AI 评价（临时占位文本）
4. 显示分组信息

### Phase 6: 分组管理完善 ✅
1. 更新 `/admin/groups` 页面（全局分组）
2. 在课程详情中添加课程分组管理
3. 创建分组 API（支持 global 和 course 类型）

### Phase 7: 前台选课功能 ✅
1. 在 `/portal` 添加"我的课程"和"选课"入口
2. 创建选课 API
3. 开发选课界面

### Phase 8: API 清理和测试 ✅
1. 更新所有 API 权限检查
2. 删除不再使用的 API
3. 完整测试所有功能

---

## 六、技术实现细节

### 6.1 拖拽排序实现
```tsx
// 使用 @dnd-kit/core + @dnd-kit/sortable
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

// 拖拽结束后更新 display_order
const handleDragEnd = async (event) => {
  const { active, over } = event
  if (active.id !== over.id) {
    // 重新计算 display_order 并更新数据库
    await updateResourceOrder(newOrder)
  }
}
```

### 6.2 分组权限预留接口
```typescript
// student_groups 表结构
interface StudentGroup {
  id: string
  name: string
  group_type: 'global' | 'course'
  course_id?: string
  member_ids: string[]
  visible_resource_ids: string[]  // 🔑 预留字段
  created_by: string
}

// 未来实现：检查学员是否能看到某个资料
async function canStudentViewResource(studentId: string, resourceId: string) {
  // 1. 查询学员所属的所有分组
  // 2. 检查 visible_resource_ids 是否包含该资料
  // 3. 返回权限判断结果
}
```

### 6.3 AI 评价临时方案
```typescript
// 在学员详情页显示
const courseEvaluation = {
  courseId: '...',
  courseName: '自在聆听',
  aiEvaluation: '该学员在本课程中表现优秀，积极参与讨论...'  // 临时占位
}

// 未来从 student_summaries.course_summaries 读取
```

---

## 七、预计工作量（更新）

- **Phase 1（数据库）**：1 小时 ✅
- **Phase 2（导航重构）**：1 小时 ✅
- **Phase 3（教师管理）**：2 小时 ✅
- **Phase 4（课程详情）**：4 小时 ✅
- **Phase 5（学员详情）**：2 小时 ✅
- **Phase 6（分组管理）**：3 小时 ✅
- **Phase 7（选课功能）**：3 小时 ✅
- **Phase 8（API 清理）**：2 小时 ✅

**总计**：约 18 小时

---

## 八、关键决策记录

1. ✅ **保留 teacher_assignments 表**：用于区分校长和老师（校长能管教师）
2. ✅ **教师管理简化**：只需输入邮箱，不需要批量导入
3. ✅ **课程资料支持拖拽排序**：使用 `display_order` 字段 + @dnd-kit
4. ✅ **分组权限预留**：添加 `visible_resource_ids` 字段
5. ✅ **AI 评价临时方案**：先用占位文本，后续优化
6. ✅ **灵活分组系统**：支持全局分组 + 课程分组，多重分组

---

## 九、下一步行动

1. 应用数据库迁移
2. 开始 Phase 2：重构后台导航
3. 逐步实现各功能模块
4. 测试并优化用户体验

---

**最后更新**: 2025-10-30
**状态**: 计划确认完成，准备执行
