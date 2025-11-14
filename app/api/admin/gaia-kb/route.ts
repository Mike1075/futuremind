import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const metadata = doc.metadata as any
        const projectId = metadata?.custom_project_id
        const currentStatus = metadata?.status

        // 如果状态是processing，检查是否实际已完成
        if (currentStatus === 'processing' && projectId) {
          // 使用Admin客户端查询向量块
          const { count, error: countError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('metadata->>project_id', projectId)

          if (!countError && count && count > 0) {
            metadata.status = 'completed'
            metadata.vector_count = count

            // 使用Admin客户端更新数据库
            await supabase
              .from('documents')
              .update({ metadata })
              .eq('id', doc.id)
              .then(() => {
                console.log(`[盖亚知识库] 已更新文档${doc.id}状态为completed，向量块数: ${count}`)
              })
          }
        }
      }
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[盖亚知识库] 获取列表失败:', error)
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
      console.error('[盖亚知识库] 数据库插入失败:', insertError)
      throw insertError
    }

    console.log('[盖亚知识库] 已保存到数据库，document_id:', newDoc.id, 'course_id:', courseId)

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

    console.log('[盖亚知识库] 开始上传到N8N（后台处理）:', {
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
    }).catch(error => {
      console.error('[盖亚知识库] N8N webhook调用失败（异步）:', error)
    })

    // 立即返回成功响应
    return NextResponse.json({
      success: true,
      document: newDoc,
      project_id: courseId,
      message: '文档已提交，正在后台处理向量化...'
    })
  } catch (error: any) {
    console.error('[盖亚知识库] 上传失败:', error)
    return NextResponse.json(
      { error: error.message || '上传失败' },
      { status: 500 }
    )
  }
}

// DELETE: 删除文档
export async function DELETE(request: Request) {
  console.log('[后端DELETE] ========== 开始删除操作 ==========')
  console.log('[后端DELETE] 请求URL:', request.url)

  try {
    // 先用普通客户端验证权限
    const authClient = await createClient()
    console.log('[后端DELETE] 身份验证客户端已创建')

    // 验证用户权限
    const { data: { user } } = await authClient.auth.getUser()
    console.log('[后端DELETE] 用户验证结果:', user ? `用户ID: ${user.id}` : '未登录')

    if (!user) {
      console.log('[后端DELETE] 用户未授权，返回401')
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('[后端DELETE] 用户角色:', profile?.role || '未知')

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      console.log('[后端DELETE] 权限不足，返回403')
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // ✅ 使用Admin客户端进行删除操作（绕过RLS）
    const supabase = createAdminClient()
    console.log('[后端DELETE] Admin客户端已创建（绕过RLS）')

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    console.log('[后端DELETE] 提取的文档ID:', documentId)

    if (!documentId) {
      console.log('[后端DELETE] 缺少文档ID，返回400')
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 })
    }

    console.log('[后端DELETE] ===== 步骤1: 查询文档信息 =====')

    // 第一步：获取文档的project_id
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', documentId)
      .eq('metadata->>type', 'gaia_knowledge_base')
      .single()

    console.log('[后端DELETE] 查询结果:', {
      找到文档: !!doc,
      错误: fetchError,
      文档数据: doc
    })

    if (fetchError) {
      console.error('[后端DELETE] 查询文档失败，错误详情:', fetchError)
      throw fetchError
    }

    if (!doc) {
      console.log('[后端DELETE] 文档不存在，返回404')
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    const metadata = doc.metadata as any
    const projectId = metadata?.custom_project_id

    console.log('[后端DELETE] 文档元数据:', {
      documentId,
      projectId,
      filename: metadata?.filename,
      完整metadata: metadata
    })

    // 第二步：删除所有关联的向量块
    if (projectId) {
      console.log('[后端DELETE] ===== 步骤2: 删除向量块 =====')
      console.log('[后端DELETE] 查询条件: metadata->>project_id =', projectId)

      // 先查询有多少向量块
      const { data: countData, error: countError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('metadata->>project_id', projectId)

      console.log('[后端DELETE] 向量块查询结果:', {
        数量: (countData as any)?.count || 0,
        错误: countError
      })

      const { data: vectorChunks, error: deleteVectorError } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>project_id', projectId)
        .select('id')

      console.log('[后端DELETE] 向量块删除结果:', {
        已删除数量: vectorChunks?.length || 0,
        删除的ID列表: vectorChunks?.map(v => v.id),
        错误: deleteVectorError
      })

      if (deleteVectorError) {
        console.error('[后端DELETE] 删除向量块失败，错误详情:', deleteVectorError)
        throw deleteVectorError
      }
    } else {
      console.log('[后端DELETE] 无project_id，跳过向量块删除')
    }

    // 第三步：删除主记录
    console.log('[后端DELETE] ===== 步骤3: 删除主记录 =====')
    console.log('[后端DELETE] 删除条件:', {
      id: documentId,
      'metadata->>type': 'gaia_knowledge_base'
    })

    const { error: deleteMainError, data: deleteMainData } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('metadata->>type', 'gaia_knowledge_base')
      .select()

    console.log('[后端DELETE] 主记录删除结果:', {
      删除的记录: deleteMainData,
      错误: deleteMainError
    })

    if (deleteMainError) {
      console.error('[后端DELETE] 删除主记录失败，错误详情:', deleteMainError)
      throw deleteMainError
    }

    console.log('[后端DELETE] ========== 删除完成 ==========')

    return NextResponse.json({
      success: true,
      deletedVectorChunks: projectId ? true : false,
      message: '删除成功'
    })
  } catch (error: any) {
    console.error('[后端DELETE] ========== 删除失败 ==========')
    console.error('[后端DELETE] 错误类型:', error?.constructor?.name)
    console.error('[后端DELETE] 错误消息:', error?.message)
    console.error('[后端DELETE] 完整错误:', error)
    return NextResponse.json({
      error: error?.message || '删除失败',
      details: error?.toString()
    }, { status: 500 })
  }
}
