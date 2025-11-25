import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InteractionService, InteractionType, ItemType } from '@/lib/services/interaction.service'
import { logger } from '@/lib/logger'

/**
 * POST /api/interactions/record
 * 记录用户互动行为
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { contentId, interactionType, itemIndex, itemType, metadata } = body

    if (!contentId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, interactionType' },
        { status: 400 }
      )
    }

    // 记录互动
    await InteractionService.recordInteraction({
      userId: user.id,
      contentId,
      interactionType: interactionType as InteractionType,
      itemIndex,
      itemType: itemType as ItemType,
      metadata
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[互动记录] 记录错误', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
