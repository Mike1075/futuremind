import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth, errorResponse } from '@/lib/api-utils'

// Type definitions
interface Submission {
  id: string
  user_id: string
  course_content_id: string
  day_key: string | null
  score: number | null
  content: string
  created_at: string
  updated_at: string
}

interface UserSelectedProject {
  id: string
  progress: Record<string, number> | null
}

/**
 * GET /api/submissions?contentId=xxx&dayKey=xxx
 * 获取用户在某个课程内容下的提交记录
 * dayKey可选，用于过滤特定项目/任务的提交
 */
async function handleGetSubmissions(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 权限验证
    const auth = await requireAuth(req)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth

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
      logger.debug('Query with dayKey', { contentId, dayKey })
    }

    logger.dbQuery('user_submissions', 'SELECT')
    const { data: submissions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const duration = Date.now() - startTime
    logger.info('Submissions retrieved', {
      count: submissions?.length || 0,
      duration: `${duration}ms`
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    logger.error('Failed to fetch submissions', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to fetch submissions', error, 500)
  }
}

export const GET = withRateLimit(handleGetSubmissions, rateLimitConfigs.api)

/**
 * DELETE /api/submissions/:id
 * 删除一个提交记录
 */
async function handleDeleteSubmission(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 权限验证
    const auth = await requireAuth(req)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth

    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission id' },
        { status: 400 }
      )
    }

    // 验证这个提交记录属于当前用户，并获取day_key和content_id
    logger.dbQuery('user_submissions', 'SELECT')
    const { data: submission } = await supabase
      .from('user_submissions')
      .select('user_id, day_key, course_content_id')
      .eq('id', submissionId)
      .single()

    const typedSubmission = submission as Pick<Submission, 'user_id' | 'day_key' | 'course_content_id'> | null

    if (!typedSubmission || typedSubmission.user_id !== user.id) {
      logger.warn('Submission access denied', { submissionId, userId: user.id })
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 403 }
      )
    }

    const dayKey = typedSubmission.day_key
    const contentId = typedSubmission.course_content_id

    logger.info('Deleting submission', { submissionId, dayKey })

    // 删除提交记录
    logger.dbQuery('user_submissions', 'DELETE')
    const { error: deleteError } = await supabase
      .from('user_submissions')
      .delete()
      .eq('id', submissionId)

    if (deleteError) {
      throw deleteError
    }

    // 如果有day_key，重新计算该任务的最高分并更新progress
    if (dayKey && contentId) {
      logger.debug('Recalculating highest score', { dayKey })

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

      logger.debug('New highest score calculated', { dayKey, score: newHighestScore })

      // 更新user_selected_projects的progress
      const { data: selection } = await supabase
        .from('user_selected_projects')
        .select('id, progress')
        .eq('user_id', user.id)
        .eq('project_id', contentId)
        .in('status', ['active', 'paused', 'completed'])
        .single()

      if (selection) {
        const typedSelection = selection as UserSelectedProject
        const currentProgress = typedSelection.progress || {}

        const updatedProgress: Record<string, number> = {
          ...currentProgress,
          [dayKey]: newHighestScore
        }

        // 如果最高分是0，从progress中移除该key
        if (newHighestScore === 0) {
          delete updatedProgress[dayKey]
        }

        logger.dbQuery('user_selected_projects', 'UPDATE')
        await supabase
          .from('user_selected_projects')
          .update({ progress: updatedProgress })
          .eq('id', typedSelection.id)

        logger.debug('Progress updated')
      }
    }

    const duration = Date.now() - startTime
    logger.info('Submission deleted successfully', {
      duration: `${duration}ms`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete submission', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to delete submission', error, 500)
  }
}

export const DELETE = withRateLimit(handleDeleteSubmission, rateLimitConfigs.api)
