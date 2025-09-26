# 部署指南

## 🚀 部署要求

- **Node.js**: 20.x 或更高版本
- **npm**: 9.x 或更高版本
- **Supabase**: 项目必须已创建并配置

## 📋 环境变量配置

### 必需的环境变量

在您的部署平台设置以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth 配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-32-chars-minimum

# 可选配置
N8N_CHAT_WEBHOOK_URL=your-n8n-webhook-url
```

### 获取 Supabase 凭据

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 前往 Settings > API
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 部署平台配置

### Vercel 部署

1. **连接 GitHub 仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 导入您的 GitHub 仓库

2. **设置环境变量**
   - 在项目设置中添加上述环境变量
   - 确保 Node.js 版本设为 20.x

3. **部署设置**
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - Node.js 版本: 20.x

### GitHub Actions 部署

1. **设置 GitHub Secrets**
   - 前往仓库 Settings > Secrets and variables > Actions
   - 添加以下 secrets:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`

2. **Vercel Token（如果使用 Vercel）**
   - `VERCEL_TOKEN`: 从 Vercel 账户获取
   - `ORG_ID`: Vercel 组织 ID
   - `PROJECT_ID`: Vercel 项目 ID

## ✅ 验证部署

### 本地测试

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际值

# 3. 运行类型检查
npx tsc --noEmit

# 4. 运行 ESLint
npm run lint

# 5. 构建项目
npm run build

# 6. 启动生产服务器
npm start
```

### 部署后检查

- [ ] 首页可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] Supabase 数据库连接正常
- [ ] 所有页面都能正常加载
- [ ] 控制台无关键错误信息

## 🛠 故障排除

### 常见问题

1. **"supabaseUrl is required" 错误**
   - 确保设置了 `NEXT_PUBLIC_SUPABASE_URL`
   - 检查环境变量名称是否正确

2. **Node.js 版本过低警告**
   - 确保部署平台使用 Node.js 20+
   - 更新 `package.json` 中的 `engines` 字段

3. **构建失败**
   - 检查所有必需的环境变量是否已设置
   - 运行本地构建测试：`npm run build`

4. **Suspense 边界错误**
   - 已修复：所有使用 `useSearchParams` 和 `useParams` 的组件都已包装

### 调试命令

```bash
# 检查环境变量（本地）
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# 详细构建日志
npm run build --verbose

# 检查生产构建
npm run start
```

## 📞 支持

如遇到部署问题，请检查：

1. 环境变量配置是否正确
2. Node.js 版本是否为 20+
3. Supabase 项目是否正常运行
4. 网络连接是否正常

---

**注意**: 请勿将敏感信息（如 API 密钥）提交到代码仓库中。始终使用环境变量进行配置。