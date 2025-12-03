// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // SEC-03: 不使用硬编码URL，必须通过环境变量配置
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
    if (!N8N_CHAT_WEBHOOK) {
      logger.error('[N8N Chat] N8N_CHAT_WEBHOOK_URL环境变量未配置')
      return NextResponse.json({ error: 'Service configuration error' }, { status: 503 })
    }

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

    logger.info('[N8N Chat] Sending request to N8N', { webhook: N8N_CHAT_WEBHOOK.substring(0, 50) })

    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      logger.error('[N8N Chat] 错误响应', { status: res.status, errorText: errorText.substring(0, 200) })
      return NextResponse.json({ error: 'N8N_CHAT_FAILED' }, { status: 502 })
    }

    // 🔥 复用 AIP 的成功方案：一次性读取完整响应，然后解析
    const responseText = await res.text()

    logger.info('[N8N Chat] Raw response', {
      length: responseText.length,
      preview: responseText.substring(0, 500)
    })

    let fullContent = ''

    // 🔥 方法1：尝试解析为单个 JSON 对象（streaming 关闭时）
    try {
      let json = JSON.parse(responseText)

      // 如果 N8N 返回数组，取第一个元素
      if (Array.isArray(json)) {
        logger.info('[N8N Chat] N8N returned array', { arrayLength: json.length })
        json = json[0] || {}
      }

      logger.info('[N8N Chat] Parsed JSON', {
        keys: Object.keys(json),
        hasText: !!json.text,
        hasOutput: !!json.output,
        hasAiContent: !!json.ai_content
      })

      if (json.text) {
        fullContent = json.text
      } else if (json.output) {
        fullContent = json.output
      } else if (json.ai_content) {
        fullContent = json.ai_content
      } else if (json.content) {
        fullContent = json.content
      }
    } catch (parseError) {
      // 🔥 方法2：尝试 NDJSON 格式（streaming 开启时）
      logger.info('[N8N Chat] Single JSON parse FAILED, trying NDJSON', {
        error: parseError instanceof Error ? parseError.message : String(parseError)
      })

      const lines = responseText.split('\n').filter(line => line.trim())
      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.type === 'item' && json.content) {
            try {
              const innerJson = JSON.parse(json.content)
              if (innerJson.text) fullContent = innerJson.text
              else if (innerJson.output) fullContent = innerJson.output
              else if (innerJson.ai_content) fullContent = innerJson.ai_content
            } catch {
              fullContent += json.content
            }
          } else if (json.text && json.type !== 'begin' && json.type !== 'done') {
            fullContent = json.text
          } else if (json.output) {
            fullContent = json.output
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 清理格式
    let finalReply = fullContent
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim()

    // 如果没有内容，返回调试信息
    if (!finalReply) {
      logger.error('[N8N Chat] No content extracted', {
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 300)
      })
      finalReply = '抱歉，我现在无法回应。请稍后再试。'
    }

    logger.info('[N8N Chat] Final reply ready', { length: finalReply.length })

    // 🔥 创建流式响应（前端打字机效果）
    const stream = new ReadableStream({
      start(controller) {
        // 发送内容
        const chunkData = JSON.stringify({
          type: 'chunk',
          content: finalReply,
          timestamp: new Date().toISOString()
        }) + '\n'
        controller.enqueue(new TextEncoder().encode(chunkData))

        // 发送完成标记
        const doneData = JSON.stringify({
          type: 'done',
          timestamp: new Date().toISOString()
        }) + '\n'
        controller.enqueue(new TextEncoder().encode(doneData))
        controller.close()
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
    logger.error('[N8N Chat] Internal error', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
