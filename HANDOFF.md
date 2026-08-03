# HANDOFF — 开发进度交接

> 最后更新：2026-08-03
> 本文档记录累计工作进度、遗留问题与下一步计划，供下一个开发者/Claude 接手。

---

## 一、已完成的工作

### 会话 1（2026-06-23）：仓库迁移 + 构建修复

#### 1. 仓库迁移
- 旧仓库 `https://github.com/dufutaoraul/FutureMind.git` 作废
- **新仓库**：`https://github.com/Mike1075/futuremind.git`
- `origin` 已切换到新仓库；以后**推送/拉取都用新仓库**
- 本仓库的 git 身份已配为：`dufutaoraul <sam79v9streat@hotmail.com>`（仅本仓库，不影响全局）

#### 2. 拉取最新内容
- 从新仓库拉取了 7-12 月冥想课程（184 天内容、6 个 CourseView 组件、6 个 DB 迁移文件）
- 本地未提交的工作做了整理：有用的提交保留，临时文件丢弃并加进 `.gitignore`

#### 3. 修复 Vercel 部署构建失败
**问题**：master 推送后 Vercel 构建失败，根因是多个文件在模块加载时检查运行时密钥、缺失即 throw，导致 `next build` 崩溃。

**修复（共 4 个文件，分两个 PR 已合并到 master）**：

| 提交 | 文件 | 改动 |
|------|------|------|
| `7c988e3` (PR #17) | `lib/supabase/service.ts` | 密钥检查从模块顶层移入 `createServiceClient()` |
| `7c988e3` (PR #17) | `app/api/admin/courses/parse/route.ts` | 移除顶层 `GEMINI_API_KEY` 的 throw |
| `c2d1d72` (PR #18) | `lib/supabase.ts` | 顶层改用占位符兜底，不再抛错 |
| `c2d1d72` (PR #18) | `pages/test-summarize.tsx` | 加 `getServerSideProps` 强制 SSR |

### 会话 2（2026-06-23~24）：Vercel Production 部署成功

#### 4. 解决 Vercel 生产部署问题（✅ 已解决）
**问题**：Vercel 项目 `futuremind2075` 的 Production Branch 设为 `main`（空模板），真实项目在 `master`。导致正式域名一直显示空壳。

**解决方案**：通过 Vercel REST API 创建 Production 部署，绕过 productionBranch 设置限制。

```bash
POST https://api.vercel.com/v13/deployments
{
  "name": "futuremind2075",
  "project": "prj_9QJsRhSqToxU77vzGStvzd3qXpcn",
  "target": "production",
  "gitSource": {
    "type": "github",
    "org": "Mike1075",
    "repo": "futuremind",
    "ref": "master"
  }
}
```

**结果**：
- 部署 `dpl_BR9SuxAbTAJfYp3gTYHK7xGesNgM`，状态 READY，target=production
- `futuremind2075.com` 和 `www.futuremind2075.com` 已指向 master 分支内容
- commit: `61409ec`（PR #18 合并后的最新提交）

#### 5. 厘清 Vercel 项目结构（✅ 已解决）
同一个 GitHub 仓库 `Mike1075/futuremind` 关联了 3 个 Vercel 项目：

| 项目名 | 域名 | 用途 |
|--------|------|------|
| **futuremind2075** | futuremind2075.com / www.futuremind2075.com | **正式生产** |
| future | future-topaz-omega.vercel.app | 测试/废弃 |
| futuremind | futuremind-nine.vercel.app | 测试/废弃 |

### 会话 3（2026-06-29）：赛斯365 下载格式修复 + 域名重新上线

#### 6. 赛斯365 网页下载壁纸格式修复（✅ 已上线）
- **问题**：网页"下载当前/批量下载"直接下载原始 `.webp`，部分 Windows 系统不识别（"图片格式不对"），且自定义文件名失效（显示 `26.6.28.ES2.webp` 原始名）。App 端无此问题。
- **修复**：新增 `downloadWallpaperAsJpeg()`（`lib/seth365/wallpaper.ts`），canvas 把 webp 转成标准 **JPEG（0.95，白底）**经 Blob URL 下载；内置回退（转换失败退回下载原始 webp）。
  - 改动：`lib/seth365/wallpaper.ts`、`components/seth365/WallpaperCarousel.tsx`、`components/seth365/BatchDownloadModal.tsx`
  - PR #19 已合并到 master（commit `df07a57`），build 通过。

#### 7. 重新上线到生产域名（✅ 已完成）
- 用 API 从 master(`df07a57`) 建了 target=production 部署 `dpl_5VVZXmHTTdrwQgrqDzewHsCHERmW`，READY，`www.futuremind2075.com` 已切到最新代码（验证返回 200）。
- 再次确认：**promote 接口提升 preview 部署会 422**（preview 用 preview 环境变量），必须用"直接建生产部署"的方式。

#### 8. 关于 Production Branch 面板入口（新发现）
- 用户在 `futuremind2075` → Settings → **Git** 页面**找不到** Production Branch 输入框——新版 Vercel UI 已把它从 Git 页移走（Git 页只剩 Connected Repo / Git Commits / Git LFS / Deploy Hooks）。
- 怀疑现位置：**Settings → Environments → Production**（环境管理里的 Branch Tracking）。下一会话需带用户去那里确认并改成 `master`。
- GitHub 仓库默认分支已是 `master`，但 Vercel 仍缓存 `main`；DELETE+POST 重连 link 后 Vercel 仍默认回 `main`（不读 GitHub 默认分支）——再次印证 **API 改不动，必须面板操作**。

### 会话 4（2026-08-03）：全面脱离 N8N + 对话模型切换 MiniMax M3

#### 9. 盖亚/AIP/文档上传全线脱离 N8N（✅ 已上线，PR #21）
- **起因**：外部 N8N 实例 `n8n.aifunbox.com` 返回 HTTP 522 失联，负责的同事离职且忘记账号密码。四个工作流全线不可用，学员看到盖亚报 `❌ [object Object]`。
- **🔑 关键转折——原始工作流 JSON 一直在本机**：线索藏在 `docs/RAG优化分析报告-2024-11-28.md` 第 169-173 行（当年记下了下载路径），实物在 `readme/N8NAIP/`。已存档到仓库 **`docs/n8n-archive/`**（扫过，只有 credentials 的 id/name 引用，无密钥）。
  - **教训**：遇到"外部依赖失联"先全盘搜历史文档里的路径线索，不要急着凭记忆重建。提示词、模型、检索参数因此是"原样恢复"而非"猜测重建"。
- **四个工作流的去向**：

  | 原工作流 | Webhook | 现在 |
  |---|---|---|
  | 心灵学院聊天bot（盖亚） | `79cbcc7c…` | `lib/gaia/native.ts` |
  | aip聊天助手 | `c3585e19…` | `lib/aip/native.ts` |
  | aip上传文档 | `267d2f36…` | `lib/rag/ingest.ts` + `extract.ts` |
  | futuremind上传文档 | `fca634ab…` | 同上 |

- **文档纠错**：`docs/N8N_WORKFLOWS.md` 记的"盖亚用 GPT-4o + Basic LLM Chain"**是错的**，存档 JSON 显示实际是 **Google Gemini + AI Agent 节点**。已加作废 banner，现行架构见 **`docs/NATIVE_AI_PIPELINE.md`**。
- **顺带修的历史问题**：
  - `document_chunks.parent_document_id` 历史 1287 条全是 NULL（N8N Vector Store 的老 bug，即 CLAUDE.md 里那条待办，已销项）
  - `/api/n8n/upload` 原本是**无鉴权**的裸转发，任何人都能传文件 → 已加身份校验
  - 删除 `/api/admin/gaia-kb/callback`（同样无鉴权的写接口，已无调用方）
  - `GlobalGaiaV3.tsx` 错误提示渲染成 `[object Object]`

#### 10. 对话模型：MiniMax-M3 主力 + gpt-5.4-mini 兜底（✅ 已上线）
- `lib/llm.ts` 按模型名自动路由三家（`gemini*` → Google，`MiniMax*`/`abab*` → MiniMax，其余 → OpenAI）
- **熔断**：主模型报额度/鉴权类错误后冷却 10 分钟直接走兜底，避免每条消息白等一次失败
- 兜底选型实测（盖亚真实提示词 + 真实检索上下文，约 5500 token 输入）：

  | 模型 | 耗时 | 输出字数 |
  |---|---|---|
  | MiniMax-M3 | 12s | 292-318 ← 最贴合"不长篇大论"人设 |
  | gpt-4o | 3.7s | 277 |
  | **gpt-5.4-mini** | 4.8s | 603 ← **选作兜底** |
  | gpt-5.4-nano | 7.5s | 1196（更便宜但又慢又啰嗦，别选） |
  | gpt-5.5 | 13.0s | 858 |

#### 11. Vercel Preview 环境变量已配齐（✅ 解决了原 P2 遗留项）
- **现象**：分支预览站白屏报 `NEXT_PUBLIC_SUPABASE_URL is required for client`
- **根因**：13 个环境变量里有 **8 个只勾了 production**。`NEXT_PUBLIC_*` 是构建时烤进 JS 包的，Preview 构建读不到就是空
- **已修**：8 个全部补上 `preview`（`GAIA_KB_PROJECT_ID`、`GEMINI_API_KEY`、`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`OPENAI_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`），另加 `MINIMAX_API_KEY`
- API 用法：`PATCH /v9/projects/{projectId}/env/{envId}?teamId=...` body `{"target":["production","preview"]}`（sensitive 类型也能改 target，不需要知道值）
- ⚠️ 改完**必须重新构建**才生效
- ⚠️ 副作用：`NEXT_PUBLIC_SITE_URL` 预览环境也生效但值指向正式站，在预览站"忘记密码"会收到指向正式站的链接

### 当前 master 顶端提交
```
a4735fd Merge pull request #21 ... (fix/gaia-native) ← 当前生产
931ad9d fix: MiniMax M3 关闭思考模式，避免 <think> 泄漏到学员可见的正文
c15e20e feat: 对话模型主力切换到 MiniMax M3，兜底 gpt-5.4-mini
28d5a57 feat: 全面脱离 N8N，四个工作流改为项目内原生实现
5a3c95c fix: 盖亚对话脱离 N8N，改为项目内原生实现
626a5d4 Merge pull request #20 ... (fix/evaluate-fallback-openai)
```
生产部署：`dpl_GpdwSMNPFrrZtEZQ4iZezxHHUdtp`（2026-08-03 建，READY）

---

## 二、遗留问题

### 🟡 P1：Vercel productionBranch 仍为 `main`（每次上线还要手动）
- Vercel API **不支持**修改 `productionBranch`（PATCH/POST/DELETE+重建 link 全试过，无效）
- **影响**：git push 到 master 后自动触发的构建仍为 Preview，不会自动成为 Production，域名不更新
- **当前解决方案**：每次合并 master 后，通过 API `POST /v13/deployments`（target=production, ref=master）手动建生产部署（见第四节命令）
- **彻底解决（待办）**：去 Vercel 后台手动把生产分支改为 `master`。
  - ⚠️ 2026-06-29 发现：Settings → **Git** 页面**已无** Production Branch 字段（新版 UI 移走了）。
  - 下一步去 **Settings → Environments → Production** 找 Branch Tracking / Production Branch 改成 master。若那里也没有，就继续用 API 手动建生产部署的兜底方案。

### 🟡 P1：暂停 2 个多余 Vercel 项目（`futuremind`、`future`）
- 同仓库连了 3 个项目，每次推送都触发 3 次构建（浪费额度，且用户易看错项目）。只有 `futuremind2075` 服务正式域名。
- 用户**不想删除**（怕动老师的东西），只想暂停。**推荐 = 断开 Git 连接（Disconnect，≠删除，可逆）**：
  - 面板：进 `futuremind`（再进 `future`）→ Settings → Git → 点 **Disconnect**。项目和历史部署都保留，只是不再自动构建；想恢复点 Connect 重连即可。
  - API 等价：`DELETE /v9/projects/{projectId}/link?teamId=team_LEhQWG6tor4xdTX0xjbBNtpl`
  - 断开只影响"自动构建"，不影响该项目已有的 `.vercel.app` 域名与历史部署。

### 🟡 P1：本地未提交的杂项改动
- `supabase/.temp/*`（CLI 自动生成，可忽略）
- `docs/march.md`、`docs/二月份完整的早课文档.md` 等
- `scripts/meditation-audit/verify/`（~40MB mp3 验证产物，已 gitignore，不要提交）
- 运行 `git status` 查看；按需决定是否提交或清理

### ✅ 已解决：Preview 环境变量（原 P2）
2026-08-03 已给 8 个变量补上 preview target，分支预览可正常运行。详见会话 4 第 11 条。

### 🟡 P1：MiniMax 额度会周期性耗尽
- 该 key 的 Token Plan 用量上限触发后全模型返回 429 `已达到 Token Plan 用量上限`，过一阵自行恢复
- **不影响可用性**：`lib/llm.ts` 熔断后自动走 `gpt-5.4-mini`，学员无感
- 日志里出现 `MiniMax-M3 额度/鉴权问题，回退到 gpt-5.4-mini` 是**正常现象，不是故障**
- 想彻底避免就去 MiniMax 后台升级套餐/充积分

### 🟡 P2：AIP 项目知识库是空的
- `document_chunks` 共 1287 条，**全部属于盖亚知识库项目**，AIP 各项目一条都没有；`wisdom_entries` 也是空表
- 说明 N8N 时代 AIP 的上传链路就没真正写入过。现在上传链路已修好，**需要重新上传项目文档**才能让 AIP 检索到东西
- 提示词里已加硬规则：检索为空时如实说"还没有相关资料"，禁止编造项目进度（实测未加时它会编出"已完成需求分析和市场调研"）

### 🟡 P2：历史 1287 条 chunk 的 parent_document_id 仍为 NULL
- 不影响使用（检索 RPC 从 `metadata->>document_id` 取），新写入的数据两处都填
- 想补齐的话写个一次性脚本按 metadata 回填即可

### 🔴 安全：`备忘录.md` 含明文账号密码
- 内容是 N8N 的登录账号密码，**已加入 `.gitignore`，绝不能提交**
- N8N 现已完全不再使用，该文件可以直接删除

### 🟢 P2：构建脆弱点可继续加固（可选）
项目里仍有模块顶层检查密钥 throw 的代码。若需 Preview 环境也能运行，可继续排查。根治办法是保证部署环境配齐环境变量。

---

## 三、下一步计划（按优先级）

1. **[P1] 用户验证盖亚对话**：登录 `www.futuremind2075.com`，打开盖亚确认能正常出字
   - 出问题一键回滚：`git revert -m 1 a4735fd`，或在 Vercel Deployments 里把上一个生产部署 Promote 回去（更快，不用重新构建）
2. **[P1] 改 Production Branch 为 `master`**：去 `futuremind2075` → Settings → **Environments → Production** 找分支设置改 master（Git 页已无此字段；API 做不到）
3. **[P1] 暂停多余项目**：`futuremind`、`future` 各自 Settings → Git → **Disconnect**（断开≠删除，可逆）
4. **[P2] 处理本地未提交杂项**：决定 `docs/` 文档等是否提交
5. **[P2] 验证 Preview 环境变量**（可选）：在 Vercel 给 Preview 环境补齐密钥
4. **[P2] 继续推进 CLAUDE.md 中的中期待办**：
   - 修复 N8N Vector Store 节点写入 `document_chunks`
   - 逐步移除 227 个 `@ts-nocheck`
   - 大型组件拆分（PBLProjectDetail、InteractionLog）
   - Rerank 优化（Cohere Reranker）

---

## 四、关键背景知识（避免踩坑）

### Vercel 部署方式（重要！）

**不要用 CLI 部署**（`vercel deploy`），中国网络会卡死在 "Building..."。正确做法：

```bash
# 用 API + gitSource 让 Vercel 服务端从 GitHub 拉代码构建
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer <VERCEL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "futuremind2075",
    "project": "prj_9QJsRhSqToxU77vzGStvzd3qXpcn",
    "target": "production",
    "gitSource": {
      "type": "github",
      "org": "Mike1075",
      "repo": "futuremind",
      "ref": "master"
    }
  }'
```

三种部署方式对比：

| 方式 | 代码来源 | 认证身份 | 受中国网络影响 |
|------|----------|----------|----------------|
| Git 触发 | GitHub webhook | commit author（可能被 Block） | 否 |
| CLI 部署 | 本地上传 | CLI token | **是（会卡死）** |
| **API + gitSource** | **Vercel 从 GitHub 拉** | **token 对应的团队 owner** | **否** |

> 需要用户提供 Vercel Token（以 `vcp_` 开头）。Token 不要写进代码或 CLAUDE.md。

### GitHub 权限 vs Vercel 团队成员（两套独立权限）
- **推送代码**只看 GitHub 仓库协作者权限：`dufutaoraul` 是 `Mike1075/futuremind` 的 collaborator
- **Vercel 团队成员**与推送代码无关，但 git 触发的部署会检查 commit author 是否在 Vercel 团队内
- 用 API + gitSource 可绕过 author 检查

### master 分支有保护规则
- 不能直接 `git push origin master`，会被拒
- **正确流程**：建分支 → push → `gh pr create` → `gh pr merge <n> --merge` → 本地 `git checkout master && git pull --ff-only` → 删临时分支

### 各家 LLM 接口的坑（2026-08-03 实测）
- **GPT-5 全系拒收 `max_tokens`**，必须用 `max_completion_tokens`
- **gpt-5.5 / 5.6-luna / sol / terra 拒收自定义 temperature**，只接受默认值 1；
  gpt-5.4-mini/nano 可以传，但一旦带上 `reasoning_effort` 就又不行了
- **MiniMax 原生接口 `/text/chatcompletion_v2` 在额度耗尽时返回 HTTP 200**，
  错误藏在 `base_resp.status_code`（2056）里 → **必须走 OpenAI 兼容接口 `/chat/completions`**，它才正确返回 429
- **MiniMax M3 默认开思考模式**，把 `<think>…</think>` 直接写进 `message.content`，
  不处理会原样显示给学员。只有 `thinking: {"type":"disabled"}` 能关，
  `reasoning_effort` / `enable_thinking` 会被静默忽略
- **embedding 绝对不能换模型**：库里 1287 条向量是 `text-embedding-3-small` 生成的
  （实测余弦相似度 0.9937；ada-002 为 -0.019），换了检索全废。对话模型可以随便换

### Vercel API 的坑
- 建**预览**部署时 **不能传 `target`**（传 `"preview"` 会 400，它只接受 `production`/`staging`/自定义环境名），
  省略 `target` 即为 preview
- 用 API token 访问预览域名会被 SSO 保护拦下，拿到的是 Vercel 登录页（`<title>Login – Vercel</title>`），
  **不是应用页面**——别把它当成应用内容去 grep，会得出错误结论
- `GET /v6/deployments/{id}/files` 对 Git 构建返回 404，读不到构建产物

### 本地构建的字体网络问题
- 本地**连不上 Google Fonts / vercel.com**
- `next build` 可能因下载不到字体而失败——这是本地网络问题，Vercel 上正常
- 判断构建是否真有问题时，排除 `next/font` / `module-not-found` 的字体错误

---

## 五、相关 PR / 提交链接
- PR #16：loading.tsx 重构 + 冥想审计脚本（已合并）
- PR #17：service.ts + parse 路由密钥延迟检查（已合并）
- PR #18：lib/supabase.ts 占位符 + 测试页 SSR（已合并）
- PR #19：赛斯365 下载转 JPEG（已合并）
- **PR #21：全面脱离 N8N + 对话模型切换 MiniMax M3（已合并，当前生产）**
- 仓库：https://github.com/Mike1075/futuremind
- Vercel 项目：futuremind2075（prj_9QJsRhSqToxU77vzGStvzd3qXpcn）
