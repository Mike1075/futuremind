// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const UpdateVideoLinkSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  platform: z.enum(['youtube', 'bilibili', 'other']).optional(),
  description: z.string().optional(),
  module_id: z.string().uuid().optional(),
  item_id: z.string().uuid().optional(),
})

// SEC-01: 不在生产环境暴露错误详情
function err(status: number, message: string, internalError?: unknown) {
  if (internalError) {
    logger.error(`[CMS video-links/id] ${message}`, internalError)
  }
  const safeMessage = status >= 500 ? 'Internal server error' : message
  return NextResponse.json({ error: { code: status, message: safeMessage } }, { status })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()

    const { data: videoLink, error } = await admin
      .from('media_resources')
      .select(`
        *,
        content_module:module_id (
          id,
          title,
          key
        ),
        content_item:item_id (
          id,
          title,
          slug
        )
      `)
      .eq('id', params.id)
      .eq('resource_type', 'video_link')
      .single()

    if (error) {
      return err(500, 'Failed to fetch video link', error)
    }

    if (!videoLink) {
      return err(404, 'Video link not found')
    }

    return NextResponse.json({ data: videoLink })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return err(401, 'Unauthorized')

    const body = await req.json()
    const parsed = UpdateVideoLinkSchema.safeParse(body)
    if (!parsed.success) {
      return err(400, parsed.error.issues.map(i => i.message).join('; '))
    }

    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    const { data: videoLink, error } = await admin
      .from('media_resources')
      .update(updateData)
      .eq('id', params.id)
      .eq('resource_type', 'video_link')
      .select(`
        *,
        content_module:module_id (
          id,
          title,
          key
        ),
        content_item:item_id (
          id,
          title,
          slug
        )
      `)
      .single()

    if (error) {
      return err(500, 'Failed to update video link', error)
    }

    if (!videoLink) {
      return err(404, 'Video link not found')
    }

    return NextResponse.json({ data: videoLink })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return err(401, 'Unauthorized')

    // Check existence
    const { data: existingVideoLink, error: fetchError } = await admin
      .from('media_resources')
      .select('id, title, url')
      .eq('id', params.id)
      .eq('resource_type', 'video_link')
      .single()

    if (fetchError || !existingVideoLink) {
      return err(404, 'Video link not found')
    }

    // Delete
    const { error: deleteError } = await admin
      .from('media_resources')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return err(500, 'Failed to delete video link', deleteError)
    }

    return NextResponse.json({
      message: 'Video link deleted successfully',
      deleted_video_link: existingVideoLink,
    })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}
