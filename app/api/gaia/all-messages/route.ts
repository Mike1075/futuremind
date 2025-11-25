import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/gaia/all-messages?limit=100&offset=0
 * 获取用户的所有历史消息（合并所有对话，支持分页）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取分页参数
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500) // 最大500条
    const offset = parseInt(searchParams.get('offset') || '0')

    // 获取用户的所有对话（限制最近20个对话以防止内存问题）
    const { data: conversations, error } = await supabase
      .from('gaia_conversations')
      .select('id, messages, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      logger.error('[All Messages] 查询失败', error)
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

    // 应用分页
    const totalCount = allMessages.length
    const paginatedMessages = allMessages.slice(offset, offset + limit)

    return NextResponse.json({
      messages: paginatedMessages,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    logger.error('[All Messages] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
