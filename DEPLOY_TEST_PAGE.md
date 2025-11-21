# 部署测试页面到生产环境

## 🚀 方法一：使用现有Vercel项目（推荐）

您的项目已经部署在Vercel上，只需推送代码即可自动部署。

### 步骤1：提交代码到Git

```bash
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 查看修改的文件
git status

# 添加新创建的测试页面
git add pages/test-summarize.tsx
git add docs/测试页面使用指南.md
git add DEPLOY_TEST_PAGE.md

# 提交代码
git commit -m "feat: 添加用户总结功能Web测试界面

- 创建完整的测试页面 pages/test-summarize.tsx
- 自动加载有数据的测试用户
- 实时日志显示和AI结果展示
- 支持选择不同维度进行测试
- 自动验证数据库存储
- 使用GPT-5 Mini模型"

# 推送到远程仓库
git push origin master
```

### 步骤2：等待Vercel自动部署

Vercel会自动检测到新的commit并开始部署。

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的项目
3. 查看最新的部署状态
4. 部署完成后，访问 `https://your-domain.vercel.app/test-summarize`

---

## 🎯 方法二：首次部署到Vercel

如果项目还没有部署到Vercel：

### 步骤1：安装Vercel CLI

```bash
npm install -g vercel
```

### 步骤2：登录Vercel

```bash
vercel login
```

### 步骤3：部署项目

```bash
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 首次部署
vercel

# 按照提示操作：
# 1. 选择项目所在目录
# 2. 确认项目设置
# 3. 等待部署完成
```

### 步骤4：配置环境变量

在Vercel Dashboard中配置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://lvjezsnwesyblnlkkirz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 步骤5：重新部署

```bash
vercel --prod
```

---

## 📱 方法三：本地运行测试

如果只想在本地测试，不部署到生产环境：

### 步骤1：启动开发服务器

```bash
cd D:\CursorWork\FutureMindInstitute\futuremind-new

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

### 步骤2：访问测试页面

打开浏览器访问：
```
http://localhost:3000/test-summarize
```

---

## 🔧 验证部署

部署完成后，验证以下内容：

### 1. 页面可访问

访问：`https://your-domain.vercel.app/test-summarize`

应该看到完整的测试界面。

### 2. 环境变量配置正确

在浏览器控制台（F12）检查：

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

应该显示正确的Supabase URL。

### 3. API调用正常

1. 选择一个测试用户
2. 选择一个维度
3. 点击"开始测试"
4. 查看日志是否正常显示
5. 检查是否成功生成总结

---

## 📊 监控和日志

### Vercel部署日志

在 Vercel Dashboard 查看：
1. 访问 https://vercel.com/dashboard
2. 选择您的项目
3. 点击 "Deployments"
4. 查看最新部署的日志

### Edge Function日志

在 Supabase Dashboard 查看：
1. Functions → summarize-user-activity
2. 点击 "Logs" 标签
3. 查看实时日志

### 浏览器控制台

按 F12 打开开发者工具：
- Console: 查看JavaScript错误
- Network: 查看API请求和响应
- Application: 查看本地存储

---

## 🐛 常见部署问题

### Q1: Vercel部署失败 - "Build Error"

**原因**: TypeScript类型错误或依赖问题

**解决**:
```bash
# 本地先验证构建
npm run build

# 如果有错误，修复后再推送
```

### Q2: 页面404 Not Found

**原因**: Next.js路由配置问题

**解决**:
确保文件位置正确：`pages/test-summarize.tsx`（不是`pages/test-summarize/index.tsx`）

### Q3: API调用失败 - CORS错误

**原因**: Supabase CORS配置问题

**解决**:
1. 在 Supabase Dashboard → Settings → API
2. 确认域名已添加到允许列表
3. 重新部署

### Q4: 环境变量未生效

**原因**: Vercel环境变量未配置或未重新部署

**解决**:
1. 在 Vercel Dashboard → Settings → Environment Variables 检查配置
2. 确保变量名以 `NEXT_PUBLIC_` 开头
3. 保存后重新部署项目

---

## 📝 部署检查清单

部署前检查：

- [ ] 代码已提交到Git仓库
- [ ] package.json依赖完整
- [ ] 环境变量已配置
- [ ] 本地构建成功 (`npm run build`)
- [ ] 本地测试通过 (`npm run dev`)

部署后验证：

- [ ] 页面可正常访问
- [ ] 测试用户列表正确加载
- [ ] Edge Function调用成功
- [ ] AI总结正常生成
- [ ] 数据库存储验证通过

---

## 🎉 快速访问

部署完成后，分享以下链接给测试人员：

**测试页面**: `https://your-domain.vercel.app/test-summarize`

**使用文档**: 查看 `docs/测试页面使用指南.md`

---

## 🔄 后续更新

如需更新测试页面：

```bash
# 1. 修改代码
# 2. 提交更改
git add pages/test-summarize.tsx
git commit -m "update: 优化测试页面"
git push origin master

# 3. Vercel会自动重新部署
```

---

## 📞 技术支持

如遇到部署问题，请提供：
1. Vercel部署日志截图
2. 浏览器控制台错误信息
3. 具体的错误描述
