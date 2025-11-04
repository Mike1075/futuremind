import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

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

    // 验证项目是否存在且可选
    const { data: project, error: projectError } = await supabase
      .from('course_contents')
      .select('id, title, project_visibility, review_status, is_published')
      .eq('id', projectId)
      .eq('content_type', 'icarus')
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 检查项目是否可选（公开或系统项目，且已发布和审核通过）
    if (!project.is_published || project.review_status !== 'approved') {
      return NextResponse.json({ error: 'Project is not available for selection' }, { status: 400 })
    }

    if (!['system', 'public'].includes(project.project_visibility)) {
      // 如果是私有项目，检查是否是创建者本人
      const { data: privateProject } = await supabase
        .from('course_contents')
        .select('created_by_user')
        .eq('id', projectId)
        .single()

      if (privateProject?.created_by_user !== user.id) {
        return NextResponse.json({ error: 'This project is private' }, { status: 403 })
      }
    }

    // 检查是否已经选择过该项目
    const { data: existing } = await supabase
      .from('user_selected_projects')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .single()

    if (existing) {
      // 如果已存在但状态是取消，则重新激活
      if (existing.status === 'cancelled') {
        const { data: updated, error: updateError } = await supabase
          .from('user_selected_projects')
          .update({
            status: 'active',
            selected_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            notes: notes || null
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          console.error('[API Error] Failed to reactivate project:', updateError)
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
          message: 'Project reactivated successfully',
          selection: updated
        })
      } else {
        return NextResponse.json({
          error: 'You have already selected this project',
          currentStatus: existing.status
        }, { status: 409 })
      }
    }

    // 创建新的项目选择记录
    const { data: selection, error: insertError } = (await supabase
      .from('user_selected_projects')
      .insert({
        user_id: user.id,
        project_id: projectId,
        status: 'active',
        notes: notes || null,
        progress: {},
        completion_percentage: 0
      } as any)
      .select()
      .single()) as any

    if (insertError) {
      console.error('[API Error] Failed to select project:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Project selected successfully',
      selection
    }, { status: 201 })
  } catch (error) {
    console.error('[API Error] Internal error in select-project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
