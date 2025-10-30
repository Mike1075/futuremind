// API Route: /api/admin/assignments
// Description: 课程分配API - 分组级别的课程分配
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - 获取课程分配列表
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    // 1. 检查当前用户是否是管理员
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取查询参数
    const groupId = searchParams.get('group_id') || ''
    const courseId = searchParams.get('course_id') || ''

    // 3. 构建查询
    let query = supabase
      .from('course_assignments')
      .select(`
        *,
        student_groups (
          id,
          group_name,
          group_type
        ),
        course_systems (
          id,
          title,
          system_key
        ),
        assigned_by_admin:admins!course_assignments_assigned_by_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .order('assigned_at', { ascending: false })

    // 4. 应用过滤
    if (groupId) {
      query = query.eq('group_id', groupId)
    }
    if (courseId) {
      query = query.eq('course_system_id', courseId)
    }

    // 5. 执行查询
    const { data: assignments, error } = await query

    if (error) throw error

    // 6. 为每个分配获取学员数量
    const assignmentsWithStats = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { count: studentCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('student_group_id', assignment.group_id)

        return {
          ...assignment,
          student_count: studentCount || 0
        }
      })
    )

    // 7. 返回结果
    return NextResponse.json({
      assignments: assignmentsWithStats
    })

  } catch (error: any) {
    console.error('[API Error] /api/admin/assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建分组级别的课程分配
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. 检查当前用户是否是管理员
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取请求体数据
    const body = await request.json()
    const { group_id, course_system_id, notes } = body

    // 3. 验证必填字段
    if (!group_id || !course_system_id) {
      return NextResponse.json(
        { error: 'group_id and course_system_id are required' },
        { status: 400 }
      )
    }

    // 4. 检查是否已经分配过
    const { data: existing } = await supabase
      .from('course_assignments')
      .select('id')
      .eq('group_id', group_id)
      .eq('course_system_id', course_system_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This course is already assigned to this group' },
        { status: 400 }
      )
    }

    // 5. 创建课程分配
    const { data: assignment, error } = await supabase
      .from('course_assignments')
      .insert({
        group_id,
        course_system_id,
        assigned_by: user.id,
        notes: notes || null
      })
      .select(`
        *,
        student_groups (
          id,
          group_name,
          group_type
        ),
        course_systems (
          id,
          title,
          system_key
        ),
        assigned_by_admin:admins!course_assignments_assigned_by_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (error) throw error

    // 6. 获取分组中的学员数量
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('student_group_id', group_id)

    // 7. 返回创建的分配
    return NextResponse.json({
      assignment: {
        ...assignment,
        student_count: studentCount || 0
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API Error] POST /api/admin/assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
