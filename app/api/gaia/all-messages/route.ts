import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/gaia/all-messages
 * 获取用户的所有历史消息（合并所有对话）
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户的所有对话
    const { data: conversations, error } = await supabase
      .from('gaia_conversations')
      .select('id, messages, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[All Messages] Error:', error)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    // 合并所有对话的消息
    const allMessages: Array<{
      role: string
      content: string
      timestamp: string
      conversationId: string
    }> = []

    conversations?.forEach(conv => {
      const messages = (conv.messages as any[] || []) as Array<{
        role: string
        content: string
        timestamp: string
      }>

      messages.forEach(msg => {
        allMessages.push({
          ...msg,
          conversationId: conv.id
        })
      })
    })

    // 按时间排序（从早到晚）
    allMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json({
      messages: allMessages,
      totalCount: allMessages.length
    })
  } catch (error) {
    console.error('[All Messages] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
