// delete-submission 边缘函数
// 核心功能：删除提交记录 + 回退意识树成长点数

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// 初始化Supabase客户端（使用Service Role绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  // 处理CORS预检请求
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
    // 1. 解析请求
    const { user_id, submission_id } = await req.json()

    if (!user_id || !submission_id) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数：user_id, submission_id' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    console.log(`🗑️ 开始删除提交：user_id=${user_id}, submission_id=${submission_id}`)

    // 2. 获取提交记录详情（需要验证所有权并获取成长点数）
    const { data: submission, error: fetchError } = await supabase
      .from('user_submissions')
      .select('*')
      .eq('id', submission_id)
      .eq('user_id', user_id)  // 确保只能删除自己的提交
      .single()

    if (fetchError || !submission) {
      console.error('❌ 提交记录不存在或无权删除:', fetchError)
      return new Response(
        JSON.stringify({ error: '提交记录不存在或无权删除' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const growthPoints = submission.consciousness_growth_points || 0
    console.log(`📊 该提交的意识成长点数: ${growthPoints}`)

    // 3. 如果有意识成长点数，需要从用户的意识树中减去
    if (growthPoints > 0) {
      console.log('🌱 回退意识树成长点数...')

      // 获取用户的意识树
      const { data: tree } = await supabase
        .from('consciousness_trees')
        .select('*')
        .eq('user_id', user_id)
        .single()

      if (tree) {
        // 计算新的总分（不能低于0）
        const currentTotalPoints = tree.total_growth_points || 0
        const newTotalPoints = Math.max(0, currentTotalPoints - growthPoints)

        console.log(`📉 总成长点数: ${currentTotalPoints} → ${newTotalPoints}`)

        // 更新意识树的总成长点数
        const { error: updateTreeError } = await supabase
          .from('consciousness_trees')
          .update({
            total_growth_points: newTotalPoints,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        if (updateTreeError) {
          console.error('❌ 更新意识树失败:', updateTreeError)
          // 不阻止删除操作，只记录错误
        } else {
          console.log('✅ 意识树点数已回退')
        }
      }
    }

    // 4. 删除提交记录
    console.log('🗑️ 删除提交记录...')

    const { error: deleteError } = await supabase
      .from('user_submissions')
      .delete()
      .eq('id', submission_id)
      .eq('user_id', user_id)  // 再次确认所有权

    if (deleteError) {
      console.error('❌ 删除提交记录失败:', deleteError)
      return new Response(
        JSON.stringify({ error: '删除失败: ' + deleteError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    console.log('✅ 提交记录已删除')

    // 5. 返回成功结果
    return new Response(
      JSON.stringify({
        success: true,
        message: '提交记录已删除',
        reverted_points: growthPoints
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('❌ 删除失败:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '删除失败',
        details: error instanceof Error ? error.stack : undefined,
      }),
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
