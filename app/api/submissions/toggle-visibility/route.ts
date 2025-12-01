// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/submissions/toggle-visibility
 * 切换作业的公开/私密状态
 * Body参数：
 * - submissionId: 作业ID（必需）
 * - isPublic: 是否公开（必需）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, isPublic } = body

    if (!submissionId || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      )
    }

    // 验证作业属于当前用户
    const { data: submission, error: fetchError } = await supabase
      .from('user_submissions')
      .select('user_id, is_public')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only modify your own submissions' },
        { status: 403 }
      )
    }

    // 更新公开状态
    const { data: updateData, error: updateError } = await supabase
      .from('user_submissions')
      .update({ is_public: isPublic })
      .eq('id', submissionId)
      .select('is_public')
      .single()

    if (updateError) {
      logger.error('[Submissions] 更新作业状态失败', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission visibility' },
        { status: 500 }
      )
    }

    // 验证更新是否真的成功
    const { data: verifyData } = await supabase
      .from('user_submissions')
      .select('is_public')
      .eq('id', submissionId)
      .single()

    return NextResponse.json({
      success: true,
      isPublic: verifyData?.is_public ?? isPublic,
      verified: verifyData?.is_public === isPublic
    })

  } catch (error) {
    logger.error('[Submissions] toggle-visibility error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
