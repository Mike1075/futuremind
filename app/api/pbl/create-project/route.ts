import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

/**
 * POST /api/pbl/create-project
 * 用户创建新的PBL项目（需要AI内容审核）
 *
 * Body参数:
 * - title: 项目标题
 * - subtitle: 副标题
 * - projectIntro: 项目简介
 * - difficultyLevel: 难度等级
 * - moduleName: 模块名称
 * - weekPlan: 周计划（JSON数组）
 * - projectVisibility: public|private
 * - estimatedDuration: 预计时长（分钟）
 * - projectTags: 标签数组
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      projectIntro,
      difficultyLevel,
      moduleName,
      weekPlan,
      projectVisibility = 'private',
      estimatedDuration,
      projectTags = []
    } = body

    // 验证必填字段
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!projectIntro?.trim()) {
      return NextResponse.json({ error: 'Project introduction is required' }, { status: 400 })
    }

    if (!['public', 'private'].includes(projectVisibility)) {
      return NextResponse.json({ error: 'Invalid project visibility' }, { status: 400 })
    }

    if (difficultyLevel && !['基础探索', '进阶挑战', '深度研究', '创新实践'].includes(difficultyLevel)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 })
    }

    // 如果是公开项目，需要进行AI审核
    let aiReviewResult = null
    let reviewStatus = 'approved' // 私有项目默认通过
    let isAiReviewed = false

    if (projectVisibility === 'public') {
      // TODO: 调用边缘函数进行AI内容审核
      // 审核规则：不能有色情暴力、不能谈论政治、不能伤害攻击他人
      const contentToReview = `
        标题: ${title}
        副标题: ${subtitle || ''}
        简介: ${projectIntro}
      `.trim()

      try {
        // 调用边缘函数进行内容审核
        const { data: reviewData, error: reviewError } = await supabase.functions.invoke(
          'review-user-content',
          {
            body: {
              content: contentToReview,
              contentType: 'pbl_project'
            }
          }
        )

        if (reviewError) {
          console.error('[API Error] AI review failed:', reviewError)
          // 审核失败时默认拒绝
          reviewStatus = 'rejected'
          aiReviewResult = {
            error: reviewError.message,
            timestamp: new Date().toISOString()
          }
        } else {
          isAiReviewed = true
          reviewStatus = reviewData.approved ? 'approved' : 'rejected'
          aiReviewResult = {
            approved: reviewData.approved,
            reason: reviewData.reason || null,
            violations: reviewData.violations || [],
            timestamp: new Date().toISOString()
          }
        }
      } catch (reviewError) {
        console.error('[API Error] Exception during AI review:', reviewError)
        // 出现异常时，暂时标记为待审核，需要人工介入
        reviewStatus = 'pending'
        aiReviewResult = {
          error: 'Review service unavailable',
          timestamp: new Date().toISOString()
        }
      }
    }

    // 创建项目记录
    const { data: project, error: insertError } = (await supabase
      .from('course_contents')
      .insert({
        system_id: null, // 用户项目不属于任何课程系统
        content_type: 'icarus',
        sequence_number: 999, // 用户项目使用特殊序号
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        project_intro: projectIntro.trim(),
        difficulty_level: difficultyLevel || null,
        module_name: moduleName || null,
        week_plan: weekPlan || [],
        estimated_duration: estimatedDuration || null,
        project_tags: projectTags,
        project_visibility: projectVisibility,
        created_by_user: user.id,
        is_ai_reviewed: isAiReviewed,
        ai_review_result: aiReviewResult,
        review_status: reviewStatus,
        is_published: reviewStatus === 'approved' // 只有通过审核的才自动发布
      } as any)
      .select()
      .single()) as any

    if (insertError) {
      console.error('[API Error] Failed to create project:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 如果项目通过审核，自动将创建者添加到选择列表
    if (reviewStatus === 'approved') {
      await supabase
        .from('user_selected_projects')
        .insert({
          user_id: user.id,
          project_id: project.id,
          status: 'active',
          completion_percentage: 0
        } as any)
    }

    // 根据审核结果返回不同的消息
    let message = 'Project created successfully'
    if (projectVisibility === 'public') {
      if (reviewStatus === 'approved') {
        message = 'Project created and approved! It is now visible to all users.'
      } else if (reviewStatus === 'rejected') {
        message = 'Project created but rejected by AI review. Please revise the content.'
      } else {
        message = 'Project created and pending manual review.'
      }
    }

    return NextResponse.json({
      message,
      project,
      review: aiReviewResult
    }, { status: 201 })
  } catch (error) {
    console.error('[API Error] Internal error in create-project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
