import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/gaia/extract-topic
 * 从知识点文本中提炼关键主题
 *
 * Body: { text: string }
 * Response: { topic: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 调用OpenAI API提炼主题
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个教育专家，擅长提炼学习主题。用户会给你一段知识点或问题描述，你需要提炼出一个简洁的主题句（10-15个字），概括核心要点。只返回主题句，不要解释。'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Extract Topic] OpenAI error:', errorData)
      return NextResponse.json({ error: 'Failed to extract topic' }, { status: 502 })
    }

    const data = await response.json()
    const topic = data.choices?.[0]?.message?.content?.trim() || text.substring(0, 20) + '...'

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('[Extract Topic] Internal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
