# Edge Function 部署说明

## 问题
前端调用Edge Function后，返回的`analysis`字段为`undefined`，因为服务器上的Edge Function还是旧版本。

## 解决方案
手动部署最新的Edge Function代码到Supabase。

---

## 部署步骤

### 方法1：通过Supabase Dashboard（推荐）

1. **访问Dashboard**
   - 打开：https://supabase.com/dashboard/project/lvjezsnwesyblnlkkirz/functions
   - 登录账号

2. **找到函数**
   - 点击 `evaluate-consciousness-tree` 函数

3. **更新代码**
   - 点击 "Edit" 或 "Deploy" 按钮
   - 删除所有旧代码
   - 复制粘贴下方的完整代码
   - 点击 "Deploy" 按钮

4. **等待部署完成**
   - 看到 "Deployed successfully" 提示

5. **测试**
   - 回到意识树页面
   - 刷新浏览器
   - 再次点击 "✨ 真实计算（调用AI）" 按钮
   - 查看是否显示分析详情

---

## 完整代码

**文件路径**：`supabase/functions/evaluate-consciousness-tree/index.ts`

**代码内容**：见下方
（或直接从项目文件复制：supabase/functions/evaluate-consciousness-tree/index.ts）

---

## 关键改进点

新版本Edge Function返回的数据结构包含：

```json
{
  "success": true,
  "user_id": "xxx",
  "tree_view": {...},
  "analysis": {          // ← 新增！这是关键
    "dataSource": {...},
    "aiEvaluation": {...},
    "aiRawResponse": "..."
  },
  "timestamp": "..."
}
```

旧版本只返回：
```json
{
  "success": true,
  "user_id": "xxx",
  "tree_view": {...},
  "ai_reasoning": "简要理由"  // ← 旧版，缺少详细信息
}
```

---

## 验证部署成功

部署后，再次点击"真实计算"按钮，控制台应该显示：

```
[真实计算] 成功！分析数据: {dataSource: {...}, aiEvaluation: {...}}
```

**而不是**：
```
[真实计算] 成功！分析数据: undefined  // ← 说明还是旧版本
```

---

## 如果Dashboard无法部署

使用Supabase CLI（需要access token）：

```bash
# 1. 设置access token
export SUPABASE_ACCESS_TOKEN=your_token_here

# 2. 部署
cd supabase
npx supabase functions deploy evaluate-consciousness-tree --project-ref lvjezsnwesyblnlkkirz
```

Access token获取方式：
https://supabase.com/dashboard/account/tokens
