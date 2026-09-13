// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const UpdateItemSchema = z.object({
  module_id: z.string().uuid().optional(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  default_locale: z.string().optional(),
})

// SEC-01: 不在生产环境暴露错误详情
function err(status: number, message: string, internalError?: unknown) {
  if (internalError) {
    logger.error(`[CMS items/id] ${message}`, internalError)
  }
  const safeMessage = status >= 500 ? 'Internal server error' : message
  return NextResponse.json({ error: { code: status, message: safeMessage } }, { status })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getClient()
    const { id } = await params

    const { data: item, error } = await supabase
      .from('content_item')
      .select(`
        *,
        content_module:module_id (
          id,
          title,
          key
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return err(500, 'Failed to fetch item', error)
    }

    if (!item) {
      return err(404, 'Item not found')
    }

    return NextResponse.json({ data: item })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getClient()
    const { id } = await params

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return err(401, 'Unauthorized')

    const body = await req.json()
    const parsed = UpdateItemSchema.safeParse(body)
    if (!parsed.success) {
      return err(400, parsed.error.issues.map(i => i.message).join('; '))
    }

    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString()
    }

    const { data: item, error } = await supabase
      .from('content_item')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        content_module:module_id (
          id,
          title,
          key
        )
      `)
      .single()

    if (error) {
      return err(500, 'Failed to update item', error)
    }

    if (!item) {
      return err(404, 'Item not found')
    }

    return NextResponse.json({ data: item })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getClient()
    const { id } = await params

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return err(401, 'Unauthorized')

    // 首先检查条目是否存在
    const { data: existingItem, error: fetchError } = await supabase
      .from('content_item')
      .select('id, title, slug')
      .eq('id', id)
      .single()

    if (fetchError || !existingItem) {
      return err(404, 'Item not found')
    }

    // 删除条目
    const { error: deleteError } = await supabase
      .from('content_item')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return err(500, 'Failed to delete item', deleteError)
    }

    return NextResponse.json({
      message: 'Item deleted successfully',
      deleted_item: existingItem
    })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}
