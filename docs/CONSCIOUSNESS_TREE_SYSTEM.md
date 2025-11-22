# 意识树系统架构文档

## 🌳 系统概述

意识树是"未来心智学院"的核心功能，用于可视化学员的学习成长轨迹。系统采用**累积生长制**，树只会长大不会缩小。

## 📊 完整数据流程

```
用户学习行为（对话/作业/项目）
    ↓
数据库记录
    ├─ gaia_conversations (对话记录)
    ├─ user_submissions (作业提交)
    └─ user_selected_projects (PBL项目)
    ↓
Edge Function: generate-student-summary  ← 每周执行
    ↓
生成三部分总结
    ├─ dialogue (对话维度总结)
    ├─ coursework (作业维度总结)
    └─ projects (项目维度总结)
    ↓
存储到: student_summaries.course_summaries (jsonb)
    ↓
Edge Function: evaluate-and-grow-tree  ← 手动触发/定期执行
    ↓
调用 AI "The Gardener" (GPT-4o-mini)
  分析总结，计算意识树生长增量
    ↓
更新: profiles.consciousness_tree_view (jsonb)
    ↓
前端展示: 意识树可视化
```

## 🗄️ 数据库表结构

### 1. student_summaries（学员综合评价表）

**字段**：`course_summaries` (jsonb)

**三部分总结结构**：

```json
{
  "dialogue": {
    "summary": "该学生在对话中展现出深度思考...",
    "message_count": 23,
    "conversation_count": 5,
    "last_summarized_at": "2025-11-21T13:20:48.990Z"
  },
  "coursework": {
    "summary": "该学生在作业提交方面...",
    "submission_count": 9,
    "interaction_count": 75,
    "last_summarized_at": "2025-11-21T13:21:00.604Z"
  },
  "projects": {
    "summary": "该学生在PBL项目参与...",
    "total_project_count": 4,
    "active_project_count": 4,
    "last_summarized_at": "2025-11-21T13:21:06.572Z"
  },
  "last_full_update": "2025-11-21T13:21:06.573Z"
}
```

### 2. profiles（用户档案表）

**字段**：`consciousness_tree_view` (jsonb)

**意识树结构**：

```json
{
  "roots": {
    "count": 15,          // 涉及的知识领域数量
    "depth_level": 4.5,   // 平均探索深度 (0-10)
    "is_solid": true      // 是否为实线（count > 0）
  },
  "trunk": {
    "thickness": 8,       // 觉察力/定力 (0-50)
    "height_level": 25,   // 坚持练习的时长 (0-100)
    "is_solid": true      // 依赖于 roots.is_solid AND thickness > 0
  },
  "branches": {
    "count": 5,           // 项目里程碑/深度探究次数
    "avg_length": 3.5,    // 洞见的平均精辟程度 (0-10)
    "is_solid": true      // 依赖于 trunk.is_solid AND count > 0
  },
  "leaves": {
    "count": 12,          // Aha Moments 总数
    "is_solid": true      // 依赖于 branches.is_solid
  },
  "fruits": {
    "count": 2,           // 完成项目/贡献总数
    "is_solid": false     // 依赖于 branches.is_solid
  }
}
```

## ⚙️ Edge Functions（边缘函数）

### 1. generate-student-summary

**文件位置**：`supabase/functions/generate-student-summary/index.ts`

**功能**：为所有学员生成AI综合评价（三部分总结）

**触发方式**：每周日凌晨3点（定时任务）

**AI模型**：GPT-4o-mini

**输出**：三部分总结（dialogue、coursework、projects）

### 2. evaluate-and-grow-tree

**文件位置**：`supabase/functions/evaluate-and-grow-tree/index.ts`

**功能**：根据三部分总结，计算意识树生长增量

**触发方式**：
- Fire-and-Forget 模式（立即返回200，后台异步计算）
- 手动触发或定期执行

**AI模型**：GPT-4o-mini（"The Gardener" - 首席园丁）

**核心逻辑**：

#### 生长法则

1. **根 (Roots) - 知识领域**
   - `count` = 旧count + 新发现的领域数量
   - `depth_level` = 根据深度探讨适当增加（每次+0.5，上限10）
   - `is_solid` = count > 0

2. **树干 (Trunk) - 觉察与定力**
   - `thickness` = 每次深刻自我觉察或冥想练习 +2
   - `height_level` = 有持续学习/练习行为 +1
   - `is_solid` = roots.is_solid AND thickness > 0

3. **枝 (Branches) - 探究里程碑**
   - `count` = 旧count + 新识别的里程碑数量
   - `avg_length` = 根据精彩程度微调
   - `is_solid` = trunk.is_solid AND count > 0

4. **叶 (Leaves) - 顿悟时刻**
   - `count` = 旧count + 新发现的顿悟数量
   - `is_solid` = branches.is_solid

5. **果 (Fruits) - 创造与贡献**
   - `count` = 旧count + 新发现的贡献数量
   - `is_solid` = branches.is_solid

#### 特殊规则

- **只增不减**：除非数据重置，否则数值不应减少
- **虚线连锁**：如果树干变虚，上面的枝叶果必须强制变虚
- **畸形允许**：允许 roots.count 很大（博学）但 trunk.thickness 很小（无定力）

## 🎨 前端可视化

### 组件位置

- **意识树Canvas**：`components/consciousness/ConsciousnessTreeCanvas.tsx`
- **意识树生成器**：`lib/utils/consciousnessTreeGenerator.ts`
- **测试工作台**：`components/consciousness/ConsciousnessTreeClient.tsx`（仅校长可见）
- **学生视图**：`components/consciousness/ConsciousnessTreeView.tsx`

### 特性

1. **空树状态**：显示闪烁的暗红色种子（等待探索和发芽）
2. **缩放功能**：学生视图支持50%-300%缩放
3. **实时渲染**：基于Canvas的粒子系统
4. **权限控制**：
   - 校长：可访问测试工作台，手动调节参数
   - 学生/教师：只能查看真实数据生成的意识树

## 🔧 如何触发意识树生长

### 方法1：手动触发（开发/调试）

```typescript
const response = await fetch('/api/evaluate-tree', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId: 'user-uuid' })
});
```

### 方法2：自动触发（生产环境）

- 设置定时任务（如每周一次）
- 或在用户完成关键行为后触发（作业提交、项目完成等）

## 📈 查询用户意识树数据

### SQL 查询总结

```sql
SELECT
  auth.users.email,
  student_summaries.course_summaries
FROM student_summaries
JOIN auth.users ON student_summaries.user_id = auth.users.id
WHERE auth.users.email = 'user@example.com';
```

### SQL 查询意识树

```sql
SELECT
  auth.users.email,
  profiles.consciousness_tree_view
FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'user@example.com';
```

## 🚨 常见问题排查

### 1. 意识树不更新？

检查清单：
- [ ] `student_summaries` 表是否有最新总结？
- [ ] Edge Function `evaluate-and-grow-tree` 是否成功执行？
- [ ] OpenAI API Key 是否配置正确？
- [ ] 查看 Edge Function 日志

### 2. 总结数据为空？

- 确认用户是否有学习行为（对话/作业/项目）
- 检查 `generate-student-summary` 是否定时执行

### 3. AI 返回的树结构不合法？

- 查看 Edge Function 日志中的 `[AI原始输出]`
- 检查 `validateTreeStructure` 函数的验证逻辑

## 📚 相关文件索引

### Edge Functions
- `supabase/functions/generate-student-summary/index.ts` - 生成三部分总结
- `supabase/functions/evaluate-and-grow-tree/index.ts` - 计算意识树增量

### 前端组件
- `components/consciousness/ConsciousnessTreeCanvas.tsx` - Canvas渲染
- `components/consciousness/ConsciousnessTreeClient.tsx` - 测试工作台
- `components/consciousness/ConsciousnessTreeView.tsx` - 学生视图
- `lib/utils/consciousnessTreeGenerator.ts` - 树生成算法

### 数据库表
- `student_summaries` - 存储三部分总结
- `profiles` - 存储意识树结构
- `gaia_conversations` - 对话记录
- `user_submissions` - 作业提交记录
- `user_selected_projects` - PBL项目选择记录

## 🎯 设计哲学

> "The tree never shrinks, it only grows."

意识树采用**累积生长制**，象征着学习的不可逆性和持续成长。即使学员暂时停止学习，树也不会缩小，只会等待下一次生长。

---

**最后更新**：2025-11-22
**维护者**：Claude Code (Anthropic)
