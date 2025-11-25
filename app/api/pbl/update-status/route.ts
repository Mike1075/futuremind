import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * PATCH /api/pbl/update-status
 * 更新用户的项目状态（暂停、恢复、完成、取消）
 *
 * Body参数:
 * - selectionId: 选择记录ID
 * - status: 新状态 (active|paused|completed|cancelled)
 * - completionPercentage: 可选的完成百分比
 * - notes: 可选的更新备注
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { selectionId, status, completionPercentage, notes } = body

    if (!selectionId) {
      return NextResponse.json({ error: 'Selection ID is required' }, { status: 400 })
    }

    if (!status || !['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: active, paused, completed, cancelled'
      }, { status: 400 })
    }

    // CQ-03: 使用maybeSingle()验证该选择记录是否属于当前用户
    const { data: selection, error: fetchError } = (await (supabase
      .from('user_selected_projects') as any)
      .select('id, user_id, project_id, status')
      .eq('id', selectionId)
      .eq('user_id', user.id)
      .maybeSingle()) as any

    if (fetchError) {
      logger.error('[PBL] 查询项目选择记录失败', fetchError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 })
    }

    // 构建更新数据
    const updateData: any = {
      status,
      last_activity_at: new Date().toISOString()
    }

    if (completionPercentage !== undefined) {
      if (completionPercentage < 0 || completionPercentage > 100) {
        return NextResponse.json({
          error: 'Completion percentage must be between 0 and 100'
        }, { status: 400 })
      }
      updateData.completion_percentage = completionPercentage
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // 如果标记为完成，自动设置完成百分比为100
    if (status === 'completed') {
      updateData.completion_percentage = 100
    }

    // CQ-03: 使用maybeSingle()更新记录
    const { data: updated, error: updateError } = (await (supabase
      .from('user_selected_projects') as any)
      .update(updateData)
      .eq('id', selectionId)
      .select(`
        *,
        course_contents:project_id (
          id,
          title,
          difficulty_level,
          module_name
        )
      `)
      .maybeSingle()) as any

    if (updateError) {
      logger.error('[PBL] 更新项目状态失败', updateError)
      // SEC-01: 生产环境不泄露详细错误信息
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Project status updated successfully',
      selection: updated
    })
  } catch (error) {
    logger.error('[PBL] update-status内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
