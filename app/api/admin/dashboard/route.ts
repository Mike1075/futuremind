// API Route: /api/admin/dashboard
// Description: 统计看板API - 获取整体统计数据
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. 检查当前用户是否是管理员（校长或老师）
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    const isPrincipal = profile.role === 'principal'
    const isTeacher = profile.role === 'teacher'

    // 2. 获取老师管理的学员ID（如果是老师）
    let managedStudentIds: string[] = []
    if (isTeacher) {
      const { data: assignment } = await supabase
        .from('teacher_assignments')
        .select('managed_student_ids')
        .eq('teacher_id', user.id)
        .single()

      managedStudentIds = assignment?.managed_student_ids || []
    }

    // 3. 获取学员数（校长看全部，老师看自己管理的）
    let studentCountQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')

    if (isTeacher) {
      if (managedStudentIds.length === 0) {
        // 老师没有分配学员，返回空数据
        return NextResponse.json({
          overview: { total_students: 0, total_groups: 0, total_assignments: 0, total_conversations: 0, total_submissions: 0, avg_level: 0, avg_score: 0 },
          level_distribution: {},
          registration_trend: [],
          activity_trend: [],
          recent_level_changes: [],
          course_stats: []
        })
      }
      studentCountQuery = studentCountQuery.in('id', managedStudentIds)
    }

    const { count: totalStudents } = await studentCountQuery

    // 4. 获取总分组数
    const { count: totalGroups } = await supabase
      .from('student_groups')
      .select('id', { count: 'exact', head: true })

    // 5. 获取课程分配数
    const { count: totalStudentAssignments } = await supabase
      .from('student_course_assignments')
      .select('id', { count: 'exact', head: true })

    // 6. 获取学员的等级和评分（校长看全部，老师看自己管理的）
    let studentsQuery = supabase
      .from('profiles')
      .select('consciousness_level, composite_score, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: true })

    if (isTeacher && managedStudentIds.length > 0) {
      studentsQuery = studentsQuery.in('id', managedStudentIds)
    }

    const { data: students } = await studentsQuery

    // 6. 计算等级分布
    const levelDistribution = students?.reduce((acc: any, s) => {
      acc[s.consciousness_level] = (acc[s.consciousness_level] || 0) + 1
      return acc
    }, {}) || {}

    // 7. 计算平均等级和平均评分
    const avgLevel = students && students.length > 0
      ? students.reduce((sum, s) => sum + s.consciousness_level, 0) / students.length
      : 0

    const avgScore = students && students.length > 0
      ? students.reduce((sum, s) => sum + s.composite_score, 0) / students.length
      : 0

    // 8. 获取最近30天的新增学员趋势
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentStudents = students?.filter(s =>
      new Date(s.created_at) >= thirtyDaysAgo
    ) || []

    // 按天分组统计
    const registrationTrend = recentStudents.reduce((acc: any, s) => {
      const date = new Date(s.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // 9. 获取最近的行为统计数据（最近7天）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentBehavior } = await supabase
      .from('user_behavior_stats')
      .select('date, online_duration_minutes, completed_lessons')
      .gte('date', sevenDaysAgo.toISOString())
      .order('date', { ascending: true })

    // 按日期聚合
    const activityTrend = recentBehavior?.reduce((acc: any, b) => {
      const date = b.date.split('T')[0]
      if (!acc[date]) {
        acc[date] = { online_minutes: 0, lessons: 0, count: 0 }
      }
      acc[date].online_minutes += b.online_duration_minutes || 0
      acc[date].lessons += b.completed_lessons || 0
      acc[date].count += 1
      return acc
    }, {}) || {}

    // 10. 获取最近的对话和作业统计
    const { count: totalConversations } = await supabase
      .from('gaia_conversations')
      .select('id', { count: 'exact', head: true })

    const { count: totalSubmissions } = await supabase
      .from('user_submissions')
      .select('id', { count: 'exact', head: true })

    // 11. 获取最近的等级变化记录（最近10条）
    const { data: recentLevelChanges } = await supabase
      .from('consciousness_level_history')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .order('recorded_at', { ascending: false })
      .limit(10)

    // 12. 获取课程统计
    const { data: courses } = await supabase
      .from('course_systems')
      .select('id, title, system_key')

    const courseStats = await Promise.all(
      (courses || []).map(async (course) => {
        const { count: assignedStudents } = await supabase
          .from('student_course_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('course_system_id', course.id)

        const { count: assignedGroups } = await supabase
          .from('course_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('course_system_id', course.id)

        return {
          ...course,
          assigned_students: assignedStudents || 0,
          assigned_groups: assignedGroups || 0
        }
      })
    )

    // 13. 返回统计数据
    return NextResponse.json({
      overview: {
        total_students: totalStudents || 0,
        total_groups: totalGroups || 0,
        total_assignments: totalStudentAssignments || 0,
        total_conversations: totalConversations || 0,
        total_submissions: totalSubmissions || 0,
        avg_level: Math.round(avgLevel * 10) / 10,
        avg_score: Math.round(avgScore * 100) / 100
      },
      level_distribution: levelDistribution,
      registration_trend: Object.entries(registrationTrend).map(([date, count]) => ({
        date,
        count
      })),
      activity_trend: Object.entries(activityTrend).map(([date, data]: [string, any]) => ({
        date,
        avg_online_minutes: Math.round(data.online_minutes / data.count),
        total_lessons: data.lessons
      })),
      recent_level_changes: recentLevelChanges || [],
      course_stats: courseStats
    })

  } catch (error: any) {
    console.error('[API Error] /api/admin/dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
