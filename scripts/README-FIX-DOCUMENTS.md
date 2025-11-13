# 修复历史项目缺失文档问题

## 问题描述

AIP聊天系统在选择项目后报错：
```
N8N webhook失败 (500): {"code":0,"message":"No item to return was found"}
```

**根本原因**：历史项目在创建时没有自动生成"项目智慧库"文档，导致N8N workflow的SQL查询返回空结果。

## 解决方案

### 步骤1：检查问题

在Supabase SQL编辑器中运行以下查询，查看有多少项目缺少文档：

```sql
SELECT
    COUNT(DISTINCT p.id) as missing_docs_count
FROM projects p
LEFT JOIN documents d
    ON p.id = d.project_id
    AND d.title = '项目智慧库'
WHERE d.id IS NULL;
```

### 步骤2：执行修复脚本

**方式一：使用Supabase CLI**
```bash
cd D:\CursorWork\FutureMindInstitute\futuremind-new
supabase db execute --file scripts/fix-missing-project-documents.sql
```

**方式二：在Supabase Dashboard中手动执行**
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `fix-missing-project-documents.sql` 的内容
4. 粘贴并执行

### 步骤3：验证修复

执行后，最后一个查询应该显示：
```
still_missing_count = 0
```

## 预期结果

- ✅ 所有历史项目都会自动创建一个"项目智慧库"文档
- ✅ AIP聊天系统选择项目后不再报错
- ✅ N8N workflow能正常执行SQL查询
- ✅ 新建项目会自动创建默认文档（已实现）

## 技术说明

修复脚本会为每个缺少文档的项目创建：
- **title**: `项目智慧库`
- **content**: 空字符串（与新建项目逻辑一致）
- **embedding**: NULL（正常，N8N不依赖embedding）
- **metadata**: `{"type": "project_knowledge_base", "auto_created": true}`

## 未来保障

`lib/aip/api.ts` 第290-309行的 `createProject` 函数已包含自动创建文档的逻辑，新建项目不会再出现此问题。
