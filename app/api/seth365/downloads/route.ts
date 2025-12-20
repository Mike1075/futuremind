import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: 获取所有激活的下载链接（公开）
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('app_downloads')
    .select('platform, version, download_url, release_notes, updated_at')
    .eq('is_active', true)
    .order('platform')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: 添加或更新下载链接（仅校长）
export async function POST(request: Request) {
  const supabase = await createClient()

  // 验证用户身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 验证是否为校长
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'principal') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const body = await request.json()
  const { platform, version, download_url, release_notes } = body

  if (!platform || !version) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
  }

  // 将旧版本设为非激活
  await supabase
    .from('app_downloads')
    .update({ is_active: false })
    .eq('platform', platform)
    .eq('is_active', true)

  // 插入新版本
  const { data, error } = await supabase
    .from('app_downloads')
    .insert({
      platform,
      version,
      download_url: download_url || null,
      release_notes: release_notes || null,
      is_active: true,
      uploaded_by: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE: 删除下载链接（仅校长）
export async function DELETE(request: Request) {
  const supabase = await createClient()

  // 验证用户身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 验证是否为校长
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'principal') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')

  if (!platform) {
    return NextResponse.json({ error: '缺少platform参数' }, { status: 400 })
  }

  const { error } = await supabase
    .from('app_downloads')
    .update({ is_active: false })
    .eq('platform', platform)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
