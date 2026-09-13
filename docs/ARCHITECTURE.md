# FutureMind Institute - 系统架构文档

## 技术栈

### 前端框架
- **Next.js 14** - React全栈框架（App Router）
- **TypeScript** - 类型安全的JavaScript超集
- **Tailwind CSS** - 实用优先的CSS框架
- **Framer Motion** - 动画库

### 后端服务
- **Supabase** - 开源Firebase替代方案
  - PostgreSQL数据库
  - 实时订阅
  - 边缘函数（Deno运行时）
  - 身份认证
  - 存储服务

### AI集成
- **N8N** - AI工作流编排平台
- **Claude API** - Anthropic的AI模型
- **OpenAI API** - GPT模型（备用）

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  Next.js 14 App Router + React Server Components           │
├─────────────────────────────────────────────────────────────┤
│                        业务逻辑层                            │
│  - CourseService: 课程数据管理                              │
│  - ProgressService: 学习进度追踪                            │
│  - ErrorHandler: 统一错误处理                               │
├─────────────────────────────────────────────────────────────┤
│                        数据访问层                            │
│  Supabase Client (类型安全的数据库查询)                     │
├─────────────────────────────────────────────────────────────┤
│                        数据库层                              │
│  PostgreSQL (Supabase托管)                                  │
│  - 5个核心表 + RLS策略                                      │
├─────────────────────────────────────────────────────────────┤
│                        边缘函数层                            │
│  Supabase Edge Functions (Deno运行时)                      │
│  - evaluate-submission: 作业评估                            │
│  - proxy-gaia-dialogue: AI对话代理                          │
│  - generate-gaia-variables: 上下文生成                      │
│  - calculate-relative-level: 相对等级计算                   │
│  - delete-submission: 作业删除（含成长点回退）              │
│  - generate-student-summary: 学生总结生成                   │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 课程系统 (Course System)

**位置**: `app/courses/`

**核心文件**:
- `[system_key]/page.tsx` - 课程列表页
- `[system_key]/[content_id]/page.tsx` - 课程详情页
- `[system_key]/[content_id]/SubmissionButton.tsx` - 作业提交
- `[system_key]/[content_id]/SubmissionDialog.tsx` - 作业对话框
- `[system_key]/[content_id]/SubmissionHistory.tsx` - 提交历史

**服务层**:
- `lib/services/course.service.ts` - 课程数据管理
- `lib/services/progress.service.ts` - 进度管理

**特性**:
- 三种课程结构：daily_sequential（日序列）、module_matrix（模块矩阵）、stage_sequential（阶段序列）
- 前置课程解锁机制
- 实时进度追踪
- 批量进度查询优化

### 2. AI导师系统 (Gaia)

**位置**: `components/GaiaDialog.tsx`, `lib/api/gaia.ts`

**边缘函数**:
- `proxy-gaia-dialogue` - 实时对话代理
- `generate-gaia-variables` - 个性化上下文生成

**工作流程**:
```
用户提问 → 前端收集上下文 → Edge Function
         ↓
    查询gaia_context_variables缓存（45分钟TTL）
         ↓
    打包完整"情报包"（用户画像+课程内容+对话历史）
         ↓
    发送到N8N工作流 → Claude API
         ↓
    流式返回AI响应 → 保存到gaia_conversations
         ↓
    触发insight处理（提取学习洞察）
```

**成本优化**:
- 上下文缓存（45分钟内复用）
- 按需生成，避免浪费
- 流式响应，提升体验

### 3. 作业评估系统

**位置**: `supabase/functions/evaluate-submission/`

**评估流程**:
```
学生提交作业 → evaluate-submission边缘函数
              ↓
         调用N8N评估工作流
              ↓
         AI评分 + 反馈生成
              ↓
         计算意识成长点数
              ↓
    更新user_submissions + 触发意识树生长
```

**评分标准**:
- 内容深度 (40%)
- 批判性思考 (30%)
- 个人洞察 (20%)
- 表达清晰度 (10%)

### 4. 意识树可视化

**位置**: `components/ConsciousnessTree.tsx`

**数据来源**: `profiles.consciousness_tree_view`

**生长机制**:
- 根系：深度思考能力
- 树干：知识稳定性
- 叶片：学习活跃度
- 果实：洞察成果

**更新触发**:
- 作业提交评估后
- 学习洞察生成时
- 课程完成时

### 5. PBL项目式学习

**位置**: `components/pbl/`

**核心组件**:
- `MainDashboard.tsx` - 主仪表板
- `ProjectExplorer.tsx` - 项目浏览器
- `CommunityPage.tsx` - 社区页面
- `CreateProjectModal.tsx` - 创建项目对话框

**特性**:
- 项目协作
- 同伴学习
- 进度可视化
- 资源共享

## 数据流

### 1. 用户登录流程

```
用户输入凭据 → Supabase Auth.signIn
              ↓
         JWT Token生成
              ↓
    查询profiles表获取角色
              ↓
    重定向到对应页面（portal/admin）
```

### 2. 课程学习流程

```
选择课程 → 检查解锁状态（prerequisites）
         ↓
    加载课程内容（CourseService.getContentWithSystem）
         ↓
    批量查询进度（ProgressService.getBatchProgress）
         ↓
    渲染内容 + 展示进度
         ↓
    完成学习 → 更新进度（ProgressService.markAsCompleted）
```

### 3. 作业提交流程

```
学生填写作业 → 调用evaluate-submission边缘函数
              ↓
         插入user_submissions表
              ↓
    AI评估（N8N → Claude API）
              ↓
    返回评分+反馈
              ↓
    自动标记课程完成（progress_value=100）
              ↓
    意识树生长更新
```

## 性能优化

### 1. 数据库查询优化

**批量查询**:
```typescript
// 避免N+1查询
const progressMap = await ProgressService.getBatchProgress(
  userId,
  contentIds,
  'reading'
)
```

**索引策略**:
- `user_progress(user_id, ref_item_id, progress_type)` - 复合索引
- `course_contents(system_id, sequence_number)` - 排序优化
- `user_submissions(user_id, course_content_id)` - 历史查询

### 2. 前端性能

**React Server Components**:
- 服务器端数据获取，减少客户端请求
- 自动代码分割
- 流式渲染

**动态导入**:
```typescript
const GaiaDialog = dynamic(() => import('@/components/GaiaDialog'))
```

**图片优化**:
- Next.js Image组件自动优化
- WebP格式支持
- 响应式图片

### 3. 缓存策略

**Supabase缓存**:
- `revalidate = 0` - 课程详情页强制动态渲染
- Gaia上下文缓存 - 45分钟TTL

**浏览器缓存**:
- 静态资源CDN缓存
- Service Worker（未启用）

## 安全性

### 1. 行级安全 (RLS)

所有表都启用RLS策略：

**profiles表**:
- 用户只能查看自己的完整信息
- 其他用户只能看到公开信息（full_name, avatar_url）

**user_progress表**:
- 用户只能访问自己的进度记录
- 教师可查看所有学生进度

**user_submissions表**:
- 学生只能访问自己的提交记录
- 教师可查看和评估学生作业

### 2. 身份认证

**JWT Token**:
- Supabase自动管理
- HttpOnly Cookie存储
- 自动刷新机制

**角色权限**:
- `student` - 基础学习权限
- `teacher` - 课程管理 + 学生评估
- `principal` - 全局管理权限

### 3. API安全

**边缘函数认证**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return new Response('Unauthorized', { status: 401 })
}
```

**CORS配置**:
- 限制允许的域名
- 验证请求来源

**输入验证**:
- 使用Zod验证环境变量
- 边缘函数参数验证
- SQL注入防护（参数化查询）

## 可扩展性

### 1. 服务层模式

所有业务逻辑封装在服务类中：
- 易于单元测试
- 便于功能扩展
- 避免代码重复

### 2. 类型系统

完整的TypeScript类型定义：
- 数据库类型自动生成
- 服务层类型安全
- API响应类型化

### 3. 模块化设计

**独立模块**:
- 课程系统
- AI导师
- 作业系统
- PBL系统
- 意识树

每个模块可独立开发、测试、部署。

## 部署架构

**前端**:
- Vercel托管（推荐）
- 自动CDN分发
- 边缘网络加速

**数据库**:
- Supabase云托管
- 自动备份
- 高可用性保障

**边缘函数**:
- Supabase Edge Functions
- Deno运行时
- 全球分布式部署

**AI服务**:
- N8N自托管或云托管
- Claude API云服务
- 流式响应支持

## 监控与日志

### 1. 错误追踪

**前端**:
- Console.error保留用于调试
- 错误边界捕获React错误

**后端**:
- 边缘函数日志（Supabase Dashboard）
- 数据库慢查询监控

### 2. 性能监控

**Next.js分析**:
- Vercel Analytics
- Web Vitals监控

**数据库性能**:
- Supabase Dashboard
- 查询分析工具

## 未来优化方向

1. **实时协作** - 使用Supabase Realtime实现多人协作
2. **离线支持** - Service Worker + IndexedDB
3. **移动端优化** - PWA支持
4. **国际化** - i18n多语言支持
5. **高级分析** - 学习轨迹分析、推荐系统
