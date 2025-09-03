import { createClient } from '@/lib/supabase/client'

export type UploadResult = {
  success: boolean
  error?: string
  body?: string
}

/**
 * Upload a document to n8n via our server proxy.
 * Accepts pdf, doc, docx, txt. Max 20MB.
 */
export async function uploadProjectDocument(params: {
  projectId: string
  file: File
}): Promise<UploadResult> {
  const { projectId, file } = params

  const form = new FormData()
  form.set('project_id', projectId)
  form.set('file', file)

  const res = await fetch('/api/n8n/upload', {
    method: 'POST',
    body: form,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { success: false, error: data?.error || 'UPLOAD_FAILED' }
  }

  return { success: true, body: data?.body }
}

/**
 * Helper to fetch projects (id, name) for current user.
 * Adjust the table/columns to your schema if needed.
 */
export async function listUserProjects() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('pbl_project')
    .select('id,name')
    .order('created_at', { ascending: false })

  return data || []
}


