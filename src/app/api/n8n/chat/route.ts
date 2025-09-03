import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/fca634ab-8e03-4a6f-99f3-c7dc46e772ae'

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
    const payload: any = {
      message,
      text: message,
      prompt: message,
      content: message,
      project_id,
      user_id: userId,
    }
    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    if (!res.ok) {
      // 将 n8n 的错误体返回，便于前端直接看到具体错误
      return NextResponse.json({ error: 'N8N_CHAT_FAILED', status: res.status, body: text }, { status: 502 })
    }
    // assume n8n returns {reply: string} or plain text
    try {
      const json = JSON.parse(text)
      return NextResponse.json(json)
    } catch {
      return NextResponse.json({ reply: text })
    }
  } catch (e) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}


