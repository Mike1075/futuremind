import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/gaia/recent-messages?limit=10&offset=0
 * 获取用户最新对话的聊天消息（支持分页）
 * - limit: 返回的消息数量（默认10）
 * - offset: 从倒数第几条消息开始（默认0，即从最新的开始）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 获取用户最近更新的活跃对话（与 GaiaAPI 保持一致，添加 is_active 过滤）
    const { data: conversation, error } = await supabase
      .from('gaia_conversations')
      .select('id, messages')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !conversation) {
      // 没有历史对话
      return NextResponse.json({
        messages: [],
        conversationId: null,
        totalCount: 0,
        hasMore: false
      })
    }

    // 🔥 统一消息格式：支持两种输入格式
    // 格式1 (GaiaDialog): { id, content, isGaia, timestamp }
    // 格式2 (GlobalGaiaV3): { role, content, timestamp }
    const rawMessages = (conversation.messages as any[] || [])
    const normalizedMessages = rawMessages.map((msg: any) => {
      // 判断消息来源
      if (msg.role) {
        // 已经是 role 格式，直接返回
        return {
          role: msg.role,
          content: msg.content || '',
          timestamp: msg.timestamp
        }
      } else if (msg.isGaia !== undefined) {
        // isGaia 格式，转换为 role 格式
        return {
          role: msg.isGaia ? 'assistant' : 'user',
          content: msg.content || '',
          timestamp: msg.timestamp
        }
      } else {
        // 未知格式，默认作为用户消息
        return {
          role: 'user',
          content: msg.content || msg.text || '',
          timestamp: msg.timestamp || new Date().toISOString()
        }
      }
    })

    const totalCount = normalizedMessages.length

    // 从后往前切片（最新的消息在数组末尾）
    // offset=0, limit=10 -> 取最后10条
    // offset=10, limit=20 -> 取倒数第11到30条
    const startIndex = Math.max(0, totalCount - offset - limit)
    const endIndex = totalCount - offset
    const messages = normalizedMessages.slice(startIndex, endIndex)

    const hasMore = startIndex > 0

    return NextResponse.json({
      messages,
      conversationId: conversation.id,
      totalCount,
      hasMore
    })
  } catch (error) {
    logger.error('[Recent Messages] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
