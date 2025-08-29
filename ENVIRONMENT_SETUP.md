# 环境变量配置指南

## 本地开发环境配置

### 1. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件，并添加以下配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzQyOTUsImV4cCI6MjA3MjAxMDI5NX0.sxXXFRlGutfdhYU0r-1o8Osf98JJgii9hPdFyFWlHgU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc

# 应用配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# AI 配置 (可选，用于未来AI集成)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 2. 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase服务角色密钥 | ✅ |
| `NEXTAUTH_URL` | 应用URL | ✅ |
| `NEXTAUTH_SECRET` | NextAuth密钥 | ✅ |
| `OPENAI_API_KEY` | OpenAI API密钥 | ❌ |
| `ANTHROPIC_API_KEY` | Anthropic API密钥 | ❌ |

### 3. 数据库设置

#### 3.1 运行数据库迁移

在Supabase SQL编辑器中执行以下脚本：

```sql
-- 复制并执行 supabase/migrations/001_initial_schema.sql 中的内容
```

#### 3.2 验证数据库表

确保以下表已创建：
- `profiles` - 用户资料
- `seasons` - 季度内容
- `user_progress` - 用户进度
- `gaia_conversations` - 对话记录
- `pbl_projects` - PBL项目
- `project_participants` - 项目参与者

### 4. 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用

## Vercel 部署配置

### 1. 环境变量设置

在Vercel项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzQyOTUsImV4cCI6MjA3MjAxMDI5NX0.sxXXFRlGutfdhYU0r-1o8Osf98JJgii9hPdFyFWlHgU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
```

### 2. 部署步骤

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 部署应用

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查Supabase URL和密钥是否正确
   - 确认数据库迁移已执行

2. **认证问题**
   - 检查NEXTAUTH_SECRET是否设置
   - 确认Supabase认证配置正确

3. **样式问题**
   - 确认Tailwind CSS配置正确
   - 检查组件类名是否正确

### 获取帮助

如有问题，请：
1. 检查控制台错误信息
2. 查看Supabase日志
3. 联系项目维护者

## 安全注意事项

⚠️ **重要提醒**：
- 不要将 `.env.local` 文件提交到Git
- 生产环境使用强密码
- 定期更新API密钥
- 使用环境变量管理敏感信息
