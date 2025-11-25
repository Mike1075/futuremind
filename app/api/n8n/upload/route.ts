import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // SEC-03: 不使用硬编码URL，必须通过环境变量配置
    const N8N_UPLOAD_WEBHOOK = process.env.N8N_UPLOAD_WEBHOOK_URL
    if (!N8N_UPLOAD_WEBHOOK) {
      logger.error('[N8N Upload] N8N_UPLOAD_WEBHOOK_URL环境变量未配置')
      return NextResponse.json({ error: 'Service configuration error' }, { status: 503 })
    }

    const formData = await req.formData()

    // 直接转发表单数据到 n8n
    const response = await fetch(N8N_UPLOAD_WEBHOOK, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      logger.error('[N8N Upload] 上传失败', { status: response.status })
      return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 502 })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    logger.error('[N8N Upload] 上传异常', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
