// API Route: /api/teacher/students
// Description: 老师管理自己的学员
// 权限：仅限老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - 获取老师可以管理的学员（已选老师课程的学员）
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. 检查当前用户是否是老师
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teachers only' }, { status: 403 })
    }

    // 2. 获取老师当前管理的学员和课程
    const { data: teacherAssignment } = await supabase
      .from('teacher_assignments')
      .select('managed_student_ids, managed_course_ids')
      .eq('teacher_id', user.id)
      .single()

    const managedStudentIds = teacherAssignment?.managed_student_ids || []
    const managedCourseIds = teacherAssignment?.managed_course_ids || []

    // 3. 获取已管理的学员详细信息
    let managedStudents: any[] = []
    if (managedStudentIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, consciousness_level, composite_score, created_at')
        .in('id', managedStudentIds)
        .eq('role', 'student')
        .order('full_name')

      managedStudents = data || []
    }

    // 4. 获取可以分配的学员（选了老师管理的课程但还没被管理的学员）
    let availableStudents: any[] = []
    if (managedCourseIds.length > 0) {
      // 查询选了这些课程的学员
      const { data: courseAssignments } = await supabase
        .from('student_course_assignments')
        .select('student_id')
        .in('course_system_id', managedCourseIds)

      if (courseAssignments && courseAssignments.length > 0) {
        const studentIdsInCourses = [...new Set(courseAssignments.map(a => a.student_id))]

        // 排除已经管理的学员
        const availableIds = studentIdsInCourses.filter(id => !managedStudentIds.includes(id))

        if (availableIds.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, consciousness_level, composite_score, created_at')
            .in('id', availableIds)
            .eq('role', 'student')
            .order('full_name')

          availableStudents = data || []
        }
      }
    }

    // 5. 返回结果
    return NextResponse.json({
      managed_students: managedStudents,
      available_students: availableStudents,
      managed_course_ids: managedCourseIds
    })

  } catch (error: any) {
    console.error('[API Error] GET /api/teacher/students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 添加学员到管理列表
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. 检查当前用户是否是老师
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teachers only' }, { status: 403 })
    }

    // 2. 获取请求数据
    const body = await request.json()
    const { student_ids } = body

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'student_ids array is required' }, { status: 400 })
    }

    // 3. 获取当前的 teacher_assignments
    const { data: teacherAssignment } = await supabase
      .from('teacher_assignments')
      .select('managed_student_ids, managed_course_ids')
      .eq('teacher_id', user.id)
      .single()

    const currentStudentIds = teacherAssignment?.managed_student_ids || []
    const managedCourseIds = teacherAssignment?.managed_course_ids || []

    // 4. 验证要添加的学员是否选了老师的课程
    if (managedCourseIds.length > 0) {
      const { data: courseAssignments } = await supabase
        .from('student_course_assignments')
        .select('student_id')
        .in('student_id', student_ids)
        .in('course_system_id', managedCourseIds)

      const validStudentIds = [...new Set(courseAssignments?.map(a => a.student_id) || [])]
      const invalidIds = student_ids.filter(id => !validStudentIds.includes(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Students ${invalidIds.join(', ')} are not enrolled in your courses` },
          { status: 400 }
        )
      }
    }

    // 5. 合并学员ID（去重）
    const newStudentIds = [...new Set([...currentStudentIds, ...student_ids])]

    // 6. 更新 teacher_assignments
    const { error } = await supabase
      .from('teacher_assignments')
      .update({ managed_student_ids: newStudentIds })
      .eq('teacher_id', user.id)

    if (error) throw error

    // 7. 返回成功
    return NextResponse.json({
      success: true,
      added_count: student_ids.length,
      total_managed: newStudentIds.length
    })

  } catch (error: any) {
    console.error('[API Error] POST /api/teacher/students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
