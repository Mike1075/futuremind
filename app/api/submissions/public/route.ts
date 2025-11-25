import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/submissions/public
 * 获取公开的优秀作业（评分≥90分且未被隐藏）
 * Query参数：
 * - contentId: 课程内容ID（必需）
 * - limit: 返回数量限制（可选，默认20）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const contentId = searchParams.get('contentId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId parameter' },
        { status: 400 }
      )
    }

    // 查询公开的优秀作业
    const { data: submissions, error } = await supabase
      .from('user_submissions')
      .select(`
        id,
        content,
        attachments,
        score,
        submitted_at,
        user_id,
        profiles:user_id (
          full_name
        )
      `)
      .eq('course_content_id', contentId)
      .eq('is_public', true)
      .eq('hidden_by_teacher', false)
      .gte('score', 90)
      .order('score', { ascending: false })
      .order('submitted_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('[提交] 查询公开作业失败', error)
      return NextResponse.json(
        { error: 'Failed to fetch public submissions' },
        { status: 500 }
      )
    }

    // 格式化返回数据
    const formattedSubmissions = submissions?.map(sub => ({
      id: sub.id,
      content: sub.content,
      attachments: sub.attachments,
      score: sub.score,
      submittedAt: sub.submitted_at,
      studentName: (sub.profiles as any)?.full_name || '匿名用户'
    })) || []

    return NextResponse.json({
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    })

  } catch (error) {
    logger.error('[提交] 公开作业API错误', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
