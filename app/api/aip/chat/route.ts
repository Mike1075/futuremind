import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[AIP Chat] 未授权访问')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[AIP Chat] 用户:', user.id, user.email)

    const body = await request.json()
    const { chatInput, project_id, organization_id } = body

    console.log('[AIP Chat] 请求参数:', {
      chatInput: chatInput?.substring(0, 100) + (chatInput?.length > 100 ? '...' : ''),
      project_id,
      organization_id,
      user_id: user.id
    })

    if (!chatInput) {
      console.error('[AIP Chat] 缺少chatInput参数')
      return NextResponse.json({ error: 'Missing chatInput' }, { status: 400 })
    }

    // N8N webhook URL - 使用生产环境
    const webhookUrl = 'https://n8n.aifunbox.com/webhook/c3585e19-255f-48ed-a481-b0c4d1c748ac'

    // 处理project_id：支持单个或多个项目
    // 如果是数组，转换为逗号分隔的字符串，方便N8N处理
    let projectIdValue = ''
    let projectIdsArray: string[] = []

    if (project_id) {
      if (Array.isArray(project_id)) {
        projectIdsArray = project_id.filter(id => id) // 过滤掉空值
        projectIdValue = projectIdsArray.join(',')
      } else {
        projectIdValue = project_id
        projectIdsArray = [project_id]
      }
    }

    const n8nPayload = {
      chatInput,
      user_id: user.id,
      project_id: projectIdValue,  // 单个ID或逗号分隔的多个ID
      project_ids: projectIdsArray, // 同时提供数组形式，供N8N选择使用
      organization_id: organization_id || ''
    }

    console.log('[AIP Chat] 调用N8N webhook:', webhookUrl)
    console.log('[AIP Chat] N8N payload:', JSON.stringify(n8nPayload, null, 2))

    const n8nStartTime = Date.now()
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(n8nPayload)
    })

    const n8nDuration = Date.now() - n8nStartTime
    console.log('[AIP Chat] N8N响应时间:', n8nDuration, 'ms')
    console.log('[AIP Chat] N8N响应状态:', n8nResponse.status, n8nResponse.statusText)

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('[AIP Chat] N8N webhook失败:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText
      })

      // 特殊处理404错误 - webhook未注册
      if (n8nResponse.status === 404) {
        let errorMessage = 'N8N webhook未注册或已过期'
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.hint) {
            errorMessage += `\n提示: ${errorData.hint}`
          }
        } catch {}
        throw new Error(`N8N webhook 404错误: ${errorMessage}`)
      }

      throw new Error(`N8N webhook失败 (${n8nResponse.status}): ${errorText}`)
    }

    // 🔥 创建流式响应并转发给前端
    const stream = new ReadableStream({
      async start(controller) {
        const reader = n8nResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        if (!reader) {
          controller.close()
          return
        }

        try {
          let firstChunkReceived = false
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
                    console.log(`[AIP Chat] ⏱️  首个chunk到达: +${Date.now() - startTime}ms`)
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

          // 🔥 流结束后，保存到数据库
          const finalReply = fullContent
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim() || '抱歉，我现在无法回应。请稍后再试。'

          console.log('[AIP Chat] AI响应内容:', finalReply.substring(0, 200))

          // 保存聊天记录到数据库
          console.log('[AIP Chat] 开始保存聊天记录到数据库...')
          const { error: dbError } = await supabase.from('chat_history').insert({
            user_id: user.id,
            content: chatInput,
            role: 'user',
            agent_type: 'member',
            project_id: projectIdsArray[0] || null,
            ai_content: finalReply,
            metadata: {
              organization_id,
              project_ids: projectIdsArray,
              project_count: projectIdsArray.length
            }
          })

          if (dbError) {
            console.error('[AIP Chat] 保存聊天记录失败:', dbError)
          } else {
            console.log('[AIP Chat] 聊天记录保存成功')
          }

          const totalDuration = Date.now() - startTime
          console.log('[AIP Chat] 总处理时间:', totalDuration, 'ms')

          // 发送完成标记
          const doneData = JSON.stringify({
            type: 'done',
            timestamp: new Date().toISOString()
          }) + '\n'

          controller.enqueue(new TextEncoder().encode(doneData))
          controller.close()
        } catch (error) {
          console.error('[AIP Chat] Stream error:', error)
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
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[AIP Chat] ❌ 处理失败 (耗时', totalDuration, 'ms):', error)
    console.error('[AIP Chat] 错误堆栈:', error.stack)

    return NextResponse.json(
      {
        error: 'Failed to process chat',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
