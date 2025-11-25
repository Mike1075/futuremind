import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 验证管理员权限
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile?.role || !['principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { userId, amount } = await request.json()

    if (!userId || typeof amount !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    // 获取当前成长值（使用composite_score）
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('composite_score')
      .eq('id', userId)
      .single()

    const currentGrowth = Number(currentProfile?.composite_score) || 0
    const newGrowth = currentGrowth + amount

    // 更新成长值
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ composite_score: newGrowth })
      .eq('id', userId)

    if (updateError) {
      logger.error('[意识] 更新成长值失败', updateError)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newGrowth,
      message: `成功添加 ${amount} 成长值`
    })
  } catch (error) {
    logger.error('[意识] 添加成长值错误', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
