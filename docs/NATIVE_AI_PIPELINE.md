# AI 管线原生实现（取代 N8N）

> 2026-08-03 起，盖亚对话、AIP 对话、文档向量化全部在项目内实现，不再依赖任何外部工作流服务。

## 背景

外部 N8N 实例 `n8n.aifunbox.com` 失联（HTTP 522），负责的同事离职且忘记账号密码，无法恢复。
四个工作流全线不可用，盖亚对话直接报错。

原始工作流 JSON 在本机 `readme/N8NAIP/` 找回，已存档到 **`docs/n8n-archive/`**——
提示词、模型、检索参数全部来自这里，是唯一权威来源。

## 四个工作流的去向

| 原工作流 | Webhook | 现在的实现 |
|---------|---------|-----------|
| 心灵学院聊天bot（盖亚） | `79cbcc7c…` | `lib/gaia/native.ts` + `app/api/gaia/chat` |
| aip聊天助手（探索者联盟） | `c3585e19…` | `lib/aip/native.ts` + `app/api/aip/chat` |
| aip上传文档 | `267d2f36…` | `lib/rag/*` + `app/api/aip/upload-document` |
| futuremind上传文档 | `fca634ab…` | `lib/rag/*` + `app/api/admin/gaia-kb`、`app/api/n8n/upload` |

`app/api/admin/gaia-kb/callback`（N8N 回调）已删除——原本是个无鉴权的写接口，现在没有调用方。

## 数据流

```
用户提问
  → OpenAI text-embedding-3-small 生成查询向量
  → Supabase RPC 混合检索（向量 + 全文 RRF）
      盖亚：hybrid_search_gaia（GAIA_KB_PROJECT_ID 范围内）
      AIP ：hybrid_search（按 project_id 过滤，多项目并行）+ wisdom_entries 两层智慧库
  → 按 parent_document_id 去重，优先取父块 expanded_content
  → 人格提示词 + 学员档案 + 参考知识 = 一条 system message
     历史消息作为真实多轮 messages 回放
  → LLM（Gemini，失败自动回退 OpenAI）
  → 伪流式返回（前端做打字机效果，接口格式与原来完全一致）
```

文档上传：

```
文件 → extractTextFromFile（PDF 走 pdf-parse，其余按 UTF-8）
     → documents 表存全文（父文档）
     → chunkText 切子块（400 / overlap 100）
     → embedBatch 批量向量化
     → document_chunks 写入（同时填 parent_document_id 列和 metadata.document_id）
```

## 关键参数（全部对齐存档 JSON）

| 项目 | 值 | 依据 |
|------|-----|------|
| Embedding 模型 | `text-embedding-3-small` | `心灵学院聊天bot.json` 的 Embeddings OpenAI4 节点显式写明；另经余弦相似度实测 0.9937 确认与库中已有向量同源（ada-002 为 -0.019，已排除） |
| 分块 | 400 / overlap 100 | 两个上传工作流的 Recursive Character Text Splitter 节点 |
| 对话模型 | **MiniMax-M3**（兜底 `gpt-5.4-mini`） | 原工作流用的是 Gemini（`lmChatGoogleGemini` 节点），2026-08-03 按项目要求改为 MiniMax 主力；设 `GAIA_CHAT_MODEL=gemini-2.5-flash` 可切回 |
| 盖亚召回 | 8 条 | 原 topK=100，降低以控制上下文长度 |
| AIP 召回 | 20 条/项目 | 原 topK=300，`docs/RAG优化分析报告-2024-11-28.md` 把它列为 P0 问题并建议降到 20-50 |

## 环境变量

| 变量 | 用途 | 缺失后果 |
|------|------|---------|
| `OPENAI_API_KEY` | **必需**。①文档 embedding，必须是 OpenAI（向量空间要和库里已有的 1287 条对齐）②对话模型兜底 | 检索、上传、对话全挂 |
| `MINIMAX_API_KEY` | 对话主力模型 | 自动回退到 `gpt-5.4-mini`，功能不受影响 |
| `GAIA_KB_PROJECT_ID` | 盖亚知识库范围 | 盖亚检索跳过，只凭模型自身学识回答 |
| `MINIMAX_BASE_URL` | 可选，MiniMax 接口域名 | 默认 `https://api.minimaxi.com/v1`（国内站） |
| `GAIA_CHAT_MODEL` | 可选，覆盖盖亚对话模型 | 默认 `MiniMax-M3` |
| `AIP_CHAT_MODEL` | 可选，覆盖 AIP 对话模型 | 默认 `MiniMax-M3` |
| `LLM_FALLBACK_MODEL` | 可选，主模型失败时的兜底 | 默认 `gpt-5.4-mini` |
| `GEMINI_API_KEY` | 可选，仅在把对话模型设回 `gemini-*` 时需要 | — |

### 模型选型依据（2026-08-03 实测）

用盖亚真实提示词 + 真实检索上下文（约 5500 token 输入）横向对比：

| 模型 | 耗时 | 输出字数 | 结论 |
|------|------|---------|------|
| **MiniMax-M3** | 12s | 292-318 | **选作主力**：篇幅最贴合"不要长篇大论"的人设要求 |
| gpt-4o | 3.7s | 277 | 最快、语气也贴合 |
| **gpt-5.4-mini** | 4.8s | 603 | **选作兜底**：gpt-5 系列里最快 |
| gpt-5.4-nano | 7.5s | 1196 | 比 mini 又慢又啰嗦，虽便宜但不可取 |
| gpt-5.5 | 13.0s | 858 | 太慢 |
| gpt-5.6-luna / sol / terra | 8s 左右 | 580-640 | 无明显优势 |

M3 实测表现：会叫学员名字、用具体例子（视觉盲点 / 冰淇淋味觉疲劳 / 房间气味适应）、
结尾开放式提问、emoji 克制；多轮连贯；课程外话题（解梦）也能认真接住。
GPT-5 系列则明显偏长，且遇到"觉得世界不真实"会大幅转向心理危机话术，
偏离盖亚原本的哲学探讨调性。

### 各家接口的坑（实测）

- **GPT-5 全系拒收 `max_tokens`**，必须用 `max_completion_tokens`
- **gpt-5.5 / 5.6 全系拒收自定义 temperature**，只接受默认值 1；
  gpt-5.4-mini/nano 可以传，但一旦带上 `reasoning_effort` 就又不行了
- **MiniMax 原生接口 `/text/chatcompletion_v2` 在额度耗尽时返回 HTTP 200**，
  错误藏在 `base_resp.status_code`（2056）里；OpenAI 兼容接口 `/chat/completions`
  才正确返回 429。**所以必须走 OpenAI 兼容接口**
- **MiniMax M3 默认开启思考模式**，且把 `<think>…</think>` 直接写进
  `message.content`（不是单独字段），不处理就会原样显示给学员。
  实测只有 `thinking: {"type": "disabled"}` 能关掉它，
  `reasoning_effort` 和 `enable_thinking` 都会被静默忽略。
  关掉后同一问题：3.0s→1.7s，completion_tokens 105→47。
  `lib/llm.ts` 除了下发该参数，还额外做了一层 `<think>` 剥离兜底
- Gemini flash 系列不关掉 thinking 的话，思考过程会吃掉 `maxOutputTokens`
  导致返回空内容；但 pro 系列又不接受 `thinkingBudget=0`

### 熔断机制

主模型返回额度/鉴权类错误时，`lib/llm.ts` 会把它冷却 10 分钟，期间直接走兜底，
避免每条消息都白等一次注定失败的请求。冷却是单实例内存状态，
充值后最多一个周期自动恢复，不需要人工干预。

N8N 相关变量（`N8N_CHAT_WEBHOOK_URL`、`N8N_UPLOAD_WEBHOOK`、`N8N_AIP_CHAT_WEBHOOK_URL`、
`N8N_AIP_UPLOAD_WEBHOOK`、`N8N_GAIA_CHAT_WEBHOOK_URL`）已全部废弃，可从 Vercel 删除。

## 提示词

两个人格提示词都以存档 JSON 里的原文为准，改动全部在源码注释里逐条说明：

- 盖亚：`lib/gaia/native.ts` 的 `GAIA_PERSONA`，原文出自 `心灵学院聊天bot.json` 的 **AI Agent** 节点
- AIP：`lib/aip/native.ts` 的 `AIP_PERSONA`，原文出自 `aip聊天生成历史2.0.json` 的 **6-Final-AI-Answer** 节点

共同的改写：原文要求模型「必须调用 xx 工具」，而现在检索和历史都由代码预先取好直接注入，
因此把工具调用指令改写成了对应的上下文说明。

## 已知的数据现状

- `document_chunks` 共 1287 条，**全部属于盖亚知识库项目**，AIP 各项目的知识块为 0
- `wisdom_entries` 为空，智慧库两层目前都取不到内容
- 历史 1287 条 chunk 的 `parent_document_id` 列全是 NULL（N8N 时代的遗留 bug），
  只有 `metadata.document_id` 有值。检索 RPC 从 metadata 取，所以不影响使用；
  新写入的数据两处都填

因此 AIP 对话目前检索不到任何项目资料。提示词里已加硬规则：检索为空时如实说"还没有相关资料"，
禁止编造项目进度——实测未加这条规则时模型会凭空编出"已完成需求分析和市场调研"。
项目文档上传后即可正常检索。

## 部署说明

盖亚/AIP 上传接口设了 `maxDuration = 300`，聊天接口设了 `maxDuration = 60`。
向量化改成了同步等待完成再返回（Serverless 下 fire-and-forget 不可靠，
返回响应后函数可能被冻结，后台任务会被杀掉）。
