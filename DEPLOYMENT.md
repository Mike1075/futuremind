# 部署指南

本文档说明如何将"未来心灵学院"项目部署到Vercel。

## 📋 部署前准备

### 1. 确认本地运行正常

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 确保没有错误
npm run build
\`\`\`

### 2. 准备环境变量

确保你有以下信息：
- Supabase项目URL
- Supabase匿名密钥（Anon Key）

## 🚀 Vercel部署步骤

### 方法一：通过Vercel Dashboard（推荐）

1. **登录Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

2. **导入项目**
   - 点击"Add New..." → "Project"
   - 选择你的GitHub仓库
   - 点击"Import"

3. **配置项目**

   根据你的截图1（1.png）：

   | 配置项 | 填写内容 |
   |--------|---------|
   | **Project Name** | `futuremind` 或 `future-mind-institute` |
   | **Framework Preset** | **Next.js** |
   | **Root Directory** | `.` （默认，留空） |
   | **Build Command** | `npm run build` （默认） |
   | **Output Directory** | `.next` （默认） |
   | **Install Command** | `npm install` （默认） |

4. **添加环境变量**

   点击"Environment Variables"展开，添加：

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzQyOTUsImV4cCI6MjA3MjAxMDI5NX0.sxXXFRlGutfdhYU0r-1o8Osf98JJgii9hPdFyFWlHgU
   ```

   **重要**：确保选择所有环境（Production, Preview, Development）

5. **点击Deploy**
   - Vercel会自动开始构建和部署
   - 等待2-5分钟

6. **访问你的网站**
   - 部署成功后，Vercel会提供一个URL
   - 例如：`https://futuremind.vercel.app`

### 方法二：通过Vercel CLI

\`\`\`bash
# 安装Vercel CLI
npm install -g vercel

# 登录Vercel
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
\`\`\`

## 🔧 部署后配置

### 1. 配置自定义域名（可选）

1. 在Vercel项目设置中找到"Domains"
2. 点击"Add Domain"
3. 输入你的域名
4. 按照指示配置DNS记录

### 2. 配置Supabase回调URL

在Supabase Dashboard中：

1. 进入"Authentication" → "URL Configuration"
2. 添加你的Vercel URL到"Site URL"
3. 添加到"Redirect URLs"：
   ```
   https://your-project.vercel.app/login
   https://your-project.vercel.app/portal
   ```

### 3. 测试关键功能

部署成功后，测试以下功能：

- ✅ 主页加载正常
- ✅ 登录/注册功能
- ✅ 盖亚对话（N8N连接）
- ✅ 个人门户页面
- ✅ PBL项目页面
- ✅ 意识树显示

## 🐛 常见问题

### 1. 环境变量未生效

**问题**：部署后提示找不到Supabase配置

**解决**：
- 检查环境变量名称是否正确（必须以`NEXT_PUBLIC_`开头）
- 确保环境变量应用到所有环境
- 重新部署项目

### 2. Build失败

**问题**：部署时构建失败

**解决**：
\`\`\`bash
# 本地测试构建
npm run build

# 检查是否有TypeScript错误
npm run lint
\`\`\`

### 3. 页面404错误

**问题**：某些页面显示404

**解决**：
- 检查`app`目录结构
- 确保所有必要的`page.tsx`文件存在
- 清除Vercel缓存并重新部署

### 4. N8N连接失败

**问题**：盖亚对话无法连接

**解决**：
- 检查N8N webhook URL是否正确
- 确保N8N工作流处于激活状态
- 查看Vercel函数日志（Functions → Logs）

## 📊 监控和日志

### 查看部署日志

1. 进入Vercel项目
2. 点击"Deployments"
3. 选择最新的部署
4. 查看"Building"和"Runtime Logs"

### 查看函数日志

1. 进入"Functions"标签
2. 选择具体的API函数
3. 查看实时日志

### 性能监控

1. 进入"Analytics"标签
2. 查看页面加载速度
3. 查看用户访问数据

## 🔄 更新部署

### 自动部署

- 推送到`main`分支会自动触发生产部署
- 推送到其他分支会创建预览部署

### 手动重新部署

1. 进入Vercel项目
2. 点击"Deployments"
3. 找到要重新部署的版本
4. 点击"Redeploy"

## 🌟 最佳实践

1. **使用环境分支**
   - `main` → 生产环境
   - `staging` → 预发布环境
   - `develop` → 开发环境

2. **定期备份Supabase数据**
   - 使用Supabase的备份功能
   - 导出重要数据

3. **监控错误**
   - 使用Vercel Analytics
   - 可选：集成Sentry进行错误跟踪

4. **性能优化**
   - 启用图片优化
   - 使用Vercel Edge Functions
   - 配置适当的缓存策略

## 📞 获取帮助

如果遇到问题：

1. 查看Vercel文档：https://vercel.com/docs
2. 查看Next.js文档：https://nextjs.org/docs
3. 联系项目负责人

---

**最后更新**: 2025-10-23
