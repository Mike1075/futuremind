// API Route: /api/admin/students/[id]
// Description: 学员详情API - 获取单个学员的详细信息
// 权限：校长和老师（不包含隐私数据）

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const studentId = params.id

    // 1. 检查当前用户是否是管理员（校长或老师）
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // Note: 老师和校长都有权限查看所有学员（新权限系统）

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
      .maybeSingle()

    if (studentError) throw studentError

    // 3. 获取AI生成的综合评价（可见）
    const { data: summary } = await supabase
      .from('student_summaries')
      .select('*')
      .eq('user_id', studentId)
      .maybeSingle()

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

    // 10. 获取选修课程（新增）
    const { data: enrolledCourses } = await supabase
      .from('student_course_assignments')
      .select(`
        assigned_at,
        course_systems (
          id,
          title
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')

    const coursesList = enrolledCourses?.map((e: any) => ({
      course_id: e.course_systems.id,
      course_title: e.course_systems.title,
      assigned_at: e.assigned_at,
      // 临时占位AI评价（后续从 student_summaries.course_summaries 读取）
      ai_evaluation: `该学员在「${e.course_systems.title}」课程中表现积极，参与度良好。展现出对课程内容的理解能力，能够按时完成学习任务。建议继续保持学习热情，深入探索课程核心概念。`
    })) || []

    // 11. 获取所属分组（新增）
    const { data: groupsData } = await supabase
      .from('student_groups')
      .select(`
        id,
        name,
        group_type,
        member_ids,
        course_systems (
          title
        )
      `)
      .contains('member_ids', [studentId])

    const groupsList = groupsData?.map((g: any) => ({
      id: g.id,
      name: g.name,
      group_type: g.group_type,
      course_title: g.course_systems?.title
    })) || []

    // 12. 汇总返回数据
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
      },
      enrolled_courses: coursesList,
      groups: groupsList
    })

  } catch (error: any) {
    logger.error('[API] GET /api/admin/students/[id]失败', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
