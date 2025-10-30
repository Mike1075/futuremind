// API Route: /api/admin/students/[id]
// Description: 学员详情API - 获取单个学员的详细信息
// 权限：校长和老师（不包含隐私数据）

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const studentId = params.id

    // 1. 检查当前用户是否是管理员
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取学员基本信息（不含隐私字段）
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        consciousness_level,
        composite_score,
        percentile_rank,
        level_updated_at,
        created_at,
        consciousness_tree_view
      `)
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    // 3. 获取AI生成的综合评价（可见）
    const { data: summary } = await supabase
      .from('student_summaries')
      .select('*')
      .eq('user_id', studentId)
      .single()

    // 4. 获取等级历史记录
    const { data: levelHistory } = await supabase
      .from('consciousness_level_history')
      .select('*')
      .eq('user_id', studentId)
      .order('recorded_at', { ascending: false })
      .limit(10)

    // 5. 获取行为统计数据（最近30天）
    const { data: behaviorStats } = await supabase
      .from('user_behavior_stats')
      .select('*')
      .eq('user_id', studentId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false })

    // 6. 获取学习进度统计（不含具体内容）
    const { data: progress, count: progressCount } = await supabase
      .from('user_progress')
      .select(`
        id,
        progress_value,
        updated_at,
        course_contents (
          title,
          system_id,
          course_systems (
            title,
            system_key
          )
        )
      `, { count: 'exact' })
      .eq('user_id', studentId)

    // 7. 获取作业统计（不含content内容）
    const { data: submissions, count: submissionsCount } = await supabase
      .from('user_submissions')
      .select('id, score, submission_type, submitted_at, status', { count: 'exact' })
      .eq('user_id', studentId)

    // 8. 获取对话统计（不含messages内容）
    const { data: conversations, count: conversationsCount } = await supabase
      .from('gaia_conversations')
      .select('id, title, message_count, created_at', { count: 'exact' })
      .eq('user_id', studentId)

    // 9. 计算课程完成率
    const courseProgress = progress?.reduce((acc: any, p: any) => {
      const systemKey = p.course_contents?.course_systems?.system_key
      if (!systemKey) return acc

      if (!acc[systemKey]) {
        acc[systemKey] = {
          title: p.course_contents?.course_systems?.title,
          completed: 0,
          total: 0,
          percentage: 0
        }
      }

      acc[systemKey].total++
      if (p.progress_value >= 100) {
        acc[systemKey].completed++
      }

      acc[systemKey].percentage = Math.round((acc[systemKey].completed / acc[systemKey].total) * 100)

      return acc
    }, {})

    // 10. 汇总返回数据
    return NextResponse.json({
      student,
      summary,
      level_history: levelHistory || [],
      behavior_stats: behaviorStats || [],
      progress: {
        total_items: progressCount || 0,
        by_course: courseProgress || {}
      },
      submissions: {
        total: submissionsCount || 0,
        avg_score: submissions && submissions.length > 0
          ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
          : 0
      },
      conversations: {
        total: conversationsCount || 0,
        avg_depth: conversations && conversations.length > 0
          ? Math.round(conversations.reduce((sum, c) => sum + (c.message_count || 0), 0) / conversations.length)
          : 0
      }
    })

  } catch (error: any) {
    console.error(`[API Error] /api/admin/students/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
