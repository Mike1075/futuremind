// @ts-nocheck
// TODO: 移除 @ts-nocheck，修复类型错误（见审查报告）
import { NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth, errorResponse, validateParams } from '@/lib/api-utils'
import { isDev } from '@/lib/env'
import type { GaiaMessage } from '@/lib/supabase/database.types'
import type { Json } from '@/types/database'

// CQ-02: 定义对话记录类型（匹配数据库schema）
interface GaiaConversation {
  id: string
  user_id: string | null
  session_id?: string
  messages: GaiaMessage[] | unknown
  title: string | null
  is_active: boolean | null
  message_count: number | null
  updated_at?: string | null
  created_at?: string | null
}

/**
 * POST /api/gaia/chat
 * 全局盖亚对话API - 支持流式输出
 *
 * Body参数:
 * - message: 用户消息
 * - conversationId: 可选，现有对话ID
 */
async function handleGaiaChat(req: NextRequest): Promise<Response> {
  try {
    const startTime = Date.now()
    logger.info('Gaia chat request started')

    // 获取N8N Webhook URL（不使用硬编码）
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL

    if (!N8N_CHAT_WEBHOOK) {
      logger.error('N8N chat webhook URL not configured')
      return errorResponse('Service configuration error', undefined, 503)
    }

    // 权限验证
    const auth = await requireAuth(req)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth

    // 解析和验证请求参数
    const body = await req.json()
    const { message, conversationId, currentMessages } = body

    logger.debug('Request parsed', {
      elapsed: `${Date.now() - startTime}ms`,
      userId: user.id
    })

    const validation = validateParams(body, {
      message: {
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 5000
      }
    })

    if (!validation.valid) {
      return validation.response!
    }

    const userId = user.id

    // 1. 查找或创建用户的全局对话记录
    // CQ-02: 使用明确类型替代any
    let conversation: GaiaConversation | null = null
    let isNewConversation = false

    if (conversationId) {
      const { data } = await supabase
        .from('gaia_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()

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
        .maybeSingle()

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
          logger.error('Failed to create conversation', createError)
          return errorResponse('Failed to create conversation', createError, 500)
        }

        conversation = newConv
        isNewConversation = true
      }
    }

    // 2. 获取历史消息
    // CQ-02: 使用GaiaMessage类型
    let conversationHistory: GaiaMessage[] = []

    if (currentMessages && Array.isArray(currentMessages) && currentMessages.length > 0) {
      conversationHistory = currentMessages as GaiaMessage[]
    } else {
      conversationHistory = (conversation?.messages || []) as GaiaMessage[]
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
      .maybeSingle()

    const userName = profileData?.full_name || profileData?.email?.split('@')[0] || '用户'
    logger.debug('User profile loaded', { userName, userId })

    // ============================================
    // 5. 获取学生画像和对话摘要
    // ============================================
    const { data: studentSummary } = await supabase
      .from('student_summaries')
      .select(`
        personality_traits,
        learning_style,
        strengths,
        areas_for_growth,
        course_summaries,
        messages_since_last_summary,
        generated_at
      `)
      .eq('user_id', userId)
      .maybeSingle()

    // 提取对话摘要
    // CQ-02: 安全访问Json类型的嵌套属性
    const courseSummaries = studentSummary?.course_summaries as Record<string, { dialogue?: { summary?: string } }> | null
    const dialogueSummary = courseSummaries?.default?.dialogue?.summary || ''

    // 构建学生画像字符串
    const studentProfile = studentSummary ? `
性格特点：${studentSummary.personality_traits ? JSON.stringify(studentSummary.personality_traits) : '暂未分析'}
学习风格：${studentSummary.learning_style || '暂未分析'}
优势领域：${Array.isArray(studentSummary.strengths) ? studentSummary.strengths.join('、') : '暂未分析'}
成长空间：${Array.isArray(studentSummary.areas_for_growth) ? studentSummary.areas_for_growth.join('、') : '暂未分析'}
`.trim() : ''

    logger.debug('Student summary loaded', {
      hasProfile: !!studentProfile,
      hasDialogueSummary: !!dialogueSummary,
      messagesSinceLastSummary: studentSummary?.messages_since_last_summary || 0
    })

    // ============================================
    // 6. 检查是否需要更新摘要（事件驱动）
    // ============================================
    const shouldUpdate = evaluateShouldUpdate(studentSummary)
    if (shouldUpdate) {
      // 异步触发更新，不阻塞当前对话
      triggerAsyncSummaryUpdate(userId)
      logger.info('Async summary update triggered', { userId })
    }

    // 7. 准备发送给N8N的数据
    const defaultProjectId = process.env.DEFAULT_PROJECT_ID || 'p001'
    const defaultOrganizationId = process.env.DEFAULT_ORGANIZATION_ID || 'd03b6947-f08d-41bd-86c0-c92c3c4630b0'

    const payload = {
      chatInput: message,
      session_id: conversation?.session_id || conversation?.id,
      user_id: userId,
      user_name: userName,
      user_email: profileData?.email || user.email,
      project_id: defaultProjectId,
      organization_id: defaultOrganizationId,
      // CQ-02: 使用GaiaMessage类型
      conversation_history: conversationHistory.slice(-5).map((m: GaiaMessage) => ({
        role: m.role,
        content: m.content
      })),

      // 学生画像（用于因材施教）
      student_profile: studentProfile,

      // 对话行为摘要（用于了解学生）
      dialogue_summary: dialogueSummary
    }

    logger.debug('Database operations completed', {
      elapsed: `${Date.now() - startTime}ms`
    })

    logger.debug('Calling N8N webhook', {
      url: N8N_CHAT_WEBHOOK.substring(0, 50) + '...',
      sessionId: payload.session_id,
      historyLength: payload.conversation_history.length,
      payloadSize: JSON.stringify(payload).length
    })

    // 5. 调用N8N获取流式响应（添加60秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    let n8nRes: Response
    try {
      const n8nFetchStart = Date.now()
      logger.info('N8N request started')

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

      logger.info('N8N response received', {
        elapsed: `${Date.now() - startTime}ms`,
        n8nDuration: `${Date.now() - n8nFetchStart}ms`,
        status: n8nRes.status
      })

      if (!n8nRes.ok) {
        const errorText = await n8nRes.text()
        logger.error('N8N request failed', undefined, {
          status: n8nRes.status,
          errorText: errorText.substring(0, 200)
        })
        return errorResponse('Failed to get response from Gaia', undefined, 502)
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        logger.error('N8N request timeout (60s)')
        return errorResponse('Request timeout', undefined, 504)
      }
      throw error
    }

    // 🔥 复用 AIP 的成功方案：一次性读取完整响应，然后解析
    const responseText = await n8nRes.text()

    logger.info('[gaia-chat] N8N raw response', {
      length: responseText.length,
      preview: responseText.substring(0, 500)
    })

    let fullContent = ''

    // 🔥 方法1：尝试解析为单个 JSON 对象（streaming 关闭时）
    try {
      let json = JSON.parse(responseText)

      // 如果 N8N 返回数组，取第一个元素
      if (Array.isArray(json)) {
        logger.info('[gaia-chat] N8N returned array', { arrayLength: json.length })
        json = json[0] || {}
      }

      logger.info('[gaia-chat] Parsed JSON', {
        keys: Object.keys(json),
        hasText: !!json.text,
        hasOutput: !!json.output,
        hasAiContent: !!json.ai_content,
        hasContent: !!json.content
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
      logger.info('[gaia-chat] Single JSON parse FAILED, trying NDJSON', {
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

    // 如果没有内容，返回友好的错误消息
    if (!finalReply) {
      // 只在开发环境中记录详细调试信息
      if (isDev()) {
        logger.error('[gaia-chat] No content extracted', {
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 300)
        })
      } else {
        logger.error('[gaia-chat] No content extracted', {
          responseLength: responseText.length
        })
      }
      finalReply = '抱歉，我现在无法回应。请稍后再试。'
    }

    logger.info('[gaia-chat] Final reply ready - v2', { length: finalReply.length, preview: finalReply.substring(0, 100) })

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
          conversationId: conversation?.id,
          timestamp: new Date().toISOString()
        }) + '\n'
        controller.enqueue(new TextEncoder().encode(doneData))
        controller.close()
      }
    })

    // 🔥 保存到数据库（在返回响应前）
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
        messages: finalMessages as unknown as Json,
        message_count: finalMessages.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation?.id)

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    logger.error('Gaia chat request failed', error)
    return errorResponse('Internal server error', error, 500)
  }
}

// 导出包装了Rate Limiting的处理器
export const POST = withRateLimit(
  handleGaiaChat,
  rateLimitConfigs.chat
)

// ============================================
// 辅助函数：判断是否需要更新摘要
// ============================================
interface StudentSummaryData {
  messages_since_last_summary?: number | null
  generated_at?: string | null
}

function evaluateShouldUpdate(summary: StudentSummaryData | null): boolean {
  // 没有摘要记录，新用户暂时不更新（等积累数据）
  if (!summary) return false

  const messageCount = summary.messages_since_last_summary || 0
  const lastUpdate = summary.generated_at ? new Date(summary.generated_at) : null
  const daysSinceUpdate = lastUpdate
    ? (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity

  // 阈值判断
  if (messageCount >= 10) return true           // 消息量大，需要更新
  if (daysSinceUpdate >= 7 && messageCount >= 3) return true  // 中频用户
  if (daysSinceUpdate >= 30 && messageCount >= 1) return true // 兜底

  return false
}

// ============================================
// 辅助函数：异步触发摘要更新
// ============================================
function triggerAsyncSummaryUpdate(userId: string): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('Missing Supabase credentials for async summary update')
    return
  }

  // 调用 summarize-user-activity 边缘函数
  // 使用 fetch 异步调用，不等待结果
  fetch(`${supabaseUrl}/functions/v1/summarize-user-activity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({
      userId: userId,
      dimensions: ['dialogue', 'coursework', 'projects']
    })
  }).catch(err => {
    logger.error('Async summary update failed', err)
  })
}
