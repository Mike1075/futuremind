// @ts-nocheck
/**
 * POST /api/submissions/delete
 * 删除自己的作业提交记录
 *
 * 历史背景：此功能原本直接调用 Supabase 边缘函数 delete-submission，
 * 但该函数部署时开启了 JWT 校验，Supabase 网关现已拒绝项目的 legacy JWT
 * （返回 401 UNAUTHORIZED_LEGACY_JWT），导致所有删除请求失败。
 * 现改为同域 API Route：服务端用会话 cookie 校验身份 + 归属，再用
 * Service Role 执行删除。顺带修掉旧实现里 user_id 由客户端传入的越权隐患，
 * 也规避微信浏览器直连边缘函数失败的问题。
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 验证用户登录（以服务端会话为准，不信任客户端传来的 user_id）
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录后再试' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const submissionId = body?.submission_id || body?.submissionId

    if (!submissionId) {
      return NextResponse.json({ error: '缺少必要参数：submission_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 2. 校验记录存在且归属当前用户
    const { data: submission, error: fetchError } = await admin
      .from('user_submissions')
      .select('id, user_id')
      .eq('id', submissionId)
      .maybeSingle()

    if (fetchError) {
      logger.error('[Submissions] 查询待删除作业失败', fetchError)
      return NextResponse.json({ error: '删除失败，请稍后重试' }, { status: 500 })
    }

    if (!submission) {
      return NextResponse.json({ error: '提交记录不存在' }, { status: 404 })
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: '只能删除自己的提交记录' }, { status: 403 })
    }

    // 3. 删除
    const { error: deleteError } = await admin
      .from('user_submissions')
      .delete()
      .eq('id', submissionId)
      .eq('user_id', user.id)

    if (deleteError) {
      logger.error('[Submissions] 删除作业失败', deleteError)
      return NextResponse.json({ error: '删除失败，请稍后重试' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '提交记录已删除' })

  } catch (error) {
    logger.error('[Submissions] delete error', error)
    return NextResponse.json({ error: '删除失败，请稍后重试' }, { status: 500 })
  }
}
