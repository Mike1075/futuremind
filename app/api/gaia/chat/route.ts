import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/gaia/chat
 * 全局盖亚对话API - 统一的对话接口
 *
 * Body参数:
 * - message: 用户消息
 * - conversationId: 可选，现有对话ID
 */
export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/79cbcc7c-fcff-4ab4-9a4e-c5a6f14b3024'

    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId } = await req.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const userId = user.id

    // 1. 查找或创建用户的全局对话记录
    let conversation: any = null
    let isNewConversation = false

    if (conversationId) {
      // 尝试加载现有对话
      const { data } = await supabase
        .from('gaia_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      conversation = data
    }

    if (!conversation) {
      // 查找用户是否有活跃对话
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
        // 创建新对话
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
          return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
        }

        conversation = newConv
        isNewConversation = true
      }
    }

    // 2. 获取历史消息
    const conversationHistory = (conversation.messages as any[] || []) as Array<{
      role: string
      content: string
      timestamp: string
    }>

    // 3. 添加用户消息
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...conversationHistory, userMessage]

    // 4. 准备发送给N8N的数据
    // 使用全局默认的project_id和organization_id
    const defaultProjectId = process.env.DEFAULT_PROJECT_ID || 'p001' // 默认使用伊卡洛斯项目
    const defaultOrganizationId = process.env.DEFAULT_ORGANIZATION_ID || 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'

    const payload = {
      chatInput: message,
      session_id: conversation.session_id || conversation.id,
      user_id: userId,
      project_id: defaultProjectId,
      organization_id: defaultOrganizationId,
      conversation_history: conversationHistory.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    }

    console.log(`[Gaia Chat] 发送给N8N: conversation_id=${conversation.id}`)

    // 5. 调用N8N获取AI回复
    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Gaia Chat] N8N error:', errorText)
      return NextResponse.json({
        error: 'Failed to get response from Gaia',
        status: res.status
      }, { status: 502 })
    }

    // 6. 读取N8N的流式响应
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (reader) {
      try {
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
              }
            } catch {
              // 继续处理下一行
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    // 7. 添加助手消息
    const reply = fullContent || '抱歉，我现在无法回应。请稍后再试。'

    const assistantMessage = {
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString()
    }

    const finalMessages = [...updatedMessages, assistantMessage]

    // 8. 更新数据库
    const { error: updateError } = await supabase
      .from('gaia_conversations')
      .update({
        messages: finalMessages,
        message_count: finalMessages.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    if (updateError) {
      console.error('[Gaia Chat] Failed to update conversation:', updateError)
    }

    // 9. 返回回复
    return NextResponse.json({
      reply,
      conversationId: conversation.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gaia Chat] Internal error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
