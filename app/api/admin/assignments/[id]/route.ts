// API Route: /api/admin/assignments/[id]
// Description: 删除课程分配（分组级别）
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// DELETE - 删除分组课程分配
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const assignmentId = params.id

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

    // 2. 删除课程分配
    const { error } = await supabase
      .from('course_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error

    // 3. 返回成功
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`[API Error] DELETE /api/admin/assignments/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
