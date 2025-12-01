// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// ✅ 性能优化：启用30秒缓存，对话列表更新频率较低
export const revalidate = 30

/**
 * GET /api/gaia/conversations
 * 获取用户的聊天记录列表
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户的所有对话，按更新时间倒序
    const { data: conversations, error } = await supabase
      .from('gaia_conversations')
      .select('id, title, updated_at, message_count')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('[Gaia Conversations] 查询对话失败', error)
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
    }

    return NextResponse.json({
      conversations: conversations || []
    })
  } catch (error) {
    logger.error('[Gaia Conversations] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
