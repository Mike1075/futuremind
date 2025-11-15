// calculate-roots-depth Edge Function
// 核心功能：基于用户课程进度计算五大领域的根系深度

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * 课程体系到领域的映射
 * 每个课程可以影响多个领域，权重表示贡献比例
 */
const COURSE_DOMAIN_MAPPING: Record<string, Record<string, number>> = {
  'listening': {
    'self_awareness': 1.0,      // 自在聆听完全专注于自我觉察
  },
  'earth': {
    'life_sciences': 0.6,        // 欢迎来到地球主要关注生命科学
    'universal_laws': 0.4,       // 同时涉及通用法则（物理、化学等）
  },
  'icarus': {
    'creative_expression': 0.5,  // 伊卡洛斯计划平衡创意表达
    'social_connection': 0.3,    // 社会连接（协作）
    'self_awareness': 0.2,       // 以及自我探索
  }
}

/**
 * 深度评分公式
 * - 完成度 0-100% 对应深度分 0-40
 * - 例如：完成50%的课程 = 20分深度
 */
function calculateDepthFromProgress(progressPercentage: number, weight: number): number {
  const baseDepth = (progressPercentage / 100) * 40
  return Math.round(baseDepth * weight)
}

serve(async (req) => {
  // 处理CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: '缺少user_id参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log(`🌱 开始计算根系深度：user_id=${user_id}`)

    // 1. 获取所有课程系统
    const { data: courseSystems, error: systemsError } = await supabase
      .from('course_systems')
      .select('id, system_key, title')
      .eq('is_active', true)

    if (systemsError) throw systemsError

    // 2. 初始化领域分数
    const domainScores: Record<string, number> = {
      'self_awareness': 0,
      'life_sciences': 0,
      'universal_laws': 0,
      'creative_expression': 0,
      'social_connection': 0,
    }

    // 3. 遍历每个课程系统，计算进度
    for (const system of courseSystems || []) {
      // 获取该课程系统下所有已发布的内容
      const { data: contents } = await supabase
        .from('course_contents')
        .select('id')
        .eq('system_id', system.id)
        .eq('is_published', true)

      if (!contents || contents.length === 0) continue

      const totalContents = contents.length
      const contentIds = contents.map((c: any) => c.id)

      // 获取用户在这些内容上的进度
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('ref_item_id, progress_value')
        .eq('user_id', user_id)
        .in('ref_item_id', contentIds)
        .eq('progress_type', 'reading')

      // 计算完成数量
      const completedCount = (progressData || []).filter(
        (p: any) => p.progress_value === 100
      ).length

      // 计算完成百分比
      const completionPercentage = Math.round((completedCount / totalContents) * 100)

      console.log(`📚 ${system.title}: ${completedCount}/${totalContents} (${completionPercentage}%)`)

      // 根据课程映射，更新对应领域的分数
      const domainWeights = COURSE_DOMAIN_MAPPING[system.system_key]
      if (domainWeights) {
        for (const [domain, weight] of Object.entries(domainWeights)) {
          const depthContribution = calculateDepthFromProgress(completionPercentage, weight)
          domainScores[domain] += depthContribution
          console.log(`  ➡️ ${domain}: +${depthContribution}`)
        }
      }
    }

    console.log('🌳 最终领域分数:', domainScores)

    // 4. 更新或创建 user_domain_exploration 记录
    const domainScoresJsonb = {
      self_awareness: { depth_score: domainScores.self_awareness },
      life_sciences: { depth_score: domainScores.life_sciences },
      universal_laws: { depth_score: domainScores.universal_laws },
      creative_expression: { depth_score: domainScores.creative_expression },
      social_connection: { depth_score: domainScores.social_connection },
    }

    // 先检查是否已存在记录
    const { data: existing } = await supabase
      .from('user_domain_exploration')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('user_domain_exploration')
        .update({
          domain_scores: domainScoresJsonb,
          last_evaluated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)

      if (updateError) throw updateError
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('user_domain_exploration')
        .insert({
          user_id,
          domain_scores: domainScoresJsonb,
          last_evaluated_at: new Date().toISOString(),
          total_evaluations: 1,
        })

      if (insertError) throw insertError
    }

    // 5. 更新 profiles.consciousness_tree_view 中的根系数据
    const rootsView = {
      main_roots: [
        { domain: 'self_awareness', length: domainScores.self_awareness },
        { domain: 'life_sciences', length: domainScores.life_sciences },
        { domain: 'universal_laws', length: domainScores.universal_laws },
        { domain: 'creative_expression', length: domainScores.creative_expression },
        { domain: 'social_connection', length: domainScores.social_connection },
      ]
    }

    // 获取现有的 consciousness_tree_view
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_tree_view')
      .eq('id', user_id)
      .single()

    const updatedTreeView = {
      ...(profile?.consciousness_tree_view || {}),
      roots: rootsView,
      last_updated: new Date().toISOString(),
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        consciousness_tree_view: updatedTreeView,
      })
      .eq('id', user_id)

    if (profileUpdateError) throw profileUpdateError

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        domain_scores: domainScores,
        roots_view: rootsView,
        message: '根系深度计算完成',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ 计算失败:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
