import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/b568b56a-79f0-47d4-b016-969612e5fa19'

    // 获取登录用户（失败不阻塞，以便未登录也可体验对话）
    let userId: string | null = null
    try {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {}

    const { message, project_id } = await req.json()
    if (!message) return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 })

    // 兼容多种字段命名，以适配不同 n8n 节点：
    const payload: Record<string, string> = {
      message,
      text: message,
      prompt: message,
      content: message,
      project_id: project_id || '',
      user_id: userId || 'guest',
    }
    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    
    // 添加详细的调试日志
    console.log('=== N8N 聊天 API 调试信息 ===')
    console.log('发送到 n8n 的 payload:', JSON.stringify(payload, null, 2))
    console.log('n8n 响应状态:', res.status)
    console.log('n8n 响应头:', Object.fromEntries(res.headers.entries()))
    console.log('n8n 原始响应文本:', text)
    console.log('n8n 响应文本长度:', text.length)
    console.log('================================')
    
    if (!res.ok) {
      // 将 n8n 的错误体返回，便于前端直接看到具体错误
      return NextResponse.json({ error: 'N8N_CHAT_FAILED', status: res.status, body: text }, { status: 502 })
    }
    
    // 尝试解析 n8n 的响应
    let responseData
    try {
      responseData = JSON.parse(text)
      console.log('n8n 响应解析为 JSON:', responseData)
    } catch {
      console.log('n8n 响应不是 JSON，作为纯文本处理:', text)
      responseData = { reply: text }
    }
    
    return NextResponse.json(responseData)
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}


