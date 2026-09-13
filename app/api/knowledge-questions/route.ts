// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { contentId, knowledgePointIndex, knowledgePointText } = await request.json()

    if (!contentId || knowledgePointIndex === undefined || !knowledgePointText) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 1. 检查用户是否已有分配
    const { data: assignment } = await supabase
      .from('user_knowledge_point_assignments')
      .select('assigned_question_index, has_responded')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('knowledge_point_index', knowledgePointIndex)
      .single()

    // 2. 获取预生成的问题列表
    let { data: questionData } = await supabase
      .from('knowledge_point_questions')
      .select('questions')
      .eq('content_id', contentId)
      .eq('knowledge_point_index', knowledgePointIndex)
      .single()

    // 3. 如果没有预生成问题，使用默认问题（不再触发边缘函数，问题应由管理员提前生成）
    if (!questionData || !questionData.questions || questionData.questions.length === 0) {
      // 返回默认问题
      const defaultQuestions = [
        `这个概念与你的日常生活有什么联系？你能想到哪些具体的例子来说明它？`,
        `如果这个知识点不存在，世界会有什么不同？`,
        `这个概念的核心原理是什么？它是如何运作的？`,
        `你能用自己的话向一个小朋友解释这个概念吗？`,
        `这个知识点与其他学科有什么联系？能举例说明吗？`
      ]
      questionData = { questions: defaultQuestions }
    }

    const questions = questionData.questions as string[]

    // 4. 如果用户已有分配且已回答，返回相同问题
    if (assignment && assignment.has_responded) {
      const questionIndex = assignment.assigned_question_index
      return NextResponse.json({
        question: questions[questionIndex] || questions[0],
        questionIndex,
        hasResponded: true
      })
    }

    // 5. 用户未回答或没有分配，随机分配一个新问题
    const randomIndex = Math.floor(Math.random() * questions.length)

    if (assignment) {
      // 更新现有分配为新的随机问题
      const { error: updateError } = await supabase
        .from('user_knowledge_point_assignments')
        .update({
          assigned_question_index: randomIndex,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('knowledge_point_index', knowledgePointIndex)

      if (updateError) {
        logger.error('[Knowledge Questions] 更新分配失败:', updateError)
      }
    } else {
      // 保存新分配记录
      const { error: insertError } = await supabase
        .from('user_knowledge_point_assignments')
        .insert({
          user_id: user.id,
          content_id: contentId,
          knowledge_point_index: knowledgePointIndex,
          assigned_question_index: randomIndex,
          has_responded: false
        })

      if (insertError) {
        logger.error('[Knowledge Questions] 保存分配失败:', insertError)
      }
    }

    return NextResponse.json({
      question: questions[randomIndex],
      questionIndex: randomIndex,
      hasResponded: false
    })

  } catch (error) {
    logger.error('[Knowledge Questions] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 标记用户已回复问题
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { contentId, knowledgePointIndex, responseText } = await request.json()

    if (!contentId || knowledgePointIndex === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 更新用户回复状态
    const { error } = await supabase
      .from('user_knowledge_point_assignments')
      .update({
        has_responded: true,
        response_text: responseText || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .eq('knowledge_point_index', knowledgePointIndex)

    if (error) {
      logger.error('[Knowledge Questions] 更新回复状态失败:', error)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('[Knowledge Questions] 错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
