import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/gaia/load-history
 * 加载盖亚对话历史消息
 *
 * Body参数:
 * - offset: 偏移量（用于分页，默认0）
 * - limit: 每次加载数量（默认20）
 */
export async function POST(req: NextRequest) {
  try {
    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { offset = 0, limit = 20 } = await req.json()

    // 查找用户的活跃对话
    const { data: conversation, error: convError } = await supabase
      .from('gaia_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (convError || !conversation) {
      // 没有对话记录，返回空
      return NextResponse.json({
        conversationId: null,
        messages: [],
        hasMore: false
      })
    }

    // 获取消息数组
    const allMessages = (conversation.messages as any[] || []) as Array<{
      role: string
      content: string
      timestamp: string
      metadata?: any
    }>
    const totalMessages = allMessages.length

    // 计算分页
    // 由于要从最新的开始显示，我们需要反向处理
    // offset=0 时，取最后的limit条
    // offset=20 时，取倒数第21到40条
    const startIndex = Math.max(0, totalMessages - offset - limit)
    const endIndex = totalMessages - offset

    const messages = allMessages.slice(startIndex, endIndex)
    const hasMore = startIndex > 0

    return NextResponse.json({
      conversationId: conversation.id,
      messages,
      hasMore,
      total: totalMessages
    })
  } catch (error) {
    console.error('[Gaia Load History] Internal error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
