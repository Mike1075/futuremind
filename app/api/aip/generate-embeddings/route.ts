import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// 生成OpenAI embedding
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('[Generate Embeddings] 开始处理')

    // 使用service role key创建客户端（绕过RLS）
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // 查询所有没有embedding的documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, title, content')
      .is('embedding', null)
      .not('content', 'eq', '')
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        message: '没有需要生成embedding的文档',
        processed: 0
      })
    }

    logger.info('[Generate Embeddings] 找到文档', { count: documents.length })

    // 为每个文档生成embedding
    const results = []
    for (const doc of documents) {
      try {

        // 组合标题和内容
        const textToEmbed = `${doc.title || ''}\n\n${doc.content}`
        const embedding = await generateEmbedding(textToEmbed)

        // 更新document的embedding
        const { error: updateError } = await supabase
          .from('documents')
          .update({ embedding: embedding })
          .eq('id', doc.id)

        if (updateError) {
          logger.error('[Generate Embeddings] 更新失败', { docId: doc.id, error: updateError })
          results.push({ id: doc.id, success: false })
        } else {
          results.push({ id: doc.id, success: true, title: doc.title })
        }

        // 避免OpenAI rate limit
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        logger.error('[Generate Embeddings] 处理错误', { docId: doc.id, error })
        results.push({ id: doc.id, success: false })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    logger.info('[Generate Embeddings] 完成', { successCount, failCount })

    return NextResponse.json({
      message: 'Embedding生成完成',
      total: documents.length,
      success: successCount,
      failed: failCount,
      results: results
    })
  } catch (error: any) {
    logger.error('[Generate Embeddings] 错误', error)
    return NextResponse.json(
      { error: '生成embedding失败' },
      { status: 500 }
    )
  }
}
