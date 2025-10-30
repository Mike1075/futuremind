// API Route: /api/admin/assignments/batch
// Description: 批量课程分配
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST - 批量创建课程分配
export async function POST(request: Request) {
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

    // 2. 获取请求数据
    const body = await request.json()
    const { student_ids, course_system_ids } = body

    // 验证参数
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'student_ids array is required' }, { status: 400 })
    }

    if (!course_system_ids || !Array.isArray(course_system_ids) || course_system_ids.length === 0) {
      return NextResponse.json({ error: 'course_system_ids array is required' }, { status: 400 })
    }

    // 3. 如果是老师，验证权限
    if (isTeacher) {
      const { data: teacherAssignment } = await supabase
        .from('teacher_assignments')
        .select('managed_student_ids')
        .eq('teacher_id', user.id)
        .single()

      const managedStudentIds = teacherAssignment?.managed_student_ids || []

      // 检查所有学员是否都在管理列表中
      const unauthorizedStudents = student_ids.filter(id => !managedStudentIds.includes(id))
      if (unauthorizedStudents.length > 0) {
        return NextResponse.json(
          { error: `You do not manage students: ${unauthorizedStudents.join(', ')}` },
          { status: 403 }
        )
      }
    }

    // 4. 查询已存在的分配，避免重复
    const { data: existingAssignments } = await supabase
      .from('student_course_assignments')
      .select('student_id, course_system_id')
      .in('student_id', student_ids)
      .in('course_system_id', course_system_ids)

    const existingPairs = new Set(
      existingAssignments?.map(a => `${a.student_id}:${a.course_system_id}`) || []
    )

    // 5. 准备要插入的数据
    const assignmentsToInsert = []
    for (const studentId of student_ids) {
      for (const courseId of course_system_ids) {
        const pairKey = `${studentId}:${courseId}`
        if (!existingPairs.has(pairKey)) {
          assignmentsToInsert.push({
            student_id: studentId,
            course_system_id: courseId,
            assigned_by: user.id,
            assigned_by_role: profile.role,
            status: 'active'
          })
        }
      }
    }

    // 6. 批量插入
    if (assignmentsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        created_count: 0,
        skipped_count: student_ids.length * course_system_ids.length,
        message: 'All assignments already exist'
      })
    }

    const { data: newAssignments, error } = await supabase
      .from('student_course_assignments')
      .insert(assignmentsToInsert)
      .select()

    if (error) throw error

    // 7. 返回结果
    return NextResponse.json({
      success: true,
      created_count: newAssignments?.length || 0,
      skipped_count: (student_ids.length * course_system_ids.length) - (newAssignments?.length || 0),
      total_students: student_ids.length,
      total_courses: course_system_ids.length
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API Error] POST /api/admin/assignments/batch:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
