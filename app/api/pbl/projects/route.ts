// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'

export async function GET() {
  try {
    const admin = getAdminClient()

    const { data: projects, error } = await admin
      .from('pbl_projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SEC-05: 验证用户角色（仅教师和校长可创建项目）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.role || !['teacher', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Only teachers and principals can create projects' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, max_participants = 10 } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 使用管理员client插入数据，绕过RLS限制
    const { data: project, error } = await admin
      .from('pbl_projects')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        max_participants,
        status: 'active',
        current_participants: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
