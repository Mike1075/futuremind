// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * POST /api/discussions/[id]/like
 * 点赞讨论
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getClient()
    const admin = getAdminClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: discussionId } = params

    // 检查讨论是否存在
    const { data: discussion, error: discussionError } = await admin
      .from('course_discussions')
      .select('id, is_deleted')
      .eq('id', discussionId)
      .single()

    if (discussionError || !discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    if (discussion.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot like deleted discussion' },
        { status: 403 }
      )
    }

    // 检查是否已经点赞
    const { data: existingLike } = await admin
      .from('discussion_likes')
      .select('id')
      .eq('discussion_id', discussionId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this discussion' },
        { status: 400 }
      )
    }

    // 添加点赞（trigger会自动更新likes_count）
    const { error } = await admin
      .from('discussion_likes')
      .insert({
        discussion_id: discussionId,
        user_id: user.id,
      })

    if (error) {
      // 处理唯一约束违反（并发情况下）
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already liked this discussion' },
          { status: 400 }
        )
      }
      logger.error('[Discussions API] Error adding like', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 获取更新后的点赞数
    const { data: updatedDiscussion } = await admin
      .from('course_discussions')
      .select('likes_count')
      .eq('id', discussionId)
      .single()

    return NextResponse.json({
      success: true,
      likes_count: updatedDiscussion?.likes_count || 0,
    })
  } catch (error) {
    logger.error('[Discussions API] POST like unexpected error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/discussions/[id]/like
 * 取消点赞讨论
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getClient()
    const admin = getAdminClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: discussionId } = params

    // 删除点赞（trigger会自动更新likes_count）
    const { error } = await admin
      .from('discussion_likes')
      .delete()
      .eq('discussion_id', discussionId)
      .eq('user_id', user.id)

    if (error) {
      logger.error('[Discussions API] Error removing like', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 获取更新后的点赞数
    const { data: updatedDiscussion } = await admin
      .from('course_discussions')
      .select('likes_count')
      .eq('id', discussionId)
      .single()

    return NextResponse.json({
      success: true,
      likes_count: updatedDiscussion?.likes_count || 0,
    })
  } catch (error) {
    logger.error('[Discussions API] DELETE like unexpected error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
