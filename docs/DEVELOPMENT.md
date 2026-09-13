# 开发指南

## 快速开始

### 环境要求

- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0
- **Git**: 最新版本
- **Supabase CLI**: 最新版本（可选，用于本地开发）

### 初始化项目

```bash
# 克隆仓库
git clone <repository-url>
cd futuremind-new

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local

# 配置环境变量（见下方）
# 编辑 .env.local
```

### 环境变量配置

在`.env.local`文件中配置以下变量：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# N8N配置
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/...

# 可选：AI服务配置
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 启动开发服务器

```bash
# 开发模式
npm run dev

# 访问 http://localhost:3000
```

---

## 项目结构

```
futuremind-new/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # 认证路由组
│   │   └── login/
│   ├── admin/                    # 管理后台
│   │   ├── courses/              # 课程管理
│   │   ├── teachers/             # 教师管理
│   │   └── groups/               # 分组管理
│   ├── api/                      # API路由
│   │   ├── admin/                # 管理API
│   │   ├── media/                # 媒体API
│   │   └── webhook/              # Webhook
│   ├── courses/                  # 课程学习页面
│   │   └── [system_key]/         # 动态课程路由
│   │       ├── page.tsx          # 课程列表
│   │       └── [content_id]/     # 课程详情
│   ├── portal/                   # 学习中心
│   └── page.tsx                  # 首页
│
├── components/                   # React组件
│   ├── ui/                       # UI基础组件
│   ├── pbl/                      # PBL相关组件
│   ├── GaiaDialog.tsx            # AI导师对话框
│   └── ConsciousnessTree.tsx     # 意识树可视化
│
├── lib/                          # 工具库
│   ├── api/                      # API客户端
│   │   └── gaia.ts               # Gaia API
│   ├── services/                 # 服务层
│   │   ├── course.service.ts     # 课程服务
│   │   └── progress.service.ts   # 进度服务
│   ├── supabase/                 # Supabase配置
│   │   ├── client.ts             # 客户端
│   │   ├── server.ts             # 服务端
│   │   ├── service.ts            # Service Role
│   │   └── database.types.ts     # 数据库类型
│   └── utils/                    # 工具函数
│       └── error-handler.ts      # 错误处理
│
├── supabase/                     # Supabase配置
│   ├── functions/                # 边缘函数
│   │   ├── evaluate-submission/  # 作业评估
│   │   ├── proxy-gaia-dialogue/  # AI对话代理
│   │   └── ...                   # 其他函数
│   └── migrations/               # 数据库迁移
│
├── public/                       # 静态资源
├── docs/                         # 项目文档
└── readme/                       # 设计文档
```

---

## 开发规范

### 代码风格

项目使用ESLint和Prettier进行代码格式化：

```bash
# 检查代码风格
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

**重要规范**:

1. **使用TypeScript** - 所有新代码必须使用TypeScript
2. **服务层优先** - 数据库操作应使用服务层，不直接调用Supabase
3. **避免`as any`** - 使用正确的类型定义
4. **错误处理** - 使用统一的错误处理工具
5. **只保留`console.error`** - 移除调试用的`console.log`

### 命名约定

**文件命名**:
- 组件文件：`PascalCase.tsx` (如 `GaiaDialog.tsx`)
- 工具文件：`kebab-case.ts` (如 `error-handler.ts`)
- 服务文件：`name.service.ts` (如 `course.service.ts`)

**变量命名**:
- 组件：`PascalCase`
- 函数/变量：`camelCase`
- 常量：`UPPER_SNAKE_CASE`
- 类型/接口：`PascalCase`

**数据库命名**:
- 表名：`snake_case`复数形式 (如 `course_systems`)
- 字段名：`snake_case` (如 `created_at`)

### Git工作流

**分支策略**:
```bash
main          # 生产分支
├── develop   # 开发分支
├── feature/* # 功能分支
└── hotfix/*  # 紧急修复分支
```

**提交规范**:

使用语义化提交消息：

```bash
feat: 添加新功能
fix: 修复Bug
refactor: 重构代码
docs: 更新文档
style: 代码格式调整
test: 添加测试
chore: 构建/工具变更
```

**示例**:
```bash
git commit -m "feat: 实现地球课程知识点AI对话功能"
git commit -m "fix: 修复作业提交后进度未更新问题"
git commit -m "refactor: 移除所有Supabase as any类型断言"
```

---

## 常见开发任务

### 1. 添加新的课程类型

**步骤**:

1. 在`course_contents`表添加新字段
2. 更新TypeScript类型定义
3. 在CourseService添加处理逻辑
4. 创建对应的UI组件
5. 更新课程详情页渲染逻辑

**示例 - 添加Quiz课程类型**:

```typescript
// 1. 更新数据库类型
export interface CourseContent {
  // ... 现有字段
  quiz_questions?: QuizQuestion[]  // 新增
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
}

// 2. 在渲染函数中处理
const renderContent = () => {
  if (content.quiz_questions) {
    return <QuizComponent questions={content.quiz_questions} />
  }
  // ... 其他类型
}
```

### 2. 创建新的边缘函数

**步骤**:

```bash
# 创建函数目录
cd supabase/functions
mkdir my-new-function
cd my-new-function

# 创建index.ts
cat > index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 认证检查
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 业务逻辑
    const body = await req.json()
    // ...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
EOF

# 部署函数
supabase functions deploy my-new-function
```

### 3. 添加新的服务层方法

**示例 - 在CourseService添加方法**:

```typescript
// lib/services/course.service.ts

export class CourseService {
  // ... 现有方法

  /**
   * 获取用户收藏的课程
   */
  static async getFavoriteCourses(
    userId: string
  ): Promise<CourseSystem[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_favorites')
      .select('course_system_id')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`查询收藏失败: ${error.message}`)
    }

    const courseIds = data.map(f => f.course_system_id)

    const { data: courses, error: coursesError } = await supabase
      .from('course_systems')
      .select('*')
      .in('id', courseIds)

    if (coursesError) {
      throw new Error(`查询课程失败: ${coursesError.message}`)
    }

    return courses || []
  }
}
```

### 4. 添加新的UI组件

**最佳实践**:

```typescript
// components/ui/MyNewComponent.tsx
'use client'  // 如果需要客户端交互

import { useState } from 'react'
import { motion } from 'framer-motion'

interface MyNewComponentProps {
  title: string
  onAction?: () => void
}

export default function MyNewComponent({
  title,
  onAction
}: MyNewComponentProps) {
  const [state, setState] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-gray-900 rounded-lg"
    >
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {/* ... */}
    </motion.div>
  )
}
```

---

## 测试

### 单元测试

使用Jest + React Testing Library：

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

**测试示例**:

```typescript
// lib/services/__tests__/course.service.test.ts
import { CourseService } from '../course.service'

describe('CourseService', () => {
  describe('getCourseSystemByKey', () => {
    it('should return course system when found', async () => {
      const result = await CourseService.getCourseSystemByKey('listening')
      expect(result).toBeDefined()
      expect(result?.system_key).toBe('listening')
    })

    it('should return null when not found', async () => {
      const result = await CourseService.getCourseSystemByKey('nonexistent')
      expect(result).toBeNull()
    })
  })
})
```

### 集成测试

使用Playwright进行E2E测试：

```bash
# 安装Playwright
npm install -D @playwright/test

# 运行E2E测试
npm run test:e2e
```

---

## 调试

### 前端调试

**Chrome DevTools**:
- 使用React DevTools浏览组件树
- 使用Network标签监控API请求
- 使用Console查看错误日志（只保留console.error）

**VS Code调试配置**:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 后端调试

**边缘函数日志**:
```bash
# 查看实时日志
supabase functions logs my-function --follow

# 查看最近的日志
supabase functions logs my-function --limit 100
```

**数据库查询调试**:
```typescript
// 启用Supabase查询日志
const supabase = createClient(url, key, {
  auth: { debug: true }
})
```

---

## 性能优化

### 前端优化

**1. 使用React Server Components**:
```typescript
// app/courses/[system_key]/page.tsx
// 默认是Server Component，无需'use client'

export default async function CoursePage({ params }) {
  // 服务器端数据获取，减少客户端请求
  const data = await CourseService.getCourseWithContents(params.system_key)

  return <div>{/* ... */}</div>
}
```

**2. 动态导入**:
```typescript
// 延迟加载大型组件
import dynamic from 'next/dynamic'

const GaiaDialog = dynamic(() => import('@/components/GaiaDialog'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})
```

**3. 图片优化**:
```typescript
import Image from 'next/image'

<Image
  src="/consciousness-tree.png"
  width={800}
  height={600}
  alt="意识树"
  priority  // 首屏图片
/>
```

### 数据库优化

**1. 批量查询**:
```typescript
// 避免N+1查询
const progressMap = await ProgressService.getBatchProgress(
  userId,
  contentIds,
  'reading'
)
```

**2. 选择性字段**:
```typescript
// 只查询需要的字段
const { data } = await supabase
  .from('course_systems')
  .select('id, title, description')  // 不要用'*'
  .eq('is_active', true)
```

**3. 使用索引**:
```sql
-- 为常用查询添加索引
CREATE INDEX idx_user_progress_lookup
  ON user_progress(user_id, ref_item_id, progress_type);
```

---

## 部署前检查清单

- [ ] 所有环境变量已配置
- [ ] 运行`npm run build`无错误
- [ ] 运行`npm run lint`无警告
- [ ] 所有测试通过
- [ ] 数据库迁移已应用
- [ ] 边缘函数已部署
- [ ] RLS策略已启用
- [ ] 移除了所有调试console.log
- [ ] 更新了CHANGELOG
- [ ] 代码已提交并push

---

## 常见问题

### Q: Supabase查询返回null

**A**: 检查RLS策略，确保当前用户有权限访问该数据：

```sql
-- 在Supabase Dashboard的SQL Editor中测试
SELECT * FROM course_systems WHERE is_active = true;
```

### Q: 边缘函数超时

**A**: 边缘函数有60秒超时限制。对于长时间运行的任务，考虑：
- 使用后台任务队列
- 分批处理
- 返回任务ID，异步轮询结果

### Q: TypeScript类型错误

**A**: 重新生成Supabase类型：

```bash
supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

### Q: 本地开发时数据库连接失败

**A**: 检查`.env.local`中的配置是否正确，确保使用正确的Supabase URL和密钥。

---

## 相关资源

- [Next.js文档](https://nextjs.org/docs)
- [Supabase文档](https://supabase.com/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [Framer Motion文档](https://www.framer.com/motion)
