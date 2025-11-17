# Claude Code 错误教训记录

> **目的**：记录所有在开发过程中犯过的错误，避免重复犯错
> **更新时间**：每次犯错后立即更新

---

## 🚨 关键原则（务必遵守）

### ⚠️ **强制执行：每次修改代码后立即执行**

```bash
# === 第1步：查看所有修改和未跟踪文件 ===
git status

# === 第2步：搜索所有import语句，检查导入的文件是否存在 ===
# 对于每个修改的文件，执行：
grep -n "^import\|^from.*import" [修改的文件]

# === 第3步：检查每个导入的文件是否在git中 ===
# 如果文件在 "Untracked files" 中，必须添加！
git ls-files [导入的文件路径] || echo "文件未跟踪，需要添加！"

# === 第4步：检查差异 ===
git diff

# === 第5步：一次性添加所有相关文件 ===
git add [所有相关文件]

# === 第6步：再次确认 ===
git status
git diff --cached

# === 第7步：提交并推送 ===
git commit -m "..."
git push
```

**如果跳过以上任何一步，必定会出错！**

---

### 1. Git 提交前的完整检查清单
- [ ] 运行 `git status` 查看**所有**修改的文件
- [ ] 使用 `Grep` 或 `Bash` 搜索相关文件，确保没有遗漏
- [ ] 检查每个修改文件的**依赖关系**（imports, API调用等）
- [ ] 如果添加了新的API方法，确保**同时提交API文件和调用它的所有组件**
- [ ] 提交前用 `git diff` 检查每个文件的改动是否合理
- [ ] **绝不**分批提交相互依赖的文件

### 2. 新增功能的完整性检查
- [ ] 新增API方法：必须同时提交API文件 + 所有调用方
- [ ] 新增组件：必须同时提交组件文件 + 导入它的页面
- [ ] 新增类型定义：必须同时提交类型文件 + 使用它的所有文件
- [ ] 修改接口：必须同时更新所有实现该接口的文件

### 3. TypeScript 构建错误的预防
- [ ] 本地运行 `npm run build` 验证（如果可能）
- [ ] 检查所有 import 语句是否正确
- [ ] 确保类型导入和实现导入都存在
- [ ] 验证所有新方法都有正确的类型签名

---

## 📋 错误记录

### ❌ 错误 #1: 导入了组件但忘记提交组件文件 (2025-01-17 - 第2次)

**错误描述**：
- `app/tree-preview/page.tsx` 导入了 `LottieTreeRenderer` 组件
- 组件文件 `components/ui/lottie-tree-renderer.tsx` 存在于本地
- 组件依赖的动画文件 `public/animations/growing-plant.json` 也存在
- **但这两个文件都没有提交到 git**
- **导致**：Vercel构建失败，报错 `Module not found: Can't resolve '@/components/ui/lottie-tree-renderer'`

**根本原因**：
- **又犯了同样的错误！** 修改页面导入组件，但忘记提交组件文件
- 没有检查 `git status` 中的 untracked files
- 没有意识到新组件及其依赖都需要提交

**正确做法**：
```bash
# 1. 检查 untracked files
git status

# 2. 查找所有导入的新组件
grep -r "import.*from '@/components" app/tree-preview/

# 3. 检查这些组件是否存在于 untracked files 中
# 4. 同时提交组件文件及其所有依赖
git add components/ui/lottie-tree-renderer.tsx \
        public/animations/growing-plant.json \
        app/tree-preview/page.tsx
```

**教训**：
- ✅ **修改页面添加导入时，必须检查新导入的组件是否已提交**
- ✅ **新组件的所有依赖（JSON、图片、CSS等）也必须一起提交**
- ✅ 提交前运行 `git status` 检查 untracked files
- ✅ 使用 `Grep` 搜索所有 import 语句，确保导入的文件都已提交

---

### ❌ 错误 #2: 分批提交相互依赖的文件 (2025-01-17 - 第1次)

**错误描述**：
- 添加了新的API方法 `getTreeGrowthData()` 到 `lib/api/consciousness-tree.ts`
- 在 `dynamic-consciousness-tree-v2.tsx` 中调用了这个方法
- **第一次提交**只提交了组件文件，没有提交API文件
- **导致**：Vercel构建失败，TypeScript报错 `Property 'getTreeGrowthData' does not exist`

**根本原因**：
- 没有意识到API文件也被修改了
- 没有检查 `git status` 中的所有修改文件
- 盲目地只提交了看到的组件文件

**正确做法**：
```bash
# 1. 先查看所有修改
git status

# 2. 搜索所有使用了新方法的文件
grep -r "getTreeGrowthData" components/ lib/

# 3. 一次性提交所有相关文件
git add lib/api/consciousness-tree.ts \
        components/ui/dynamic-consciousness-tree.tsx \
        components/ui/dynamic-consciousness-tree-v2.tsx \
        components/ui/dynamic-consciousness-tree-v3.tsx

# 4. 提交前再次确认
git diff --cached
```

**教训**：
- ✅ 新增API方法时，必须同时提交API定义和所有调用方
- ✅ 提交前必须运行 `git status` 并检查每个修改的文件
- ✅ 使用 `Grep` 工具搜索所有相关引用
- ✅ **绝不**假设只有某几个文件需要提交

---

### ❌ 错误 #2: 修改文件后未读取就尝试编辑 (历史错误)

**错误描述**：
- 尝试使用 `Edit` 工具修改文件
- 报错：`File has not been read yet. Read it first before writing to it.`

**根本原因**：
- Edit工具要求必须先用Read工具读取文件
- 这是为了确保编辑的内容是基于最新版本

**正确做法**：
```typescript
// 1. 先读取
<Read file_path="..." />

// 2. 再编辑
<Edit file_path="..." old_string="..." new_string="..." />
```

**教训**：
- ✅ 使用 Edit 前必须先 Read
- ✅ 即使是刚才读过的文件，如果会话中断也要重新读取

---

### ❌ 错误 #3: UTF-8 编码问题 (历史错误)

**错误描述**：
- Windows环境下Python脚本输出中文时报错
- `UnicodeEncodeError: 'gbk' codec can't encode character`

**正确做法**：
```python
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
```

**教训**：
- ✅ Windows环境的Python脚本开头加UTF-8配置
- ✅ 所有文件保存为UTF-8编码

---

## 🎯 未来改进计划

### 提交前自动检查脚本
创建一个 `pre-commit-check.sh` 脚本：
```bash
#!/bin/bash
echo "🔍 检查未提交的修改..."
git status

echo "🔍 检查TypeScript类型错误..."
npm run type-check || true

echo "🔍 检查是否有遗漏的API调用..."
# 添加自定义检查逻辑
```

### 使用TodoWrite跟踪
在进行复杂修改时：
1. 用 `TodoWrite` 列出所有需要修改的文件
2. 逐个标记为 completed
3. 提交前检查 todo list 确保全部完成

---

## 📌 快速参考

**每次提交前必做**：
```bash
# 1. 查看状态
git status

# 2. 搜索相关引用（替换为实际的方法/类名）
grep -r "关键字" .

# 3. 检查差异
git diff

# 4. 添加所有相关文件
git add [所有相关文件]

# 5. 再次确认
git diff --cached

# 6. 提交
git commit -m "..."

# 7. 推送
git push
```

---

## 💡 记住

> **"不要假设，要验证"**
> - 不要假设只需要提交某些文件
> - 不要假设其他文件没有改动
> - 不要假设构建会成功
> - **总是验证、验证、再验证！**

---

*最后更新：请在每次犯错后立即更新此文档*
