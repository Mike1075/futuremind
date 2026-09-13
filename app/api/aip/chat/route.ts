// @ts-nocheck
// TODO: 移除 @ts-nocheck，修复类型错误（见审查报告）
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth, errorResponse, validateParams } from '@/lib/api-utils'
import { generateAipReply } from '@/lib/aip/native'

// 检索 + LLM 全在这个请求里完成，给足执行时间
export const maxDuration = 60

async function handleChatRequest(request: NextRequest): Promise<Response> {
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  try {
    // 1. 权限验证
    const authStart = Date.now()
    const auth = await requireAuth(request)
    timings.auth = Date.now() - authStart

    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth
    logger.info('Chat request received', { userId: user.id, authTime: `${timings.auth}ms` })

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

    // 3. 处理project_id：支持单个或多个项目
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
    const dbStart = Date.now()

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

    timings.db = Date.now() - dbStart

    const chatHistory = chatHistoryResult.data
    const studentSummary = studentSummaryResult.data
    const userProfile = profileResult.data
    const projectsInfo = projectInfoResult.data || []

    logger.info('DB queries completed', { dbTime: `${timings.db}ms` })

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

    // 生成回复（检索项目知识库 + 智慧库 + 调用 LLM，原先由 N8N 承担）
    const llmStartTime = Date.now()
    let fullContent = ''

    try {
      fullContent = await generateAipReply(supabase, {
        userName,
        studentProfile: studentProfileText,
        projectsInfo: projectsInfoText,
        history: historyMessages,
        message: chatInput,
        projectIds: projectIdsArray,
        organizationId: organization_id || undefined
      })
    } catch (error) {
      logger.error('[aip-chat] 生成回复失败', error)
      return errorResponse('AI service error', undefined, 502)
    }

    const llmDuration = Date.now() - llmStartTime

    logger.debug('Extracted content', {
      contentLength: fullContent.length,
      preview: fullContent.substring(0, 100)
    })

    // 清理格式
    let finalReply = fullContent
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim()

    // 如果没有内容，返回友好的错误消息
    if (!finalReply) {
      logger.error('[aip-chat] 模型返回内容为空')
      finalReply = '抱歉，我现在无法回应，请稍后再试。'
    }

    timings.llm = llmDuration
    timings.total = Date.now() - startTime

    logger.info('AI response completed', {
      responseLength: finalReply.length,
      timings: {
        auth: `${timings.auth}ms`,
        db: `${timings.db}ms`,
        llm: `${timings.llm}ms`,
        total: `${timings.total}ms`,
        overhead: `${timings.total - timings.llm}ms`
      }
    })

    // 🔥 修复：先保存聊天记录到数据库（同步等待），再返回响应
    // 这样可以确保用户导航离开页面前数据已保存
    const saveStart = Date.now()
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

    const saveTime = Date.now() - saveStart
    if (dbError) {
      logger.error('Failed to save chat history', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        saveTime: `${saveTime}ms`
      })
    } else {
      logger.info('Chat history saved successfully', { saveTime: `${saveTime}ms` })
    }

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

        // 发送完成标记（包含服务端计时信息）
        const doneData = JSON.stringify({
          type: 'done',
          timestamp: new Date().toISOString(),
          serverTimings: {
            auth: timings.auth,
            db: timings.db,
            llm: timings.llm,
            total: timings.total,
            dbSave: saveTime
          }
        }) + '\n'
        controller.enqueue(new TextEncoder().encode(doneData))
        controller.close()
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
