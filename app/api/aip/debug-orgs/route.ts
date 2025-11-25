import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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

    const adminSupabase = createAdminClient()

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
    logger.error('[Debug Orgs] GET error', error)
    return NextResponse.json(
      { error: 'Failed to debug organizations' },
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
      logger.error('[Debug Orgs] 未授权访问')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('[Debug Orgs] 开始修复用户组织', { userId: user.id })

    // 使用 Admin Client 绕过 RLS
    const adminSupabase = createAdminClient()
    const fixes = []

    // 1. 查找社区组织（通过名称，避免JSON查询问题）
    logger.debug('[Debug Orgs] 查找社区组织')
    let { data: communityOrgs, error: communityQueryError } = await adminSupabase
      .from('organizations')
      .select('id, name')
      .eq('name', '社区项目')
      .limit(1)

    if (communityQueryError) {
      logger.error('[Debug Orgs] 查找社区组织失败', communityQueryError)
      throw new Error(`查找社区组织失败: ${communityQueryError.message}`)
    }

    let communityOrgId: string

    if (communityOrgs && communityOrgs.length > 0) {
      communityOrgId = communityOrgs[0].id
      logger.debug('[Debug Orgs] 找到已存在的社区组织', { id: communityOrgId })
    } else {
      // 创建社区组织（使用 Admin Client 绕过 RLS）
      logger.debug('[Debug Orgs] 创建新的社区组织')
      const { data: newCommunity, error: createError } = await adminSupabase
        .from('organizations')
        .insert({
          name: '社区项目',
          description: '探索者联盟全局社区 - 所有成员可以参与的公开项目',
          settings: { is_global: true, is_system: true }
        })
        .select('id')
        .single()

      if (createError || !newCommunity) {
        logger.error('[Debug Orgs] 创建社区组织失败', createError)
        throw new Error(`创建社区组织失败: ${createError?.message || '未知错误'}`)
      }

      communityOrgId = newCommunity.id
      fixes.push('创建了社区组织')
      logger.debug('[Debug Orgs] 社区组织创建成功', { id: communityOrgId })
    }

    // 2. 查找个人组织（通过用户ID，名称为"我的项目"）
    logger.debug('[Debug Orgs] 查找个人组织')
    let { data: personalOrgs, error: personalQueryError } = await adminSupabase
      .from('organizations')
      .select('id, name, description')
      .eq('name', '我的项目')
      .like('description', '%我参与和发起%')
      .limit(10) // 可能有多个用户都有"我的项目"

    if (personalQueryError) {
      logger.error('[Debug Orgs] 查找个人组织失败', personalQueryError)
      throw new Error(`查找个人组织失败: ${personalQueryError.message}`)
    }

    // 检查这些组织中哪个属于当前用户
    let personalOrgId: string | null = null

    if (personalOrgs && personalOrgs.length > 0) {
      // 检查用户是否已经是某个"我的项目"组织的owner
      for (const org of personalOrgs) {
        const { data: membership } = await supabase
          .from('user_organizations')
          .select('id')
          .eq('organization_id', org.id)
          .eq('user_id', user.id)
          .eq('role_in_org', 'owner')
          .single()

        if (membership) {
          personalOrgId = org.id
          logger.debug('[Debug Orgs] 找到用户的个人组织', { id: personalOrgId })
          break
        }
      }
    }

    if (!personalOrgId) {
      // 创建个人组织（使用 Admin Client 绕过 RLS）
      logger.debug('[Debug Orgs] 创建新的个人组织')
      const { data: newPersonal, error: createError } = await adminSupabase
        .from('organizations')
        .insert({
          name: '我的项目',
          description: '我参与和发起的所有项目',
          settings: { is_personal: true, user_id: user.id }
        })
        .select('id')
        .single()

      if (createError || !newPersonal) {
        logger.error('[Debug Orgs] 创建个人组织失败', createError)
        throw new Error(`创建个人组织失败: ${createError?.message || '未知错误'}`)
      }

      personalOrgId = newPersonal.id
      fixes.push('创建了个人组织')
      logger.debug('[Debug Orgs] 个人组织创建成功', { id: personalOrgId })
    }

    // 3. 删除旧的关系（清理脏数据）
    const orgIds = [communityOrgId, personalOrgId]
    logger.debug('[Debug Orgs] 清理旧关系', { orgIds })

    const { error: deleteError } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', user.id)
      .in('organization_id', orgIds)

    if (deleteError) {
      logger.error('[Debug Orgs] 删除旧关系失败', deleteError)
      // 不阻断流程，可能是没有旧数据
    } else {
      fixes.push('清理了旧的组织关系')
      logger.debug('[Debug Orgs] 旧关系清理成功')
    }

    // 4. 重新插入正确的关系（使用 Admin Client 绕过 RLS）
    logger.debug('[Debug Orgs] 创建新的组织关系')
    const { error: insertError } = await adminSupabase
      .from('user_organizations')
      .insert([
        {
          user_id: user.id,
          organization_id: communityOrgId,
          role_in_org: 'member'
        },
        {
          user_id: user.id,
          organization_id: personalOrgId,
          role_in_org: 'owner'
        }
      ])

    if (insertError) {
      logger.error('[Debug Orgs] 插入新关系失败', insertError)
      throw new Error(`插入组织关系失败: ${insertError.message}`)
    }

    fixes.push('重新创建了组织关系')
    logger.debug('[Debug Orgs] 组织关系创建成功')

    // 5. 验证修复结果
    const { data: verifyOrgs } = await supabase
      .from('user_organizations')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)

    logger.info('[Debug Orgs] 修复完成', { fixCount: fixes.length, orgCount: verifyOrgs?.length || 0 })

    return NextResponse.json({
      success: true,
      message: '组织数据已成功修复',
      fixes,
      organizations: verifyOrgs,
      summary: {
        communityOrgId,
        personalOrgId,
        totalOrganizations: verifyOrgs?.length || 0
      }
    })
  } catch (error: any) {
    logger.error('[Debug Orgs] 修复失败', error)

    return NextResponse.json(
      {
        error: 'Failed to fix organizations'
      },
      { status: 500 }
    )
  }
}
