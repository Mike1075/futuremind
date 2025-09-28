import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvaluationRequest {
  user_id: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isGaia: boolean;
  timestamp: string;
}

interface DomainScores {
  self_awareness: { depth_score: number };
  life_sciences: { depth_score: number };
  universal_laws: { depth_score: number };
  creative_expression: { depth_score: number };
  social_connection: { depth_score: number };
}

interface GrowthScores {
  self_awareness_growth: number;
  life_sciences_growth: number;
  universal_laws_growth: number;
  creative_expression_growth: number;
  social_connection_growth: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 解析请求
    const { user_id }: EvaluationRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. 初始化Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. 获取双重上下文
    console.log(`开始为用户 ${user_id} 进行意识评估...`)

    // 3.1 获取历史水平 (domain_scores)
    const { data: explorationData, error: explorationError } = await supabase
      .from('user_domain_exploration')
      .select('domain_scores')
      .eq('user_id', user_id)
      .single()

    if (explorationError && explorationError.code !== 'PGRST116') {
      console.error('获取探索记录失败:', explorationError)
      return new Response(
        JSON.stringify({ error: '获取用户探索记录失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const currentScores: DomainScores = explorationData?.domain_scores || {
      self_awareness: { depth_score: 0 },
      life_sciences: { depth_score: 0 },
      universal_laws: { depth_score: 0 },
      creative_expression: { depth_score: 0 },
      social_connection: { depth_score: 0 }
    }

    // 3.2 获取最新行为 (最后20条消息)
    const { data: conversationData, error: conversationError } = await supabase
      .from('gaia_conversations')
      .select('messages')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error('获取对话记录失败:', conversationError)
      return new Response(
        JSON.stringify({ error: '获取对话记录失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const allMessages: ChatMessage[] = conversationData?.messages || []
    const recentMessages = allMessages.slice(-20) // 取最后20条消息

    if (recentMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: '用户尚未有足够的对话记录进行评估' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. 构建AI提示词
    const aiPrompt = `
你是一位专业的意识成长评估师，负责分析学员的对话内容并评估其在五个核心领域的成长程度。

## 评估维度
1. **自我觉察 (self_awareness)**: 对内在状态、情绪、思维模式的觉察能力
2. **生命科学 (life_sciences)**: 对生命现象、身体智慧、自然规律的理解
3. **宇宙法则 (universal_laws)**: 对宇宙运行规律、物理原理、哲学思考的洞察
4. **创造表达 (creative_expression)**: 创造力、艺术感受力、独特表达的展现
5. **社会联结 (social_connection)**: 人际关系、共情能力、社会理解的深度

## 学员当前状态
当前领域分数：
- 自我觉察: ${currentScores.self_awareness.depth_score}
- 生命科学: ${currentScores.life_sciences.depth_score}
- 宇宙法则: ${currentScores.universal_laws.depth_score}
- 创造表达: ${currentScores.creative_expression.depth_score}
- 社会联结: ${currentScores.social_connection.depth_score}

## 最近对话内容
${recentMessages.map((msg, idx) => `${idx + 1}. ${msg.isGaia ? '[盖亚]' : '[学员]'}: ${msg.content}`).join('\n')}

## 评估要求
基于学员的最新对话内容，评估其在各领域的成长增量。请考虑：
- 对话中体现的深度思考和洞察
- 提出的问题质量和探索精神
- 情感表达和自我反思能力
- 对复杂概念的理解和应用
- 与他人/盖亚的互动质量

每个领域的增长分数范围：0-10分
- 0-2分：基础对话，无明显成长
- 3-5分：有一定思考深度，中等成长
- 6-8分：深度洞察，显著成长
- 9-10分：突破性理解，卓越成长

请以JSON格式返回评估结果，格式如下：
{
  "self_awareness_growth": 数字,
  "life_sciences_growth": 数字,
  "universal_laws_growth": 数字,
  "creative_expression_growth": 数字,
  "social_connection_growth": 数字,
  "evaluation_reasoning": "简要说明评估理由"
}
`

    // 5. 调用AI大模型进行评估
    console.log('调用AI进行意识成长评估...')

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API密钥未配置' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的意识成长评估师，擅长通过对话内容分析学员的内在成长。请严格按照要求的JSON格式返回评估结果。'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!openaiResponse.ok) {
      console.error('OpenAI API调用失败:', await openaiResponse.text())
      return new Response(
        JSON.stringify({ error: 'AI评估服务调用失败' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const aiResult = await openaiResponse.json()
    const aiContent = aiResult.choices[0]?.message?.content

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'AI评估返回空结果' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 6. 解析AI评估结果
    let growthScores: GrowthScores & { evaluation_reasoning?: string }
    try {
      // 提取JSON部分（可能包含其他文本）
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : aiContent
      growthScores = JSON.parse(jsonStr)

      // 验证必需字段
      const requiredFields = ['self_awareness_growth', 'life_sciences_growth', 'universal_laws_growth', 'creative_expression_growth', 'social_connection_growth']
      for (const field of requiredFields) {
        if (typeof growthScores[field as keyof GrowthScores] !== 'number') {
          throw new Error(`缺少或无效的字段: ${field}`)
        }
      }
    } catch (parseError) {
      console.error('AI返回结果解析失败:', parseError, '原始内容:', aiContent)
      return new Response(
        JSON.stringify({ error: 'AI评估结果格式无效', details: aiContent }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('AI评估完成:', growthScores)

    // 7. 调用数据库函数更新探索记录和意识树视图
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_exploration_and_tree_view', {
        p_user_id: user_id,
        p_growth_scores_json: {
          self_awareness_growth: growthScores.self_awareness_growth,
          life_sciences_growth: growthScores.life_sciences_growth,
          universal_laws_growth: growthScores.universal_laws_growth,
          creative_expression_growth: growthScores.creative_expression_growth,
          social_connection_growth: growthScores.social_connection_growth,
        }
      })

    if (updateError) {
      console.error('更新意识树失败:', updateError)
      return new Response(
        JSON.stringify({ error: '更新意识树失败', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 8. 返回评估结果
    const result = {
      success: true,
      user_id,
      evaluation: {
        growth_scores: growthScores,
        ai_reasoning: growthScores.evaluation_reasoning,
        messages_analyzed: recentMessages.length,
        previous_scores: currentScores,
      },
      update_result: updateResult,
      timestamp: new Date().toISOString(),
    }

    console.log('意识树评估和更新完成:', result)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('处理请求时发生错误:', error)
    return new Response(
      JSON.stringify({
        error: '内部服务器错误',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})