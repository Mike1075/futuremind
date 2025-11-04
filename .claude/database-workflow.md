# 数据库迁移工作流程 - Claude Code 自动化指南

## ⚠️ 重要：每次数据库迁移后必须执行

当您使用 MCP Supabase 工具应用数据库迁移后（`mcp__supabase__apply_migration`），**必须立即**重新生成 TypeScript 类型定义。

## 自动化流程

### 1. 应用数据库迁移后
```
✅ 迁移已应用
↓
⚠️ 类型定义已过期！
↓
🔄 立即重新生成类型
```

### 2. 重新生成类型的命令

使用 MCP Supabase 工具：
```typescript
mcp__supabase__generate_typescript_types()
```

然后将结果写入：
```
lib/supabase/database.types.ts
```

### 3. 提交更改

```bash
git add lib/supabase/database.types.ts
git commit -m "chore: 更新Supabase类型定义（数据库迁移后）"
git push
```

## 为什么这很重要？

### 问题场景
2025-01-04 我们遇到了严重的类型错误问题：
- 应用了创建 `user_selected_projects` 表的迁移
- 给 `course_contents` 表添加了新字段
- **但没有重新生成类型定义**
- 结果：TypeScript 将所有新表/字段的类型推断为 `never`
- 导致：10+ 个文件出现类型错误，需要手动添加 `as any` 规避

### 根本原因
- `lib/supabase/database.types.ts` 文件包含了数据库schema的TypeScript类型
- 这个文件不会自动更新
- 数据库变化后如果不重新生成，TypeScript会不认识新的表/字段

### 解决方案
每次数据库迁移后立即重新生成类型 = 问题永远不会发生

## Claude Code 检查清单

作为 Claude Code，当我看到以下情况时，必须主动重新生成类型：

- ✅ 使用了 `mcp__supabase__apply_migration` 工具
- ✅ 创建了新表
- ✅ 给现有表添加了新字段
- ✅ 修改了表的schema

**检测信号**：
- 如果代码中出现 Supabase 类型错误（`type 'never'`, `Property does not exist`）
- 如果用户报告类型错误
- 如果 Vercel 构建失败并显示 Supabase 类型错误

**立即行动**：
1. 调用 `mcp__supabase__generate_typescript_types()`
2. 更新 `lib/supabase/database.types.ts`
3. 提交并推送
4. 告知用户问题已从根源解决

## 好处

### 开发体验
- ✅ IDE 自动补全表名和字段名
- ✅ 编译时捕获错误，不是运行时
- ✅ 不需要到处写 `as any`
- ✅ 重构更安全

### 避免的问题
- ❌ 类型推断为 `never`
- ❌ 属性访问错误
- ❌ 回调参数隐式 `any`
- ❌ 需要大量手动类型断言
- ❌ Vercel 构建失败

## 历史记录

### 2025-01-04: 初始问题和解决
- **问题**：应用PBL项目系统迁移后，出现大量类型错误
- **原因**：类型文件包含错误内容（"Must specify one of --local..."）
- **解决**：使用MCP工具重新生成完整类型定义
- **提交**：1cadffd "fix: 重新生成完整的Supabase类型定义"
- **教训**：数据库迁移后必须立即更新类型定义

## 用户无需操作

这个工作流程完全由 Claude Code 自动处理。用户不需要：
- ❌ 手动运行任何命令
- ❌ 记住任何步骤
- ❌ 安装额外工具

Claude Code 会在每次数据库迁移后自动检测并执行类型重新生成。
