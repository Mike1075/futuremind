import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * POST /api/pbl/select-project
 * 用户选择一个PBL项目
 *
 * Body参数:
 * - projectId: 项目ID
 * - notes: 可选的个人备注
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, notes } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // CQ-03: 使用maybeSingle()验证项目是否存在且可选
    const { data: project, error: projectError } = (await (supabase
      .from('course_contents') as any)
      .select('id, title, project_visibility, review_status, is_published')
      .eq('id', projectId)
      .eq('content_type', 'icarus')
      .maybeSingle()) as any

    if (projectError) {
      logger.error('[PBL] 查询项目失败', projectError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 检查项目是否可选（公开或系统项目，且已发布和审核通过）
    if (!project.is_published || project.review_status !== 'approved') {
      return NextResponse.json({ error: 'Project is not available for selection' }, { status: 400 })
    }

    if (!['system', 'public'].includes(project.project_visibility)) {
      // CQ-03: 如果是私有项目，检查是否是创建者本人
      const { data: privateProject } = (await (supabase
        .from('course_contents') as any)
        .select('created_by_user')
        .eq('id', projectId)
        .maybeSingle()) as any

      if (!privateProject || privateProject.created_by_user !== user.id) {
        return NextResponse.json({ error: 'This project is private' }, { status: 403 })
      }
    }

    // DB-16: 使用UPSERT解决并发控制问题
    // 先尝试upsert，如果记录存在且状态不是cancelled则不更新
    const { data: upsertResult, error: upsertError } = (await (supabase
      .from('user_selected_projects') as any)
      .upsert({
        user_id: user.id,
        project_id: projectId,
        status: 'active',
        notes: notes || null,
        progress: {},
        completion_percentage: 0,
        selected_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_id',
        ignoreDuplicates: false
      })
      .select()
      .single()) as any

    if (upsertError) {
      // CQ-03: 使用maybeSingle()检查是否是因为已存在active/completed状态的记录
      const { data: existing } = (await (supabase
        .from('user_selected_projects') as any)
        .select('id, status')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle()) as any

      if (existing && existing.status !== 'cancelled') {
        return NextResponse.json({
          error: 'You have already selected this project',
          currentStatus: existing.status
        }, { status: 409 })
      }

      logger.error('[PBL] 选择项目失败', upsertError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Project selected successfully',
      selection: upsertResult
    }, { status: 201 })
  } catch (error) {
    logger.error('[PBL] select-project内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
