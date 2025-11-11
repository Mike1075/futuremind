import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/submissions?contentId=xxx&dayKey=xxx
 * 获取用户在某个课程内容下的提交记录
 * dayKey可选，用于过滤特定项目/任务的提交
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')
    const dayKey = searchParams.get('dayKey')

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId parameter' },
        { status: 400 }
      )
    }

    // 构建查询
    let query = supabase
      .from('user_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_content_id', contentId)

    // 如果提供了dayKey，按dayKey过滤
    if (dayKey) {
      query = query.eq('day_key', dayKey)
      console.log(`🔍 查询提交记录: contentId=${contentId}, dayKey=${dayKey}`)
    }

    const { data: submissions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    console.log(`✅ 找到 ${submissions?.length || 0} 条提交记录`)

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('[Submissions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/submissions/:id
 * 删除一个提交记录
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission id' },
        { status: 400 }
      )
    }

    // 验证这个提交记录属于当前用户，并获取day_key和content_id
    const { data: submission } = await supabase
      .from('user_submissions')
      .select('user_id, day_key, course_content_id')
      .eq('id', submissionId)
      .single()

    if (!submission || (submission as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 403 }
      )
    }

    const dayKey = (submission as any).day_key
    const contentId = (submission as any).course_content_id

    console.log(`🗑️ 删除提交记录: id=${submissionId}, day_key=${dayKey}`)

    // 删除提交记录
    const { error: deleteError } = await supabase
      .from('user_submissions')
      .delete()
      .eq('id', submissionId)

    if (deleteError) {
      console.error('Error deleting submission:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete submission' },
        { status: 500 }
      )
    }

    // 如果有day_key，重新计算该任务的最高分并更新progress
    if (dayKey && contentId) {
      console.log(`🔄 重新计算 ${dayKey} 的最高分...`)

      // 查询该day_key的剩余提交记录，找到最高分
      const { data: remainingSubmissions } = await supabase
        .from('user_submissions')
        .select('score')
        .eq('user_id', user.id)
        .eq('course_content_id', contentId)
        .eq('day_key', dayKey)
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .limit(1)

      const newHighestScore = remainingSubmissions && remainingSubmissions.length > 0
        ? remainingSubmissions[0].score
        : 0  // 如果没有剩余提交，设为0

      console.log(`📊 ${dayKey} 新的最高分: ${newHighestScore}`)

      // 更新user_selected_projects的progress
      const { data: selection } = await supabase
        .from('user_selected_projects')
        .select('id, progress')
        .eq('user_id', user.id)
        .eq('project_id', contentId)
        .in('status', ['active', 'paused', 'completed'])
        .single()

      if (selection) {
        const updatedProgress: Record<string, number> = {
          ...((selection.progress as Record<string, number>) || {}),
          [dayKey]: newHighestScore
        }

        // 如果最高分是0，从progress中移除该key
        if (newHighestScore === 0) {
          delete updatedProgress[dayKey]
        }

        await supabase
          .from('user_selected_projects')
          .update({ progress: updatedProgress })
          .eq('id', selection.id)

        console.log(`✅ 已更新progress`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Submissions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
