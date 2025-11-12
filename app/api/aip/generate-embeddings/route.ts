import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限（可选：只允许管理员调用）
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Generate Embeddings API] 调用Edge Function...')

    // 调用Edge Function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-document-embeddings`
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Generate Embeddings API] Edge Function错误:', errorText)
      throw new Error(`Edge Function failed: ${errorText}`)
    }

    const result = await response.json()
    console.log('[Generate Embeddings API] 完成:', result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Generate Embeddings API] 错误:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings', details: error.message },
      { status: 500 }
    )
  }
}
