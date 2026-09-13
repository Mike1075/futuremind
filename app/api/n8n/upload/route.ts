// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { extractTextFromFile } from '@/lib/rag/extract'
import { ingestDocument } from '@/lib/rag/ingest'

// 向量化是同步完成的，大文档需要更长的执行时间
export const maxDuration = 300

/**
 * POST /api/n8n/upload
 * 项目文档上传入知识库
 *
 * 路径名保留是为了不动前端调用方（lib/api/gaia.ts 的 uploadProjectDocument），
 * 但实现已不再经过 N8N：改为项目内提取文本 → 分块 → 向量化 → 写入 document_chunks。
 * 同时补上了原来缺失的身份校验（旧版是个无鉴权的裸转发）。
 */
export async function POST(req: NextRequest) {
  try {
    const authClient = await createServerSupabase()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = (formData.get('project_id') as string) || null
    const title = (formData.get('title') as string) || file?.name || '未命名文档'

    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 })
    }

    const fileContent = await extractTextFromFile(file)

    if (!fileContent.trim()) {
      return NextResponse.json({
        error: '无法从文件中提取文本内容，请上传 txt / md / pdf 格式'
      }, { status: 400 })
    }

    // 写 documents / document_chunks 需要绕过 RLS
    const admin = createAdminClient()

    const { data: newDoc, error: insertError } = await admin
      .from('documents')
      .insert({
        title,
        content: fileContent,
        user_id: user.id,
        project_id: projectId,
        metadata: {
          type: 'project_document',
          project_id: projectId,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
          status: 'processing'
        }
      })
      .select()
      .single()

    if (insertError || !newDoc) {
      logger.error('[Upload] 写入 documents 失败', insertError)
      return NextResponse.json({ error: '保存文档失败' }, { status: 500 })
    }

    const { chunkCount } = await ingestDocument(admin, {
      documentId: newDoc.id,
      content: fileContent,
      title,
      projectId,
      userId: user.id,
      extraMetadata: { type: 'project_document', filename: file.name }
    })

    await admin
      .from('documents')
      .update({
        metadata: { ...(newDoc.metadata as any), status: 'completed', vector_count: chunkCount },
        updated_at: new Date().toISOString()
      })
      .eq('id', newDoc.id)

    logger.info('[Upload] 文档入库完成', { document_id: newDoc.id, chunkCount })

    return NextResponse.json({ success: true, document_id: newDoc.id, vector_count: chunkCount })
  } catch (error) {
    logger.error('[Upload] 上传异常', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
