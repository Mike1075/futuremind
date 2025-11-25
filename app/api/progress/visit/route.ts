import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireAuth, errorResponse, validateParams } from '@/lib/api-utils'

/**
 * PUT /api/progress/visit
 * 记录用户访问课程内容
 *
 * Body参数:
 * - contentId: 课程内容ID
 */
async function handleRecordVisit(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // 权限验证
    const auth = await requireAuth(req)
    if (!auth.authorized) {
      return auth.response
    }

    const { user, supabase } = auth

    // 参数验证
    const body = await req.json()
    const validation = validateParams(body, {
      contentId: {
        required: true,
        type: 'string'
      }
    })

    if (!validation.valid) {
      return validation.response!
    }

    const { contentId } = body

    // 使用UPSERT：如果记录存在则更新时间，否则插入新记录
    logger.dbQuery('content_visit_records', 'UPSERT')
    const { error } = await supabase
      .from('content_visit_records')
      .upsert(
        {
          user_id: user.id,
          content_id: contentId,
          last_visited_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,content_id'
        }
      )

    if (error) {
      throw error
    }

    const duration = Date.now() - startTime
    logger.info('Visit recorded', {
      contentId,
      duration: `${duration}ms`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to record visit', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to record visit', error, 500)
  }
}

export const PUT = withRateLimit(handleRecordVisit, rateLimitConfigs.api)
