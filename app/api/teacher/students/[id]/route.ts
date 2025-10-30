// API Route: /api/teacher/students/[id]
// Description: 从老师的管理列表中移除学员
// 权限：仅限老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// DELETE - 从管理列表移除学员
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const studentId = params.id

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

    // 2. 获取当前的 teacher_assignments
    const { data: teacherAssignment } = await supabase
      .from('teacher_assignments')
      .select('managed_student_ids')
      .eq('teacher_id', user.id)
      .single()

    const currentStudentIds = teacherAssignment?.managed_student_ids || []

    // 3. 检查学员是否在管理列表中
    if (!currentStudentIds.includes(studentId)) {
      return NextResponse.json(
        { error: 'Student is not in your managed list' },
        { status: 404 }
      )
    }

    // 4. 移除学员
    const newStudentIds = currentStudentIds.filter((id: string) => id !== studentId)

    // 5. 更新 teacher_assignments
    const { error } = await supabase
      .from('teacher_assignments')
      .update({ managed_student_ids: newStudentIds })
      .eq('teacher_id', user.id)

    if (error) throw error

    // 6. 返回成功
    return NextResponse.json({
      success: true,
      remaining_count: newStudentIds.length
    })

  } catch (error: any) {
    console.error(`[API Error] DELETE /api/teacher/students/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
