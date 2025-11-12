import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

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
      console.error('[Gaia Conversations] Error:', error)
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
    }

    return NextResponse.json({
      conversations: conversations || []
    })
  } catch (error) {
    console.error('[Gaia Conversations] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
