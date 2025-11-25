import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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
        const projectId = metadata?.custom_project_id || metadata?.project_id
        const currentStatus = metadata?.status

        logger.debug(`[盖亚知识库] 检查文档: ${doc.id}, title: ${doc.title}, status: ${currentStatus}, project_id: ${projectId}`)

        // 如果状态是processing，检查是否实际已完成
        if (currentStatus === 'processing' && projectId) {
          logger.debug(`[盖亚知识库] >>> 发现processing状态文档，开始查询向量块，project_id: ${projectId}`)

          try {
            // 🔧 修复：.neq()不匹配NULL，需要查询所有然后手动过滤
            logger.debug(`[盖亚知识库] 开始查询向量块...`)

            const { data: allDocs, error: vectorError } = await supabase
              .from('documents')
              .select('id, metadata')
              .eq('metadata->>project_id', projectId)

            let vectorCount = 0
            if (vectorError) {
              logger.error(`[盖亚知识库] ❌ 查询失败:`, vectorError)
            } else if (allDocs) {
              // 手动过滤掉主文档（type = 'gaia_knowledge_base'）
              const vectors = allDocs.filter((d: any) => {
                const meta = d.metadata as any
                return meta?.type !== 'gaia_knowledge_base'
              })
              vectorCount = vectors.length
              logger.debug(`[盖亚知识库] ✅ 查询成功，总文档: ${allDocs.length}, 向量块: ${vectorCount}`)
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
    const courseId = formData.get('courseId') as string

    if (!file || !title || !courseId) {
      return NextResponse.json(
        { error: '缺少文件、标题或课程ID' },
        { status: 400 }
      )
    }

    // 先记录到数据库（标记为processing状态）
    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        title,
        content: '', // 内容由N8N处理
        user_id: user.id,
        metadata: {
          type: 'gaia_knowledge_base',
          custom_project_id: courseId, // 使用用户选择的课程ID
          project_id: courseId, // 同时保存到project_id字段（用于向量搜索）
          filename: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
          status: 'processing' // 标记为处理中
        },
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[盖亚知识库] 数据库插入失败:', insertError)
      throw insertError
    }

    logger.debug('[盖亚知识库] 已保存到数据库', { document_id: newDoc.id, course_id: courseId })

    // 异步上传到N8N（不等待结果，让N8N在后台处理）
    const webhookUrl = 'https://n8n.aifunbox.com/webhook/fca634ab-8e03-4a6f-99f3-c7dc46e772ae'
    const n8nFormData = new FormData()

    // 🔧 修复：根据文件扩展名设置正确的MIME类型
    const fileName = file.name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
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

    // 创建带正确MIME类型的Blob
    const fileBuffer = await file.arrayBuffer()
    const blob = new Blob([fileBuffer], { type: mimeType })

    n8nFormData.append('file', blob, fileName)
    n8nFormData.append('project_id', courseId) // 使用用户选择的课程ID
    n8nFormData.append('title', title)
    n8nFormData.append('document_id', newDoc.id) // 传递document_id，供N8N回调使用

    logger.debug('[盖亚知识库] 开始上传到N8N（后台处理）:', {
      url: webhookUrl,
      project_id: courseId,
      document_id: newDoc.id,
      title: title,
      filename: fileName,
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
          metadata.error_message = `N8N调用失败: ${error.message}`
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
      project_id: courseId,
      message: '文档已提交，正在后台处理向量化...'
    })
  } catch (error: any) {
    logger.error('[盖亚知识库] 上传失败:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? (error.message || '上传失败') : '上传失败' },
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
    const projectId = metadata?.custom_project_id

    // 第二步：删除所有关联的向量块
    if (projectId) {
      const { data: vectorChunks, error: deleteVectorError } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>project_id', projectId)
        .select('id')

      logger.debug('[后端DELETE] 向量块删除', { count: vectorChunks?.length || 0 })

      if (deleteVectorError) {
        logger.error('[后端DELETE] 删除向量块失败', deleteVectorError)
        throw deleteVectorError
      }
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
    return NextResponse.json({
      error: error?.message || '删除失败',
      details: error?.toString()
    }, { status: 500 })
  }
}
