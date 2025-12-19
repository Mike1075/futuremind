# FutureMind Institute 项目上下文

## 项目概述
FutureMind Institute（未来心智研究院）是一个面向青少年的教育平台，提供多种创新课程体系。

## 技术栈
- **框架**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + Framer Motion
- **后端**: Supabase (Auth + Database + Storage)
- **AI**: OpenAI API, Google GenAI
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
3. **倾听课程 (Listening)** - 14天音频课程
4. **盖亚对话 (Gaia Dialog)** - AI 对话系统
5. **赛斯365 (Seth365)** - 每日灵感壁纸系统

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

**页面入口**: `/seth365`（Portal 导航栏有按钮）

**壁纸规格**:
- 每天8张壁纸：中英文×竖横×2张
- 文件命名：`{年}.{月}.{日}.{语言}{方向}{序号}.webp`
- 示例：`25.12.21.CS1.webp`（2025年12月21日 中文竖版 第1张）

**语言代码**: C=中文, E=英文
**方向代码**: S=竖版, H=横版

**资源位置**:
```
public/seth365/
├── wallpapers/           # 壁纸图片
│   ├── 25/12/           # 2025年12月
│   └── 26/01/           # 2026年1月
└── downloads/           # 客户端下载
    ├── Seth365.apk      # Android 版
    └── Seth365_Setup.exe # Windows 版（待构建）
```

**组件结构**:
| 组件 | 文件 | 功能 |
|------|------|------|
| 倒计时卡片 | `CountdownCard.tsx` | 启动前显示倒计时 |
| 日历视图 | `CalendarView.tsx` | 日期选择+解锁状态 |
| 壁纸轮播 | `WallpaperCarousel.tsx` | 轮播+筛选+下载 |
| 下载区 | `DownloadSection.tsx` | 多平台下载+说明 |
| 海报编辑器 | `PosterEditor.tsx` | 替换二维码 |

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

## 待办事项

### 未完成
- [ ] 修复 N8N Vector Store 节点写入 `document_chunks`
- [ ] 考虑 Vercel Pro 的 Instant Start（减少冷启动）
- [ ] Rerank 优化（Cohere Reranker）
- [ ] @ts-nocheck 逐步移除（227 个文件）
- [ ] 大型组件拆分（PBLProjectDetail、InteractionLog）
- [ ] Seth365 Windows 安装包构建（需在 Windows 项目中执行 PyInstaller）

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
- ✅ **赛斯365功能（2025-12-19）**：
  - Portal 导航栏添加入口按钮
  - 创建 `/seth365` 页面（日历+轮播+下载）
  - 倒计时卡片（启动前显示）
  - 壁纸轮播组件（筛选、全屏、自动播放）
  - 多平台下载区（Android/Windows/iOS 说明）
  - 海报编辑器（替换二维码功能）
  - 复制 704 张壁纸资源 + APK 下载文件

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
