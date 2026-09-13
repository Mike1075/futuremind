// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()

    const { data: project, error } = await admin
      .from('pbl_projects')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      logger.error('获取项目失败', error)
      return NextResponse.json({ error: '获取项目失败' }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    logger.error('API错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, max_participants, status } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
    }

    if (max_participants !== undefined) {
      updateData.max_participants = max_participants
    }

    if (status && ['active', 'completed', 'paused'].includes(status)) {
      updateData.status = status
    }

    // 使用管理员client更新数据
    const { data: project, error } = await admin
      .from('pbl_projects')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('更新项目失败', error)
      return NextResponse.json({ error: '更新项目失败' }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    logger.error('API错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 使用管理员client删除数据
    const { error } = await admin
      .from('pbl_projects')
      .delete()
      .eq('id', params.id)

    if (error) {
      logger.error('删除项目失败', error)
      return NextResponse.json({ error: '删除项目失败' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    logger.error('API错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
