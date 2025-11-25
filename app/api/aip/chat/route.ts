import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth, errorResponse, validateParams } from '@/lib/api-utils'

async function handleChatRequest(request: NextRequest): Promise<Response> {
  const startTime = Date.now()

  try {
    // 1. 权限验证
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth
    logger.info('Chat request received', { userId: user.id })

    // 2. 解析和验证请求参数
    const body = await request.json()
    const { chatInput, project_id, organization_id } = body

    const validation = validateParams(body, {
      chatInput: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 5000
      }
    })

    if (!validation.valid) {
      return validation.response!
    }

    logger.debug('Chat params', {
      chatInputLength: chatInput.length,
      projectId: project_id,
      organizationId: organization_id
    })

    // 3. 获取N8N Webhook URL（不使用硬编码）
    const webhookUrl = process.env.N8N_AIP_CHAT_WEBHOOK_URL

    if (!webhookUrl) {
      logger.error('N8N webhook URL not configured')
      return errorResponse('Service configuration error', undefined, 503)
    }

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
      project_id: projectIdValue,
      project_ids: projectIdsArray,
      organization_id: organization_id || ''
    }

    logger.debug('Calling N8N webhook', {
      url: webhookUrl.substring(0, 50) + '...',
      payloadSize: JSON.stringify(n8nPayload).length
    })

    const n8nStartTime = Date.now()

    // 添加超时控制
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // 60秒超时

    try {
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      })

      clearTimeout(timeout)

      const n8nDuration = Date.now() - n8nStartTime
      logger.info('N8N response received', {
        status: n8nResponse.status,
        duration: `${n8nDuration}ms`
      })

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        logger.error('N8N webhook failed', undefined, {
          status: n8nResponse.status,
          statusText: n8nResponse.statusText
        })

        if (n8nResponse.status === 404) {
          return errorResponse('AI service not available', undefined, 503)
        }

        return errorResponse('AI service error', undefined, 502)
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
                    logger.debug('First chunk received', {
                      elapsed: `${Date.now() - startTime}ms`
                    })
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

          logger.debug('AI response completed', {
            responseLength: finalReply.length
          })

          // 保存聊天记录到数据库
          logger.dbQuery('chat_history', 'INSERT')
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
            logger.error('Failed to save chat history', dbError)
          } else {
            logger.debug('Chat history saved successfully')
          }

          const totalDuration = Date.now() - startTime
          logger.info('Chat request completed', {
            duration: `${totalDuration}ms`
          })

          // 发送完成标记
          const doneData = JSON.stringify({
            type: 'done',
            timestamp: new Date().toISOString()
          }) + '\n'

          controller.enqueue(new TextEncoder().encode(doneData))
          controller.close()
        } catch (error) {
          logger.error('Stream processing error', error)
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
      clearTimeout(timeout)
      if (error.name === 'AbortError') {
        logger.error('N8N request timeout (60s)')
        return errorResponse('Request timeout', undefined, 504)
      }
      throw error
    }
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    logger.error('Chat request failed', error, {
      duration: `${totalDuration}ms`
    })

    return errorResponse('Failed to process chat', error, 500)
  }
}

// 导出包装了Rate Limiting的处理器
export const POST = withRateLimit(
  handleChatRequest,
  rateLimitConfigs.chat
)
