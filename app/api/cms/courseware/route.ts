// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const CoursewareSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  module_id: z.string().uuid(),
  item_id: z.string().uuid(),
  file_url: z.string().url(),
  file_type: z.enum(['pdf', 'doc', 'ppt', 'txt', 'other']).default('other'),
})

// SEC-01: 不在生产环境暴露错误详情
function err(status: number, message: string, internalError?: unknown) {
  if (internalError) {
    logger.error(`[CMS courseware] ${message}`, internalError)
  }
  const safeMessage = status >= 500 ? 'Internal server error' : message
  return NextResponse.json({ error: { code: status, message: safeMessage } }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const moduleId = req.nextUrl.searchParams.get('module')
    const itemId = req.nextUrl.searchParams.get('item')

    let query = admin
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
      .eq('resource_type', 'courseware')
      .order('created_at', { ascending: false })

    if (moduleId) query = query.eq('module_id', moduleId)
    if (itemId) query = query.eq('item_id', itemId)

    const { data, error } = await query

    if (error) {
      return err(500, 'Failed to fetch courseware', error)
    }

    return NextResponse.json({ data: data || [] })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const supabase = await getClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return err(401, 'Unauthorized')

    const body = await req.json()
    const parsed = CoursewareSchema.safeParse(body)
    if (!parsed.success) {
      return err(400, parsed.error.issues.map(i => i.message).join('; '))
    }

    const { title, description, module_id, item_id, file_url, file_type } = parsed.data

    const insertData = {
      title,
      description: description ?? null,
      module_id,
      item_id,
      url: file_url,
      resource_type: 'courseware',
      meta: {
        file_type,
      },
      created_by: user.id,
    }

    const { data: courseware, error } = await admin
      .from('media_resources')
      .insert(insertData)
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
      return err(500, 'Failed to create courseware', error)
    }

    // Fire N8N webhook if configured
    const webhook = process.env.N8N_UPLOAD_WEBHOOK
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'courseware.created',
            data: courseware,
          }),
        })
      } catch (e) {
        logger.warn('[CMS] N8N webhook调用失败 (courseware.created)', e)
      }
    }

    return NextResponse.json({ data: courseware }, { status: 201 })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}
