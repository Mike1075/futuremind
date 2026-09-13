// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const UpdateModuleSchema = z.object({
  key: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
})

// SEC-01: 不在生产环境暴露错误详情
function err(status: number, message: string, internalError?: unknown) {
  if (internalError) {
    logger.error(`[CMS modules/id] ${message}`, internalError)
  }
  const safeMessage = status >= 500 ? 'Internal server error' : message
  return NextResponse.json({ error: { code: status, message: safeMessage } }, { status })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getClient()

    const { data: module, error } = await supabase
      .from('content_module')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return err(500, 'Failed to fetch module', error)
    }

    if (!module) {
      return err(404, 'Module not found')
    }

    return NextResponse.json({ data: module })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return err(401, 'Unauthorized')

    const body = await req.json()
    const parsed = UpdateModuleSchema.safeParse(body)
    if (!parsed.success) {
      return err(400, parsed.error.issues.map(i => i.message).join('; '))
    }

    const updateData = {
      ...parsed.data,
      updated_at: new Date().toISOString()
    }

    const { data: module, error } = await supabase
      .from('content_module')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return err(500, 'Failed to update module', error)
    }

    if (!module) {
      return err(404, 'Module not found')
    }

    return NextResponse.json({ data: module })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getClient()

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return err(401, 'Unauthorized')

    // 首先检查模块是否存在
    const { data: existingModule, error: fetchError } = await supabase
      .from('content_module')
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingModule) {
      return err(404, 'Module not found')
    }

    // 删除模块（级联删除相关条目）
    const { error: deleteError } = await supabase
      .from('content_module')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return err(500, 'Failed to delete module', deleteError)
    }

    return NextResponse.json({
      message: 'Module deleted successfully',
      deleted_module: existingModule
    })
  } catch (e: unknown) {
    return err(500, 'Internal server error', e)
  }
}
