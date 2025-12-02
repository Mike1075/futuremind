// @ts-nocheck
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

    // 并行查询：聊天历史 + 用户画像 + 项目信息
    // 🔥 修复：按项目过滤聊天历史，避免不同项目的知识库内容互相污染
    logger.dbQuery('chat_history + student_summaries + project_info', 'SELECT')

    // 构建聊天历史查询（按项目过滤）
    let chatHistoryQuery = supabase
      .from('chat_history')
      .select('content, ai_content, created_at, project_id')
      .eq('user_id', user.id)
      .eq('agent_type', 'member')
      .order('created_at', { ascending: false })
      .limit(10)

    // 如果选择了项目，只加载这些项目相关的历史对话
    if (projectIdsArray.length > 0) {
      chatHistoryQuery = chatHistoryQuery.in('project_id', projectIdsArray)
    }

    // 构建项目信息查询（支持多个项目）
    const projectInfoQuery = projectIdsArray.length > 0
      ? supabase
          .from('projects')
          .select('id, name, description')
          .in('id', projectIdsArray)
      : Promise.resolve({ data: [] })

    const [chatHistoryResult, studentSummaryResult, profileResult, projectInfoResult] = await Promise.all([
      chatHistoryQuery,
      supabase
        .from('student_summaries')
        .select('personality_traits, learning_style, strengths, areas_for_growth')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle(),
      projectInfoQuery
    ])

    const chatHistory = chatHistoryResult.data
    const studentSummary = studentSummaryResult.data
    const userProfile = profileResult.data
    const projectsInfo = projectInfoResult.data || []

    // 构建用户画像字符串（来自盖亚的分析）
    const studentProfileText = studentSummary ? `
用户画像（由盖亚分析生成）：
- 性格特点：${studentSummary.personality_traits ? JSON.stringify(studentSummary.personality_traits) : '暂未分析'}
- 学习风格：${studentSummary.learning_style || '暂未分析'}
- 优势领域：${Array.isArray(studentSummary.strengths) ? studentSummary.strengths.join('、') : '暂未分析'}
- 成长空间：${Array.isArray(studentSummary.areas_for_growth) ? studentSummary.areas_for_growth.join('、') : '暂未分析'}
`.trim() : ''

    // 构建历史消息数组（从旧到新排序）
    const historyMessages = (chatHistory || [])
      .reverse()
      .flatMap(record => [
        { role: 'user', content: record.content },
        { role: 'assistant', content: record.ai_content }
      ])

    logger.debug('Chat history loaded', {
      historyCount: chatHistory?.length || 0,
      messagesCount: historyMessages.length
    })

    const userName = userProfile?.full_name || userProfile?.email?.split('@')[0] || '探索者'

    // 构建项目信息文本（支持多个项目）
    let projectsInfoText = ''
    if (projectsInfo.length === 1) {
      // 单个项目
      projectsInfoText = `项目名称：${projectsInfo[0].name || '未命名项目'}\n项目简介：${projectsInfo[0].description || '暂无简介'}`
    } else if (projectsInfo.length > 1) {
      // 多个项目
      projectsInfoText = projectsInfo.map((p: any, i: number) =>
        `【项目${i + 1}】${p.name || '未命名项目'}\n简介：${p.description || '暂无简介'}`
      ).join('\n\n')
    }

    const n8nPayload = {
      chatInput,
      user_id: user.id,
      user_name: userName,
      project_id: projectIdValue,
      project_ids: projectIdsArray,
      organization_id: organization_id || '',
      // 添加项目信息（支持多个项目）
      projects_info: projectsInfoText,
      project_count: projectsInfo.length,
      // 添加历史消息供N8N使用
      chat_history: historyMessages,
      // 添加用户画像（来自盖亚的分析）
      student_profile: studentProfileText
    }

    // 🔥 打印完整的 Webhook URL（用于调试）
    logger.info('Calling N8N webhook', {
      fullUrl: webhookUrl,
      payloadSize: JSON.stringify(n8nPayload).length,
      payloadKeys: Object.keys(n8nPayload)
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

      // 🔥 详细日志：打印所有响应头
      const responseHeaders: Record<string, string> = {}
      n8nResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      logger.info('N8N response details', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        duration: `${n8nDuration}ms`,
        headers: responseHeaders,
        url: n8nResponse.url,
        redirected: n8nResponse.redirected,
        type: n8nResponse.type
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

    // 🔥 读取完整响应
    const responseText = await n8nResponse.text()

    // 🔥 详细日志：显示完整的原始响应
    logger.info('N8N raw response FULL', {
      length: responseText.length,
      content: responseText.substring(0, 1000),
      firstChar: responseText.charCodeAt(0),
      lastChar: responseText.charCodeAt(responseText.length - 1)
    })

    let fullContent = ''

    // 🔥 方法1：尝试解析为单个 JSON 对象（streaming 关闭时）
    try {
      let json = JSON.parse(responseText)

      // 🔥 如果 N8N 返回数组，取第一个元素
      if (Array.isArray(json)) {
        logger.info('N8N returned array', { arrayLength: json.length })
        json = json[0] || {}
      }

      logger.info('Parsed JSON', {
        keys: Object.keys(json),
        hasAiContent: !!json.ai_content,
        hasText: !!json.text,
        hasOutput: !!json.output,
        hasContent: !!json.content
      })

      if (json.ai_content) {
        fullContent = json.ai_content
      } else if (json.text) {
        fullContent = json.text
      } else if (json.output) {
        fullContent = json.output
      } else if (json.content) {
        fullContent = json.content
      }
    } catch (parseError) {
      // 🔥 方法2：尝试 NDJSON 格式（streaming 开启时）
      logger.info('Single JSON parse FAILED, trying NDJSON', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: responseText.substring(0, 200)
      })
      const lines = responseText.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)

          // type: "item" 包含实际内容
          if (json.type === 'item' && json.content) {
            // content 可能是字符串或嵌套 JSON
            try {
              const innerJson = JSON.parse(json.content)
              if (innerJson.ai_content) {
                fullContent = innerJson.ai_content
              } else if (innerJson.text) {
                fullContent = innerJson.text
              } else if (innerJson.output) {
                fullContent = innerJson.output
              }
            } catch {
              // content 是纯文本
              fullContent += json.content
            }
          }
          // 也支持直接返回的格式
          else if (json.ai_content) {
            fullContent = json.ai_content
          } else if (json.text && json.type !== 'begin' && json.type !== 'done') {
            fullContent = json.text
          } else if (json.output) {
            fullContent = json.output
          }
        } catch {
          // 忽略解析错误，继续处理下一行
        }
      }
    }

    logger.debug('Extracted content', {
      contentLength: fullContent.length,
      preview: fullContent.substring(0, 100)
    })

    // 清理格式
    let finalReply = fullContent
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim()

    // 🔥 如果没有内容，返回调试信息
    if (!finalReply) {
      finalReply = `[调试] 解析失败。N8N响应长度: ${responseText.length}, 前200字符: ${responseText.substring(0, 200)}`
    }

    const totalDuration = Date.now() - startTime
    logger.info('AI response completed', {
      responseLength: finalReply.length,
      duration: `${totalDuration}ms`
    })

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

        // 异步保存聊天记录
        supabase.from('chat_history').insert({
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
        }).then(({ error: dbError }) => {
          if (dbError) {
            logger.error('Failed to save chat history', {
              code: dbError.code,
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint
            })
          } else {
            logger.info('Chat history saved successfully')
          }
        })
      }
    })

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
