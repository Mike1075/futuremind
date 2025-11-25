// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * GET /api/discussions/likes?discussion_ids=id1,id2,id3
 * 批量检查用户是否点赞了指定的讨论
 * 返回格式: { discussion_id: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getClient()
    const admin = getAdminClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const discussionIdsParam = searchParams.get('discussion_ids')

    if (!discussionIdsParam) {
      return NextResponse.json(
        { error: 'discussion_ids is required' },
        { status: 400 }
      )
    }

    const discussionIds = discussionIdsParam.split(',').filter(Boolean)

    if (discussionIds.length === 0) {
      return NextResponse.json({ likes: {} })
    }

    // 批量查询用户的点赞记录
    const { data: userLikes, error } = await admin
      .from('discussion_likes')
      .select('discussion_id')
      .eq('user_id', user.id)
      .in('discussion_id', discussionIds)

    if (error) {
      logger.error('[Discussions API] Error fetching likes', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 构建返回对象 { discussion_id: true/false }
    const likes: Record<string, boolean> = {}
    discussionIds.forEach((id) => {
      likes[id] = userLikes?.some((like) => like.discussion_id === id) || false
    })

    return NextResponse.json({ likes })
  } catch (error) {
    logger.error('[Discussions API] Unexpected error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
