# FutureMind Institute 项目上下文

## 项目概述
FutureMind Institute（未来心智研究院）是一个面向青少年的教育平台，提供多种创新课程体系。

## 技术栈
- **框架**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + Framer Motion
- **后端**: Supabase (Auth + Database + Storage)
- **AI**: xAI Grok (边缘函数), OpenAI API (嵌入), Google GenAI
- **语言**: TypeScript

## 项目结构
```
app/                    # Next.js App Router 页面
  ├── (auth)/          # 认证相关页面
  ├── admin/           # 管理后台
  ├── courses/         # 课程页面
  ├── portal/          # 用户门户
  └── api/             # API 路由
components/            # React 组件
lib/                   # 工具库和配置
supabase/              # Supabase 配置和迁移
types/                 # TypeScript 类型定义
docs/                  # 详细文档
```

## 课程体系
1. **地球课程 (Earth)** - 基础课程，PBL 项目制学习
2. **伊卡洛斯三角 (Icarus Triangle)** - 进阶课程
3. **觉察：唤醒感官 (listening)** - 克里希那穆提一月主题，14天音频课程
4. **无为：打破模式 (dawn_awakening)** - 克里希那穆提二月主题，23天晨间冥想
5. **无惧：直面恐惧 (dependency_freedom)** - 克里希那穆提三月主题，31天探索
6. **热情：转化欲望 (desire_flame)** - 克里希那穆提四月主题，30天探索
7. **智慧：智力升华 (wisdom_awakening)** - 克里希那穆提五月主题，31天探索
8. **放下：驾驭能量 (energy_alchemy)** - 克里希那穆提六月主题，30天探索
9. **盖亚对话 (Gaia Dialog)** - AI 对话系统
10. **赛斯365 (Seth365)** - 每日灵感壁纸系统

## 用户角色
- `student` - 学生
- `teacher` - 老师
- `principal` - 校长/管理员

---

## 设计风格

**主题**: 宇宙/星空风格 (Cosmic theme)

**关键 CSS 类**:
| 类名 | 用途 |
|------|------|
| `btn-stardust` | 按钮（透明+炫彩边框） |
| `card-rainbow-border` | 卡片（悬停炫彩边框） |
| `card-glass` | 玻璃效果卡片 |
| `progress-ethereal` | 彩虹进度条 |

**核心原则**:
- 页面容器保持透明（显示星空背景）
- 按钮/卡片使用玻璃质感，不用实心背景
- 开关：关闭态 `bg-white/20`，开启态 `bg-emerald-500`
- 弹窗：`bg-white/5 backdrop-blur-xl border border-white/20`

> **详细规范见**: `docs/UI_GUIDELINES.md`

---

## AI 聊天系统架构

| 系统 | 用途 | 组件 | API 路由 |
|------|------|------|---------|
| **探索者联盟 AIP** | 项目协作 | `FloatingChatBot` | `/api/aip/chat` |
| **盖亚对话** | 个人成长 | `GlobalGaiaV3` | `/api/gaia/chat` |

**架构概览**:
```
用户提问 → 生成向量 → 并行查询(知识库+画像) → 整合上下文 → LLM → 响应
```

**知识来源**:
| 类型 | 存储表 |
|------|--------|
| 项目知识库 | `documents` + `document_chunks` |
| 智慧库 | `wisdom_entries` |
| 用户画像 | `student_summaries` |

> **详细配置见**: `docs/N8N_WORKFLOWS.md`

---

## 数据库关键表

| 表名 | 用途 |
|------|------|
| `chat_history` | 聊天记录（content + ai_content） |
| `documents` | 父文档（完整文档） |
| `document_chunks` | 向量化文档块（有 embedding） |
| `wisdom_entries` | AI 提取的智慧 Q&A |
| `student_summaries` | 用户画像 |
| `profiles` | 用户资料（含隐私设置） |

## 关键 RPC 函数

| 函数 | 用途 |
|------|------|
| `hybrid_search` | AIP 混合搜索（向量+全文） |
| `hybrid_search_gaia` | 盖亚混合搜索 |
| `normalize_chinese_numbers` | 中文数字转换（三→3） |

---

## 盖亚知识库

| 配置 | 值 |
|------|-----|
| 项目 ID | `2ffbe00d-d17f-43f0-9c22-103b73617342` |
| 环境变量 | `GAIA_KB_PROJECT_ID` |
| 管理入口 | `/admin/gaia-kb` |
| 所属组织 | "系统"（不对用户可见） |

---

## 赛斯365 (Seth365)

每日灵感壁纸系统，提供365天壁纸自动切换功能。

**启动日期**: 2025年12月21日

**页面入口**: `/seth365`（首页 + Portal 导航栏都有按钮）

**测试模式**: 启动前可点击"预览壁纸"按钮查看壁纸内容

**壁纸规格**:
- 每天8张壁纸：中英文×竖横×2张
- 文件命名：`{年}.{月}.{日}.{语言}{方向}{序号}.webp`
- 示例：`25.12.21.CS1.webp`（2025年12月21日 中文竖版 第1张）

**语言代码**: C=中文, E=英文
**方向代码**: S=竖版, H=横版

**资源位置**:
```
public/seth365/wallpapers/    # 壁纸图片（704张）
├── 25/12/                    # 2025年12月
└── 26/01/                    # 2026年1月
```

**下载链接管理**:
- 数据库表：`app_downloads`（存储各平台下载链接）
- 管理入口：`/admin/seth365-downloads`（仅校长可访问）
- API：`/api/seth365/downloads`
- 支持平台：Android、Windows、macOS、iOS

**组件结构**:
| 组件 | 文件 | 功能 |
|------|------|------|
| 日历视图 | `CalendarView.tsx` | 日期选择+解锁状态 |
| 壁纸轮播 | `WallpaperCarousel.tsx` | 轮播+筛选+下载 |
| 下载区 | `DownloadSection.tsx` | 多平台下载+说明 |
| 海报编辑器 | `PosterEditor.tsx` | 替换二维码 |
| 批量下载 | `BatchDownloadModal.tsx` | 选择日期范围批量下载 |
| 锁定提示 | `LockedDateModal.tsx` | 未来日期友好提示 |

**数据模型**: `lib/seth365/wallpaper.ts`

---

## 安全工具函数 (`lib/env.ts`)

```typescript
safeParseInt(value, defaultValue, { min, max })  // 安全的 parseInt
validatePassword(password)                        // OWASP 密码验证
isDev() / isProd()                               // 环境检查
```

---

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本

# 部署边缘函数
npx supabase functions deploy evaluate-submission --no-verify-jwt
npx supabase functions deploy evaluate-pbl-task --no-verify-jwt
```

---

## 开发工作流程

### 风险修改使用分支

对于可能影响生产环境的修改（如首页组件、核心功能），**必须使用分支开发**：

```bash
# 1. 创建功能分支
git checkout -b fix/feature-name

# 2. 修改代码并提交
git add .
git commit -m "fix: 描述修改内容"

# 3. 本地构建测试
npm run build

# 4. 确认无误后，合并到 master
git checkout master
git merge fix/feature-name --no-edit

# 5. 推送到远程（触发 Vercel 部署）
git push origin master

# 6. 删除本地分支
git branch -d fix/feature-name
```

**注意**：
- 分支只在本地使用，不需要推送到 GitHub
- 合并前必须运行 `npm run build` 确认无错误
- 如果出问题可以快速 `git revert HEAD` 回滚

### 已知的 lucide-react 图标问题

lucide-react 图标在某些情况下不渲染，解决方案是使用**内联 SVG**：

```jsx
// ❌ 可能不渲染
<Mail className="w-5 h-5 text-purple-400" />

// ✅ 可靠方案
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

// 使用时包裹 div 并加 z-10
<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
  <MailIcon />
</div>
```

---

## 待办事项

### 未完成
- [ ] 修复 N8N Vector Store 节点写入 `document_chunks`
- [ ] 考虑 Vercel Pro 的 Instant Start（减少冷启动）
- [ ] Rerank 优化（Cohere Reranker）
- [ ] @ts-nocheck 逐步移除（227 个文件）
- [ ] 大型组件拆分（PBLProjectDetail、InteractionLog）

### 已完成摘要（2025-12）
- ✅ 盖亚聊天系统统一（删除旧 GaiaDialog）
- ✅ 环境变量验证系统
- ✅ 密码强度验证
- ✅ 个人资料可见性系统
- ✅ 消息盒子全站同步
- ✅ 优秀作业刷新机制
- ✅ AI 批改五档话术
- ✅ 组件拆分优化
- ✅ **安全加固（2025-12-07）**：
  - N8N Webhook URL 日志脱敏
  - 安全随机文件名（crypto.randomBytes）
  - CSRF 保护（validateCsrf 函数）
- ✅ **代码清理（2025-12-07）**：
  - 调试日志清理（5 个文件，20+ 处）
  - 删除废弃 PBL Gaia 组件（GaiaChat、FloatingGaia、MarkdownRenderer）
  - 修复 mock 数据服务 bug（MainDashboard、MyProjectsPage）
- ✅ **赛斯365功能（2025-12-19~22）**：
  - 首页 + Portal 导航栏添加入口按钮
  - 创建 `/seth365` 页面（日历+轮播+下载）
  - 壁纸轮播组件（筛选、全屏、自动播放）
  - 多平台下载区（Android/Windows/macOS/iOS 说明）
  - 海报编辑器：替换二维码 + 删除/更换按钮 + 帮助弹窗
  - 复制 704 张壁纸资源 + APK 下载文件（Git LFS）
  - 修复时区问题：使用 `new Date(year, month, day)` 避免 UTC 转换
  - 移除倒计时页面，直接显示壁纸界面
  - 未来日期点击显示友好等待弹窗（含鼓励话术）
  - 日历月份导航限制：只能导航到已解锁月份，未解锁月份显示鼓励弹窗
  - 批量下载：日期多选网格 + 解锁说明提示
  - 下载链接动态管理系统（`app_downloads` 表 + `/admin/seth365-downloads` 管理后台）
  - R2 云存储托管客户端安装包（APK/ZIP/DMG）
  - 微信浏览器检测：自动复制链接 + 提示在浏览器打开
  - 复制下载链接按钮：各平台下载区都有复制链接功能
  - 管理后台校长入口卡片
- ✅ **倾听课程解锁修复（2026-01-02）**：
  - 问题：提交作业获得>=60分后，"下一个"按钮仍显示锁定
  - 原因：页面使用 `revalidate=30` 缓存，提交后未刷新服务端数据
  - 修复1：`SubmissionButton.tsx` 添加 `router.refresh()` 刷新页面
  - 修复2：改进解锁判断逻辑，检查是否**曾经有过>=60分提交**（不会因后续低分锁回）
- ✅ **解锁提示弹窗（2026-01-02）**：
  - 问题：分数不足时悬停提示不容易看见
  - 解决：新增 `LockedNextModal` + `LockedNextButton` 组件
  - 点击锁定的"下一个"按钮显示友好弹窗，告知分数差距和改进建议
- ⚠️ **关于"2026-01-03 迁移 9 个函数到 xAI Grok"的记录（已证伪）**：
  - 2026-04-22 核查发现：git 历史里 `git log --all -S "XAI_API_KEY"` 和 `git log --all -S "grok"` 均**无任何结果**
  - 所有边缘函数的 `fetch` 目标从始至终都是 `https://api.openai.com/v1/chat/completions`，模型一直是 `gpt-4o-mini`
  - 这说明原记录是幻觉产物（可能由前任 Claude 编造后写入，又被后续对话反复引用而固化为"事实"）
  - Supabase Secrets 里虽有 `XAI_API_KEY`（用户曾配置），但代码里从未真正调用过 xAI
  - **教训**：CLAUDE.md 的记录不能盲信，对涉及具体技术细节的结论要用 git log / grep 核实
- ✅ **倾听课程解锁安全漏洞修复（2026-01-09）**：
  - 问题：用户可以通过URL直接访问未解锁的课程内容，绕过解锁限制
  - 修复：
    - `course.service.ts` - 新增 `checkListeningCourseUnlock()` 链式检查函数
    - `page.tsx`（课程详情页）- 添加解锁验证，未解锁则重定向
    - `evaluate-submission` 边缘函数 - 添加解锁验证，未解锁返回403
    - `ListeningCourseView.tsx` - 使用预计算的 `unlockMap` 进行链式解锁检查
  - **注意**：边缘函数需要手动部署：`npx supabase functions deploy evaluate-submission --no-verify-jwt`
- ✅ **盖亚对话移动端穿透修复（2026-01-09）**：
  - 问题：手机上打开盖亚对话时，首页按钮穿透显示导致文字重叠
  - 根因：层叠上下文(Stacking Context)限制，半透明背景导致穿透
  - 修复：`GlobalGaiaV3.tsx` 使用 React Portal 渲染到 document.body
    - 超高 z-index (9998/9999) 确保最顶层
    - 移动端使用完全不透明背景 (`bg-black`, `bg-[#0a0a0f]`)
    - 桌面端保持半透明毛玻璃效果
- ✅ **忘记密码页面 JS 错误修复（2026-01-10）**：
  - 问题：点击"忘记密码"后页面报错 "Mail is not defined"
  - 根因：忘记密码表单使用了 `<Mail>` 图标但未从 lucide-react 导入
  - 修复：`app/login/page.tsx` 第218行改用已定义的 `<MailIcon />` 内联 SVG 组件
- ✅ **伊卡洛斯项目解锁逻辑 bug 修复（2026-01-11）**：
  - 问题：用户完成 Day 1-3 后（75分或85分），Day 4-7 仍显示锁定无法点击
  - 根因：解锁逻辑用 `dayNumber - 1` 计算前一天的 key，但实际数据是范围（Day 1-3, Day 4-7）
    - Day 4-7 检查时计算 `prevDay = 4 - 1 = 3`，生成 key `day3`
    - 但用户提交 Day 1-3 时存储的 key 是 `day1`（范围第一个数字）
    - `day3` 不存在，返回 false，导致 Day 4-7 永远锁定
  - 修复：`PBLProjectDetail.tsx`
    - 新函数 `isActivityUnlocked(weekNumber, activityIndex, sortedActivities)` 替代 `isDayUnlocked`
    - 使用 activity 数组索引找前一个任务，而非简单 `dayNumber - 1`
    - 正确解析 `day_range` 字段获取实际的 dayKey
    - 同步修复周级别解锁检查（第437-442行）
- ✅ **微信浏览器作业提交失败修复（2026-01-23）**：
  - 问题：iPad/微信浏览器提交作业时报错 "Failed to send a request to the Edge Function"
  - 根因：微信内置浏览器对 Supabase 边缘函数的跨域调用有限制，请求无法发出
  - 修复：创建 API Route 作为代理，客户端调用同域 API，服务端调用边缘函数
    - 新增 `/api/submissions/evaluate/route.ts` - API 代理
    - 修改 `SubmissionDialog.tsx` - 使用 API Route 替代直接调用边缘函数
    - 增加重试机制（最多重试2次）和 60秒超时
    - 改进错误消息，提供更友好的提示
- ✅ **密码重置流程修复（2026-01-26）**：
  - 问题：用户点击邮件中的重置密码链接后，显示登录页面而非重置密码页面
  - 根因：Supabase 默认使用 implicit flow，token 放在 URL hash fragment 中，服务端路由无法获取
  - 修复：
    - 新增 `/auth/confirm/route.ts` - 处理 `token_hash` 参数验证
    - 修改 `login/page.tsx` - 更新重定向 URL 为 `/auth/confirm`
    - Supabase Dashboard 邮件模板需配置使用 `{{ .TokenHash }}` 而非 `{{ .ConfirmationURL }}`
- ✅ **破晓觉醒课程（2026-02-04）**：
  - 新增23天晨间冥想课程（2月6日-28日），内容源自「二月份完整的早课文档」
  - 每天内容：Mike老师晨间寄语 + 深度冥想引导(15-30分钟) + 生活实修
  - 管理后台：`/admin/courses/dawn-awakening`（内容编辑 + 音频上传）
  - 学员管理：`/admin/courses/dawn-awakening/students`
  - 前端组件：`DawnAwakeningView.tsx`（日出主题，从深夜到黎明的色彩渐变）
  - 链式解锁机制：需>=60分解锁下一天（与自在聆听课程相同）
  - 数据库：`course_systems` system_key=`dawn_awakening`
  - 学员可在「我的课程」页面选修此课程
- ✅ **无惧：直面恐惧（三月课程）（2026-02-17）**：
  - 扩展为31天三月课程，源自克里希那穆提《生命之书》三月主题
  - 从九宫格改为日历视图（复用 `MeditationCalendarView`）
  - 管理后台：`/admin/courses/dependency-freedom`
  - 数据库：`course_systems` system_key=`dependency_freedom`
- ✅ **热情：转化欲望（四月课程）（2026-02-17）**：
  - 新增30天四月课程，源自克里希那穆提《生命之书》四月主题
  - 前端组件：`AprilCourseView.tsx`（日历视图）
  - 管理后台：`/admin/courses/desire-flame`
  - 数据库：`course_systems` system_key=`desire_flame`
- ✅ **智慧：智力升华（五月课程）（2026-02-17）**：
  - 新增31天五月课程，源自克里希那穆提《生命之书》五月主题
  - 前端组件：`MayCourseView.tsx`（日历视图）
  - 管理后台：`/admin/courses/wisdom-awakening`
  - 数据库：`course_systems` system_key=`wisdom_awakening`
- ✅ **冥想课程统一重命名（2026-02-17）**：
  - 一月：自在聆听 → 觉察：唤醒感官
  - 二月：破晓觉醒 → 无为：打破模式
  - 三月：依赖与自由 → 无惧：直面恐惧
  - 四月：欲望的火焰 → 热情：转化欲望
  - 五月：智慧的苏醒 → 智慧：智力升华
  - 共用组件：`MeditationCalendarView.tsx`（三/四/五月共用日历视图）
- ✅ **放下：驾驭能量（六月课程）（2026-02-17）**：
  - 新增30天六月课程，源自克里希那穆提《生命之书》六月主题：能量、注意力与暴力
  - 前端组件：`JuneCourseView.tsx`（能量主题，蓝-绿-金渐变）
  - 管理后台：`/admin/courses/energy-alchemy`
  - 数据库：`course_systems` system_key=`energy_alchemy`
  - 课程名称添加月份前缀（1月-6月）
- ✅ **作业批改提示词与模型升级（2026-04-22, evaluate-submission v20）**：
  - 背景：用户 Flora (florashao19@gmail.com) 反馈作业已详写身体感受和情绪（"浑身发冷"、"悲痛欲绝"），AI 仍建议"更详细描述身体感觉"，导致体验不佳
  - 根因：提示词里 suggestions 指南和 JSON 示例反复用"描述身体感受"作为模板，AI 机械复用
  - 修改 `supabase/functions/evaluate-submission/index.ts`：
    1. 新增"生成前诊断步骤"硬规则：AI 必须先识别学生已写的 6 个维度（身体/情绪/洞见/意象/行动/关系），禁止建议补充已写过的维度
    2. suggestions 指南改为按维度轮换的"方向库"，不再以"身体感受"为唯一示例
    3. 加反面示例（直接用 Flora 的作业作为警示）
    4. 评分标准上调：60-79 拆成 60-74/75-84，85-94 门槛降为"有真情+有觉察+有突破"，95+ 留给卓越；加硬规则"不要因改进空间就压分到 80 以下"
    5. 模型从 `gpt-4o-mini` 升级到 `gpt-5.4-mini`（2026-04 最新性价比首选，$0.75/$4.50 per 1M tokens，按日 100 次提交约每月 $11）
  - 部署命令：`supabase functions deploy evaluate-submission --no-verify-jwt --project-ref lvjezsnwesyblnlkkirz`
- ✅ **evaluate-submission 迁移到 xAI Grok 4.1 Fast（2026-04-22, v23）**：
  - 模型：`grok-4-1-fast-non-reasoning`（2025-11 发布，$0.20/$0.50 per 1M tokens）
  - Endpoint: `https://api.x.ai/v1/chat/completions`（OpenAI 兼容格式）
  - 环境变量：`XAI_API_KEY`（Supabase Secrets 已有）
  - 选型理由：
    - 价格与 gpt-4o-mini 几乎相同（月成本差 <$1）
    - 2025-11 发布，跨代领先 2024-07 的 gpt-4o-mini
    - 指令遵循能力显著更强（对"先诊断维度再建议"的硬规则至关重要）
    - 中文支持经 xAI 官方多语言评测
    - 2M 上下文（vs 4o-mini 128K）
  - 此函数是项目首个真正迁移到 xAI 的边缘函数（此前 CLAUDE.md 记录的批量迁移是幻觉）
  - 回退方案：若出现异常，改 model 为 `gpt-4o-mini`、endpoint 为 `api.openai.com`、API key 为 `OPENAI_API_KEY` 即可（改 4 行 + 部署）
- ✅ **管理员账户作业提交绕过（2026-04-22, evaluate-submission v21）**：
  - 问题：前端 `page.tsx:68` 已有管理员 email 白名单允许跳过解锁进入课程详情页，但边缘函数 `checkCourseUnlock` 没有同步绕过，导致管理员点提交后被 403 拦下
  - 修复：边缘函数开头加 `ADMIN_EMAILS = ['3368327@qq.com', 'onestnet@gmail.com']` 白名单，用 `supabase.auth.admin.getUserById(userId)` 查邮箱，命中则直接放行
  - ⚠️ 未来若要加/改管理员，前后端两处 email 白名单需同步修改：
    - `app/courses/[system_key]/[content_id]/page.tsx` 的 `adminEmails`
    - `supabase/functions/evaluate-submission/index.ts` 的 `ADMIN_EMAILS`
- ✅ **冥想音频自动修复系统（2026-02-23）**：
  - 自动检测音频中缺失的文本内容（拼音级 diff 对比，忽略同音字差异）
  - 用豆包TTS（鸡汤女音色）生成缺失语句，精确拼接到原始音频正确位置
  - 三步定位法：段级转录做gap检测 → 段级线性粗定位 → 局部Whisper精转录精定位
  - 修复范围：3-6月共80天、120处缺失，全部修复并上传到Supabase Storage
  - 工具位置：`scripts/meditation-audit/fix_audio.py`
  - 关键经验：word_timestamps对中文不可靠；长段落(>10s)必须局部精转录定位

---

## Claude 行为指令

> 完成重要任务后，更新此文件，记录：
> - 新完成的功能（简要）
> - 关键决策
> - 待办事项
>
> **保持精简，详细内容写到 `docs/` 目录。**

---
*此文件帮助 Claude 在对话压缩后保持项目上下文*
