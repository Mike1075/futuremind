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
| 对话模型 | Gemini（`gemini-2.5-flash`） | 两个聊天工作流挂的都是 `lmChatGoogleGemini` 节点 |
| 盖亚召回 | 8 条 | 原 topK=100，降低以控制上下文长度 |
| AIP 召回 | 20 条/项目 | 原 topK=300，`docs/RAG优化分析报告-2024-11-28.md` 把它列为 P0 问题并建议降到 20-50 |

## 环境变量

| 变量 | 用途 | 缺失后果 |
|------|------|---------|
| `OPENAI_API_KEY` | **必需**。文档 embedding，且必须是 OpenAI（向量空间要和库里已有的 1287 条对齐） | 检索和上传全挂 |
| `GEMINI_API_KEY` | 对话模型 | 自动回退到 OpenAI，功能不受影响 |
| `GAIA_KB_PROJECT_ID` | 盖亚知识库范围 | 盖亚检索跳过，只凭模型自身学识回答 |
| `GAIA_CHAT_MODEL` | 可选，覆盖盖亚对话模型 | 默认 `gemini-2.5-flash` |
| `AIP_CHAT_MODEL` | 可选，覆盖 AIP 对话模型 | 默认 `gemini-2.5-flash` |
| `LLM_FALLBACK_MODEL` | 可选，Gemini 失败时的回退模型 | 默认 `gpt-4o` |

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
