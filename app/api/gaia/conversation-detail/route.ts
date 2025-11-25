import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

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

    // CQ-03: 使用maybeSingle()避免对话不存在时抛出错误
    const { data: conversation, error } = await supabase
      .from('gaia_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      logger.error('[Conversation Detail] 查询对话失败', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!conversation) {
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
    logger.error('[Conversation Detail] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
