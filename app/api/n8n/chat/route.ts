import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/79cbcc7c-fcff-4ab4-9a4e-c5a6f14b3024'

    // 获取登录用户（失败不阻塞，以便未登录也可体验对话）
    let userId: string | null = null
    try {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {}

    const { chatInput, session_id, user_id, project_id, organization_id } = await req.json()
    if (!chatInput) return NextResponse.json({ error: 'CHAT_INPUT_REQUIRED' }, { status: 400 })

    // 处理project_id：如果是数组，转换为JSON字符串
    let projectIdValue = ''
    if (project_id) {
      if (Array.isArray(project_id)) {
        projectIdValue = JSON.stringify(project_id)
      } else {
        projectIdValue = String(project_id)
      }
    }

    // 发送给 N8N 的 payload，包含完整的对话隔离字段
    const payload: Record<string, string> = {
      chatInput,
      session_id: session_id || crypto.randomUUID(),
      user_id: user_id || userId || 'guest',
      project_id: projectIdValue,
      organization_id: organization_id || '',
    }
    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[N8N Chat] 错误响应:', errorText)
      return NextResponse.json({ error: 'N8N_CHAT_FAILED', status: res.status, body: errorText }, { status: 502 })
    }

    // 🔥 创建真正的流式响应 - 边读边发送，不等待完整内容
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        if (!reader) {
          controller.close()
          return
        }

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

                  // 🔥 实时发送给前端（真正的流式输出）
                  const streamData = JSON.stringify({
                    type: 'chunk',
                    content: fullContent,
                    timestamp: new Date().toISOString()
                  }) + '\n'

                  controller.enqueue(new TextEncoder().encode(streamData))
                }
              } catch {
                // 继续处理下一行
              }
            }
          }

          // 发送完成标记
          const doneData = JSON.stringify({
            type: 'done',
            content: fullContent,
            timestamp: new Date().toISOString()
          }) + '\n'

          controller.enqueue(new TextEncoder().encode(doneData))
          controller.close()
        } catch (error) {
          console.error('[N8N Chat] Stream error:', error)
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
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
