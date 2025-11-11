import { createClient } from '@/lib/supabase/server'
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. 查找或创建全局"社区项目"组织（所有用户都应该加入）
    let communityOrgId: string
    let needsToJoinCommunity = false

    const { data: communityOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('settings->is_global', true)
      .single()

    if (communityOrg) {
      communityOrgId = communityOrg.id

      // 检查用户是否已经是社区成员
      const { data: existingMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', communityOrgId)
        .single()

      needsToJoinCommunity = !existingMembership
    } else {
      // 创建全局社区组织
      const { data: newCommunityOrg, error: createCommunityError } = await supabase
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
        throw new Error('创建社区组织失败')
      }

      communityOrgId = newCommunityOrg.id
      needsToJoinCommunity = true
    }

    // 2. 检查用户是否已有个人组织
    const { data: existingPersonalOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('settings->is_personal', true)
      .eq('settings->user_id', user.id)
      .single()

    if (existingPersonalOrg) {
      // 用户已有个人组织，确保加入了社区和个人组织
      const personalOrgId = existingPersonalOrg.id

      // 检查是否已加入个人组织
      const { data: personalMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', personalOrgId)
        .single()

      const membershipInserts = []

      if (needsToJoinCommunity) {
        membershipInserts.push({
          user_id: user.id,
          organization_id: communityOrgId,
          role_in_org: 'member'
        })
      }

      if (!personalMembership) {
        membershipInserts.push({
          user_id: user.id,
          organization_id: personalOrgId,
          role_in_org: 'owner'
        })
      }

      if (membershipInserts.length > 0) {
        await supabase
          .from('user_organizations')
          .insert(membershipInserts)
      }

      return NextResponse.json({
        message: '已确保用户加入所有组织',
        alreadyInitialized: true
      })
    }

    // 3. 创建"我的项目"个人组织
    const { data: personalOrg, error: createPersonalError } = await supabase
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
      throw new Error('创建个人组织失败')
    }

    const personalOrgId = personalOrg.id

    // 4. 将用户加入两个组织
    const { error: insertError } = await supabase
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
      throw new Error('加入组织失败: ' + insertError.message)
    }

    return NextResponse.json({
      success: true,
      message: '默认组织初始化成功',
      organizations: {
        community: communityOrgId,
        personal: personalOrgId
      }
    })
  } catch (error: any) {
    console.error('Init default orgs error:', error)
    return NextResponse.json(
      { error: '初始化默认组织失败', details: error.message },
      { status: 500 }
    )
  }
}
