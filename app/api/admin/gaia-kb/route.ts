// @ts-nocheck
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import pdf from 'pdf-parse'

// GET: 获取盖亚知识库文档列表
export async function GET() {
  try {
    // 先用普通客户端验证权限
    const authClient = await createClient()

    // 验证用户权限
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查用户角色（只有老师和校长可访问）
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // ✅ 使用Admin客户端查询文档（绕过RLS）
    const supabase = createAdminClient()
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 智能更新状态：检查是否有对应的向量块（使用Admin客户端）
    logger.debug(`[盖亚知识库] ========== 开始智能状态检测 ==========`)
    logger.debug(`[盖亚知识库] 获取到文档数量: ${documents?.length || 0}`)

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const metadata = doc.metadata as any
        const projectId = metadata?.project_id
        const currentStatus = metadata?.status

        logger.debug(`[盖亚知识库] 检查文档: ${doc.id}, title: ${doc.title}, status: ${currentStatus}, project_id: ${projectId}`)

        // 如果状态是processing，检查是否实际已完成
        if (currentStatus === 'processing' && projectId) {
          logger.debug(`[盖亚知识库] >>> 发现processing状态文档，开始查询向量块，project_id: ${projectId}`)

          try {
            // 从 document_chunks 表查询向量块数量
            logger.debug(`[盖亚知识库] 开始查询向量块...`)

            const { count, error: vectorError } = await supabase
              .from('document_chunks')
              .select('id', { count: 'exact', head: true })
              .eq('metadata->>document_id', doc.id)

            let vectorCount = 0
            if (vectorError) {
              logger.error(`[盖亚知识库] ❌ 查询失败:`, vectorError)
            } else if (count !== null) {
              vectorCount = count
              logger.debug(`[盖亚知识库] ✅ 查询成功，向量块: ${vectorCount}`)
            } else {
              logger.debug(`[盖亚知识库] ⚠️ 查询返回null`)
            }

            // 如果有向量块，更新状态
            if (vectorCount > 0) {
              metadata.status = 'completed'
              metadata.vector_count = vectorCount
              const now = new Date().toISOString()

              logger.debug(`[盖亚知识库] ✅ 准备更新文档${doc.id}，向量块数: ${vectorCount}`)

              const { error: updateError } = await supabase
                .from('documents')
                .update({
                  metadata,
                  updated_at: now
                })
                .eq('id', doc.id)

              if (updateError) {
                logger.error(`[盖亚知识库] ❌ 更新失败:`, updateError)
              } else {
                logger.debug(`[盖亚知识库] ✅ 成功更新状态为completed`)
                // 同步更新内存对象
                doc.metadata = metadata
                doc.updated_at = now
              }
            } else {
              logger.debug(`[盖亚知识库] ⚠️ 向量块数为0，保持processing状态`)
            }
          } catch (err) {
            logger.error(`[盖亚知识库] ❌ 查询异常:`, err)
          }
        }
      }
    }

    return NextResponse.json({ documents })
  } catch (error) {
    logger.error('[盖亚知识库] 获取列表失败:', error)
    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    )
  }
}

// POST: 上传文档到N8N webhook并记录到数据库
export async function POST(request: Request) {
  try {
    // 先用普通客户端验证权限
    const authClient = await createClient()

    // 验证用户权限
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // ✅ 使用Admin客户端进行数据库操作（绕过RLS）
    const supabase = createAdminClient()

    // 解析FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file || !title) {
      return NextResponse.json(
        { error: '缺少文件或标题' },
        { status: 400 }
      )
    }

    // 读取文件内容（用于存入 documents.content，支持父子架构检索）
    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    // 根据文件类型提取文本内容
    let fileContent: string
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.pdf')) {
      // PDF 文件：使用 pdf-parse 提取文本
      try {
        const pdfData = await pdf(buffer)
        fileContent = pdfData.text
        logger.debug('[盖亚知识库] PDF 解析成功', {
          pages: pdfData.numpages,
          textLength: fileContent.length
        })
      } catch (pdfError: any) {
        logger.error('[盖亚知识库] PDF 解析失败:', pdfError)
        return NextResponse.json({
          error: 'PDF 解析失败',
          details: pdfError.message || '无法提取 PDF 文本内容'
        }, { status: 400 })
      }
    } else {
      // 文本文件：直接转换为 UTF-8
      fileContent = buffer.toString('utf-8')
    }

    // 使用盖亚专属的 project_id（从环境变量获取）
    const gaiaProjectId = process.env.GAIA_KB_PROJECT_ID
    if (!gaiaProjectId) {
      logger.error('[盖亚知识库] GAIA_KB_PROJECT_ID环境变量未配置')
      return NextResponse.json({ error: '服务配置错误', details: 'GAIA_KB_PROJECT_ID未配置' }, { status: 503 })
    }

    // 调试日志
    logger.debug('[盖亚知识库] 准备插入数据库', {
      title,
      content_length: fileContent.length,
      user_id: user.id,
      project_id: gaiaProjectId,
      filename: file.name,
      file_size: file.size
    })

    // 先记录到数据库（标记为processing状态）
    // 存入完整文件内容，支持父子架构检索（子块通过 parent_document_id 关联到此记录）
    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        title,
        content: fileContent, // 存入完整文件内容
        user_id: user.id,
        project_id: gaiaProjectId,
        metadata: {
          type: 'gaia_knowledge_base',
          project_id: gaiaProjectId,
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
          status: 'processing'
        },
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[盖亚知识库] 数据库插入失败:', insertError)
      throw insertError
    }

    logger.debug('[盖亚知识库] 已保存到数据库', { document_id: newDoc.id, project_id: gaiaProjectId })

    // SEC-03: N8N webhook URL必须通过环境变量配置
    // 盖亚知识库复用通用上传webhook（N8N_UPLOAD_WEBHOOK）
    const webhookUrl = process.env.N8N_UPLOAD_WEBHOOK
    if (!webhookUrl) {
      logger.error('[盖亚知识库] N8N_UPLOAD_WEBHOOK环境变量未配置')
      return NextResponse.json({ error: '服务配置错误' }, { status: 503 })
    }
    const n8nFormData = new FormData()

    // 🔧 修复：根据文件扩展名设置正确的MIME类型
    const n8nFileName = file.name
    const fileExtension = n8nFileName.substring(n8nFileName.lastIndexOf('.')).toLowerCase()
    let mimeType = file.type || 'application/octet-stream'

    // 强制设置正确的MIME类型（N8N只支持text/plain和application/pdf）
    if (fileExtension === '.md' || fileExtension === '.txt') {
      // ⚠️ N8N不支持text/markdown，统一使用text/plain
      mimeType = 'text/plain'
    } else if (fileExtension === '.pdf') {
      mimeType = 'application/pdf'
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      // Word文档也当作纯文本处理
      mimeType = 'text/plain'
    } else {
      // 其他所有类型都当作纯文本
      mimeType = 'text/plain'
    }

    // 创建带正确MIME类型的Blob（复用前面已读取的 fileBuffer）
    const blob = new Blob([fileBuffer], { type: mimeType })

    n8nFormData.append('file', blob, n8nFileName)
    n8nFormData.append('project_id', gaiaProjectId) // 使用盖亚专属 project_id
    n8nFormData.append('title', title)
    n8nFormData.append('document_id', newDoc.id) // 传递document_id，供N8N回调使用

    logger.debug('[盖亚知识库] 开始上传到N8N（后台处理）:', {
      url: webhookUrl,
      project_id: gaiaProjectId,
      document_id: newDoc.id,
      title: title,
      filename: n8nFileName,
      original_mime_type: file.type,
      corrected_mime_type: mimeType,
      file_size: file.size
    })

    // 发起请求但不等待（fire and forget）
    fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
    })
      .then(async (response) => {
        logger.debug('[盖亚知识库] N8N webhook响应:', {
          status: response.status,
          statusText: response.statusText,
          document_id: newDoc.id
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const responseText = await response.text()
        logger.debug('[盖亚知识库] N8N webhook成功', { responseText })
      })
      .catch(async (error) => {
        logger.error('[盖亚知识库] N8N webhook调用失败（异步）:', error)
        // 仅在开发环境记录详细错误
        if (process.env.NODE_ENV === 'development') {
          logger.error('[盖亚知识库] 错误详情:', {
            message: error.message,
            stack: error.stack,
            document_id: newDoc.id
          })
        }

        // 🔧 webhook失败时，自动更新文档状态为error
        try {
          const metadata = newDoc.metadata as any
          metadata.status = 'error'
          // SEC-01: 生产环境不泄露详细错误信息
          metadata.error_message = process.env.NODE_ENV === 'development'
            ? `N8N调用失败: ${error.message}`
            : 'N8N服务处理失败，请稍后重试'
          metadata.error_time = new Date().toISOString()

          const { error: updateError } = await supabase
            .from('documents')
            .update({
              metadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', newDoc.id)

          if (updateError) {
            logger.error('[盖亚知识库] 更新错误状态失败:', updateError)
          } else {
            logger.debug('[盖亚知识库] 已将文档状态更新为error', { document_id: newDoc.id })
          }
        } catch (updateErr) {
          logger.error('[盖亚知识库] 捕获更新异常:', updateErr)
        }
      })

    // 立即返回成功响应
    return NextResponse.json({
      success: true,
      document: newDoc,
      message: '文档已提交，正在后台处理向量化...'
    })
  } catch (error: any) {
    logger.error('[盖亚知识库] 上传失败:', error)
    // 临时：返回详细错误信息用于调试
    return NextResponse.json(
      {
        error: '上传失败',
        details: error.message || '未知错误',
        code: error.code,
        hint: error.hint
      },
      { status: 500 }
    )
  }
}

// DELETE: 删除文档
export async function DELETE(request: Request) {
  logger.debug('[后端DELETE] 开始删除操作', { url: request.url })

  try {
    // 先用普通客户端验证权限
    const authClient = await createClient()

    // 验证用户权限
    const { data: { user } } = await authClient.auth.getUser()
    logger.debug('[后端DELETE] 用户验证', { userId: user?.id || '未登录' })

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    logger.debug('[后端DELETE] 用户角色', { role: profile?.role || '未知' })

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // ✅ 使用Admin客户端进行删除操作（绕过RLS）
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 })
    }

    // 第一步：获取文档的project_id
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', documentId)
      .eq('metadata->>type', 'gaia_knowledge_base')
      .single()

    logger.debug('[后端DELETE] 查询结果', { found: !!doc, documentId })

    if (fetchError) {
      logger.error('[后端DELETE] 查询文档失败', fetchError)
      throw fetchError
    }

    if (!doc) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    const metadata = doc.metadata as any
    const projectId = metadata?.project_id

    // 第二步：删除所有关联的向量块（从 document_chunks 表）
    // 使用 document_id 精确匹配，避免删除其他文档的向量块
    const { data: vectorChunks, error: deleteVectorError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('metadata->>document_id', documentId)
      .select('id')

    logger.debug('[后端DELETE] 向量块删除', { count: vectorChunks?.length || 0, documentId })

    if (deleteVectorError) {
      logger.error('[后端DELETE] 删除向量块失败', deleteVectorError)
      throw deleteVectorError
    }

    // 第三步：删除主记录
    const { error: deleteMainError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('metadata->>type', 'gaia_knowledge_base')

    if (deleteMainError) {
      logger.error('[后端DELETE] 删除主记录失败', deleteMainError)
      throw deleteMainError
    }

    logger.debug('[后端DELETE] 删除完成', { documentId })

    return NextResponse.json({
      success: true,
      deletedVectorChunks: projectId ? true : false,
      message: '删除成功'
    })
  } catch (error: any) {
    logger.error('[后端DELETE] 删除失败', error)
    // SEC-01: 不暴露错误详情
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
