import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/progress/calculate
 * 计算用户的课程内容学习进度
 *
 * Query参数:
 * - contentId: 单个课程内容ID
 * - contentIds: 多个课程内容ID (逗号分隔)
 * - stageId: 阶段ID (计算该阶段所有内容的平均进度)
 *
 * 进度计算公式:
 * - 浏览进度: 40% (存在访问记录)
 * - 讨论进度: 60% (该内容的讨论消息数 >= 2)
 * - 总进度 = 浏览进度 + 讨论进度
 */
export async function GET(req: NextRequest) {
  try {
    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')
    const contentIdsParam = searchParams.get('contentIds')
    const stageId = searchParams.get('stageId')

    // 确定要计算的内容ID列表
    let contentIds: string[] = []

    if (stageId) {
      // 获取阶段下的所有内容
      const { data: stageContents, error: stageError } = await supabase
        .from('course_contents')
        .select('id')
        .eq('stage_id', stageId)

      if (stageError) {
        console.error('[Progress Calculate] Stage query error:', stageError)
        return NextResponse.json({ error: 'Failed to query stage contents' }, { status: 500 })
      }

      contentIds = stageContents?.map((c: any) => c.id) || []
    } else if (contentIdsParam) {
      contentIds = contentIdsParam.split(',').filter(id => id.trim())
    } else if (contentId) {
      contentIds = [contentId]
    } else {
      return NextResponse.json({ error: 'contentId, contentIds, or stageId is required' }, { status: 400 })
    }

    if (contentIds.length === 0) {
      return NextResponse.json({ error: 'No valid content IDs provided' }, { status: 400 })
    }

    // 批量查询访问记录
    const { data: visitRecords } = await (supabase as any)
      .from('content_visit_records')
      .select('content_id')
      .eq('user_id', user.id)
      .in('content_id', contentIds)

    const visitedContentIds = new Set(visitRecords?.map((r: any) => r.content_id) || [])

    // 批量查询讨论消息数
    // 策略：查询该用户在这些内容下的所有讨论，统计每个讨论的消息数
    const { data: discussions } = await (supabase as any)
      .from('knowledge_discussions')
      .select('id, content_id')
      .eq('user_id', user.id)
      .in('content_id', contentIds)

    const discussionIds = discussions?.map((d: any) => d.id) || []
    const contentToDiscussionMap = new Map<string, string[]>()

    discussions?.forEach((d: any) => {
      if (!contentToDiscussionMap.has(d.content_id)) {
        contentToDiscussionMap.set(d.content_id, [])
      }
      contentToDiscussionMap.get(d.content_id)!.push(d.id)
    })

    // 查询所有相关讨论的消息数
    const discussionMessageCounts = new Map<string, number>()
    if (discussionIds.length > 0) {
      const { data: messageCounts } = await (supabase as any)
        .from('discussion_messages')
        .select('discussion_id')
        .in('discussion_id', discussionIds)
        .eq('role', 'user') // 只统计用户消息

      messageCounts?.forEach((m: any) => {
        const count = discussionMessageCounts.get(m.discussion_id) || 0
        discussionMessageCounts.set(m.discussion_id, count + 1)
      })
    }

    // 计算每个内容的进度
    const progressResults = contentIds.map(cid => {
      // 浏览进度
      const browsingProgress = visitedContentIds.has(cid) ? 0.4 : 0

      // 讨论进度：该内容下所有讨论的用户消息数之和
      const relatedDiscussions = contentToDiscussionMap.get(cid) || []
      const totalUserMessages = relatedDiscussions.reduce((sum, did) => {
        return sum + (discussionMessageCounts.get(did) || 0)
      }, 0)
      const discussionProgress = totalUserMessages >= 2 ? 0.6 : 0

      const totalProgress = browsingProgress + discussionProgress

      return {
        contentId: cid,
        progress: totalProgress,
        browsing: browsingProgress,
        discussion: discussionProgress,
        userMessageCount: totalUserMessages
      }
    })

    // 如果是单个内容查询，直接返回单个对象
    if (contentId && contentIds.length === 1) {
      return NextResponse.json(progressResults[0])
    }

    // 如果是阶段查询，返回平均进度
    if (stageId) {
      const avgProgress = progressResults.reduce((sum, p) => sum + p.progress, 0) / progressResults.length
      return NextResponse.json({
        stageId,
        averageProgress: avgProgress,
        contentCount: progressResults.length,
        details: progressResults
      })
    }

    // 批量查询，返回数组
    return NextResponse.json({
      results: progressResults
    })
  } catch (error) {
    console.error('[Progress Calculate] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
