// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ✅ 性能优化：启用60秒缓存，PBL项目列表不需要实时更新
export const revalidate = 60

/**
 * GET /api/pbl/public-projects
 * 获取所有公开的PBL项目（包括系统项目和通过审核的用户公开项目）
 *
 * Query参数:
 * - difficulty: 难度筛选（基础探索|进阶挑战|深度研究|创新实践）
 * - module: 模块筛选
 * - search: 关键词搜索
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getClient()
    const { searchParams } = new URL(request.url)

    const difficulty = searchParams.get('difficulty')
    const module = searchParams.get('module')
    // SEC-07: 限制搜索参数长度（防止DoS攻击）
    const searchRaw = searchParams.get('search')
    const search = searchRaw ? searchRaw.slice(0, 100) : null

    // 构建查询
    let query = (supabase
      .from('course_contents') as any)
      .select(`
        id,
        title,
        subtitle,
        project_intro,
        difficulty_level,
        module_name,
        project_tags,
        estimated_duration,
        week_plan,
        prerequisites,
        project_visibility,
        project_icon_url,
        project_cover_image,
        sequence_number,
        created_by_user,
        created_at,
        profiles:created_by_user (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('content_type', 'icarus')
      .eq('is_published', true)
      .eq('review_status', 'approved')
      .in('project_visibility', ['system', 'public'])
      .order('sequence_number', { ascending: true })

    // 应用筛选条件
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    if (module) {
      query = query.eq('module_name', module)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%,project_intro.ilike.%${search}%`)
    }

    const { data: projects, error } = (await query) as any

    if (error) {
      logger.error('[PBL] Failed to fetch public projects', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // 获取每个项目的参与人数
    const projectIds = projects?.map((p: any) => p.id) || []

    const { data: participationCounts } = await supabase
      .from('user_selected_projects')
      .select('project_id')
      .in('project_id', projectIds)
      .in('status', ['active', 'completed'])

    // 统计每个项目的参与人数
    const countMap = participationCounts?.reduce((acc: any, item: any) => {
      acc[item.project_id] = (acc[item.project_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 添加参与人数到项目数据
    const projectsWithStats = projects?.map((project: any) => ({
      ...project,
      participant_count: countMap[project.id] || 0,
      is_system: project.project_visibility === 'system',
      creator: project.profiles
    }))

    return NextResponse.json({
      projects: projectsWithStats || [],
      total: projectsWithStats?.length || 0
    })
  } catch (error) {
    logger.error('[PBL] Internal error in public-projects', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
