// Edge Function: calculate-relative-level
// Description: 计算所有学员的相对意识等级（1-7级）
// Trigger: 每周日凌晨2点自动运行 或 手动触发

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentLevel {
  user_id: string
  consciousness_level: number
  composite_score: number
  percentile_rank: number
  domain_depth_score: number
  activity_score: number
  quality_score: number
  dialogue_depth_score: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[开始计算相对等级]', new Date().toISOString())

    // 调用数据库函数计算等级
    const { data: rankedStudents, error: calcError } = await supabase
      .rpc('calculate_all_student_levels')

    if (calcError) {
      console.error('[计算失败]', calcError)
      throw calcError
    }

    console.log(`[计算完成] 共处理 ${rankedStudents.length} 位学员`)

    // 更新每个学员的等级信息
    let updatedCount = 0
    let historyCount = 0

    for (const student of rankedStudents as StudentLevel[]) {
      // 1. 更新profiles表
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          consciousness_level: student.consciousness_level,
          composite_score: student.composite_score,
          percentile_rank: student.percentile_rank,
          level_updated_at: new Date().toISOString()
        })
        .eq('id', student.user_id)

      if (profileError) {
        console.error(`[更新失败] 用户 ${student.user_id}:`, profileError)
        continue
      }

      updatedCount++

      // 2. 记录到历史表
      const { error: historyError } = await supabase
        .from('consciousness_level_history')
        .insert({
          user_id: student.user_id,
          consciousness_level: student.consciousness_level,
          composite_score: student.composite_score,
          percentile_rank: student.percentile_rank,
          domain_depth_score: student.domain_depth_score,
          activity_score: student.activity_score,
          quality_score: student.quality_score,
          dialogue_depth_score: student.dialogue_depth_score,
          recorded_at: new Date().toISOString()
        })

      if (historyError) {
        console.error(`[历史记录失败] 用户 ${student.user_id}:`, historyError)
      } else {
        historyCount++
      }
    }

    // 统计等级分布
    const levelDistribution = rankedStudents.reduce((acc, student) => {
      const level = (student as StudentLevel).consciousness_level
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_students: rankedStudents.length,
      updated_profiles: updatedCount,
      saved_history_records: historyCount,
      level_distribution: levelDistribution,
      message: `成功计算并更新了 ${updatedCount} 位学员的意识等级`
    }

    console.log('[执行结果]', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('[Edge Function 错误]', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
