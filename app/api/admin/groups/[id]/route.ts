// API Route: /api/admin/groups/[id]
// Description: 分组详情API - 获取、更新、删除分组
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - 获取分组详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const groupId = params.id

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

    // 2. 获取分组基本信息
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select(`
        *,
        created_by_profile:profiles!student_groups_created_by_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('id', groupId)
      .single()

    if (groupError) throw groupError

    // 3. 获取分组中的学员列表
    const { data: students, count: studentCount } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        consciousness_level,
        composite_score,
        created_at
      `, { count: 'exact' })
      .eq('student_group_id', groupId)
      .eq('role', 'student')
      .order('composite_score', { ascending: false })

    // 4. 不再支持分组级别的课程分配（已删除 course_assignments 表）
    const assignmentCount = 0
    const assignments: any[] = []

    // 5. 计算分组统计数据
    const stats = {
      total_students: studentCount || 0,
      total_assignments: assignmentCount || 0,
      avg_level: students && students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.consciousness_level, 0) / students.length * 10) / 10
        : 0,
      avg_score: students && students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.composite_score, 0) / students.length * 100) / 100
        : 0,
      level_distribution: students?.reduce((acc: any, s) => {
        acc[s.consciousness_level] = (acc[s.consciousness_level] || 0) + 1
        return acc
      }, {}) || {}
    }

    // 6. 返回完整数据
    return NextResponse.json({
      group,
      students: students || [],
      assignments: assignments || [],
      stats
    })

  } catch (error: any) {
    console.error(`[API Error] /api/admin/groups/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新分组
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const groupId = params.id

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

    // 2. 获取请求体数据
    const body = await request.json()
    const { group_name, description } = body

    // 3. 验证必填字段
    if (!group_name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // 4. 更新分组
    const { data: group, error } = await supabase
      .from('student_groups')
      .update({
        name: group_name,
        description: description || null
      })
      .eq('id', groupId)
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

    // 5. 获取学员数量
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('student_group_id', groupId)
      .eq('role', 'student')

    // 6. 返回更新后的分组
    return NextResponse.json({
      group: {
        ...group,
        student_count: studentCount || 0
      }
    })

  } catch (error: any) {
    console.error(`[API Error] PUT /api/admin/groups/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除分组
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const groupId = params.id

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

    // 2. 检查是否是系统自动分组（不可删除）
    const { data: group } = await supabase
      .from('student_groups')
      .select('group_type')
      .eq('id', groupId)
      .single()

    if (group?.group_type === 'auto_level') {
      return NextResponse.json(
        { error: 'Cannot delete auto-generated level groups' },
        { status: 400 }
      )
    }

    // 3. 检查分组中是否有学员
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('student_group_id', groupId)
      .eq('role', 'student')

    if (studentCount && studentCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete group with ${studentCount} students. Please remove students first.` },
        { status: 400 }
      )
    }

    // 4. 删除分组（课程分配会因为 ON DELETE CASCADE 自动删除）
    const { error } = await supabase
      .from('student_groups')
      .delete()
      .eq('id', groupId)

    if (error) throw error

    // 5. 返回成功
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`[API Error] DELETE /api/admin/groups/${params.id}:`, error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
