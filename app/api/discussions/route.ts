// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * GET /api/discussions?course_content_id={id}&parent_id={id}
 * 获取讨论列表（支持嵌套回复）
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const courseContentId = searchParams.get('course_content_id')
    const parentId = searchParams.get('parent_id')

    if (!courseContentId) {
      return NextResponse.json(
        { error: 'course_content_id is required' },
        { status: 400 }
      )
    }

    let query = admin
      .from('course_discussions')
      .select(`
        *,
        user:profiles!course_discussions_user_id_fkey (
          id,
          username,
          avatar_url,
          user_type
        ),
        replies:course_discussions!course_discussions_parent_id_fkey (
          id,
          content,
          likes_count,
          created_at,
          user:profiles!course_discussions_user_id_fkey (
            id,
            username,
            avatar_url,
            user_type
          )
        )
      `)
      .eq('course_content_id', courseContentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // 如果指定了parent_id，只获取该父评论的回复
    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      // 否则只获取顶级评论（没有父评论的）
      query = query.is('parent_id', null)
    }

    const { data: discussions, error } = await query

    if (error) {
      logger.error('[Discussions API] Error fetching discussions:', error)
      return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 })
    }

    return NextResponse.json({ discussions })
  } catch (error) {
    logger.error('[Discussions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/discussions
 * 创建新讨论/回复
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getClient()
    const admin = getAdminClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { course_content_id, content, parent_id = null } = body

    // 验证必填字段
    if (!course_content_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'course_content_id and content are required' },
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

    // 如果是回复，验证父评论是否存在
    if (parent_id) {
      const { data: parentDiscussion, error: parentError } = await admin
        .from('course_discussions')
        .select('id, is_deleted')
        .eq('id', parent_id)
        .single()

      if (parentError || !parentDiscussion || parentDiscussion.is_deleted) {
        return NextResponse.json(
          { error: 'Parent discussion not found or deleted' },
          { status: 404 }
        )
      }
    }

    // 创建讨论（使用admin client确保插入成功，RLS策略已配置）
    const { data: discussion, error } = await admin
      .from('course_discussions')
      .insert({
        course_content_id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select(`
        *,
        user:profiles!course_discussions_user_id_fkey (
          id,
          username,
          avatar_url,
          user_type
        )
      `)
      .single()

    if (error) {
      logger.error('[Discussions API] Error creating discussion:', error)
      return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 })
    }

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    logger.error('[Discussions API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
