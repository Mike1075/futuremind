// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

/**
 * GET /api/pbl/my-projects
 * 获取当前用户选择的所有PBL项目
 *
 * Query参数:
 * - status: 状态筛选（active|paused|completed|cancelled）
 * - include_progress: 是否包含详细进度数据（默认true）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const includeProgress = searchParams.get('include_progress') !== 'false'

    // 构建查询
    let query = (supabase
      .from('user_selected_projects') as any)
      .select(`
        id,
        selected_at,
        status,
        progress,
        last_activity_at,
        completion_percentage,
        notes,
        created_at,
        updated_at,
        course_contents:project_id (
          id,
          title,
          subtitle,
          project_intro,
          difficulty_level,
          module_name,
          project_tags,
          estimated_duration,
          week_plan,
          project_visibility,
          project_icon_url,
          project_cover_image,
          created_by_user
        )
      `)
      .eq('user_id', user.id)
      .order('last_activity_at', { ascending: false })

    // 应用状态筛选
    if (statusFilter && ['active', 'paused', 'completed', 'cancelled'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    const { data: myProjects, error } = (await query) as any

    if (error) {
      logger.error('[API] 获取用户项目失败', error)
      return NextResponse.json({ error: '获取项目失败' }, { status: 500 })
    }

    // 统计各状态的项目数量
    const stats = {
      total: myProjects?.length || 0,
      active: myProjects?.filter((p: any) => p.status === 'active').length || 0,
      paused: myProjects?.filter((p: any) => p.status === 'paused').length || 0,
      completed: myProjects?.filter((p: any) => p.status === 'completed').length || 0,
      cancelled: myProjects?.filter((p: any) => p.status === 'cancelled').length || 0
    }

    // 如果需要详细进度数据，获取每个项目的任务完成情况
    let projectsWithProgress = myProjects

    if (includeProgress && myProjects && myProjects.length > 0) {
      const projectIds = myProjects.map((p: any) => p.course_contents?.id).filter(Boolean)

      // 获取每个项目的周计划任务数（从week_plan JSON计算）
      projectsWithProgress = myProjects.map((project: any) => {
        const weekPlan = project.course_contents?.week_plan || []

        // 计算总任务数
        let totalTasks = 0
        if (Array.isArray(weekPlan)) {
          weekPlan.forEach((week: any) => {
            if (week.days && Array.isArray(week.days)) {
              totalTasks += week.days.length
            }
          })
        }

        // 从progress JSON获取已完成任务数
        const progress = project.progress || {}
        const completedTasks = Object.values(progress).filter((v: any) => v === true).length

        return {
          ...project,
          task_stats: {
            total: totalTasks,
            completed: completedTasks,
            percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          }
        }
      })
    }

    return NextResponse.json({
      projects: projectsWithProgress || [],
      stats
    })
  } catch (error) {
    logger.error('[PBL] my-projects内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
