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

    // 上传到N8N webhook
    const n8nFormData = new FormData()
    n8nFormData.append('file', file)
    n8nFormData.append('project_id', nextProjectId)
    n8nFormData.append('title', title)

    const webhookUrl = 'https://n8n.aifunbox.com/webhook/fca634ab-8e03-4a6f-99f3-c7dc46e772ae'

    console.log('[盖亚知识库] 准备上传到N8N:', {
      url: webhookUrl,
      project_id: nextProjectId,
      title: title,
      filename: file.name
    })

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
    })

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text()
      console.error('[盖亚知识库] N8N webhook失败:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        body: errorBody
      })
      throw new Error(`N8N webhook失败 (${webhookResponse.status}): ${webhookResponse.statusText}. Response: ${errorBody.substring(0, 200)}`)
    }

    const webhookResult = await webhookResponse.text()
    console.log('[盖亚知识库] N8N响应:', webhookResult)

    // 记录到数据库
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
        },
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      document: newDoc,
      project_id: nextProjectId,
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
