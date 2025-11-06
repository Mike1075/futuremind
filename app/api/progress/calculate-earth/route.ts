import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionService } from '@/lib/services/interaction.service'

/**
 * GET /api/progress/calculate-earth?contentId=xxx
 * 计算地球课程内容的真实学习进度
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

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId parameter' },
        { status: 400 }
      )
    }

    // 获取内容信息
    const { data: content, error: contentError } = await supabase
      .from('course_contents')
      .select('knowledge_points, socratic_questions, post_reflection')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // 解析内容结构
    const contentData = content as any
    const knowledgePoints = (contentData.knowledge_points as string[]) || []
    const socraticQuestions = (contentData.socratic_questions as any) || {}
    const postReflection = (contentData.post_reflection as string[]) || []

    const questionCounts = {
      pre: socraticQuestions.pre_watch?.length || 0,
      during: socraticQuestions.during_watch?.length || 0,
      post: socraticQuestions.post_watch?.length || 0
    }

    // 计算进度
    const result = await InteractionService.calculateProgress({
      userId: user.id,
      contentId,
      knowledgePointCount: knowledgePoints.length,
      questionCounts,
      reflectionCount: postReflection.length
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Calculate Earth Progress] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
