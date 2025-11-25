import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    logger.debug('[N8N] chat callback received', { hasData: !!data })

    // 这里可以添加额外的处理逻辑
    // 比如保存到数据库、触发通知等

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[N8N] Chat callback error', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
