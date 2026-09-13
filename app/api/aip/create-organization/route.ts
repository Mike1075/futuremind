import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { validateCsrf } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // CSRF 保护
    const csrfResult = validateCsrf(request)
    if (!csrfResult.valid) {
      return csrfResult.response
    }

    // 1. 验证用户登录
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 2. 检查用户角色（只有 principal 可以创建组织）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'principal') {
      return NextResponse.json({ error: '只有校长可以创建组织' }, { status: 403 })
    }

    // 3. 解析请求体
    const body = await request.json()
    const { name, description, is_public } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: '组织名称不能为空' }, { status: 400 })
    }

    // 4. 使用 service role 创建组织（绕过 RLS）
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org, error: createError } = await adminClient
      .from('organizations')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public ?? false,
      })
      .select()
      .single()

    if (createError) {
      logger.error('[create-organization] 创建组织失败:', createError)
      return NextResponse.json({ error: '创建组织失败' }, { status: 500 })
    }

    // 5. 将创建者添加为 owner
    const { error: memberError } = await adminClient
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role_in_org: 'owner',
      })

    if (memberError) {
      logger.error('[create-organization] 添加成员失败:', memberError)
      // 回滚：删除刚创建的组织
      await adminClient.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: '创建组织失败' }, { status: 500 })
    }

    return NextResponse.json({ data: org })
  } catch (error) {
    logger.error('[create-organization] 服务器错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
