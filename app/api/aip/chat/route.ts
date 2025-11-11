import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chatInput, project_id, organization_id } = body

    if (!chatInput) {
      return NextResponse.json({ error: 'Missing chatInput' }, { status: 400 })
    }

    // 调用n8n webhook（使用正式端点，不是测试端点）
    const n8nResponse = await fetch(
      'https://n8n.aifunbox.com/webhook/fd6b2fff-af4c-4013-8fb6-ada231750a5a',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput,
          user_id: user.id,
          project_id: project_id || [],
          organization_id: organization_id || ''
        })
      }
    )

    if (!n8nResponse.ok) {
      throw new Error('N8N webhook failed')
    }

    const n8nData = await n8nResponse.json()

    // 保存聊天记录到数据库
    await supabase.from('chat_history').insert({
      user_id: user.id,
      content: chatInput,
      role: 'user',
      agent_type: 'member',  // 默认使用member类型
      project_id: project_id?.[0] || null,
      ai_content: n8nData.response || n8nData.output || JSON.stringify(n8nData),
      metadata: {
        organization_id,
        project_ids: project_id
      }
    })

    return NextResponse.json({
      response: n8nData.response || n8nData.output || '收到您的消息'
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat', details: error.message },
      { status: 500 }
    )
  }
}
