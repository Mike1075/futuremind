import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/n8n/gaia-history
 * 加载知识点讨论的历史消息
 *
 * Body参数:
 * - contentId: 课程内容ID
 * - knowledgePointText: 知识点或问题文本
 * - discussionType: 讨论类型
 */
export async function POST(req: NextRequest) {
  try {
    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId, knowledgePointText, discussionType } = await req.json()

    if (!contentId || !knowledgePointText || !discussionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 查找讨论主题
    const { data: discussion, error: discussionError } = await (supabase as any)
      .from('knowledge_discussions')
      .select('id, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('knowledge_point_text', knowledgePointText)
      .eq('discussion_type', discussionType)
      .single()

    if (discussionError || !discussion) {
      // 没有找到历史讨论
      return NextResponse.json({
        discussion: null,
        messages: []
      })
    }

    // 加载讨论消息
    const { data: messages, error: messagesError } = await (supabase as any)
      .from('discussion_messages')
      .select('role, content, created_at')
      .eq('discussion_id', discussion.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('[Gaia History] Load messages error:', messagesError)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    return NextResponse.json({
      discussion: {
        id: discussion.id,
        created_at: discussion.created_at,
        updated_at: discussion.updated_at
      },
      messages: messages || []
    })
  } catch (error) {
    console.error('[Gaia History] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
