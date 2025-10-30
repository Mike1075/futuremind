import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/teachers - 获取教师列表
export async function GET() {
  try {
    const supabase = await createClient()

    // 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否是校长（只有校长可以管理教师）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile as unknown as { role?: string })?.role

    if (profileError || !profile || !userRole || userRole !== 'principal') {
      return NextResponse.json(
        { error: 'Forbidden - Only principals can manage teachers' },
        { status: 403 }
      )
    }

    // 获取所有教师列表
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (teachersError) {
      console.error('获取教师列表失败:', teachersError)
      return NextResponse.json({ error: teachersError.message }, { status: 500 })
    }

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/teachers - 添加教师（通过邮箱）
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否是校长
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (profile as unknown as { role?: string })?.role

    if (profileError || !profile || !userRole || userRole !== 'principal') {
      return NextResponse.json(
        { error: 'Forbidden - Only principals can add teachers' },
        { status: 403 }
      )
    }

    // 查找该邮箱对应的用户
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single()

    if (findError || !targetUser) {
      return NextResponse.json(
        { error: 'User with this email not found. Please make sure the user has registered.' },
        { status: 404 }
      )
    }

    const targetUserData = targetUser as unknown as {
      id: string
      email: string
      full_name: string | null
      role?: string
    }

    // 检查是否已经是教师
    if (targetUserData.role === 'teacher') {
      return NextResponse.json(
        { error: 'This user is already a teacher' },
        { status: 400 }
      )
    }

    // 将用户角色设为 teacher
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({ role: 'teacher' })
      .eq('id', targetUserData.id)

    if (updateError) {
      console.error('更新用户角色失败:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 创建 teacher_assignments 记录（由触发器自动创建，这里返回成功即可）
    return NextResponse.json({
      message: 'Teacher added successfully',
      teacher: {
        id: targetUserData.id,
        email: targetUserData.email,
        full_name: targetUserData.full_name
      }
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
