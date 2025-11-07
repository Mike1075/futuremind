import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionService } from '@/lib/services/interaction.service'

/**
 * GET /api/progress/earth-course-progress?courseSystemId=xxx&userId=xxx
 * 计算地球课程的总体进度（所有阶段的平均）
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
    const courseSystemId = searchParams.get('courseSystemId')
    const userId = searchParams.get('userId')

    if (!courseSystemId || !userId) {
      return NextResponse.json(
        { error: 'Missing courseSystemId or userId parameter' },
        { status: 400 }
      )
    }

    // 验证用户只能查询自己的进度
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 获取所有阶段
    const { data: stages, error: stagesError } = await supabase
      .from('course_stages')
      .select('id, stage_number')
      .eq('system_id', courseSystemId)
      .eq('is_published', true)
      .order('stage_number', { ascending: true })

    if (stagesError || !stages || stages.length === 0) {
      return NextResponse.json({ progress: 0 })
    }

    // 计算每个阶段的平均进度
    const stageProgresses: number[] = []

    for (const stage of stages) {
      // 获取该阶段的所有内容
      const { data: stageContents, error: contentsError } = await supabase
        .from('course_contents')
        .select('id, knowledge_points, socratic_questions, post_reflection')
        .eq('stage_id', stage.id)
        .eq('is_published', true)

      if (contentsError || !stageContents || stageContents.length === 0) {
        stageProgresses.push(0)
        continue
      }

      // 计算该阶段每个内容的进度
      const contentProgressPromises = stageContents.map(async (content: any) => {
        const knowledgePoints = (content.knowledge_points as string[]) || []
        const socraticQuestions = (content.socratic_questions as any) || {}
        const postReflection = (content.post_reflection as string[]) || []

        const questionCounts = {
          pre: socraticQuestions.pre_watch?.length || 0,
          during: socraticQuestions.during_watch?.length || 0,
          post: socraticQuestions.post_watch?.length || 0
        }

        const result = await InteractionService.calculateProgress({
          userId,
          contentId: content.id,
          knowledgePointCount: knowledgePoints.length,
          questionCounts,
          reflectionCount: postReflection.length
        })

        return result.progress
      })

      const contentProgresses = await Promise.all(contentProgressPromises)
      const stageTotal = contentProgresses.reduce((sum, p) => sum + p, 0)
      const stageProgress = Math.round(stageTotal / stageContents.length)
      stageProgresses.push(stageProgress)
    }

    // 计算所有阶段的平均进度作为总进度
    const totalStageProgress = stageProgresses.reduce((sum, p) => sum + p, 0)
    const progress = Math.round(totalStageProgress / stages.length)

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('[Earth Course Progress] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
