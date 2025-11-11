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

    // N8N 返回流式输出，需要读取流并组合所有 content 字段
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let rawText = ''

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          rawText += chunk

          // 尝试解析每个 chunk（可能包含多个 JSON 对象或换行分隔的 JSON）
          const lines = chunk.split('\n').filter(line => line.trim())
          for (const line of lines) {
            try {
              const json = JSON.parse(line)

              // 只处理 type: "item" 的流式数据
              if (json.type === 'item' && json.content) {
                // content 可能是纯文本，也可能是转义的 JSON 字符串
                const content = json.content

                // 尝试解析 content（可能包含 output 字段）
                try {
                  const innerJson = JSON.parse(content)
                  // 如果包含 output 字段，这是完整的最终回复
                  if (innerJson.output) {
                    fullContent = innerJson.output // 直接使用完整回复，覆盖之前的累积
                  }
                } catch {
                  // content 是纯文本，累加
                  fullContent += content
                }
              }
            } catch (e) {
              // 可能不是 JSON，或者是部分 JSON，继续
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    // 返回组合后的内容
    return NextResponse.json({
      reply: fullContent,
      content: fullContent
    })
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
