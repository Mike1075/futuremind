import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

interface N8nCallbackPayload {
  user_id: string
  user_message: string
  gaia_reply: string
  conversation_id?: string
  timestamp?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload: N8nCallbackPayload = await req.json()
    const { user_id, user_message, gaia_reply } = payload

    console.log('=== N8N 回调 API 调试信息 ===')
    console.log('收到的payload:', JSON.stringify(payload, null, 2))
    console.log('⚠️  注意：前端已处理聊天记录存储，此API仅做日志记录')

    if (!user_id || user_id === 'guest') {
      console.log('user_id为guest或null，跳过处理')
      return NextResponse.json({ success: true, message: 'Guest conversation logged' })
    }

    if (!user_message || !gaia_reply) {
      return NextResponse.json({ error: 'user_message and gaia_reply are required' }, { status: 400 })
    }

    // 只做日志记录，不存储到数据库（前端已经存储了）
    console.log(`📝 N8N回调日志 - 用户${user_id}:`)
    console.log(`用户消息: ${user_message}`)
    console.log(`盖亚回复: ${gaia_reply}`)
    console.log('✅ 聊天记录由前端统一管理，无需重复存储')

    return NextResponse.json({
      success: true,
      message: 'Callback received and logged',
      note: 'Chat storage handled by frontend'
    })

  } catch (error) {
    console.error('N8N回调处理失败:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 支持GET请求用于测试
export async function GET() {
  return NextResponse.json({
    message: 'N8N Chat Callback API is ready',
    usage: 'POST with { user_id, user_message, gaia_reply }'
  })
}