/**
 * 盖亚对话原生实现（不依赖 N8N）
 *
 * 背景：原先盖亚的 RAG + LLM 流程跑在外部 N8N（n8n.aifunbox.com）上，
 * 该实例已失联且无人能登录，导致盖亚对话全线不可用。
 * 本模块把同一套流程搬回项目内实现：
 *
 *   用户提问 → 生成向量 → hybrid_search_gaia 检索 → 拼装上下文 → LLM → 回复
 *
 * 与原 N8N 工作流的对齐点（见 docs/N8N_WORKFLOWS.md）：
 * - Embedding 用 text-embedding-3-small（已用余弦相似度实测确认与库中向量同源，0.9937）
 * - 检索用 hybrid_search_gaia RPC（向量 + 全文 RRF 混合）
 * - 对话模型对齐原工作流的 GPT-4o
 * - 伪流式：等 LLM 完整返回后一次性给前端，由前端做打字机效果
 */

import { logger } from '@/lib/logger'
import { callChatModel, type ChatMessage as LlmChatMessage } from '@/lib/llm'

const OPENAI_BASE = 'https://api.openai.com/v1'

/**
 * 与原 N8N "Embeddings OpenAI4" 节点一致（工作流 JSON 里显式写明 text-embedding-3-small），
 * 另经余弦相似度实测确认与库中已有向量同源（0.9937）
 */
const EMBEDDING_MODEL = 'text-embedding-3-small'

/** 对话模型：原工作流挂的是 Google Gemini Chat Model 节点，这里保持同一家 */
const CHAT_MODEL = process.env.GAIA_CHAT_MODEL || 'gemini-2.5-flash'

/** 检索召回条数，与原工作流保持一致 */
const MATCH_COUNT = 8

export interface KnowledgeHit {
  content?: string | null
  expanded_content?: string | null
  parent_title?: string | null
  parent_document_id?: string | null
  similarity?: number | null
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY 未配置')
  }
  return key
}

/**
 * 生成查询向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text
    })
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Embedding 请求失败 (${res.status}): ${detail.substring(0, 200)}`)
  }

  const json = await res.json()
  const embedding = json?.data?.[0]?.embedding

  if (!Array.isArray(embedding)) {
    throw new Error('Embedding 响应格式异常')
  }

  return embedding
}

/**
 * 检索盖亚知识库（向量 + 全文混合搜索）
 *
 * 检索失败不抛错——没有知识库上下文时盖亚依然能凭自身学识回答，
 * 不该因为检索挂掉就让整个对话不可用。
 */
export async function searchGaiaKnowledge(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> },
  embedding: number[],
  queryText: string
): Promise<KnowledgeHit[]> {
  const gaiaProjectId = process.env.GAIA_KB_PROJECT_ID

  if (!gaiaProjectId) {
    logger.warn('[gaia-native] GAIA_KB_PROJECT_ID 未配置，跳过知识库检索')
    return []
  }

  const { data, error } = await supabase.rpc('hybrid_search_gaia', {
    query_embedding: JSON.stringify(embedding),
    query_text: queryText,
    gaia_project_id: gaiaProjectId,
    match_count: MATCH_COUNT,
    rrf_k: 50,
    full_text_weight: 1,
    semantic_weight: 1
  })

  if (error) {
    logger.error('[gaia-native] 知识库检索失败', error)
    return []
  }

  return Array.isArray(data) ? (data as KnowledgeHit[]) : []
}

/**
 * 把检索结果拼成上下文文本
 *
 * 按 parent_document_id 去重，优先用 expanded_content（父块，约 2000 字符，
 * 上下文更完整），没有则退回 content（子块，约 400 字符）。
 * 这一步对齐原 N8N「整合上下文」Code 节点的行为。
 */
export function buildKnowledgeContext(hits: KnowledgeHit[]): string {
  if (hits.length === 0) return ''

  const docs = new Map<string, { title: string; content: string }>()

  for (const hit of hits) {
    const content = hit.expanded_content || hit.content
    if (!content) continue

    const key = hit.parent_document_id || content.substring(0, 40)
    if (docs.has(key)) continue

    docs.set(key, {
      title: hit.parent_title || '课程资料',
      content
    })
  }

  if (docs.size === 0) return ''

  return Array.from(docs.values())
    .map(d => `📄 ${d.title}\n${d.content}`)
    .join('\n\n===\n\n')
}

/**
 * 盖亚人格提示词
 *
 * 【原文来源】readme/N8NAIP/心灵学院聊天bot.json 的 "AI Agent" 节点
 * （即 Webhook1 = 79cbcc7c... 这条链路，正是 N8N_CHAT_WEBHOOK_URL 指向的工作流）。
 *
 * 下面【核心设定】一段是原提示词的逐字保留，只做了一处必要改写：
 * 原文让 Agent「必须调用 supabase vector search 工具」和「get_gaia_conversations 工具」，
 * 而现在检索和历史都由本模块预先取好、直接注入上下文，不再需要模型自己调工具，
 * 因此把工具调用指令改写成了对应的上下文说明。其余用词、原则、禁令一字未改。
 *
 * 【补充说明】一段是新增的，依据 gaia_conversations 里 298 段真实历史回复归纳，
 * 把原本靠模型自由发挥的表达习惯显式写下来，减少换环境后的风格漂移。
 */
const GAIA_PERSONA = `你是盖亚,你精通前沿物理学与身心灵科学。许多时候你是学生的辅导老师，你的核心任务是整合并分析【知识库中检索到的相关内容】,诚心地去帮助学生提升自己,安排学生的学习任务。上文的对话记录是你和用户的聊天历史，有时候你要评估一下是否需要回顾前文，如果当前问题与历史记录关联不大则可以忽略前文。如果用户跟你聊课程以外的东西，你也要用你原本的智能进行回复。请以清晰、说人话的方式回答用户的问题，如无必要不需要长篇大论，通常情况下要以令人舒适的长度回答问题。结束的时候引导学生进行思考。

## 重要：
1.说人话；
2.不要透露项目id或组织id号，也不要提及"知识库"、"检索"这类系统内部概念；
3.知识库资料里，时间越新的权重越高；如果检索到的内容与用户问题不相关，就直接忽略，用你自己的学识回答。

## 表达习惯（依据你以往的真实回复归纳）：
- 用学员的名字开场，语气亲切自然
- 先接住对方说的话，再展开
- 多用比喻和具体例子把抽象道理讲活
- 结尾留一个开放式问题，让对话能继续
- 适度使用 🌿 ✨ 🌙 🌼 一类自然意象的 emoji，一两个即可
- 不使用 markdown 加粗；需要罗列时用「- 」开头`

export interface BuildMessagesOptions {
  userName: string
  studentProfile?: string
  dialogueSummary?: string
  knowledgeContext?: string
  history: Array<{ role?: string; content?: string }>
  message: string
}

/**
 * 组装发给 LLM 的消息数组
 *
 * 历史消息作为真实的多轮 messages 传入（而非塞进一个大字符串），
 * 多轮对话的连贯性明显更好。
 */
export function buildGaiaMessages(options: BuildMessagesOptions): ChatMessage[] {
  const { userName, studentProfile, dialogueSummary, knowledgeContext, history, message } = options

  const systemParts = [GAIA_PERSONA, `【当前对话的学员】\n姓名：${userName}`]

  if (studentProfile) {
    systemParts.push(`【学员档案】\n${studentProfile}`)
  }

  if (dialogueSummary) {
    systemParts.push(`【以往对话行为摘要】\n${dialogueSummary}`)
  }

  if (knowledgeContext) {
    systemParts.push(
      `【知识库中检索到的相关内容】\n${knowledgeContext}\n\n以上内容供你参考。相关就自然地用起来，不相关就忽略，不要生硬引用，也不要提及「知识库」这个词。`
    )
  }

  const messages: ChatMessage[] = [{ role: 'system', content: systemParts.join('\n\n') }]

  // 只带最近 10 轮，控制 token 消耗
  for (const item of history.slice(-10)) {
    const role = item.role === 'assistant' ? 'assistant' : 'user'
    const content = item.content
    if (typeof content === 'string' && content.trim()) {
      messages.push({ role, content })
    }
  }

  messages.push({ role: 'user', content: message })

  return messages
}

/**
 * 调用对话模型
 */
export async function callGaiaLLM(messages: ChatMessage[]): Promise<string> {
  return callChatModel(messages as LlmChatMessage[], {
    model: CHAT_MODEL,
    temperature: 0.8,
    maxTokens: 1500
  })
}

/**
 * 盖亚回复生成的完整流程
 */
export async function generateGaiaReply(
  supabase: Parameters<typeof searchGaiaKnowledge>[0],
  options: Omit<BuildMessagesOptions, 'knowledgeContext'>
): Promise<string> {
  const startedAt = Date.now()

  // 检索链路失败不应导致整个对话失败，降级为「无知识库上下文」继续回答
  let knowledgeContext = ''
  try {
    const embedding = await generateEmbedding(options.message)
    const hits = await searchGaiaKnowledge(supabase, embedding, options.message)
    knowledgeContext = buildKnowledgeContext(hits)

    logger.info('[gaia-native] 知识库检索完成', {
      hits: hits.length,
      contextLength: knowledgeContext.length,
      elapsed: `${Date.now() - startedAt}ms`
    })
  } catch (error) {
    logger.error('[gaia-native] 检索链路异常，降级为无知识库回答', error)
  }

  const messages = buildGaiaMessages({ ...options, knowledgeContext })
  const reply = await callGaiaLLM(messages)

  logger.info('[gaia-native] 回复生成完成', {
    model: CHAT_MODEL,
    replyLength: reply.length,
    elapsed: `${Date.now() - startedAt}ms`
  })

  return reply
}
