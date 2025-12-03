import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 系统组织名称（不可删除/修改）
const SYSTEM_ORG_NAMES = ['社区项目', '我的项目', '系统']

// 获取单个组织信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org, error } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !org) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    return NextResponse.json({ data: org })
  } catch (error) {
    console.error('[organization] GET 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 修改组织
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 检查组织是否存在
    const { data: org } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single()

    if (!org) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    // 检查是否是系统组织
    if (SYSTEM_ORG_NAMES.includes(org.name)) {
      return NextResponse.json({ error: '系统组织不可修改' }, { status: 403 })
    }

    // 检查用户是否是组织的 owner
    const { data: membership } = await adminClient
      .from('user_organizations')
      .select('role_in_org')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role_in_org !== 'owner') {
      return NextResponse.json({ error: '只有组织所有者可以修改组织' }, { status: 403 })
    }

    // 解析请求体
    const body = await request.json()
    const { name, description, is_public } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: '组织名称不能为空' }, { status: 400 })
    }

    // 更新组织
    const { data: updatedOrg, error: updateError } = await adminClient
      .from('organizations')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[organization] 更新失败:', updateError)
      return NextResponse.json({ error: '更新组织失败' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedOrg })
  } catch (error) {
    console.error('[organization] PATCH 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 删除组织
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 检查组织是否存在
    const { data: org } = await adminClient
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single()

    if (!org) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    // 检查是否是系统组织
    if (SYSTEM_ORG_NAMES.includes(org.name)) {
      return NextResponse.json({ error: '系统组织不可删除' }, { status: 403 })
    }

    // 检查用户是否是组织的 owner
    const { data: membership } = await adminClient
      .from('user_organizations')
      .select('role_in_org')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role_in_org !== 'owner') {
      return NextResponse.json({ error: '只有组织所有者可以删除组织' }, { status: 403 })
    }

    // 检查组织下是否还有项目
    const { data: projects } = await adminClient
      .from('projects')
      .select('id')
      .eq('organization_id', id)
      .limit(1)

    if (projects && projects.length > 0) {
      return NextResponse.json({ error: '请先删除组织下的所有项目' }, { status: 400 })
    }

    // 删除组织成员关系
    await adminClient
      .from('user_organizations')
      .delete()
      .eq('organization_id', id)

    // 删除组织
    const { error: deleteError } = await adminClient
      .from('organizations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[organization] 删除失败:', deleteError)
      return NextResponse.json({ error: '删除组织失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[organization] DELETE 错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
