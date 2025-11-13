import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    console.log('🔐 用户验证:', user?.id)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, isPublic } = body
    console.log('📝 请求参数:', { submissionId, isPublic, type: typeof isPublic })

    if (!submissionId || typeof isPublic !== 'boolean') {
      console.error('❌ 参数验证失败:', { submissionId, isPublic })
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      )
    }

    // 验证作业属于当前用户
    console.log('🔍 查询作业:', submissionId)
    const { data: submission, error: fetchError } = await supabase
      .from('user_submissions')
      .select('user_id, is_public')
      .eq('id', submissionId)
      .single()

    console.log('📄 查询结果:', { submission, fetchError })

    if (fetchError || !submission) {
      console.error('❌ 作业不存在:', fetchError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.user_id !== user.id) {
      console.error('❌ 权限验证失败:', { submissionUserId: submission.user_id, currentUserId: user.id })
      return NextResponse.json(
        { error: 'You can only modify your own submissions' },
        { status: 403 }
      )
    }

    console.log('🔄 准备更新: 从', submission.is_public, '到', isPublic)

    // 更新公开状态
    const { data: updateData, error: updateError } = await supabase
      .from('user_submissions')
      .update({ is_public: isPublic })
      .eq('id', submissionId)
      .select('is_public')
      .single()

    console.log('💾 更新结果:', { updateData, updateError })

    if (updateError) {
      console.error('❌ 更新作业状态失败:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission visibility', details: updateError.message },
        { status: 500 }
      )
    }

    // 验证更新是否真的成功
    const { data: verifyData } = await supabase
      .from('user_submissions')
      .select('is_public')
      .eq('id', submissionId)
      .single()

    console.log('✅ 验证更新后的值:', verifyData)

    return NextResponse.json({
      success: true,
      isPublic: verifyData?.is_public ?? isPublic,
      verified: verifyData?.is_public === isPublic
    })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
