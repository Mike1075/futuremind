import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: N8N完成处理后的回调，更新文档状态
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { document_id, project_id, vector_count, status } = body

    console.log('[盖亚知识库回调] 收到N8N回调:', {
      document_id,
      project_id,
      vector_count,
      status
    })

    if (!document_id) {
      return NextResponse.json({ error: '缺少document_id' }, { status: 400 })
    }

    // 使用Admin客户端更新状态（绕过RLS）
    const supabase = createAdminClient()

    // 获取当前文档的metadata
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', document_id)
      .single()

    if (fetchError || !doc) {
      console.error('[盖亚知识库回调] 查询文档失败:', fetchError)
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    // 更新metadata
    const metadata = doc.metadata as any
    metadata.status = status || 'completed'
    metadata.vector_count = vector_count || 0
    metadata.updated_by_callback = true
    metadata.callback_time = new Date().toISOString()

    // 更新数据库
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('[盖亚知识库回调] 更新失败:', updateError)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    console.log('[盖亚知识库回调] ✅ 成功更新文档状态:', {
      document_id,
      status: metadata.status,
      vector_count: metadata.vector_count
    })

    return NextResponse.json({
      success: true,
      message: '状态已更新',
      document_id,
      status: metadata.status,
      vector_count: metadata.vector_count
    })
  } catch (error: any) {
    console.error('[盖亚知识库回调] 处理失败:', error)
    return NextResponse.json(
      { error: error.message || '处理失败' },
      { status: 500 }
    )
  }
}
