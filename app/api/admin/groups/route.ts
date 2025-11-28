// @ts-nocheck
// API Route: /api/admin/groups
// Description: 分组管理API - 获取分组列表和创建新分组
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// GET - 获取分组列表
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

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取查询参数
    // SEC-07: 限制搜索参数长度（防止DoS攻击）
    const searchRaw = searchParams.get('search') || ''
    const search = searchRaw.slice(0, 100)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 3. 构建查询
    let query = supabase
      .from('student_groups')
      .select(`
        *,
        created_by_profile:profiles!student_groups_created_by_fkey(
          id,
          full_name,
          email,
          role
        )
      `, { count: 'exact' })

    // 4. 应用搜索过滤
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 5. 应用排序
    query = query.order('created_at', { ascending: false })

    // 6. 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 7. 执行查询
    const { data: groups, error, count } = await query

    if (error) throw error

    // 8. 为每个分组计算学员数量（从member_ids数组）
    const groupsWithStats = (groups || []).map((group) => {
      return {
        ...group,
        student_count: group.member_ids ? group.member_ids.length : 0
      }
    })

    // 9. 返回结果
    return NextResponse.json({
      groups: groupsWithStats,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error: any) {
    logger.error('[API] /api/admin/groups GET失败', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建新分组
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取请求体数据
    const body = await request.json()
    const { name, description, group_type } = body

    // 3. 验证必填字段
    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // 4. 创建分组
    const { data: group, error } = await supabase
      .from('student_groups')
      .insert({
        name,
        description: description || null,
        group_type: group_type || 'custom',
        created_by: user.id
      })
      .select(`
        *,
        created_by_profile:profiles!student_groups_created_by_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (error) throw error

    // 5. 返回创建的分组（附带统计数据）
    return NextResponse.json({
      group: {
        ...group,
        student_count: 0
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error('[API] POST /api/admin/groups失败', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
