// API Route: /api/admin/assignments/students
// Description: 学员个人课程分配API
// 权限：校长和老师

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - 获取学员个人课程分配列表
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

    // 2. 获取查询参数
    const studentId = searchParams.get('student_id') || ''
    const courseId = searchParams.get('course_id') || ''

    // 3. 构建查询
    let query = supabase
      .from('student_course_assignments')
      .select(`
        *,
        student:profiles!student_course_assignments_student_id_fkey (
          id,
          full_name,
          email,
          consciousness_level
        ),
        course_systems (
          id,
          title,
          system_key
        )
      `)
      .order('assigned_at', { ascending: false })

    // 4. 应用过滤
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (courseId) {
      query = query.eq('course_system_id', courseId)
    }

    // 5. 执行查询
    const { data: assignments, error } = await query

    if (error) throw error

    // 6. 返回结果
    return NextResponse.json({
      assignments: assignments || []
    })

  } catch (error: any) {
    console.error('[API Error] /api/admin/assignments/students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建学员个人课程分配
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

    if (!profile || !['principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Not an admin' }, { status: 403 })
    }

    // 2. 获取请求体数据
    const body = await request.json()
    const { student_id, course_system_id, notes } = body

    // 3. 验证必填字段
    if (!student_id || !course_system_id) {
      return NextResponse.json(
        { error: 'student_id and course_system_id are required' },
        { status: 400 }
      )
    }

    // 4. 检查是否已经分配过
    const { data: existing } = await supabase
      .from('student_course_assignments')
      .select('id')
      .eq('student_id', student_id)
      .eq('course_system_id', course_system_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This course is already assigned to this student' },
        { status: 400 }
      )
    }

    // 5. 创建课程分配
    const { data: assignment, error } = await supabase
      .from('student_course_assignments')
      .insert({
        student_id,
        course_system_id,
        assigned_by: user.id,
        notes: notes || null
      })
      .select(`
        *,
        student:profiles!student_course_assignments_student_id_fkey (
          id,
          full_name,
          email,
          consciousness_level
        ),
        course_systems (
          id,
          title,
          system_key
        )
      `)
      .single()

    if (error) throw error

    // 6. 返回创建的分配
    return NextResponse.json({
      assignment
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API Error] POST /api/admin/assignments/students:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
