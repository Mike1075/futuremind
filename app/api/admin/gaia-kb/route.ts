import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: 获取盖亚知识库文档列表
export async function GET() {
  try {
    const supabase = await createClient()

    // 验证用户权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查用户角色（只有老师和校长可访问）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 查询盖亚知识库文档
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .order('created_at', { ascending: false })

    if (error) throw error

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
    const supabase = await createClient()

    // 验证用户权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

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

    // 获取下一个project_id编号
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('metadata')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .order('created_at', { ascending: false })
      .limit(1)

    let nextProjectId = 'p001'
    if (existingDocs && existingDocs.length > 0) {
      const metadata = existingDocs[0].metadata as any
      const lastProjectId = metadata?.custom_project_id as string || 'p000'
      const lastNumber = parseInt(lastProjectId.substring(1))
      nextProjectId = `p${String(lastNumber + 1).padStart(3, '0')}`
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
          custom_project_id: nextProjectId,
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

    console.log('[盖亚知识库] 已保存到数据库，document_id:', newDoc.id)

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
    n8nFormData.append('project_id', nextProjectId)
    n8nFormData.append('title', title)
    n8nFormData.append('document_id', newDoc.id) // 传递document_id，供N8N回调使用

    console.log('[盖亚知识库] 开始上传到N8N（后台处理）:', {
      url: webhookUrl,
      project_id: nextProjectId,
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
      project_id: nextProjectId,
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
  try {
    const supabase = await createClient()

    // 验证用户权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 })
    }

    // 删除文档
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('metadata->>type', 'gaia_knowledge_base') // 确保只能删除盖亚知识库文档

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[盖亚知识库] 删除失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
