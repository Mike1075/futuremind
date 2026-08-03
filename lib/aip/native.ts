/**
 * 探索者联盟（AIP）聊天的原生实现（不依赖 N8N）
 *
 * 背景：原先跑在 N8N 工作流「aip聊天生成历史」上（webhook c3585e19…），
 * 该实例已失联。本模块把同一套流程搬回项目内：
 *
 *   用户提问 → 生成向量 → 按项目检索知识库 + 智慧库 → 拼装上下文 → LLM → 回复
 *
 * 与原工作流的对齐点（原始工作流 JSON 见 readme/N8NAIP/aip聊天生成历史2.0.json）：
 * - Embedding：text-embedding-3-small（与盖亚同一套向量空间）
 * - 检索按 project_id 过滤，支持同时选多个项目
 * - 智慧库分「项目智慧库」和「组织智慧库」两层，提示词里对两者的用法有明确规定
 * - 对话模型：原工作流挂的是 Google Gemini Chat Model 节点
 *
 * 与原工作流的差异（均为有意为之）：
 * - topK 从 300 降到 20。docs/RAG优化分析报告-2024-11-28.md 把 topK=300 列为
 *   P0 级严重问题（上下文过长、模型迷失、成本高），当时的建议就是降到 20-50。
 * - 检索从纯向量换成 hybrid_search（向量 + 全文 RRF 混合），并带上父块扩展上下文。
 * - 原提示词里的 get_tasks / get_mannual 两个工具本项目没有对应实现，相关步骤已移除。
 */

import { logger } from '@/lib/logger'
import { embedBatch } from '@/lib/rag/ingest'
import { callChatModel, type ChatMessage } from '@/lib/llm'

/** 对话模型：与原 N8N 工作流同一家 */
const CHAT_MODEL = process.env.AIP_CHAT_MODEL || 'gemini-2.5-flash'

/** 每个项目的召回条数（原工作流 topK=300，见文件头说明） */
const MATCH_COUNT = 20

/** 智慧库每层的最大条数 */
const WISDOM_LIMIT = 5

export type { ChatMessage }

export interface AipKnowledgeHit {
  content?: string | null
  expanded_content?: string | null
  parent_title?: string | null
  parent_document_id?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MinimalSupabase = { rpc: (fn: string, args: Record<string, unknown>) => any; from: (t: string) => any }

/**
 * 检索项目知识库
 *
 * hybrid_search 的 filter_project_id 一次只接受一个项目，
 * 而 AIP 支持同时选多个项目，所以这里并行查完再合并去重。
 */
export async function searchProjectKnowledge(
  supabase: MinimalSupabase,
  embedding: number[],
  queryText: string,
  projectIds: string[],
  organizationId?: string
): Promise<AipKnowledgeHit[]> {
  const embeddingText = JSON.stringify(embedding)

  const targets = projectIds.length > 0 ? projectIds : [null]

  const results = await Promise.all(
    targets.map(async projectId => {
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: embeddingText,
        query_text: queryText,
        filter_project_id: projectId,
        filter_organization_id: organizationId || null,
        match_count: MATCH_COUNT,
        rrf_k: 50,
        full_text_weight: 1,
        semantic_weight: 1
      })

      if (error) {
        logger.error('[aip-native] 知识库检索失败', { projectId, error })
        return []
      }

      return Array.isArray(data) ? (data as AipKnowledgeHit[]) : []
    })
  )

  return results.flat()
}

/**
 * 查询智慧库（项目级 + 组织级）
 *
 * 对应原工作流里的「项目智慧库」「组织智慧库」两个 Postgres 节点。
 */
export async function fetchWisdom(
  supabase: MinimalSupabase,
  projectIds: string[],
  organizationId?: string
): Promise<{ project: string[]; organization: string[] }> {
  const queries: Promise<{ data: Array<{ content: string | null }> | null }>[] = []

  const projectQuery =
    projectIds.length > 0
      ? supabase
          .from('wisdom_entries')
          .select('content')
          .eq('wisdom_type', 'project')
          .in('project_id', projectIds)
          .order('quality_score', { ascending: false })
          .limit(WISDOM_LIMIT)
      : Promise.resolve({ data: [] })

  const orgQuery = organizationId
    ? supabase
        .from('wisdom_entries')
        .select('content')
        .eq('wisdom_type', 'organization')
        .eq('organization_id', organizationId)
        .order('quality_score', { ascending: false })
        .limit(WISDOM_LIMIT)
    : Promise.resolve({ data: [] })

  queries.push(projectQuery, orgQuery)

  const [projectResult, orgResult] = await Promise.all(queries)

  const pick = (r: { data: Array<{ content: string | null }> | null }) =>
    (r.data || []).map(x => x.content).filter((c): c is string => !!c)

  return { project: pick(projectResult), organization: pick(orgResult) }
}

/**
 * 拼装参考知识
 *
 * 结构对齐原「整合上下文」Code 节点：文档上下文按 parent_document_id 去重，
 * 优先用父块 expanded_content；智慧库分两层单独成段。
 */
export function buildAipContext(
  hits: AipKnowledgeHit[],
  wisdom: { project: string[]; organization: string[] }
): string {
  const parts: string[] = []

  const docs = new Map<string, { title: string; content: string }>()
  for (const hit of hits) {
    const content = hit.expanded_content || hit.content
    if (!content) continue

    const key = hit.parent_document_id || content.substring(0, 40)
    if (docs.has(key)) continue

    docs.set(key, { title: hit.parent_title || '项目文档', content })
  }

  if (docs.size > 0) {
    parts.push(
      '【相关文档上下文】\n' +
        Array.from(docs.values())
          .map(d => `📄 ${d.title}\n${d.content}`)
          .join('\n\n===\n\n')
    )
  }

  if (wisdom.project.length > 0) {
    parts.push('【项目智慧库】\n' + wisdom.project.join('\n\n---\n\n'))
  }

  if (wisdom.organization.length > 0) {
    parts.push('【组织智慧库】\n' + wisdom.organization.join('\n\n---\n\n'))
  }

  return parts.length > 0 ? parts.join('\n\n') : ''
}

/**
 * AIP 项目经理人格提示词
 *
 * 【原文来源】readme/N8NAIP/aip聊天生成历史2.0.json 的 "6-Final-AI-Answer" 节点。
 * 第 1、2 步原文是「必须调用 supabase vector search / get_chat_history 工具」，
 * 现在检索和历史都由本模块预先取好直接注入，因此改写成对应的上下文说明；
 * 原文第 5、6 步依赖 get_tasks / get_mannual 两个本项目没有的工具，已移除。
 * 其余（尤其是第 3、4 步对两层智慧库的用法规定）逐字保留。
 *
 * 【新增】「重要」第 3 条是原文没有的。实测发现：当项目还没有上传过任何文档时，
 * 检索结果为空，模型会凭空编造项目进度（"已完成需求分析和市场调研…"），
 * 这对项目管理场景是有害的，所以显式禁止。
 */
const AIP_PERSONA = `你是一个高级AI项目经理，你会根据团队资料和团队人员情况来协调安排和转告事宜。你的核心任务是整合并分析【参考知识】里的项目文档，结合上文的聊天历史，以清晰、说人话的方式回答用户的当前问题。

## 执行步骤：
1.【参考知识】里的文档内容如果与问题相关则精准回复，资料里时间越新的权重越高；
2.上文的对话记录是你和用户的聊天历史，如果当前问题与历史记录关联不大则可以忽略前文。要敏锐识别用户开头说的"那"，"但是"，以及以"呢"，"吗"结尾的，表示关联的词汇，这意味着你需要强烈联系上文；
3.必须判断【参考知识】的成分，如果【参考知识】同时包含【项目智慧库】和【组织智慧库】两部分内容，请将【组织智慧库】作为底色，再以【项目智慧库】为大方向,以文档里的相关信息作为主体来准备回答问题；
4.如果发现【项目智慧库】和【组织智慧库】与用户的当前问题不对应，那么可以不提及这两个智慧库的资料,文档同理；
5.回答用户问题。

## 重要：
1.说人话；
2.不要透露项目id或组织id号，也不要提及"知识库"、"检索"这类系统内部概念；
3.绝不编造事实。如果【参考知识】里没有能回答问题的内容，而用户问的又是项目进度、任务分工、成员安排、文档内容这类事实性问题，就如实说明你这边还没有相关资料，并建议他把项目文档上传上来，或者补充说明情况。宁可说"我还不知道"，也不要编一个听起来合理的答案。`

export interface BuildAipMessagesOptions {
  userName: string
  studentProfile?: string
  projectsInfo?: string
  knowledgeContext?: string
  history: Array<{ role?: string; content?: string }>
  message: string
}

export function buildAipMessages(options: BuildAipMessagesOptions): ChatMessage[] {
  const { userName, studentProfile, projectsInfo, knowledgeContext, history, message } = options

  const systemParts = [AIP_PERSONA, `【当前对话的成员】\n姓名：${userName}`]

  if (projectsInfo) systemParts.push(`【当前选中的项目】\n${projectsInfo}`)
  if (studentProfile) systemParts.push(`【成员画像】\n${studentProfile}`)
  if (knowledgeContext) systemParts.push(`【参考知识】\n${knowledgeContext}`)

  const messages: ChatMessage[] = [{ role: 'system', content: systemParts.join('\n\n') }]

  // 只带最近 10 轮，控制 token 消耗
  for (const item of history.slice(-20)) {
    const role = item.role === 'assistant' ? 'assistant' : 'user'
    if (typeof item.content === 'string' && item.content.trim()) {
      messages.push({ role, content: item.content })
    }
  }

  messages.push({ role: 'user', content: message })

  return messages
}

export interface GenerateAipReplyOptions extends Omit<BuildAipMessagesOptions, 'knowledgeContext'> {
  projectIds: string[]
  organizationId?: string
}

/**
 * AIP 回复生成的完整流程
 */
export async function generateAipReply(
  supabase: MinimalSupabase,
  options: GenerateAipReplyOptions
): Promise<string> {
  const startedAt = Date.now()

  // 检索失败不应导致整个对话失败，降级为「无参考知识」继续回答
  let knowledgeContext = ''
  try {
    const [embedding] = await embedBatch([options.message])
    const [hits, wisdom] = await Promise.all([
      searchProjectKnowledge(
        supabase,
        embedding,
        options.message,
        options.projectIds,
        options.organizationId
      ),
      fetchWisdom(supabase, options.projectIds, options.organizationId)
    ])

    knowledgeContext = buildAipContext(hits, wisdom)

    logger.info('[aip-native] 检索完成', {
      hits: hits.length,
      projectWisdom: wisdom.project.length,
      orgWisdom: wisdom.organization.length,
      contextLength: knowledgeContext.length,
      elapsed: `${Date.now() - startedAt}ms`
    })
  } catch (error) {
    logger.error('[aip-native] 检索链路异常，降级为无参考知识回答', error)
  }

  const messages = buildAipMessages({ ...options, knowledgeContext })
  const reply = await callChatModel(messages, {
    model: CHAT_MODEL,
    temperature: 0.7,
    maxTokens: 1500
  })

  logger.info('[aip-native] 回复生成完成', {
    model: CHAT_MODEL,
    replyLength: reply.length,
    elapsed: `${Date.now() - startedAt}ms`
  })

  return reply
}
