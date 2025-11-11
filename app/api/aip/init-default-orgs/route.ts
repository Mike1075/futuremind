import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/aip/init-default-orgs
 * 为当前用户初始化默认组织
 * - "社区项目"（全局社区，is_global=true）
 * - "我的项目"（个人空间，is_personal=true）
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Init Orgs] 未授权访问')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Init Orgs] 开始初始化用户组织，用户ID:', user.id)

    // 使用 Admin Client 绕过 RLS，用于创建系统组织
    const adminSupabase = createAdminClient()

    // 1. 查找或创建全局"社区项目"组织（通过名称查询，避免JSON查询问题）
    let communityOrgId: string
    let needsToJoinCommunity = false

    console.log('[Init Orgs] 查找社区组织...')
    let { data: communityOrgs, error: communityQueryError } = await adminSupabase
      .from('organizations')
      .select('id, name')
      .eq('name', '社区项目')
      .limit(1)

    if (communityQueryError) {
      console.error('[Init Orgs] 查找社区组织失败:', communityQueryError)
      throw new Error(`查找社区组织失败: ${communityQueryError.message}`)
    }

    if (communityOrgs && communityOrgs.length > 0) {
      communityOrgId = communityOrgs[0].id
      console.log('[Init Orgs] 找到社区组织:', communityOrgId)

      // 检查用户是否已经是社区成员
      const { data: existingMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', communityOrgId)
        .single()

      needsToJoinCommunity = !existingMembership
      console.log('[Init Orgs] 需要加入社区:', needsToJoinCommunity)
    } else {
      // 创建全局社区组织（使用 Admin Client 绕过 RLS）
      console.log('[Init Orgs] 创建社区组织...')
      const { data: newCommunityOrg, error: createCommunityError } = await adminSupabase
        .from('organizations')
        .insert({
          name: '社区项目',
          description: '探索者联盟全局社区 - 所有成员可以参与的公开项目',
          settings: {
            is_global: true,
            is_system: true
          }
        })
        .select('id')
        .single()

      if (createCommunityError || !newCommunityOrg) {
        console.error('[Init Orgs] 创建社区组织失败:', createCommunityError)
        throw new Error(`创建社区组织失败: ${createCommunityError?.message || '未知错误'}`)
      }

      communityOrgId = newCommunityOrg.id
      needsToJoinCommunity = true
      console.log('[Init Orgs] 社区组织创建成功:', communityOrgId)
    }

    // 2. 查找个人组织（通过名称+描述，然后验证owner身份）
    console.log('[Init Orgs] 查找个人组织...')
    let { data: personalOrgs, error: personalQueryError } = await adminSupabase
      .from('organizations')
      .select('id, name, description')
      .eq('name', '我的项目')
      .like('description', '%我参与和发起%')
      .limit(10)

    if (personalQueryError) {
      console.error('[Init Orgs] 查找个人组织失败:', personalQueryError)
      throw new Error(`查找个人组织失败: ${personalQueryError.message}`)
    }

    let personalOrgId: string | null = null

    if (personalOrgs && personalOrgs.length > 0) {
      // 检查哪个是当前用户的个人组织（通过owner关系验证）
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
          console.log('[Init Orgs] 找到用户的个人组织:', personalOrgId)
          break
        }
      }
    }

    if (personalOrgId) {
      // 用户已有个人组织，确保加入了两个组织
      console.log('[Init Orgs] 用户已有个人组织，检查加入状态...')

      // 检查是否已加入个人组织
      const { data: personalMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', personalOrgId)
        .single()

      const membershipInserts = []

      if (needsToJoinCommunity) {
        console.log('[Init Orgs] 添加社区组织关系')
        membershipInserts.push({
          user_id: user.id,
          organization_id: communityOrgId,
          role_in_org: 'member'
        })
      }

      if (!personalMembership) {
        console.log('[Init Orgs] 添加个人组织关系')
        membershipInserts.push({
          user_id: user.id,
          organization_id: personalOrgId,
          role_in_org: 'owner'
        })
      }

      if (membershipInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('user_organizations')
          .insert(membershipInserts)

        if (insertError) {
          console.error('[Init Orgs] 插入组织关系失败:', insertError)
          throw new Error(`插入组织关系失败: ${insertError.message}`)
        }

        console.log('[Init Orgs] ✅ 已补充缺失的组织关系')
      } else {
        console.log('[Init Orgs] ✅ 用户已加入所有组织')
      }

      return NextResponse.json({
        message: '已确保用户加入所有组织',
        alreadyInitialized: true,
        organizations: {
          community: communityOrgId,
          personal: personalOrgId
        }
      })
    }

    // 3. 创建"我的项目"个人组织（使用 Admin Client 绕过 RLS）
    console.log('[Init Orgs] 创建新的个人组织...')
    const { data: personalOrg, error: createPersonalError } = await adminSupabase
      .from('organizations')
      .insert({
        name: '我的项目',
        description: '我参与和发起的所有项目',
        settings: {
          is_personal: true,
          user_id: user.id
        }
      })
      .select('id')
      .single()

    if (createPersonalError || !personalOrg) {
      console.error('[Init Orgs] 创建个人组织失败:', createPersonalError)
      throw new Error(`创建个人组织失败: ${createPersonalError?.message || '未知错误'}`)
    }

    personalOrgId = personalOrg.id
    console.log('[Init Orgs] 个人组织创建成功:', personalOrgId)

    // 4. 将用户加入两个组织
    console.log('[Init Orgs] 创建组织关系...')
    const membershipInserts = [
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
    ]

    const { error: insertError } = await supabase
      .from('user_organizations')
      .insert(membershipInserts)

    if (insertError) {
      console.error('[Init Orgs] 加入组织失败:', insertError)
      throw new Error(`加入组织失败: ${insertError.message}`)
    }

    console.log('[Init Orgs] ✅ 默认组织初始化完成')

    return NextResponse.json({
      success: true,
      message: '默认组织初始化成功',
      organizations: {
        community: communityOrgId,
        personal: personalOrgId
      }
    })
  } catch (error: any) {
    console.error('[Init Orgs] ❌ 初始化失败:', error)
    console.error('[Init Orgs] 错误堆栈:', error.stack)

    return NextResponse.json(
      {
        error: '初始化默认组织失败',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
