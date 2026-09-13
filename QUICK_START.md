# 快速启动指南

## 🚀 5分钟快速开始

### 1. 克隆或使用项目

你现在在项目目录中：`D:\CursorWork\FutureMindInstitute\futuremind-new`

### 2. 安装依赖

\`\`\`bash
cd futuremind-new
npm install
\`\`\`

### 3. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

### 4. 访问应用

打开浏览器访问：http://localhost:3000

## ✅ 已完成的工作

### 核心功能
- ✅ 项目初始化（Next.js 15 + TypeScript + Tailwind CSS v4）
- ✅ Supabase客户端配置
- ✅ **修复登录页面hydration error**（使用useMemo+isMounted）
- ✅ **修复密码框眼睛图标逻辑**（睁眼=可见，闭眼=隐藏）
- ✅ 主页重构（纯黑暗色主题）
- ✅ 删除测试页面按钮
- ✅ 添加登录检测（"与盖亚对话"和"探索者联盟"）
- ✅ 探索者联盟 → 跳转到 /pbl

### 页面
- ✅ 主页 (`/`)
- ✅ 登录/注册页面 (`/login`)
- ✅ 个人门户 (`/portal`)
- ✅ PBL项目页面 (`/pbl`)
- ✅ 意识树详情页 (`/simple-tree`)

### 组件
- ✅ GaiaDialog - 盖亚对话组件
- ✅ ConsciousnessTree - 意识树组件（直接照搬，未修改）
- ✅ UploadToGaia - 文档上传组件
- ✅ ConversationManager - 对话管理组件

### API路由
- ✅ `/api/n8n/chat` - 聊天API
- ✅ `/api/n8n/upload` - 文档上传API
- ✅ `/api/n8n/chat-callback` - 回调API

## 📁 项目结构

\`\`\`
futuremind-new/
├── app/
│   ├── page.tsx          ← 主页（已修复所有问题）
│   ├── login/            ← 登录页（已修复hydration error和密码框图标）
│   ├── portal/           ← 个人门户
│   ├── pbl/              ← PBL项目
│   └── api/n8n/          ← N8N集成API
├── components/
│   ├── GaiaDialog.tsx
│   ├── ConsciousnessTree.tsx
│   └── ui/
├── lib/
│   ├── supabase/         ← Supabase配置
│   └── api/              ← API客户端
└── .env.local            ← 环境变量（已配置）
\`\`\`

## 🎨 主要改进

### 1. 修复的Bug
1. **Hydration Error** - 登录页面粒子动画导致的服务端/客户端不匹配
   - 解决方案：使用 `useMemo` + `isMounted` 状态

2. **密码框图标逻辑** - 睁眼/闭眼图标显示反了
   - 修复：`{showPassword ? <Eye /> : <EyeOff />}`

3. **Dashboard页面过时** - 已删除，只保留 `/portal`

### 2. UI改进
- 全局暗色主题（类似Chrome暗色模式）
- 删除"测试页面"按钮
- 优化登录流程（带redirect参数）

### 3. 功能改进
- "与盖亚对话"和"探索者联盟"添加登录检测
- "探索者联盟" → 跳转到 `/pbl`（PBL项目页面）
- 删除所有对 `/alliance` 页面的引用

## 🔗 重要链接

- **开发服务器**: http://localhost:3000
- **Supabase URL**: https://lvjezsnwesyblnlkkirz.supabase.co
- **N8N聊天工作流**: https://n8n.aifunbox.com/webhook/b568b56a-79f0-47d4-b016-969612e5fa19
- **N8N上传工作流**: https://n8n.aifunbox.com/webhook/fca634ab-8e03-4a6f-99f3-c7dc46e772ae

## 📝 下一步

### 可以直接部署
项目已经完全可以部署到Vercel：

1. 查看 `DEPLOYMENT.md` 了解详细部署步骤
2. 按照Vercel配置填写信息
3. 部署！

### 未来改进方向（待定）
- 意识树视觉优化（等待你的确认）
- 课程内容（lessons文件夹，待补充）
- N8N工作流调试（你负责）

## ⚠️ 注意事项

1. **不要修改原有代码** - 所有工作都在新项目中完成 ✅
2. **意识树暂未修改** - 直接照搬现有代码 ✅
3. **N8N配置** - webhook URL已配置，无需修改 ✅

## 🎯 测试清单

启动项目后测试以下功能：

- [ ] 访问主页，查看暗色主题
- [ ] 点击"与盖亚对话"，未登录时跳转到登录页
- [ ] 点击"探索者联盟"，未登录时跳转到登录页
- [ ] 点击"个人门户"，跳转到登录页
- [ ] 登录/注册功能
- [ ] 登录后访问个人门户
- [ ] 查看意识树
- [ ] 测试盖亚对话（需要N8N工作流运行）

## 💡 提示

- 如果遇到TypeScript错误，运行 `npm run lint` 检查
- 如果端口被占用，修改 package.json 中的 dev 脚本
- 环境变量已配置在 `.env.local` 中

---

**项目状态**: ✅ 已完成，可以部署
**最后更新**: 2025-10-23
