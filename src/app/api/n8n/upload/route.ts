import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

// Max file size: 20MB
const MAX_SIZE_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export async function POST(req: NextRequest) {
  try {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/fca634ab-8e03-4a6f-99f3-c7dc46e772ae'

    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // Parse multipart/form-data
    const form = await req.formData()
    const file = form.get('file') as File | null
    const projectId = form.get('project_id')?.toString()

    if (!file) {
      return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'PROJECT_ID_REQUIRED' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'UNSUPPORTED_FILE_TYPE' }, { status: 415 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    // Optional: verify user has access to the project
    // If pbl_project table exists with owner_id, validate here. Non-blocking fallback.
    try {
      const { data: proj } = await supabase
        .from('pbl_project')
        .select('id')
        .eq('id', projectId)
        .limit(1)
        .single()
      if (!proj) {
        // Continue but mark as warning in payload
      }
    } catch {
      // Table may not exist yet; proceed.
    }

    // Forward to n8n webhook
    const forward = new FormData()
    forward.set('file', file)
    forward.set('project_id', projectId)
    forward.set('user_id', user.id)

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: forward as any,
      // Do not set Content-Type; the runtime sets correct multipart boundary
    })

    const text = await n8nRes.text()

    if (!n8nRes.ok) {
      return NextResponse.json(
        { error: 'N8N_FORWARD_FAILED', status: n8nRes.status, body: text },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, body: text })
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}


