import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/gaia/recent-messages
 * 获取用户最近的10条聊天消息（用于打开盖亚时显示上下文）
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户最近更新的对话
    const { data: conversation, error } = await supabase
      .from('gaia_conversations')
      .select('id, messages')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !conversation) {
      // 没有历史对话
      return NextResponse.json({
        messages: [],
        conversationId: null
      })
    }

    const allMessages = (conversation.messages as any[] || []) as Array<{
      role: string
      content: string
      timestamp: string
    }>

    // 返回最后10条消息
    const recentMessages = allMessages.slice(-10)

    return NextResponse.json({
      messages: recentMessages,
      conversationId: conversation.id
    })
  } catch (error) {
    console.error('[Recent Messages] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
