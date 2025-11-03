// proxy-gaia-dialogue 边缘函数
// 核心功能：实时对话代理与安全网关

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') // 可选，如果配置了就用n8n，否则用OpenAI

// 初始化Supabase客户端
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
    const { user_id, course_system_id, course_content_id, user_input, session_id } = await req.json()

    if (!user_id || !course_system_id || !user_input || !session_id) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`💬 对话代理启动: user_id=${user_id}, session_id=${session_id}`)

    // 2. 获取盖亚上下文变量（缓存）
    console.log('🔍 获取上下文缓存...')
    const { data: contextCache } = await supabase
      .from('gaia_context_variables')
      .select('*')
      .eq('user_id', user_id)
      .eq('course_system_id', course_system_id)
      .gt('valid_until', new Date().toISOString())
      .single()

    if (!contextCache) {
      console.log('⚠️ 上下文缓存未找到或已过期，返回提示')
      // 在实际应用中，这里应该调用prepare-course-context-for-gaia函数生成缓存
      // 现在简单返回错误提示
      return new Response(
        JSON.stringify({
          error: '上下文缓存未就绪，请先进入课程页面',
          hint: '系统需要先准备您的个性化学习上下文'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ 上下文缓存获取成功')

    // 3. 获取对话历史
    console.log('📜 获取对话历史...')
    const { data: conversation } = await supabase
      .from('gaia_conversations')
      .select('messages')
      .eq('session_id', session_id)
      .single()

    const dialogueHistory = conversation?.messages || []
    console.log(`✅ 获取到 ${dialogueHistory.length} 条历史消息`)

    // 4. 构建发送给AI的完整情报包
    const aiPayload = {
      user_profile: {
        user_id,
        student_profile: contextCache.student_profile,
      },
      course_context: {
        course_system_id,
        course_content_id,
        course_learning_summary: contextCache.course_learning_summary,
        recent_submissions: contextCache.recent_submissions,
        consciousness_tree: contextCache.consciousness_tree,
      },
      dialogue_history: dialogueHistory.slice(-20), // 最近20条
      current_interaction: {
        user_input,
        timestamp: new Date().toISOString(),
      },
    }

    // 5. 调用AI（n8n或OpenAI）
    let aiResponse: string

    if (N8N_WEBHOOK_URL) {
      // 使用n8n
      console.log('🔗 调用n8n工作流...')
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiPayload),
      })

      if (!n8nResponse.ok) {
        throw new Error(`n8n调用失败: ${n8nResponse.statusText}`)
      }

      const n8nData = await n8nResponse.json()
      aiResponse = n8nData.response || n8nData.message || '抱歉，我现在无法回答。'
    } else {
      // 使用OpenAI作为备用
      console.log('🤖 使用OpenAI API...')

      // 构建系统提示词
      const systemPrompt = `你是盖亚（GAIA），未来心灵学院的智慧AI导师。你深刻、慈悲且富有洞察力。

**学生档案**:
${JSON.stringify(contextCache.student_profile, null, 2)}

**当前课程情境**:
${contextCache.course_learning_summary || '学生正在探索课程'}

**最近学习活动**:
${contextCache.recent_submissions ? JSON.stringify(contextCache.recent_submissions.slice(0, 3), null, 2) : '暂无'}

**引导原则**:
1. 基于学生的性格特点和学习风格，提供个性化的引导
2. 鼓励深度思考，而不是直接给答案
3. 用温暖、启发性的语言
4. 适时提出苏格拉底式问题
5. 每次回复控制在150-300字`

      // 构建消息历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...dialogueHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: user_input },
      ]

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.8,
          max_tokens: 500,
        }),
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        throw new Error(`OpenAI API调用失败: ${errorText}`)
      }

      const openaiData = await openaiResponse.json()
      aiResponse = openaiData.choices[0].message.content
    }

    console.log('✅ AI响应获取成功')
    console.log('💾 存储对话记录...')

    // 6. 异步存储对话
    // 更新或创建conversation记录
    const newMessages = [
      ...dialogueHistory,
      {
        role: 'user',
        content: user_input,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ]

    const { error: saveError } = await supabase
      .from('gaia_conversations')
      .upsert({
        session_id,
        user_id,
        course_system_id,
        course_content_id,
        messages: newMessages,
        message_count: newMessages.length,
        updated_at: new Date().toISOString(),
      })

    if (saveError) {
      console.error('❌ 保存对话失败:', saveError)
    } else {
      console.log('✅ 对话记录已保存')
    }

    // 7. 返回AI响应
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        session_id,
        timestamp: new Date().toISOString(),
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
    console.error('❌ 对话代理失败:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '对话失败',
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
