// pregenerate-knowledge-questions 边缘函数
// 功能：为知识点预生成10个启发性问题并存储到数据库

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    const { contentId, knowledgePointIndex, knowledgePointText } = await req.json()

    console.log('[Pregenerate] 收到请求:', { contentId, knowledgePointIndex, knowledgePointText: knowledgePointText?.substring(0, 50) })

    if (!contentId || knowledgePointIndex === undefined || !knowledgePointText) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // 创建Supabase客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 检查是否已经存在预生成的问题
    const { data: existing } = await supabase
      .from('knowledge_point_questions')
      .select('id, questions')
      .eq('content_id', contentId)
      .eq('knowledge_point_index', knowledgePointIndex)
      .single()

    if (existing && existing.questions && existing.questions.length >= 10) {
      console.log('[Pregenerate] 问题已存在，直接返回')
      return new Response(
        JSON.stringify({ success: true, questions: existing.questions, cached: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log('[Pregenerate] 调用OpenAI生成10个问题...')

    // 调用OpenAI生成10个不同的启发性问题
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `你是一位苏格拉底式的提问者。为给定的知识点生成10个不同角度的思考问题。

要求：
1. 每个问题必须直接以问题形式开始，不要有任何开场白、赞美或寒暄
2. 问题应该引发深度思考，可以包含2-3个递进的子问题
3. 从不同维度探索：原理、应用、联系、对比、假设等
4. 语言简洁有力，直奔主题

格式：JSON数组，每个元素是一个纯问题字符串
示例：["声音的传播是否仅依赖于物理介质的存在？心理因素在我们对声音的接受与理解中又起到了怎样的作用？", "如果我们能听到超声波，世界会变成什么样子？这会如何改变人类的沟通方式？"]`
          },
          {
            role: 'user',
            content: `知识点：${knowledgePointText}

生成10个直接的思考问题，不要任何开场白或赞美，直接返回JSON数组。`
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Pregenerate] OpenAI error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate questions', details: errorData }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || '[]'

    // 解析JSON数组
    let questions: string[]
    try {
      // 尝试提取JSON数组
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        questions = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('[Pregenerate] JSON解析失败，使用备用方案:', parseError)
      // 如果解析失败，将内容分割成多个问题
      questions = content.split('\n\n').filter((q: string) => q.trim().length > 20)
    }

    // 确保至少有10个问题
    const fallbackQuestions = [
      `这个概念与你的日常生活有什么联系？你能想到哪些具体的例子来说明它？`,
      `如果这个知识点不存在，世界会有什么不同？`,
      `这个概念的核心原理是什么？它是如何运作的？`,
      `你能用自己的话向一个小朋友解释这个概念吗？`,
      `这个知识点与其他学科有什么联系？能举例说明吗？`
    ]
    let fallbackIndex = 0
    while (questions.length < 10) {
      questions.push(fallbackQuestions[fallbackIndex % fallbackQuestions.length])
      fallbackIndex++
    }

    console.log('[Pregenerate] 成功生成', questions.length, '个问题')

    // 保存到数据库
    const { error: upsertError } = await supabase
      .from('knowledge_point_questions')
      .upsert({
        content_id: contentId,
        knowledge_point_index: knowledgePointIndex,
        knowledge_point_text: knowledgePointText,
        questions: questions.slice(0, 10), // 只保留前10个
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'content_id,knowledge_point_index'
      })

    if (upsertError) {
      console.error('[Pregenerate] 保存失败:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save questions', details: upsertError }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, questions: questions.slice(0, 10), cached: false }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('[Pregenerate] Internal error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
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
