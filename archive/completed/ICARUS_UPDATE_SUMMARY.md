# 伊卡洛斯计划完整数据更新总结

## 📊 更新概览

**更新时间**: 2025-11-17
**状态**: SQL已生成，待执行

### 当前数据库状态
- ❌ 所有11个项目仅有 **1周** 数据（不完整）
- ❌ 缺失 **81周** 的丰富内容

### 更新后状态
- ✅ 11个项目共计 **92周** 完整数据
- ✅ 202个详细活动计划
- ✅ 每个项目都有差异化图标

---

## 🎯 已完成的工作

### 1. ✅ 读取原文档并提取完整元数据
- 文件: `readme/三大课程资料/（细化完整版）未来教育PBL课程体系："伊卡洛斯计划：探索现实的边缘".md`
- 大小: 675KB, 6070行
- 结果: 成功提取所有11个项目的完整周计划

### 2. ✅ 设计差异化图标系统
- 文件: `scripts/icarus_icon_mapping.json`
- 设计思路:
  - **模块一（无形的纽带）**: PawPrint, Microscope, Atom
  - **模块二（无形的地图）**: Sprout, Bug, Droplet, MapPin
  - **模块三（延展的心灵）**: Palette, Eye, Dices, Waves

### 3. ✅ 创建Python脚本提取所有周计划数据
- 文件: `scripts/extract_icarus_complete_metadata.py`
- 功能: 自动解析markdown文档，提取所有项目的周计划、目标、活动
- 输出: `scripts/icarus_complete_metadata.json`

### 4. ✅ 生成完整的SQL更新语句
- 文件: `scripts/update_icarus_week_plans.sql`
- 使用PostgreSQL dollar-quoting避免转义问题
- 包含11条UPDATE语句和验证查询

### 5. ⏳ 更新Supabase数据库
- **状态**: SQL已生成，需手动执行
- **原因**: MCP工具有字符限制，无法直接执行大型JSON更新

---

## 📋 项目详细统计

| 序号 | 项目名称 | 当前周数 | 更新后周数 | 图标 | 颜色 |
|------|---------|---------|-----------|------|------|
| 1 | 第一阶段：宠物侦探 | 1周 | **4周** | PawPrint | purple |
| 2 | 第二阶段：杰提计划 | 1周 | **8周** | Microscope | blue |
| 3 | 第三阶段：贝尔不等式与生命系统 | 1周 | **16周** | Atom | indigo |
| 4 | 第一阶段：植物的悄悄话 | 1周 | **4周** | Sprout | green |
| 5 | 第二阶段：远程蚁巢 | 1周 | **8周** | Bug | amber |
| 6 | 第三阶段：记忆的水实验 | 1周 | **12周** | Droplet | cyan |
| 7 | 第四阶段：意识地理学 | 1周 | **8周** | MapPin | teal |
| 8 | 第一阶段：情绪的颜色 | 1周 | **4周** | Palette | pink |
| 9 | 第二阶段：跨越距离的凝视 | 1周 | **6周** | Eye | violet |
| 10 | 第三阶段：意念撼动概率 | 1周 | **10周** | Dices | orange |
| 11 | 第四阶段：幻肢与纠缠 | 1周 | **12周** | Waves | rose |
| **总计** | **11个项目** | **11周** | **92周** | - | - |

---

## 🚀 执行SQL更新的方法

### 方法一：使用Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 进入项目的 **SQL Editor**
3. 打开文件 `scripts/update_icarus_week_plans.sql`
4. 复制全部内容粘贴到SQL Editor
5. 点击 **Run** 执行
6. 检查最后的验证查询结果

### 方法二：使用Supabase CLI

```bash
# 进入项目目录
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 执行SQL文件
supabase db execute -f scripts/update_icarus_week_plans.sql
```

### 方法三：逐个执行UPDATE语句

如果SQL文件太大，可以分批执行。SQL文件中每个UPDATE语句都是独立的，可以单独执行。

---

## ✅ 验证更新是否成功

执行以下SQL查询验证：

```sql
SELECT
  sequence_number,
  title,
  jsonb_array_length(week_plan) as weeks_count,
  (week_plan->0->>'week') as first_week,
  (week_plan->(jsonb_array_length(week_plan)-1)->>'week') as last_week
FROM course_contents
WHERE system_id = '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid
ORDER BY sequence_number;
```

**预期结果**：
- 所有11个项目的 `weeks_count` 应该分别为: 4, 8, 16, 4, 8, 12, 8, 4, 6, 10, 12
- `first_week` 和 `last_week` 应该对应每个项目的周范围

---

## 📁 相关文件清单

```
futuremind-new/
├── scripts/
│   ├── icarus_icon_mapping.json            # 图标映射方案
│   ├── extract_icarus_complete_metadata.py # 元数据提取脚本
│   ├── icarus_complete_metadata.json       # 提取的完整元数据
│   ├── generate_icarus_sql_updates.py      # SQL生成脚本
│   └── update_icarus_week_plans.sql        # ⭐ 最终SQL更新文件
├── icarus_full_temp.md                      # 原始文档副本
├── ICARUS_UPDATE_SUMMARY.md                 # 本文档
└── CLAUDE_LESSONS_LEARNED.md                # 错误教训记录
```

---

## 🎨 后续待办事项

### 1. 执行SQL更新 Supabase数据库
- 使用上述方法之一执行 `scripts/update_icarus_week_plans.sql`

### 2. 更新前端和后台代码以显示图标

需要修改以下文件以使用新的图标系统：

#### 2.1 管理后台课程列表页面
**文件**: `app/admin/page.tsx` (大约行号300-400)

需要修改课程显示部分，根据项目的 `sequence_number` 或标题匹配对应图标：

```typescript
// 添加图标映射
const ICARUS_ICONS = {
  1: PawPrint,
  2: Microscope,
  3: Atom,
  4: Sprout,
  5: Bug,
  6: Droplet,
  7: MapPin,
  8: Palette,
  9: Eye,
  10: Dices,
  11: Waves
}

// 在渲染课程卡片时使用
const Icon = ICARUS_ICONS[course.sequence_number] || BookOpen
```

#### 2.2 前端Portal页面
**文件**: `components/portal/PortalClient.tsx`

在 `getCourseIcon` 函数中添加伊卡洛斯项目的图标逻辑。

### 3. 验证前端和后台显示

- 打开管理后台 `/admin`，检查伊卡洛斯项目是否显示不同图标
- 打开Portal页面 `/portal`，检查我的课程列表
- 点击进入具体课程，检查周计划是否显示完整

---

## 📝 备注

1. **数据库备份**: 执行SQL前建议备份数据库
2. **图标导入**: 确保所有使用的图标都已从 `lucide-react` 导入
3. **测试环境**: 建议先在开发/测试环境执行，验证无误后再更新生产环境

---

## 🎉 预期效果

更新完成后：

1. ✅ 管理后台：每个伊卡洛斯项目显示独特的图标（不再是统一的树苗）
2. ✅ 课程详情：每个项目显示完整的周计划（4-16周不等）
3. ✅ 用户体验：学生可以看到完整、丰富的课程内容
4. ✅ 数据完整性：与原文档保持严格一致

---

**文档生成时间**: 2025-11-17
**作者**: Claude Code
**版本**: 1.0
