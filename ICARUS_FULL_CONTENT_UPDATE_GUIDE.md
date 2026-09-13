# 伊卡洛斯计划 - 完整内容更新指南

## 📊 更新概览

**更新时间**: 2025-11-17
**更新类型**: 完整内容替换（包含所有详细教学内容）

### 当前数据库状态（问题）

- ❌ 内容过于简化，丢失了99%的详细信息
- ❌ 只有简单的标题、时长和简短描述
- ❌ 缺失所有教学步骤、任务要求、提交格式等
- ❌ 活动排序问题（Day 1 出现在 Day 2、Day 5 之后）

### 更新后状态

- ✅ 包含原文档的所有详细内容（720KB数据）
- ✅ 每个activity包含完整的markdown内容
- ✅ 包含所有教学说明、任务步骤、示例、表格等
- ✅ 添加sequence字段修复排序问题
- ✅ 92周完整内容，202个详细活动

---

## 🎯 数据结构改进

### 新的Week Plan Schema

```json
{
  "week": 1,
  "theme": "成为观察家",
  "days_range": "Days 1-7",
  "goals": ["完整的周目标描述"],
  "activities": [
    {
      "sequence": 1,  // ✨ 新增：用于正确排序
      "day_label": "Day 1",
      "day_range": "1",
      "title_zh": "项目启动：杰提的神秘故事",
      "title_en": "Project Kick-off: The Mystery of Jaytee",
      "duration": "约30分钟",
      "content": "【完整的markdown内容 - 包含所有教学步骤、说明、示例等】"  // ✨ 新增：完整内容
    }
  ]
}
```

---

## 📋 文件清单

### 生成的SQL文件（位于 `scripts/sql_updates_full/`）

| 文件名 | 项目 | 大小 |
|-------|------|------|
| `update_project_01_第一阶段_宠物侦探.sql` | 宠物侦探 | ~30KB |
| `update_project_02_第二阶段_杰提计划.sql` | 杰提计划 | ~67KB |
| `update_project_03_第三阶段_贝尔不等式与生命系统.sql` | 贝尔不等式 | ~123KB |
| `update_project_04_第一阶段_植物的悄悄话.sql` | 植物的悄悄话 | ~26KB |
| `update_project_05_第二阶段_远程蚁巢.sql` | 远程蚁巢 | ~56KB |
| `update_project_06_第三阶段_记忆的水实验.sql` | 记忆的水实验 | ~91KB |
| `update_project_07_第四阶段_意识地理学.sql` | 意识地理学 | ~60KB |
| `update_project_08_第一阶段_情绪的颜色.sql` | 情绪的颜色 | ~29KB |
| `update_project_09_第二阶段_跨越距离的凝视.sql` | 跨越距离的凝视 | ~46KB |
| `update_project_10_第三阶段_意念撼动概率.sql` | 意念撼动概率 | ~75KB |
| `update_project_11_第四阶段_幻肢与纠缠.sql` | 幻肢与纠缠 | ~98KB |
| **总计** | **11个项目** | **~700KB** |

### 辅助文件

- `scripts/icarus_full_content.json` - 提取的完整元数据（720KB）
- `scripts/extract_icarus_full_content.py` - 完整内容提取脚本
- `scripts/generate_full_content_sql.py` - SQL生成脚本
- `scripts/sql_updates_full/master_update_all.sql` - 主更新脚本

---

## 🚀 执行SQL更新的方法

### 方法一：使用Supabase Dashboard（推荐）

#### 步骤：

1. **登录 Supabase Dashboard**
   - 访问: https://supabase.com
   - 登录到您的项目

2. **进入 SQL Editor**
   - 左侧导航栏 → SQL Editor

3. **执行第一个项目（测试）**
   - 打开文件: `scripts/sql_updates_full/update_project_01_第一阶段_宠物侦探.sql`
   - 复制全部内容
   - 粘贴到SQL Editor
   - 点击 **Run** 执行
   - 检查验证查询结果（应该显示4周，12活动）

4. **依次执行其余项目**
   - 重复上述步骤执行其余10个SQL文件
   - 建议按顺序执行（项目1-11）

5. **验证所有更新**
   ```sql
   SELECT
     sequence_number,
     title,
     jsonb_array_length(week_plan) as weeks_count,
     (
       SELECT COUNT(*)
       FROM jsonb_array_elements(week_plan) w,
            jsonb_array_elements(w->'activities') a
     ) as activities_count
   FROM course_contents
   WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
   ORDER BY sequence_number;
   ```

   **预期结果**:
   ```
   seq | title                    | weeks | activities
   ----|--------------------------|-------|------------
    1  | 第一阶段：宠物侦探           |   4   |    12
    2  | 第二阶段：杰提计划           |   8   |    24
    3  | 第三阶段：贝尔不等式         |  16   |    35
    4  | 第一阶段：植物的悄悄话       |   4   |     8
    5  | 第二阶段：远程蚁巢           |   8   |    17
    6  | 第三阶段：记忆的水实验       |  12   |    25
    7  | 第四阶段：意识地理学         |   8   |    16
    8  | 第一阶段：情绪的颜色         |   4   |     9
    9  | 第二阶段：跨越距离的凝视     |   6   |    12
   10  | 第三阶段：意念撼动概率       |  10   |    20
   11  | 第四阶段：幻肢与纠缠         |  12   |    24
   ```

---

### 方法二：使用Supabase CLI（高级用户）

```bash
# 进入项目目录
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 逐个执行SQL文件
supabase db execute -f scripts/sql_updates_full/update_project_01_第一阶段_宠物侦探.sql
supabase db execute -f scripts/sql_updates_full/update_project_02_第二阶段_杰提计划.sql
# ... 依次执行其余文件
```

---

## ✅ 验证内容完整性

### 1. 检查某个活动的详细内容

```sql
SELECT
  sequence_number,
  title,
  week_plan->0->'activities'->0->'title_zh' as first_activity_title,
  length(week_plan->0->'activities'->0->>'content') as content_length
FROM course_contents
WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
  AND sequence_number = 1;
```

**预期**: `content_length` 应该在 3000-5000 字符左右（包含完整教学内容）

### 2. 查看某个活动的完整内容

```sql
SELECT
  week_plan->0->'activities'->0->>'content' as full_content
FROM course_contents
WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
  AND sequence_number = 1;
```

### 3. 检查sequence字段是否存在

```sql
SELECT
  week_plan->0->'activities'->0->'sequence' as has_sequence
FROM course_contents
WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
  AND sequence_number = 1;
```

**预期**: 应该返回数字（如 `1`），而不是 null

---

## 🎨 后续前端更新

### 需要修改的文件

#### 1. 课程详情页面

**文件**: `app/courses/[system_key]/[content_id]/page.tsx`

需要更新以：
- 读取新的 `sequence` 字段并按其排序activities
- 渲染完整的 `content` markdown内容
- 显示 `title_zh` 和 `title_en`
- 显示 `day_label` 和 `day_range`

#### 2. 管理后台课程详情

**文件**: `app/admin/courses/pbl/projects/[projectId]/page.tsx`

需要显示：
- 完整的周计划内容
- 按sequence排序的活动列表
- 详细的markdown内容渲染

---

## 📝 重要提示

1. **备份数据库**: 执行更新前，强烈建议备份数据库
2. **分批执行**: 可以先执行1-2个项目测试，确认无误后再执行剩余项目
3. **内容很大**: 每个SQL文件都很大，确保您的网络连接稳定
4. **检查结果**: 每执行一个文件后，都要检查验证查询的结果

---

## 🎉 预期效果

更新完成后：

1. ✅ **前端展示**: 每个Day显示完整的教学内容（数千字）
2. ✅ **排序正确**: Day 1、Day 2、Day 3... 按sequence正确排序
3. ✅ **内容丰富**: 包含所有教学步骤、示例、任务要求、提交格式等
4. ✅ **与原文档一致**: 严格按照原markdown文档提取，未做任何简化

---

**文档生成时间**: 2025-11-17
**作者**: Claude Code
**版本**: 2.0 - Full Content Update
