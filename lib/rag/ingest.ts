/**
 * 文档向量化入库（原生实现，不依赖 N8N）
 *
 * 背景：原先文档切块 + 向量化由外部 N8N 的 Vector Store 节点完成，
 * 该实例已失联。本模块把这条链路搬回项目内。
 *
 *   文档全文 → 父子分块 → 批量 embedding → 写入 document_chunks
 *
 * 与历史数据的兼容性（重要）：
 * - 现有 1287 条 chunk 的 metadata 里带 document_id / project_id / title，
 *   `/api/admin/gaia-kb` 的状态检测和删除逻辑都靠 `metadata->>document_id` 定位，
 *   所以这里必须继续写 metadata.document_id。
 * - 顺带修复 N8N 时代遗留的 bug：parent_document_id 这一列历史上始终是 NULL
 *   （全部 1287 条），只有 metadata 里有 document_id。新写入的数据两处都填。
 */

import { logger } from '@/lib/logger'

const OPENAI_BASE = 'https://api.openai.com/v1'

/** 与知识库现有向量同源，实测余弦相似度 0.9937 确认 */
const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * 分块参数与原 N8N 上传工作流的 Recursive Character Text Splitter 节点一致
 * （readme/N8NAIP/futuremind上传文档.json 与 aip上传文档.json 均为 400 / 100）
 */
const CHUNK_SIZE = 400
const CHUNK_OVERLAP = 100

/** 单次 embedding 请求的最大条数 */
const EMBED_BATCH_SIZE = 64

/** 单次 insert 的最大条数 */
const INSERT_BATCH_SIZE = 50

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY 未配置')
  }
  return key
}

/**
 * 把长文本切成子块
 *
 * 优先在段落边界切，段落过长时退回按句号等标点切，
 * 再长（比如一整段没有标点的文本）才硬切。
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  // 先按段落拆成"原子单元"，过长的段落继续按句子拆
  const units: string[] = []
  for (const paragraph of normalized.split(/\n\s*\n|\n/)) {
    const p = paragraph.trim()
    if (!p) continue

    if (p.length <= chunkSize) {
      units.push(p)
      continue
    }

    // 段落超长：按中英文句末标点切
    const sentences = p.split(/(?<=[。！？；!?;])\s*/).filter(s => s.trim())
    for (const sentence of sentences) {
      if (sentence.length <= chunkSize) {
        units.push(sentence)
      } else {
        // 连标点都没有的超长文本，只能硬切
        for (let i = 0; i < sentence.length; i += chunkSize) {
          units.push(sentence.slice(i, i + chunkSize))
        }
      }
    }
  }

  // 把原子单元累积成接近 chunkSize 的块
  const chunks: string[] = []
  let current = ''

  for (const unit of units) {
    if (current && current.length + unit.length + 1 > chunkSize) {
      chunks.push(current)
      // 从上一块尾部取一段作为重叠，保持上下文连续
      current = overlap > 0 ? current.slice(-overlap) + '\n' + unit : unit
    } else {
      current = current ? current + '\n' + unit : unit
    }
  }

  if (current.trim()) chunks.push(current)

  return chunks.filter(c => c.trim().length > 0)
}

/**
 * 批量生成向量
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE)

    const res = await fetch(`${OPENAI_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch })
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Embedding 批量请求失败 (${res.status}): ${detail.substring(0, 200)}`)
    }

    const json = await res.json()
    const data = json?.data

    if (!Array.isArray(data) || data.length !== batch.length) {
      throw new Error('Embedding 响应条数与请求不符')
    }

    // OpenAI 保证按 index 返回，但顺序不做承诺，显式排序更稳
    const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    for (const item of sorted) {
      if (!Array.isArray(item.embedding)) {
        throw new Error('Embedding 响应格式异常')
      }
      results.push(item.embedding)
    }
  }

  return results
}

export interface IngestOptions {
  /** documents 表的主键，作为父文档 */
  documentId: string
  /** 文档全文 */
  content: string
  title: string
  projectId?: string | null
  organizationId?: string | null
  userId?: string | null
  /** 额外写进 chunk metadata 的字段 */
  extraMetadata?: Record<string, unknown>
}

export interface IngestResult {
  chunkCount: number
}

/** 只约束到 .from()，避免和 supabase-js 复杂的链式泛型打架 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MinimalSupabase = { from: (table: string) => any }

/**
 * 把一篇文档切块、向量化并写入 document_chunks
 *
 * 会先清掉该文档已有的 chunk，所以重复调用是幂等的（可安全重试/重新入库）。
 * 需要传 Admin 客户端——写 document_chunks 要绕过 RLS。
 */
export async function ingestDocument(
  supabase: MinimalSupabase,
  options: IngestOptions
): Promise<IngestResult> {
  const { documentId, content, title, projectId, organizationId, userId, extraMetadata } = options
  const startedAt = Date.now()

  const chunks = chunkText(content)

  if (chunks.length === 0) {
    logger.warn('[rag-ingest] 文档没有可切分的内容', { documentId, title })
    return { chunkCount: 0 }
  }

  logger.info('[rag-ingest] 开始向量化', {
    documentId,
    title,
    contentLength: content.length,
    chunkCount: chunks.length
  })

  const embeddings = await embedBatch(chunks)

  // 重新入库前先清掉旧的 chunk，避免重复内容污染检索
  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .eq('metadata->>document_id', documentId)

  if (deleteError) {
    logger.warn('[rag-ingest] 清理旧向量块失败（继续写入新块）', deleteError)
  }

  const rows = chunks.map((chunk, index) => ({
    // parent_document_id 这一列历史数据全是 NULL（N8N 时代的 bug），这里补上
    parent_document_id: documentId,
    content: chunk,
    chunk_index: index,
    embedding: JSON.stringify(embeddings[index]),
    project_id: projectId || null,
    organization_id: organizationId || null,
    user_id: userId || null,
    metadata: {
      ...extraMetadata,
      title,
      source: 'native-ingest',
      // 下游用 metadata->>document_id 定位，必须保留
      document_id: documentId,
      project_id: projectId || null,
      chunk_index: index,
      total_chunks: chunks.length
    }
  }))

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const { error } = await supabase
      .from('document_chunks')
      .insert(rows.slice(i, i + INSERT_BATCH_SIZE))

    if (error) {
      logger.error('[rag-ingest] 写入向量块失败', error)
      throw new Error(`写入向量块失败: ${JSON.stringify(error).substring(0, 200)}`)
    }
  }

  logger.info('[rag-ingest] 向量化完成', {
    documentId,
    chunkCount: chunks.length,
    elapsed: `${Date.now() - startedAt}ms`
  })

  return { chunkCount: chunks.length }
}
