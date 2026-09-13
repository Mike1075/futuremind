// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// DELETE /api/admin/teachers/[id] - 删除教师（将角色改回 student）
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: teacherId } = await context.params

    // 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否是校长
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = (profile as unknown as { role?: string })?.role

    if (profileError || !profile || !userRole || userRole !== 'principal') {
      return NextResponse.json(
        { error: 'Forbidden - Only principals can remove teachers' },
        { status: 403 }
      )
    }

    // 检查目标用户是否是教师
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', teacherId)
      .maybeSingle()

    if (findError || !targetUser) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const targetUserData = targetUser as unknown as {
      id: string
      email: string
      full_name: string | null
      role?: string
    }

    if (!targetUserData.role || targetUserData.role !== 'teacher') {
      return NextResponse.json(
        { error: 'This user is not a teacher' },
        { status: 400 }
      )
    }

    // SEC-06: 审计日志 - 在使用管理员权限前记录
    logger.audit('ADMIN_CLIENT_ACCESS', {
      action: 'demote_from_teacher',
      operatorId: user.id,
      targetUserId: targetUserData.id,
      targetEmail: targetUserData.email,
      reason: 'User role demotion via admin API'
    })

    // 将角色改回 student - 使用管理员客户端绕过 RLS
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', teacherId)

    if (updateError) {
      logger.error('[教师管理] 更新用户角色失败', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // teacher_assignments 记录会由触发器自动删除
    return NextResponse.json({
      message: 'Teacher removed successfully',
      user: {
        id: targetUserData.id,
        email: targetUserData.email,
        full_name: targetUserData.full_name
      }
    })
  } catch (error) {
    logger.error('[教师管理] API错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
