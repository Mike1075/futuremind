# 数据库设置说明

## 重要提示

为了让探索者联盟（PBL）功能正常工作，您需要在Supabase中运行数据库迁移脚本。

## 如何运行迁移

### 步骤 1: 登录 Supabase

1. 访问 https://supabase.com
2. 登录您的账号
3. 进入项目: https://lvjezsnwesyblnlkkirz.supabase.co

### 步骤 2: 打开 SQL 编辑器

1. 在左侧导航栏，点击 **SQL Editor**
2. 点击 **New query** 创建新查询

### 步骤 3: 运行迁移脚本

1. 打开 `supabase/migrations/001_initial_schema.sql` 文件
2. 复制整个文件内容
3. 粘贴到 SQL 编辑器中
4. 点击 **Run** 按钮执行脚本

### 步骤 4: 验证安装

运行以下SQL来验证表已正确创建：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'seasons', 'user_progress', 'gaia_conversations', 'pbl_projects', 'project_participants');
```

您应该看到所有6个表都已创建。

## 数据库表说明

迁移脚本会创建以下表：

- **profiles**: 用户资料
- **seasons**: 季度内容（如"第一季：声音的交响"）
- **user_progress**: 用户学习进度
- **gaia_conversations**: 盖亚对话记录
- **pbl_projects**: PBL项目列表
- **project_participants**: 项目参与者

## 初始数据

迁移脚本会自动插入：
- 第一季：声音的交响（season）
- 伊卡洛斯行动：无形的纽带（PBL项目）

## 故障排除

如果遇到错误：

1. **"relation already exists"** - 表已存在，这是正常的，可以忽略
2. **"permission denied"** - 确保您有管理员权限
3. **其他错误** - 检查Supabase控制台的日志

## 需要帮助？

如果您在设置过程中遇到问题，请：
1. 检查 Supabase 项目日志
2. 确认环境变量配置正确
3. 联系项目维护者
