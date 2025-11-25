import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/gaia/check-discussed
 * 检查某个问题是否已经在聊天记录中讨论过
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question } = await req.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    logger.debug('[Check Discussed] 检查问题是否讨论过', { questionPreview: question.substring(0, 50) })

    // 获取用户的所有对话
    const { data: conversations, error } = await supabase
      .from('gaia_conversations')
      .select('id, messages, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      logger.error('[Check Discussed] 查询对话失败', error)
      return NextResponse.json({ discussed: false })
    }

    // 在所有对话中搜索这个问题
    for (const conv of conversations || []) {
      const messages = (conv.messages as any[] || []) as Array<{
        role: string
        content: string
        timestamp: string
        metadata?: { source?: string }
      }>

      // 查找匹配的知识点问题
      const foundIndex = messages.findIndex(msg =>
        msg.role === 'assistant' &&
        msg.metadata?.source === 'knowledge_point' &&
        msg.content.includes(question.substring(0, 30)) // 模糊匹配前30个字符
      )

      if (foundIndex !== -1) {
        logger.debug('[Check Discussed] 找到历史讨论', {
          conversationId: conv.id,
          messageIndex: foundIndex
        })

        return NextResponse.json({
          discussed: true,
          conversationId: conv.id,
          messageIndex: foundIndex,
          messageCount: messages.length
        })
      }
    }

    logger.debug('[Check Discussed] 未找到历史讨论')
    return NextResponse.json({ discussed: false })
  } catch (error) {
    logger.error('[Check Discussed] 内部错误', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
