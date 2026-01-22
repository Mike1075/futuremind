// @ts-nocheck
/**
 * POST /api/submissions/evaluate
 * 作业评估 API 代理
 *
 * 此 API Route 作为边缘函数的代理，解决微信浏览器等环境
 * 直接调用 Supabase Edge Function 失败的问题。
 *
 * 客户端只需调用同域的 API，服务端负责调用边缘函数。
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAuth, errorResponse } from '@/lib/api-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// 边缘函数 URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 重试配置
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

/**
 * 带重试的 fetch 函数
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        // 设置较长的超时时间（边缘函数可能需要较长时间）
        signal: AbortSignal.timeout(60000) // 60秒超时
      })

      // 如果响应成功或是客户端错误（4xx），不重试
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // 服务端错误（5xx），记录并重试
      lastError = new Error(`Edge function returned ${response.status}`)
      logger.warn('Edge function call failed, retrying...', {
        attempt: attempt + 1,
        status: response.status
      })

    } catch (error) {
      lastError = error as Error
      logger.warn('Edge function network error, retrying...', {
        attempt: attempt + 1,
        error: lastError.message
      })
    }

    // 如果还有重试次数，等待后重试
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
    }
  }

  // 所有重试都失败
  throw lastError || new Error('All retries failed')
}

/**
 * POST /api/submissions/evaluate
 * 提交作业并获取 AI 评估
 */
async function handleEvaluateSubmission(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. 权限验证
    const auth = await requireAuth(req)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth

    // 2. 解析请求体
    let body: {
      content_id: string
      submission_content: string
      submission_type?: string
      is_public?: boolean
    }

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: '无效的请求格式' },
        { status: 400 }
      )
    }

    const { content_id, submission_content, submission_type = 'reflection', is_public = false } = body

    // 3. 参数验证
    if (!content_id || !submission_content) {
      return NextResponse.json(
        { error: '缺少必要参数：content_id, submission_content' },
        { status: 400 }
      )
    }

    if (submission_content.length < 10) {
      return NextResponse.json(
        { error: '作业内容至少需要10个字' },
        { status: 400 }
      )
    }

    logger.info('Evaluating submission via API proxy', {
      userId: user.id,
      contentId: content_id,
      contentLength: submission_content.length
    })

    // 4. 获取用户的 access token 用于调用边缘函数
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token

    if (!accessToken) {
      logger.error('No access token available')
      return NextResponse.json(
        { error: '会话已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 5. 调用边缘函数（带重试）
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/evaluate-submission`

    logger.debug('Calling edge function', { url: edgeFunctionUrl })

    const response = await fetchWithRetry(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify({
        user_id: user.id,
        content_id,
        submission_content,
        submission_type,
        is_public
      })
    })

    // 6. 解析边缘函数响应
    const responseData = await response.json()

    if (!response.ok) {
      logger.error('Edge function returned error', {
        status: response.status,
        error: responseData.error
      })

      // 返回边缘函数的错误消息
      return NextResponse.json(
        { error: responseData.error || '评估失败，请重试' },
        { status: response.status }
      )
    }

    const duration = Date.now() - startTime
    logger.info('Submission evaluated successfully', {
      duration: `${duration}ms`,
      score: responseData.evaluation?.score
    })

    // 7. 返回成功结果
    return NextResponse.json(responseData)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Submission evaluation failed', error, {
      duration: `${duration}ms`
    })

    // 根据错误类型返回友好的错误消息
    let errorMessage = '提交失败，请重试'

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = '请求超时，AI 导师可能正在忙碌，请稍后重试'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '网络连接不稳定，请检查网络后重试'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(handleEvaluateSubmission, rateLimitConfigs.api)
