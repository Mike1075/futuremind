import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/consciousness/calculate-fruits
 * 计算成果果实的成熟度（基于项目完成度和社区反响）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    console.log(`🍎 开始计算成果果实：user_id=${user.id}`)

    // 1. 获取用户创建的项目
    const { data: createdProjects, error: createdError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        is_public,
        created_at,
        settings
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (createdError) throw createdError

    // 2. 获取用户参与的项目
    const { data: participatedProjects, error: participatedError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        role_in_project,
        joined_at,
        projects!inner (
          id,
          name,
          description,
          status,
          is_public,
          creator_id,
          created_at,
          settings
        )
      `)
      .eq('user_id', user.id)

    if (participatedError) throw participatedError

    // 合并项目列表
    const allProjects = [
      ...(createdProjects || []).map(p => ({ ...p, isCreator: true })),
      ...(participatedProjects || []).map(pm => ({
        ...(pm.projects as any),
        isCreator: false,
        memberRole: pm.role_in_project
      }))
    ]

    console.log(`📊 找到 ${allProjects.length} 个项目（${createdProjects?.length || 0} 个创建，${participatedProjects?.length || 0} 个参与）`)

    if (allProjects.length === 0) {
      return NextResponse.json({
        success: true,
        fruits: [],
        message: '未找到项目，无法生成果实',
      })
    }

    const fruits = []

    // 3. 为每个项目计算成熟度
    for (const project of allProjects) {
      const projectId = project.id

      // 3.1 获取项目成员数
      const { count: memberCount } = await supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // 3.2 获取项目任务统计
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // 3.3 获取项目文档数（作为知识贡献指标）
      const { count: documentCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // 3.4 获取社区参与数据（从项目设置或元数据中读取）
      const settings = project.settings as any || {}
      const viewsCount = settings.views_count || 0
      const likesCount = settings.likes_count || 0
      const commentsCount = settings.comments_count || 0

      // 4. 计算成熟度评分 (0-100)

      // 4.1 项目完成度得分 (40%)
      const projectStatusScore = project.status === 'completed' ? 100 :
                                 project.status === 'active' ? taskCompletionRate :
                                 20 // archived 或其他状态给基础分

      // 4.2 社区参与度得分 (30%)
      // 简化算法：views每10个 +1分，likes每个 +2分，comments每个 +3分
      const communityEngagementScore = Math.min(100,
        (viewsCount / 10) + (likesCount * 2) + (commentsCount * 3)
      )

      // 4.3 协作质量得分 (30%)
      // 成员数 (10分/人，上限30) + 任务完成率(上限70)
      const collaborationScore = Math.min(100,
        Math.min(30, (memberCount || 1) * 10) + taskCompletionRate * 0.7
      )

      // 4.4 综合成熟度
      const maturityLevel = Math.round(
        projectStatusScore * 0.4 +
        communityEngagementScore * 0.3 +
        collaborationScore * 0.3
      )

      // 5. 确定果实类型
      let fruitType = 'project_completion'
      if (communityEngagementScore > 60) {
        fruitType = 'community_recognition'
      } else if (documentCount && documentCount > 5) {
        fruitType = 'knowledge_contribution'
      } else if ((memberCount || 0) >= 3) {
        fruitType = 'collaboration_achievement'
      }

      // 6. 计算果实大小 (10-50)
      const size = Math.round(10 + (maturityLevel / 100) * 40)

      // 7. 元数据
      const metadata = {
        project_name: project.name,
        member_count: memberCount || 1,
        likes_count: likesCount,
        views_count: viewsCount,
        comments_count: commentsCount,
        completion_percentage: Math.round(taskCompletionRate),
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        document_count: documentCount || 0,
        is_creator: project.isCreator,
      }

      // 8. 检查是否已存在该项目的果实
      const { data: existingFruit } = await supabase
        .from('consciousness_fruits')
        .select('id, maturity_level')
        .eq('user_id', user.id)
        .eq('related_project_id', projectId)
        .maybeSingle()

      let fruitRecord

      if (existingFruit) {
        // 更新现有果实
        const { data: updated, error: updateError } = await supabase
          .from('consciousness_fruits')
          .update({
            maturity_level: maturityLevel,
            fruit_type: fruitType,
            size,
            color: getFruitColor(fruitType, maturityLevel),
            metadata,
            harvested_at: maturityLevel >= 80 && !existingFruit.maturity_level ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFruit.id)
          .select()
          .single()

        if (updateError) throw updateError
        fruitRecord = updated
      } else {
        // 创建新果实
        const { data: created, error: insertError } = await supabase
          .from('consciousness_fruits')
          .insert({
            user_id: user.id,
            fruit_type: fruitType,
            maturity_level: maturityLevel,
            related_project_id: projectId,
            metadata,
            color: getFruitColor(fruitType, maturityLevel),
            size,
            harvested_at: maturityLevel >= 80 ? new Date().toISOString() : null,
            is_public: project.is_public || false,
          })
          .select()
          .single()

        if (insertError) throw insertError
        fruitRecord = created
      }

      fruits.push(fruitRecord)

      console.log(`✨ ${existingFruit ? '更新' : '创建'}果实: ${project.name} (成熟度: ${maturityLevel})`)
    }

    // 9. 更新 profiles.consciousness_tree_view
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_tree_view')
      .eq('id', user.id)
      .single()

    const existingTreeView = (profile?.consciousness_tree_view as Record<string, any>) || {}
    const updatedTreeView = {
      ...existingTreeView,
      fruits: fruits.slice(0, 10).map(f => ({ // 只保存最成熟的10个到视图
        id: f.id,
        type: f.fruit_type,
        maturity: f.maturity_level,
        size: f.size,
        project_name: (f.metadata as any).project_name,
      })).sort((a, b) => b.maturity - a.maturity),
      last_updated: new Date().toISOString(),
    }

    await supabase
      .from('profiles')
      .update({
        consciousness_tree_view: updatedTreeView,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      fruits,
      stats: {
        total_projects: allProjects.length,
        fruits_created: fruits.filter(f => !f.updated_at || f.created_at === f.updated_at).length,
        fruits_updated: fruits.filter(f => f.updated_at && f.created_at !== f.updated_at).length,
        harvested_fruits: fruits.filter(f => f.harvested_at).length,
      },
      message: `成功计算 ${fruits.length} 个果实`,
    })
  } catch (error: any) {
    console.error('❌ 计算果实失败:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * 根据果实类型和成熟度返回颜色
 */
function getFruitColor(type: string, maturity: number): string {
  // 基础颜色
  const baseColors: Record<string, string> = {
    project_completion: '#fbbf24', // 金色
    community_recognition: '#f43f5e', // 红色
    knowledge_contribution: '#8b5cf6', // 紫色
    collaboration_achievement: '#10b981', // 绿色
  }

  const baseColor = baseColors[type] || '#fbbf24'

  // 根据成熟度调整亮度（成熟度越高越鲜艳）
  if (maturity < 30) {
    return baseColor + '66' // 40% 不透明度
  } else if (maturity < 60) {
    return baseColor + '99' // 60% 不透明度
  } else if (maturity < 80) {
    return baseColor + 'CC' // 80% 不透明度
  } else {
    return baseColor // 100% 不透明度
  }
}
