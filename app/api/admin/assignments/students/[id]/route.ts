// API Route: /api/admin/assignments/students/[id]
// Description: 删除学员个人课程分配
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// DELETE - 删除学员个人课程分配
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const assignmentId = params.id

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

    // 1.1 如果是老师，检查是否有权限删除该分配
    if (profile.role === 'teacher') {
      const { data: assignment } = await supabase
        .from('student_course_assignments')
        .select('student_id')
        .eq('id', assignmentId)
        .single()

      if (assignment) {
        const { data: teacherAssignment } = await supabase
          .from('teacher_assignments')
          .select('managed_student_ids')
          .eq('teacher_id', user.id)
          .single()

        const managedStudentIds = teacherAssignment?.managed_student_ids || []
        if (!managedStudentIds.includes(assignment.student_id)) {
          return NextResponse.json({ error: 'You do not manage this student' }, { status: 403 })
        }
      }
    }

    // 2. 删除课程分配
    const { error } = await supabase
      .from('student_course_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error

    // 3. 返回成功
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`[API Error] DELETE /api/admin/assignments/students/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
