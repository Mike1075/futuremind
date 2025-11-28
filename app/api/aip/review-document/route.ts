import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/aip/review-document
 * 审核文档API - 通过或拒绝待审核的文档
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 获取请求参数
    const body = await request.json()
    const { file_id, action, comment } = body

    if (!file_id || !action) {
      return NextResponse.json({
        error: 'Missing required fields: file_id or action'
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Must be "approve" or "reject"'
      }, { status: 400 })
    }

    // 3. 获取文件信息
    const { data: fileRecord, error: fileError } = await supabase
      .from('project_files')
      .select('*, projects(name)')
      .eq('id', file_id)
      .single()

    if (fileError || !fileRecord) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    // 类型断言以访问新添加的字段
    const fileData = fileRecord as typeof fileRecord & {
      review_status?: string
      reviewed_by?: string
      reviewed_at?: string
      review_comment?: string
    }

    // 4. 检查用户权限（必须是项目 owner 或 manager）
    const { data: membership } = await supabase
      .from('project_members')
      .select('role_in_project')
      .eq('project_id', fileData.project_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !membership.role_in_project || !['owner', 'manager'].includes(membership.role_in_project)) {
      return NextResponse.json({ error: '您没有权限审核此文档' }, { status: 403 })
    }

    // 5. 检查文件状态（必须是待审核）
    if (fileData.review_status !== 'pending') {
      return NextResponse.json({
        error: '此文档已被审核，无需重复操作'
      }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // 6. 如果通过，先发送文件到N8N处理（进入知识库）
    if (action === 'approve') {
      // 注意：由于原文件没有存储，这里我们只能标记状态
      // 实际上需要在上传时暂存原文件，或者让用户重新上传
      // 目前的设计是：审核通过后，该文档元数据标记为已通过
      // 如果需要进入知识库，需要额外的处理流程
      logger.info('[Review] 文档审核通过', { file_id, title: fileData.title })
    }

    // 7. 更新文件审核状态
    const { error: updateError } = await supabase
      .from('project_files')
      .update({
        review_status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_comment: comment || null
      } as any)  // 使用 any 绕过类型检查（新字段在数据库中已存在）
      .eq('id', file_id)

    if (updateError) {
      logger.error('[Review] 更新审核状态失败', updateError)
      return NextResponse.json({ error: '更新审核状态失败' }, { status: 500 })
    }

    // 8. 发送通知给上传者
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const reviewerName = reviewerProfile?.full_name || '项目管理员'
    const projectName = (fileData as any).projects?.name || '项目'

    const notificationMessage = action === 'approve'
      ? `您在「${projectName}」中上传的文档「${fileData.title}」已通过审核`
      : `您在「${projectName}」中上传的文档「${fileData.title}」未通过审核${comment ? `，原因：${comment}` : ''}`

    await supabase
      .from('notifications')
      .insert({
        user_id: fileData.user_id,
        type: action === 'approve' ? 'file_approved' : 'file_rejected',
        title: action === 'approve' ? '文档审核通过' : '文档审核未通过',
        message: notificationMessage,
        is_read: false,
        metadata: {
          project_id: fileData.project_id,
          file_id: file_id,
          reviewer_id: user.id,
          action: action
        }
      })

    // 9. 返回成功响应
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? '文档已通过审核' : '文档已拒绝',
      review_status: newStatus
    })

  } catch (error) {
    logger.error('[Review] 审核失败', error)
    return NextResponse.json({
      error: 'Review failed'
    }, { status: 500 })
  }
}
