// API Route: /api/admin/groups/[id]/members
// Description: 分组成员管理API - 添加/移除学员到分组
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// POST - 添加学员到分组
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: groupId } = await context.params

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

    // 2. 获取请求体数据
    const body = await request.json()
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // 3. 获取当前分组
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('member_ids')
      .eq('id', groupId)
      .single()

    if (groupError) throw groupError

    // 4. 检查学员是否已在分组中
    const currentMembers = group.member_ids || []
    if (currentMembers.includes(student_id)) {
      return NextResponse.json({ error: 'Student already in group' }, { status: 400 })
    }

    // 5. 添加学员到分组
    const { error: updateError } = await supabase
      .from('student_groups')
      .update({
        member_ids: [...currentMembers, student_id],
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('[API] POST /api/admin/groups/[id]/members失败', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 从分组中移除学员
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: groupId } = await context.params

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

    // 2. 获取请求体数据
    const body = await request.json()
    const { student_id } = body

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
    }

    // 3. 获取当前分组
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('member_ids')
      .eq('id', groupId)
      .single()

    if (groupError) throw groupError

    // 4. 移除学员
    const currentMembers = group.member_ids || []
    const newMembers = currentMembers.filter((id: string) => id !== student_id)

    // 5. 更新分组
    const { error: updateError } = await supabase
      .from('student_groups')
      .update({
        member_ids: newMembers,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    logger.error('[API] DELETE /api/admin/groups/[id]/members失败', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
