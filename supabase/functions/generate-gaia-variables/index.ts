// Edge Function: generate-gaia-variables
// Description: 为所有学员生成盖亚N8N对话变量
// Trigger: 每周日凌晨4点（在AI评价生成之后）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[开始生成盖亚N8N变量]', new Date().toISOString())

    // 获取所有学员
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .neq('role', 'content_admin')

    if (studentsError) throw studentsError

    // 获取所有课程
    const { data: courses, error: coursesError } = await supabase
      .from('course_systems')
      .select('id, system_key, title, teaching_goals, guidance_keywords')
      .eq('is_active', true)

    if (coursesError) throw coursesError

    console.log(`[学员数: ${students.length}, 课程数: ${courses.length}]`)

    let totalGenerated = 0
    let failedCount = 0

    // 为每个学员的每门课程生成变量
    for (const student of students) {
      for (const course of courses) {
        try {
          console.log(`[处理] ${student.full_name} - ${course.title}`)

          // 1. 从student_summaries获取学生性格特点
          const { data: summary, error: summaryError } = await supabase
            .from('student_summaries')
            .select('personality_traits, learning_style, strengths, areas_for_growth')
            .eq('user_id', student.id)
            .single()

          if (summaryError && summaryError.code !== 'PGRST116') {
            // PGRST116 = 没有找到数据，这是正常的
            throw summaryError
          }

          // 构建学生性格档案
          const studentProfile = {
            personality: summary?.personality_traits || null,
            learning_style: summary?.learning_style || '数据收集中',
            strengths: summary?.strengths || [],
            challenges: summary?.areas_for_growth || []
          }

          // 2. 生成该学生学这门课的学习情况简介
          const courseSummary = await generateCourseLearningSummary(
            supabase,
            student.id,
            course.id,
            course.system_key
          )

          // 3. 计算有效期（7天）
          const validUntil = new Date()
          validUntil.setDate(validUntil.getDate() + 7)

          // 4. 保存到数据库
          const { error: upsertError } = await supabase
            .from('gaia_context_variables')
            .upsert({
              user_id: student.id,
              course_system_id: course.id,
              student_profile: studentProfile,
              course_learning_summary: courseSummary,
              course_teaching_goals: course.teaching_goals,
              course_guidance_keywords: course.guidance_keywords,
              generated_at: new Date().toISOString(),
              valid_until: validUntil.toISOString()
            }, {
              onConflict: 'user_id,course_system_id'
            })

          if (upsertError) {
            console.error(`[保存失败] ${student.full_name} - ${course.title}:`, upsertError)
            failedCount++
          } else {
            totalGenerated++
          }

        } catch (error) {
          console.error(`[处理失败] ${student.full_name} - ${course.title}:`, error)
          failedCount++
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_students: students.length,
      total_courses: courses.length,
      total_generated: totalGenerated,
      failed_count: failedCount,
      message: `成功为 ${students.length} 位学员生成 ${totalGenerated} 条盖亚N8N变量`
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

async function generateCourseLearningSummary(
  supabase: any,
  userId: string,
  courseId: string,
  courseKey: string
): Promise<string> {
  // 获取该学生在该课程的进度
  const { data: progress } = await supabase
    .from('user_progress')
    .select(`
      id,
      progress_value,
      course_contents!inner (
        id,
        system_id,
        title
      )
    `)
    .eq('user_id', userId)
    .eq('course_contents.system_id', courseId)

  // 每门课的总单元数
  const totalUnits: Record<string, number> = {
    'listening': 14,
    'earth': 6,
    'icarus': 12
  }

  const total = totalUnits[courseKey] || 0
  const completedCount = progress?.filter((p: any) => p.progress_value >= 100).length || 0
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

  // 获取最近作业表现
  const { data: recentSubmissions } = await supabase
    .from('user_submissions')
    .select('score, submission_type, submitted_at')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(3)

  const avgScore = recentSubmissions && recentSubmissions.length > 0
    ? Math.round(
        recentSubmissions
          .filter((s: any) => s.score != null)
          .reduce((sum: number, s: any) => sum + s.score, 0) / recentSubmissions.length
      )
    : 0

  // 获取对话统计
  const { data: conversations } = await supabase
    .from('gaia_conversations')
    .select('message_count')
    .eq('user_id', userId)

  const totalMessages = conversations?.reduce((sum: number, c: any) => sum + (c.message_count || 0), 0) || 0
  const avgDialogueDepth = conversations && conversations.length > 0
    ? Math.round(totalMessages / conversations.length)
    : 0

  // 生成文本描述
  if (completedCount === 0 && recentSubmissions?.length === 0) {
    return `该学员尚未开始学习${courseKey}课程，建议引导其开始探索课程内容。`
  }

  let summary = `该学员在${courseKey}课程中已完成 ${completedCount}/${total} 个单元（${completionRate}%）。`

  if (recentSubmissions && recentSubmissions.length > 0) {
    summary += ` 最近 ${recentSubmissions.length} 次作业平均分 ${avgScore} 分。`
  }

  if (conversations && conversations.length > 0) {
    summary += ` 共进行了 ${conversations.length} 次对话，平均对话深度 ${avgDialogueDepth} 轮。`
  }

  // 根据学习情况添加建议
  if (completionRate < 30) {
    summary += ` 学习进度较慢，建议更多鼓励和引导。`
  } else if (completionRate >= 70) {
    summary += ` 学习进度良好，可以深入探讨高级主题。`
  }

  return summary
}
