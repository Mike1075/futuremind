// Edge Function: generate-student-summary
// Description: 为所有学员生成AI综合评价
// Trigger: 每周日凌晨3点（在等级计算之后）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentData {
  id: string
  full_name: string
  consciousness_level: number
  composite_score: number
  conversations_count: number
  avg_conversation_turns: number
  submissions_count: number
  avg_submission_score: number
  courses_enrolled: string[]
  active_days: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey || !openaiApiKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[开始生成学员综合评价]', new Date().toISOString())

    // 获取所有学员
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, consciousness_level, composite_score')
      .neq('role', 'content_admin')

    if (studentsError) throw studentsError

    console.log(`[获取到 ${students.length} 位学员]`)

    let successCount = 0
    let failCount = 0

    for (const student of students) {
      try {
        console.log(`[处理学员] ${student.full_name} (${student.id})`)

        // 1. 收集学员统计数据（不含隐私内容）
        const studentData = await fetchStudentData(supabase, student)

        // 2. 调用OpenAI生成综合评价
        const summary = await generateSummaryWithAI(openaiApiKey, studentData)

        // 3. 保存到数据库
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 7) // 7天后过期

        const { error: upsertError } = await supabase
          .from('student_summaries')
          .upsert({
            user_id: student.id,
            personality_traits: summary.personality_traits,
            learning_style: summary.learning_style,
            strengths: summary.strengths,
            areas_for_growth: summary.areas_for_growth,
            overall_summary: summary.overall_summary,
            course_summaries: summary.course_summaries,
            generated_at: new Date().toISOString(),
            valid_until: validUntil.toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (upsertError) {
          console.error(`[保存失败] ${student.full_name}:`, upsertError)
          failCount++
        } else {
          console.log(`[保存成功] ${student.full_name}`)
          successCount++
        }

      } catch (error) {
        console.error(`[处理失败] ${student.full_name}:`, error)
        failCount++
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_students: students.length,
      success_count: successCount,
      fail_count: failCount,
      message: `成功为 ${successCount} 位学员生成AI综合评价`
    }

    console.log('[执行结果]', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[Edge Function 错误]', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function fetchStudentData(supabase: any, student: any): Promise<StudentData> {
  // 获取对话统计（不含messages内容）
  const { data: conversations } = await supabase
    .from('gaia_conversations')
    .select('id, message_count, created_at')
    .eq('user_id', student.id)

  // 获取作业统计（不含content内容）
  const { data: submissions } = await supabase
    .from('user_submissions')
    .select('id, score, submission_type, submitted_at, status')
    .eq('user_id', student.id)

  // 获取课程进度
  const { data: progress } = await supabase
    .from('user_progress')
    .select('course_contents(title, system_id)')
    .eq('user_id', student.id)

  // 计算统计数据
  const conversationsCount = conversations?.length || 0
  const avgConversationTurns = conversationsCount > 0
    ? conversations.reduce((sum: number, c: any) => sum + (c.message_count || 0), 0) / conversationsCount
    : 0

  const submissionsCount = submissions?.length || 0
  const avgSubmissionScore = submissionsCount > 0
    ? submissions.filter((s: any) => s.score != null).reduce((sum: number, s: any) => sum + s.score, 0) / submissionsCount
    : 0

  const coursesEnrolled = progress
    ? Array.from(new Set(progress.map((p: any) => p.course_contents?.system_id).filter(Boolean)))
    : []

  const activeDays = submissions
    ? new Set(submissions.map((s: any) => new Date(s.submitted_at).toDateString())).size
    : 0

  return {
    id: student.id,
    full_name: student.full_name,
    consciousness_level: student.consciousness_level,
    composite_score: student.composite_score,
    conversations_count: conversationsCount,
    avg_conversation_turns: Math.round(avgConversationTurns),
    submissions_count: submissionsCount,
    avg_submission_score: Math.round(avgSubmissionScore),
    courses_enrolled: coursesEnrolled,
    active_days: activeDays
  }
}

async function generateSummaryWithAI(apiKey: string, studentData: StudentData) {
  const systemPrompt = `你是未来心智学院的AI分析师。根据学员的学习统计数据（不包含具体对话和作业内容），生成综合评价。

评价维度：
1. personality_traits: 性格特点分析（JSON对象，包含开放性openness、责任心conscientiousness、外向性extraversion等维度，分数0-100）
2. learning_style: 学习风格（如：深度反思型、快速探索型、稳健前进型）
3. strengths: 优势列表（数组，3-5项）
4. areas_for_growth: 成长空间（数组，3-5项）
5. overall_summary: 总体评价（200-300字）
6. course_summaries: 每门课的学习情况（JSON对象）

请基于以下数据生成评价，返回严格的JSON格式。`

  const userPrompt = `学员数据：
姓名：${studentData.full_name}
意识等级：Level ${studentData.consciousness_level}/7
综合评分：${studentData.composite_score}/100
对话次数：${studentData.conversations_count}
平均对话轮次：${studentData.avg_conversation_turns}
作业提交数：${studentData.submissions_count}
平均作业分数：${studentData.avg_submission_score}
活跃天数：${studentData.active_days}
已注册课程数：${studentData.courses_enrolled.length}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`OpenAI API错误: ${response.status} - ${errorData}`)
  }

  const result = await response.json()
  const content = result.choices[0].message.content

  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('[JSON解析失败]', content)
    throw new Error('AI返回的内容无法解析为JSON')
  }
}
