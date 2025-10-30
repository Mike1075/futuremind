// API Route: /api/admin/students
// Description: 学员列表API - 支持搜索、筛选、排序
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

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

    // 新权限系统：校长和老师都能查看所有学员

    // 2. 获取查询参数
    const search = searchParams.get('search') || ''
    const levelFilter = searchParams.get('level') || ''
    const sortBy = searchParams.get('sortBy') || 'composite_score'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 3. 构建查询
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        consciousness_level,
        composite_score,
        percentile_rank,
        level_updated_at,
        created_at
      `, { count: 'exact' })
      .eq('role', 'student')

    // 4. 应用搜索过滤
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 5. 应用等级过滤
    if (levelFilter) {
      query = query.eq('consciousness_level', parseInt(levelFilter))
    }

    // 6. 应用排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 7. 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 8. 执行查询
    const { data: students, error, count } = await query

    if (error) throw error

    // 9. 返回结果
    return NextResponse.json({
      students,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error: any) {
    console.error('[API Error] /api/admin/students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
