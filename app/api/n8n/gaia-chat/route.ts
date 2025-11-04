import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/n8n/gaia-chat
 * 盖亚对话API - 用于课程学习中的知识探讨
 *
 * Body参数:
 * - message: 用户消息
 * - history: 可选的对话历史记录
 * - context: 可选的上下文（知识点或问题）
 */
export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/79cbcc7c-fcff-4ab4-9a4e-c5a6f14b3024'

    // 获取登录用户
    let userId: string | null = null
    try {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // 忽略错误，允许未登录用户体验
    }

    const { message, history, context } = await req.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // 构建发送给N8N的消息
    let chatInput = message

    // 如果有上下文，将其添加到消息前
    if (context) {
      chatInput = `[上下文]\n${context}\n\n[用户消息]\n${message}`
    }

    // 发送给N8N
    const payload = {
      chatInput,
      session_id: crypto.randomUUID(), // 每次对话使用新的session
      user_id: userId || 'guest',
      project_id: 'gaia_learning', // 标识为学习对话
      organization_id: '',
    }

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

    // 读取N8N的流式响应
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

    // 返回盖亚的回复
    return NextResponse.json({
      reply: fullContent || '抱歉，我现在无法回应。请稍后再试。',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gaia Chat] Internal error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
