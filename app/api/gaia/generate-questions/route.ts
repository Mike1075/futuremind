import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/gaia/generate-questions
 * 基于主题生成启发性的苏格拉底式问题
 *
 * Body: { topic: string, originalText: string }
 * Response: { questions: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { topic, originalText } = await req.json()

    logger.debug('[Generate Questions] 收到请求', { topic, originalTextLength: originalText?.length })

    if (!topic || !originalText) {
      logger.error('[Generate Questions] 缺少必要字段')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      logger.error('[Generate Questions] OpenAI API key未配置')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    logger.debug('[Generate Questions] 调用OpenAI API')

    // 调用OpenAI生成启发性问题
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
            content: `你是盖亚（Gaia），一位充满智慧和热情的学习引导者。你的使命是通过苏格拉底式提问激发学生的深度思考。

重要原则：
1. **先赞美**：用富有创意和温暖的方式赞美学生的探索精神（每次用不同的表达方式）
2. **引导思考**：提出3-4个递进式的开放性问题，引导学生自己发现答案
3. **启发智慧**：问题要有深度，能引发思考和联想
4. **避免说教**：不直接给答案，而是引导探索

请基于学生选择的主题，生成一段包含赞美和启发性问题的对话。用第二人称"你"来称呼学生，语气温暖且充满智慧。`
          },
          {
            role: 'user',
            content: `主题：${topic}\n\n原文：${originalText}\n\n请生成赞美和启发性问题。`
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('[Generate Questions] OpenAI调用失败', errorData)
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 502 })
    }

    const data = await response.json()
    const questions = data.choices?.[0]?.message?.content?.trim() || '让我们一起探讨这个有趣的话题吧！'

    logger.debug('[Generate Questions] 成功生成', { preview: questions.substring(0, 100) })
    return NextResponse.json({ questions })
  } catch (error) {
    logger.error('[Generate Questions] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
