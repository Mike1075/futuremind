import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/gaia/conversation-detail
 * 获取特定对话的详细内容
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    // 获取对话详情
    const { data: conversation, error } = await supabase
      .from('gaia_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (error || !conversation) {
      console.error('[Conversation Detail] Error:', error)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 返回消息列表
    const messages = (conversation.messages as any[] || []) as Array<{
      role: string
      content: string
      timestamp: string
      metadata?: any
    }>

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      },
      messages
    })
  } catch (error) {
    console.error('[Conversation Detail] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
