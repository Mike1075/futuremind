// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { validateCsrf } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // CSRF 保护
    const csrfResult = validateCsrf(request)
    if (!csrfResult.valid) {
      return csrfResult.response
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { invitation_id, action } = await request.json()

    if (!invitation_id || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }

    // 获取邀请详情
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: '邀请不存在' }, { status: 404 })
    }

    // 验证是否是被邀请人
    if (invitation.invitee_id !== user.id) {
      return NextResponse.json({ error: '您没有权限响应此邀请' }, { status: 403 })
    }

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: '此邀请已被处理' }, { status: 400 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected'

    // 更新邀请状态
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation_id)

    if (updateError) {
      logger.error('[respond-invitation] 更新邀请状态失败:', updateError)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    // 如果接受邀请，将用户添加到项目成员
    if (action === 'accept' && invitation.invitation_type === 'project') {
      // 检查是否已是成员
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', invitation.target_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: invitation.target_id,
            user_id: user.id,
            role_in_project: 'member',
            joined_at: new Date().toISOString()
          })

        if (memberError) {
          logger.error('[respond-invitation] 添加项目成员失败:', memberError)
          // 不影响整体响应，只记录错误
        }
      }
    }

    // 给邀请人发送通知
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const responderName = userProfile?.full_name || userProfile?.email || '用户'

    await supabase
      .from('notifications')
      .insert({
        user_id: invitation.inviter_id,
        type: action === 'accept' ? 'invitation_accepted' : 'invitation_rejected',
        title: action === 'accept' ? '邀请已接受' : '邀请已拒绝',
        message: action === 'accept'
          ? `${responderName} 接受了您的邀请，已加入项目"${invitation.target_name}"`
          : `${responderName} 拒绝了您加入项目"${invitation.target_name}"的邀请`,
        metadata: {
          invitation_id: invitation.id,
          invitation_type: invitation.invitation_type,
          target_id: invitation.target_id,
          target_name: invitation.target_name,
          responder_id: user.id
        }
      })

    // 标记相关通知为已读
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('type', 'invitation_received')
      .contains('metadata', { invitation_id: invitation_id })

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? '已接受邀请' : '已拒绝邀请'
    })
  } catch (error) {
    logger.error('[respond-invitation] 响应邀请失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
