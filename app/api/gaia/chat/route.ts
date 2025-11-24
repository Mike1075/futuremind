import { NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/gaia/chat
 * 全局盖亚对话API - 支持流式输出
 *
 * Body参数:
 * - message: 用户消息
 * - conversationId: 可选，现有对话ID
 */
export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now()  // 🔥 开始计时
    console.log('[Gaia API] ⏱️  请求开始')

    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/79cbcc7c-fcff-4ab4-9a4e-c5a6f14b3024'

    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { message, conversationId, currentMessages } = await req.json()
    console.log(`[Gaia API] ⏱️  解析请求: +${Date.now() - startTime}ms`)

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id

    // 1. 查找或创建用户的全局对话记录
    let conversation: any = null
    let isNewConversation = false

    if (conversationId) {
      const { data } = await supabase
        .from('gaia_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      conversation = data
    }

    if (!conversation) {
      const { data } = await supabase
        .from('gaia_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      conversation = data

      if (!conversation) {
        const { data: newConv, error: createError } = await supabase
          .from('gaia_conversations')
          .insert({
            user_id: userId,
            messages: [],
            title: '新对话',
            is_active: true,
            message_count: 0
          })
          .select()
          .single()

        if (createError) {
          console.error('[Gaia Chat] Failed to create conversation:', createError)
          return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        conversation = newConv
        isNewConversation = true
      }
    }

    // 2. 获取历史消息
    let conversationHistory: Array<{
      role: string
      content: string
      timestamp: string
    }> = []

    if (currentMessages && Array.isArray(currentMessages) && currentMessages.length > 0) {
      conversationHistory = currentMessages
    } else {
      conversationHistory = (conversation.messages as any[] || []) as Array<{
        role: string
        content: string
        timestamp: string
      }>
    }

    // 3. 添加用户消息
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...conversationHistory, userMessage]

    // 4. 从profiles表获取用户姓名
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const userName = profileData?.full_name || profileData?.email?.split('@')[0] || '用户'
    console.log(`[Gaia API] 👤 用户姓名: ${userName} (来自profiles.full_name)`)

    // 5. 准备发送给N8N的数据
    const defaultProjectId = process.env.DEFAULT_PROJECT_ID || 'p001'
    const defaultOrganizationId = process.env.DEFAULT_ORGANIZATION_ID || 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'

    const payload = {
      chatInput: message,
      session_id: conversation.session_id || conversation.id,
      user_id: userId,
      user_name: userName,  // 🔥 添加用户姓名
      user_email: profileData?.email || user.email,  // 🔥 添加用户邮箱
      project_id: defaultProjectId,
      organization_id: defaultOrganizationId,
      conversation_history: conversationHistory.slice(-5).map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    }

    console.log(`[Gaia API] ⏱️  数据库操作完成: +${Date.now() - startTime}ms`)
    console.log(`[Gaia API] 📤 发送N8N请求: ${N8N_CHAT_WEBHOOK}`)
    console.log(`[Gaia API] 📊 Payload详情:`, {
      chatInput: message,
      session_id: payload.session_id,
      user_id: userId,
      conversation_history_length: payload.conversation_history.length,
      payload_size_bytes: JSON.stringify(payload).length
    })

    // 5. 调用N8N获取流式响应（添加60秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    let n8nRes: Response
    try {
      const n8nFetchStart = Date.now()
      console.log(`[Gaia API] 🚀 开始调用N8N...`)
      n8nRes = await fetch(N8N_CHAT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log(`[Gaia API] ⏱️  N8N响应到达: +${Date.now() - startTime}ms (N8N耗时: ${Date.now() - n8nFetchStart}ms)`)

      if (!n8nRes.ok) {
        const errorText = await n8nRes.text()
        console.error('[Gaia Chat] N8N error:', errorText)
        return new Response(JSON.stringify({
          error: 'Failed to get response from Gaia',
          status: n8nRes.status
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error('[Gaia API] ⏱️  N8N请求超时 (60秒)')
        return new Response(JSON.stringify({
          error: 'N8N request timeout (60s)'
        }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      throw error
    }

    // 6. 创建流式响应并转发给前端
    const stream = new ReadableStream({
      async start(controller) {
        const reader = n8nRes.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        if (!reader) {
          controller.close()
          return
        }

        try {
          let firstChunkReceived = false  // 🔥 追踪第一个chunk
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })

            // 解析每行JSON
            const lines = chunk.split('\n').filter(line => line.trim())
            for (const line of lines) {
              try {
                const json = JSON.parse(line)

                // 处理type: "item"的流式数据
                if (json.type === 'item' && json.content) {
                  if (!firstChunkReceived) {
                    console.log(`[Gaia API] ⏱️  首个chunk到达: +${Date.now() - startTime}ms`)
                    firstChunkReceived = true
                  }

                  const content = json.content

                  // 尝试解析content
                  try {
                    const innerJson = JSON.parse(content)
                    // 如果有output字段，使用完整回复
                    if (innerJson.output) {
                      fullContent = innerJson.output
                    }
                  } catch {
                    // content是纯文本，累加
                    fullContent += content
                  }

                  // 🔥 清理markdown格式：移除多余的星号
                  const cleanedContent = fullContent
                    .replace(/\*\*/g, '')  // 移除加粗标记 **
                    .replace(/\*/g, '')    // 移除斜体标记 *

                  // 🔥 实时发送给前端（流式输出）
                  const streamData = JSON.stringify({
                    type: 'chunk',
                    content: cleanedContent,
                    timestamp: new Date().toISOString()
                  }) + '\n'

                  controller.enqueue(new TextEncoder().encode(streamData))
                }
              } catch {
                // 继续处理下一行
              }
            }
          }

          // 7. 流结束后，保存到数据库
          // 🔥 清理最终内容
          const finalReply = fullContent
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim() || '抱歉，我现在无法回应。请稍后再试。'

          const assistantMessage = {
            role: 'assistant',
            content: finalReply,
            timestamp: new Date().toISOString()
          }

          const finalMessages = [...updatedMessages, assistantMessage]

          // 生成标题
          let title = conversation.title
          if (isNewConversation && finalMessages.length >= 2) {
            const firstUserMessage = finalMessages.find(m => m.role === 'user')
            if (firstUserMessage) {
              title = firstUserMessage.content.length > 30
                ? firstUserMessage.content.substring(0, 30) + '...'
                : firstUserMessage.content
            }
          }

          // 更新数据库
          await supabase
            .from('gaia_conversations')
            .update({
              title,
              messages: finalMessages,
              message_count: finalMessages.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id)

          // 发送完成标记
          const doneData = JSON.stringify({
            type: 'done',
            conversationId: conversation.id,
            timestamp: new Date().toISOString()
          }) + '\n'

          controller.enqueue(new TextEncoder().encode(doneData))
          controller.close()
        } catch (error) {
          console.error('[Gaia Chat] Stream error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('[Gaia Chat] Internal error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
