import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 验证用户身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { selectionId, dayKey } = await request.json()

    if (!selectionId || !dayKey) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 获取当前进度
    const { data: selection, error: fetchError } = await supabase
      .from('user_selected_projects')
      .select('progress, user_id')
      .eq('id', selectionId)
      .single()

    if (fetchError || !selection) {
      return NextResponse.json({ error: '找不到项目记录' }, { status: 404 })
    }

    // 验证是否是用户自己的项目
    if (selection.user_id !== user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 })
    }

    // 移除该天的进度
    const progress = selection.progress || {}
    delete progress[dayKey]

    // 更新进度
    const { error: updateError } = await supabase
      .from('user_selected_projects')
      .update({ progress })
      .eq('id', selectionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: '清除进度失败' }, { status: 500 })
  }
}
