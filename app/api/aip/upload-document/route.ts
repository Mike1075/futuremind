import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/aip/upload-document
 * AIP文档上传API - 代理到N8N webhook处理
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 获取FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string

    if (!file || !projectId || !title) {
      return NextResponse.json({
        error: 'Missing required fields: file, project_id, or title'
      }, { status: 400 })
    }

    console.log('[AIP Upload] 接收到上传请求:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      project_id: projectId,
      user_id: user.id,
      title
    })

    // 3. 创建新的FormData发送到N8N
    const n8nFormData = new FormData()
    n8nFormData.append('file', file)
    n8nFormData.append('project_id', projectId)
    n8nFormData.append('user_id', user.id)
    n8nFormData.append('title', title)

    // 4. 转发到N8N webhook
    const webhookUrl = 'https://n8n.aifunbox.com/webhook/267d2f36-116d-4e67-bedd-ef5d536cd200'

    console.log('[AIP Upload] 转发到N8N webhook:', webhookUrl)

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData
    })

    const responseText = await n8nResponse.text()

    console.log('[AIP Upload] N8N响应:', {
      status: n8nResponse.status,
      statusText: n8nResponse.statusText,
      response: responseText.substring(0, 200)
    })

    if (!n8nResponse.ok) {
      console.error('[AIP Upload] N8N返回错误:', responseText)
      return NextResponse.json({
        error: 'N8N processing failed',
        details: responseText
      }, { status: 500 })
    }

    // 5. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '文档上传成功',
      filename: file.name
    })

  } catch (error) {
    console.error('[AIP Upload] 上传失败:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
