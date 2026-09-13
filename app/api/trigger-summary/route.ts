// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * 登录时触发总结和意识树计算
 *
 * 规则：
 * 1. 检查上次总结时间，如果距离现在 < 24小时，跳过
 * 2. 如果 >= 24小时，触发 generate-student-summary
 * 3. 总结完成后，触发 evaluate-and-grow-tree
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // CQ-03: 使用maybeSingle()检查上次总结时间（可能不存在）
    const { data: summary } = await supabase
      .from('student_summaries')
      .select('generated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    // 如果有总结且在24小时内，跳过
    if (summary?.generated_at) {
      const lastSummaryTime = new Date(summary.generated_at).getTime()
      const now = Date.now()
      const hoursSinceLastSummary = (now - lastSummaryTime) / (1000 * 60 * 60)

      if (hoursSinceLastSummary < 24) {
        return NextResponse.json({
          success: true,
          message: '总结仍在有效期内（24小时），无需重新生成',
          lastSummaryTime: summary.generated_at,
          hoursSinceLastSummary: hoursSinceLastSummary.toFixed(2)
        })
      }
    }

    // 获取 Supabase URL 和 service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // 调用 summarize-user-activity Edge Function
    logger.debug(`[触发总结] 用户 ${user.id} - 开始生成新总结`)

    const summaryResponse = await fetch(
      `${supabaseUrl}/functions/v1/summarize-user-activity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ userId: user.id })
      }
    )

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text()
      logger.error('[总结失败]', errorText)
      throw new Error(`总结生成失败: ${summaryResponse.status}`)
    }

    const summaryResult = await summaryResponse.json()
    logger.info('[总结成功]', summaryResult)

    // 调用 evaluate-and-grow-tree Edge Function
    logger.debug(`[触发计算] 用户 ${user.id} - 开始计算意识树`)

    const treeResponse = await fetch(
      `${supabaseUrl}/functions/v1/evaluate-and-grow-tree`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ userId: user.id })
      }
    )

    if (!treeResponse.ok) {
      const errorText = await treeResponse.text()
      logger.error('[计算失败]', errorText)
      throw new Error(`意识树计算失败: ${treeResponse.status}`)
    }

    const treeResult = await treeResponse.json()
    logger.info('[计算成功]', treeResult)

    return NextResponse.json({
      success: true,
      message: '总结和意识树计算已触发',
      summary: summaryResult,
      tree: treeResult
    })

  } catch (error: any) {
    logger.error('[API错误]', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? (error.message || 'Internal server error') : 'Internal server error' },
      { status: 500 }
    )
  }
}
