import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/aip/debug-orgs
 * 诊断用户的组织数据，显示详细信息
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. 获取用户在user_organizations中的记录
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)

    // 3. 获取所有组织（包括系统组织）
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('*')
      .or('settings->is_global.eq.true,settings->is_personal.eq.true,settings->user_id.eq.' + user.id)

    // 4. 检查社区组织
    const { data: communityOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('settings->is_global', true)
      .single()

    // 5. 检查个人组织
    const { data: personalOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('settings->is_personal', true)
      .eq('settings->user_id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role
      },
      userOrganizations: userOrgs || [],
      userOrganizationsCount: userOrgs?.length || 0,
      allSystemOrgs: allOrgs || [],
      communityOrg: communityOrg || null,
      personalOrg: personalOrg || null,
      diagnosis: {
        hasCommunityOrg: !!communityOrg,
        hasPersonalOrg: !!personalOrg,
        joinedCommunity: userOrgs?.some(uo => uo.organization_id === communityOrg?.id) || false,
        joinedPersonal: userOrgs?.some(uo => uo.organization_id === personalOrg?.id) || false,
        needsFix: userOrgs?.length === 0 ||
                  (communityOrg && !userOrgs?.some(uo => uo.organization_id === communityOrg.id)) ||
                  (personalOrg && !userOrgs?.some(uo => uo.organization_id === personalOrg.id))
      }
    })
  } catch (error: any) {
    console.error('Debug orgs error:', error)
    return NextResponse.json(
      { error: 'Failed to debug organizations', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/aip/debug-orgs
 * 强制修复用户的组织关系
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fixes = []

    // 1. 查找或创建社区组织
    let { data: communityOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('settings->is_global', true)
      .single()

    if (!communityOrg) {
      const { data: newCommunity } = await supabase
        .from('organizations')
        .insert({
          name: '社区项目',
          description: '探索者联盟全局社区 - 所有成员可以参与的公开项目',
          settings: { is_global: true, is_system: true }
        })
        .select('id')
        .single()

      communityOrg = newCommunity
      fixes.push('创建了社区组织')
    }

    // 2. 查找或创建个人组织
    let { data: personalOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('settings->is_personal', true)
      .eq('settings->user_id', user.id)
      .single()

    if (!personalOrg) {
      const { data: newPersonal } = await supabase
        .from('organizations')
        .insert({
          name: '我的项目',
          description: '我参与和发起的所有项目',
          settings: { is_personal: true, user_id: user.id }
        })
        .select('id')
        .single()

      personalOrg = newPersonal
      fixes.push('创建了个人组织')
    }

    // 3. 删除旧的关系（清理脏数据）
    await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', user.id)
      .in('organization_id', [communityOrg!.id, personalOrg!.id])

    fixes.push('清理了旧的组织关系')

    // 4. 重新插入正确的关系
    const { error: insertError } = await supabase
      .from('user_organizations')
      .insert([
        {
          user_id: user.id,
          organization_id: communityOrg!.id,
          role_in_org: 'member'
        },
        {
          user_id: user.id,
          organization_id: personalOrg!.id,
          role_in_org: 'owner'
        }
      ])

    if (insertError) {
      throw insertError
    }

    fixes.push('重新创建了组织关系')

    // 5. 验证修复结果
    const { data: verifyOrgs } = await supabase
      .from('user_organizations')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: '组织关系已修复',
      fixes,
      organizations: verifyOrgs
    })
  } catch (error: any) {
    console.error('Fix orgs error:', error)
    return NextResponse.json(
      { error: 'Failed to fix organizations', details: error.message },
      { status: 500 }
    )
  }
}
