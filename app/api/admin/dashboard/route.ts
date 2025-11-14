// API Route: /api/admin/dashboard
// Description: 统计看板API - 获取整体统计数据
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ✅ 性能优化：启用60秒缓存，Dashboard数据不需要实时更新
// 减少重复查询，大幅提升管理后台加载速度
export const revalidate = 60

export async function GET(request: Request) {
  const startTime = performance.now()
  console.log('[Dashboard API] 🚀 开始获取统计数据')
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

    // 12. 获取课程统计 - 🔥 优化：批量查询，避免N+1问题
    const query12Start = performance.now()
    const { data: courses } = await supabase
      .from('course_systems')
      .select('id, title, system_key')

    console.log('[Dashboard API] ✅ 查询12完成：课程列表', {
      耗时: `${(performance.now() - query12Start).toFixed(0)}ms`,
      课程数: courses?.length || 0
    })

    // 🔥 批量查询所有课程的分配数据（2次查询 vs 原来的2N次）
    const query13Start = performance.now()
    const courseIds = courses?.map(c => c.id) || []

    const [studentAssignments, groupAssignments] = await Promise.all([
      supabase
        .from('student_course_assignments')
        .select('course_system_id')
        .in('course_system_id', courseIds),
      supabase
        .from('course_assignments')
        .select('course_system_id')
        .in('course_system_id', courseIds)
    ])

    console.log('[Dashboard API] ✅ 查询13完成：批量课程分配', {
      耗时: `${(performance.now() - query13Start).toFixed(0)}ms`
    })

    // 在内存中按课程ID分组统计（超快）
    const studentCountMap = new Map<string, number>()
    studentAssignments.data?.forEach(a => {
      studentCountMap.set(a.course_system_id, (studentCountMap.get(a.course_system_id) || 0) + 1)
    })

    const groupCountMap = new Map<string, number>()
    groupAssignments.data?.forEach(a => {
      groupCountMap.set(a.course_system_id, (groupCountMap.get(a.course_system_id) || 0) + 1)
    })

    const courseStats = courses?.map(course => ({
      ...course,
      assigned_students: studentCountMap.get(course.id) || 0,
      assigned_groups: groupCountMap.get(course.id) || 0
    })) || []

    // 13. 返回统计数据
    const totalTime = performance.now() - startTime
    console.log('[Dashboard API] 🎉 统计数据获取完成', {
      总耗时: `${totalTime.toFixed(0)}ms`,
      查询优化: '课程统计批量查询（2次 vs 原2N次）'
    })

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
