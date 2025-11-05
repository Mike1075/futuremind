import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * PUT /api/progress/visit
 * 记录用户访问课程内容
 *
 * Body参数:
 * - contentId: 课程内容ID
 */
export async function PUT(req: NextRequest) {
  try {
    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId } = await req.json()

    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 })
    }

    // 使用UPSERT：如果记录存在则更新时间，否则插入新记录
    const { error } = await (supabase as any)
      .from('content_visit_records')
      .upsert(
        {
          user_id: user.id,
          content_id: contentId,
          last_visited_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,content_id'
        }
      )

    if (error) {
      console.error('[Visit Record] Database error:', error)
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Visit Record] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
