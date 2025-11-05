import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/n8n/gaia-chat
 * 盖亚对话API - 用于课程学习中的知识探讨
 *
 * Body参数:
 * - message: 用户消息
 * - contentId: 课程内容ID
 * - knowledgePointText: 知识点或问题文本
 * - discussionType: 讨论类型 ('knowledge_point' | 'question' | 'reflection')
 */
export async function POST(req: NextRequest) {
  try {
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK_URL
      || 'https://n8n.aifunbox.com/webhook/79cbcc7c-fcff-4ab4-9a4e-c5a6f14b3024'

    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { message, contentId, knowledgePointText, discussionType, firstAssistantMessage } = await req.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!contentId || !knowledgePointText || !discussionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. 查找或创建讨论主题
    let discussionId: string
    const { data: existingDiscussion } = await (supabase as any)
      .from('knowledge_discussions')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('knowledge_point_text', knowledgePointText)
      .eq('discussion_type', discussionType)
      .single()

    if (existingDiscussion) {
      discussionId = existingDiscussion.id
    } else {
      const { data: newDiscussion, error: createError } = await (supabase as any)
        .from('knowledge_discussions')
        .insert({
          user_id: userId,
          content_id: contentId,
          knowledge_point_text: knowledgePointText,
          discussion_type: discussionType
        })
        .select('id')
        .single()

      if (createError || !newDiscussion) {
        console.error('Failed to create discussion:', createError)
        return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 })
      }

      discussionId = newDiscussion.id
    }

    // 2. 加载历史对话
    const { data: historyMessages } = await (supabase as any)
      .from('discussion_messages')
      .select('role, content')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })

    // 3. 如果是首次消息且有AI生成的启发性问题，先保存
    if (firstAssistantMessage && historyMessages?.length === 0) {
      await (supabase as any)
        .from('discussion_messages')
        .insert({
          discussion_id: discussionId,
          role: 'assistant',
          content: firstAssistantMessage
        })
    }

    // 4. 保存用户消息
    await (supabase as any)
      .from('discussion_messages')
      .insert({
        discussion_id: discussionId,
        role: 'user',
        content: message
      })

    // 4. 构建苏格拉底式提问的系统提示
    const socraticPrompt = `你是盖亚（Gaia），一位智慧的学习引导者。你的角色是通过苏格拉底式提问引导学生深入思考，而不是直接给出答案。

重要原则：
1. **先赞美**：首先用不同的表达方式赞美学生的探索精神和学习态度
2. **引导思考**：提出深入的问题，引导学生自己发现答案
3. **层层递进**：根据学生的回答，提出更深层次的问题
4. **鼓励反思**：帮助学生建立知识之间的联系
5. **避免直接答案**：即使学生直接求答案，也要用问题引导

当前学生正在探讨的${discussionType === 'knowledge_point' ? '知识点' : discussionType === 'question' ? '问题' : '反思'}：
"${knowledgePointText}"

请根据对话历史和学生的新消息，提出引导性的问题。`

    // 5. 构建发送给N8N的消息
    const conversationHistory = historyMessages?.map((m: any) => ({
      role: m.role,
      content: m.content
    })) || []

    const payload = {
      chatInput: message,
      session_id: discussionId,
      user_id: userId,
      project_id: 'gaia_learning',
      organization_id: '',
      system_prompt: socraticPrompt,
      conversation_history: conversationHistory
    }

    const res = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Gaia Chat] N8N error:', errorText)
      return NextResponse.json({
        error: 'Failed to get response from Gaia',
        status: res.status
      }, { status: 502 })
    }

    // 读取N8N的流式响应
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // 解析每行JSON
          const lines = chunk.split('\n').filter(line => line.trim())
          for (const line of lines) {
            try {
              const json = JSON.parse(line)

              // 处理type: "item"的流式数据
              if (json.type === 'item' && json.content) {
                const content = json.content

                // 尝试解析content
                try {
                  const innerJson = JSON.parse(content)
                  // 如果有output字段，使用完整回复
                  if (innerJson.output) {
                    fullContent = innerJson.output
                  }
                } catch {
                  // content是纯文本，累加
                  fullContent += content
                }
              }
            } catch {
              // 继续处理下一行
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    // 6. 保存助手回复
    const reply = fullContent || '抱歉，我现在无法回应。请稍后再试。'

    await (supabase as any)
      .from('discussion_messages')
      .insert({
        discussion_id: discussionId,
        role: 'assistant',
        content: reply
      })

    // 返回盖亚的回复
    return NextResponse.json({
      reply,
      discussionId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Gaia Chat] Internal error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
