// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * PUT /api/discussions/[id]
 * 更新讨论内容
 */
export async function PUT(
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

    const { id } = params
    const body = await request.json()
    const { content } = body

    // 验证必填字段
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // 内容长度限制
    if (content.trim().length < 5) {
      return NextResponse.json(
        { error: 'Content must be at least 5 characters' },
        { status: 400 }
      )
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Content must be less than 2000 characters' },
        { status: 400 }
      )
    }

    // CQ-03: 使用maybeSingle()避免记录不存在时抛出错误
    const { data: existingDiscussion, error: fetchError } = await admin
      .from('course_discussions')
      .select('id, user_id, is_deleted')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      logger.error('[Discussions API] 查询讨论失败', fetchError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!existingDiscussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    if (existingDiscussion.is_deleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted discussion' },
        { status: 403 }
      )
    }

    if (existingDiscussion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own discussions' },
        { status: 403 }
      )
    }

    // CQ-03: 更新后使用maybeSingle()
    const { data: discussion, error } = await admin
      .from('course_discussions')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        user:profiles!course_discussions_user_id_fkey (
          id,
          username,
          avatar_url,
          user_type
        )
      `)
      .maybeSingle()

    if (error) {
      logger.error('[Discussions API] 更新讨论失败', error)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ discussion })
  } catch (error) {
    logger.error('[Discussions API] 意外错误', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/discussions/[id]
 * 软删除讨论
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

    const { id } = params

    // CQ-03: 使用maybeSingle()避免记录不存在时抛出错误
    const { data: existingDiscussion, error: fetchError } = await admin
      .from('course_discussions')
      .select('id, user_id, is_deleted')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      logger.error('[Discussions API] 查询讨论失败', fetchError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!existingDiscussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      )
    }

    if (existingDiscussion.is_deleted) {
      return NextResponse.json(
        { error: 'Discussion already deleted' },
        { status: 400 }
      )
    }

    if (existingDiscussion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own discussions' },
        { status: 403 }
      )
    }

    // 软删除（设置is_deleted为true）
    const { error } = await admin
      .from('course_discussions')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      logger.error('[Discussions API] 删除讨论失败', error)
      return NextResponse.json({ error: '删除失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Discussions API] 意外错误', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
