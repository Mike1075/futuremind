import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/consciousness/calculate-level
 * 计算用户的意识等级（1-7级）
 *
 * 评分体系：
 * - 领域深度得分（40%）：五大领域的平均深度
 * - 活跃度得分（30%）：冥想次数、对话频率、提交作业
 * - 质量得分（20%）：洞见深度、果实成熟度
 * - 对话深度得分（10%）：Gaia对话的深度和频率
 *
 * 等级划分（基于百分位排名）：
 * - Level 1: 0-20%
 * - Level 2: 20-35%
 * - Level 3: 35-50%
 * - Level 4: 50-65%
 * - Level 5: 65-80%
 * - Level 6: 80-92%
 * - Level 7: 92-100%
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

    console.log(`🌟 开始计算意识等级：user_id=${user.id}`)

    // 1. 获取领域探索数据（根系深度）
    const { data: domainData } = await supabase
      .from('user_domain_exploration')
      .select('domain_scores')
      .eq('user_id', user.id)
      .maybeSingle()

    const domainScores = (domainData?.domain_scores as any) || {}

    // 计算领域平均深度（0-40分 -> 0-100分）
    const domains = ['self_awareness', 'life_sciences', 'universal_laws', 'creative_expression', 'social_connection']
    const depths = domains.map(d => (domainScores[d]?.depth_score || 0))
    const avgDepth = depths.reduce((a, b) => a + b, 0) / domains.length
    const domainDepthScore = (avgDepth / 40) * 100 // 转换为0-100分

    // 2. 获取活跃度数据

    // 2.1 冥想次数（最近90天）
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { count: meditationCount } = await supabase
      .from('user_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('submission_type', 'meditation')
      .gte('submitted_at', ninetyDaysAgo.toISOString())

    // 2.2 Gaia对话频率（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: conversationCount } = await supabase
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('agent_type', 'gaia')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 2.3 作业提交数（最近60天）
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { count: submissionCount } = await supabase
      .from('user_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('submission_type', ['reflection', 'assignment', 'project_deliverable'])
      .gte('submitted_at', sixtyDaysAgo.toISOString())

    // 活跃度得分计算
    // 冥想: 每次+1分（上限30），对话: 每10条+1分（上限40），作业: 每个+2分（上限30）
    const activityScore = Math.min(100,
      Math.min(30, meditationCount || 0) +
      Math.min(40, Math.floor((conversationCount || 0) / 10)) +
      Math.min(30, (submissionCount || 0) * 2)
    )

    // 3. 获取质量数据

    // 3.1 洞见平均深度
    const { data: insights } = await supabase
      .from('insight_leaves')
      .select('depth_score, originality_score')
      .eq('user_id', user.id)
      .limit(20) // 最近20条

    const avgInsightDepth = insights && insights.length > 0
      ? insights.reduce((sum, i) => sum + (i.depth_score || 0), 0) / insights.length
      : 0

    const avgInsightOriginality = insights && insights.length > 0
      ? insights.reduce((sum, i) => sum + (i.originality_score || 0), 0) / insights.length
      : 0

    // 3.2 果实平均成熟度
    const { data: fruits } = await supabase
      .from('consciousness_fruits')
      .select('maturity_level')
      .eq('user_id', user.id)

    const avgFruitMaturity = fruits && fruits.length > 0
      ? fruits.reduce((sum, f) => sum + (f.maturity_level || 0), 0) / fruits.length
      : 0

    // 质量得分：洞见深度(40%) + 洞见原创性(30%) + 果实成熟度(30%)
    const qualityScore =
      avgInsightDepth * 0.4 +
      avgInsightOriginality * 0.3 +
      avgFruitMaturity * 0.3

    // 4. 对话深度得分

    // 获取对话的平均长度和频率
    const { data: recentMessages } = await supabase
      .from('chat_history')
      .select('content, ai_content')
      .eq('user_id', user.id)
      .eq('agent_type', 'gaia')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(50)

    let avgMessageLength = 0
    if (recentMessages && recentMessages.length > 0) {
      const totalLength = recentMessages.reduce((sum, m) => {
        const userLength = m.content?.length || 0
        const aiLength = m.ai_content?.length || 0
        return sum + userLength + aiLength
      }, 0)
      avgMessageLength = totalLength / recentMessages.length
    }

    // 对话深度得分：基于消息频率和长度
    // 频率：每10条+20分（上限60），长度：每100字符+1分（上限40）
    const dialogueDepthScore = Math.min(100,
      Math.min(60, Math.floor((conversationCount || 0) / 10) * 20) +
      Math.min(40, Math.floor(avgMessageLength / 100))
    )

    // 5. 综合评分（0-100）
    const compositeScore = Math.round(
      domainDepthScore * 0.4 +    // 领域深度 40%
      activityScore * 0.3 +        // 活跃度 30%
      qualityScore * 0.2 +         // 质量 20%
      dialogueDepthScore * 0.1     // 对话深度 10%
    )

    console.log(`📊 评分详情:`)
    console.log(`  - 领域深度: ${domainDepthScore.toFixed(1)} (平均根长: ${avgDepth.toFixed(1)}/40)`)
    console.log(`  - 活跃度: ${activityScore} (冥想${meditationCount}, 对话${conversationCount}, 作业${submissionCount})`)
    console.log(`  - 质量: ${qualityScore.toFixed(1)} (洞见${avgInsightDepth.toFixed(1)}, 果实${avgFruitMaturity.toFixed(1)})`)
    console.log(`  - 对话深度: ${dialogueDepthScore} (消息${conversationCount}, 平均长度${avgMessageLength.toFixed(0)})`)
    console.log(`  - 综合评分: ${compositeScore}`)

    // 6. 计算百分位排名（从所有用户中）
    const { data: allScores } = await supabase
      .from('profiles')
      .select('composite_score')
      .not('composite_score', 'is', null)
      .order('composite_score', { ascending: true })

    let percentileRank = 0.5 // 默认50%
    if (allScores && allScores.length > 0) {
      const lowerCount = allScores.filter(s => (s.composite_score || 0) < compositeScore).length
      percentileRank = lowerCount / allScores.length
    }

    // 7. 确定意识等级（1-7）
    let consciousnessLevel = 1
    if (percentileRank >= 0.92) consciousnessLevel = 7
    else if (percentileRank >= 0.80) consciousnessLevel = 6
    else if (percentileRank >= 0.65) consciousnessLevel = 5
    else if (percentileRank >= 0.50) consciousnessLevel = 4
    else if (percentileRank >= 0.35) consciousnessLevel = 3
    else if (percentileRank >= 0.20) consciousnessLevel = 2
    else consciousnessLevel = 1

    console.log(`🎯 百分位排名: ${(percentileRank * 100).toFixed(1)}% → Level ${consciousnessLevel}`)

    // 8. 更新用户资料
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        consciousness_level: consciousnessLevel,
        composite_score: compositeScore,
        percentile_rank: percentileRank,
        level_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // 9. 记录历史
    await supabase
      .from('consciousness_level_history')
      .insert({
        user_id: user.id,
        consciousness_level: consciousnessLevel,
        composite_score: compositeScore,
        percentile_rank: percentileRank,
        domain_depth_score: domainDepthScore,
        activity_score: activityScore,
        quality_score: qualityScore,
        dialogue_depth_score: dialogueDepthScore,
        recorded_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      user_id: user.id,
      consciousness_level: consciousnessLevel,
      composite_score: compositeScore,
      percentile_rank: Math.round(percentileRank * 100),
      scores: {
        domain_depth: Math.round(domainDepthScore),
        activity: activityScore,
        quality: Math.round(qualityScore),
        dialogue_depth: dialogueDepthScore,
      },
      stats: {
        avg_root_depth: Math.round(avgDepth * 10) / 10,
        meditation_count: meditationCount || 0,
        conversation_count: conversationCount || 0,
        submission_count: submissionCount || 0,
        insight_count: insights?.length || 0,
        fruit_count: fruits?.length || 0,
      },
      message: `意识等级已更新为 Level ${consciousnessLevel}`,
    })
  } catch (error: any) {
    console.error('❌ 计算等级失败:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}
