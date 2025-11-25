import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// 延迟初始化OpenAI客户端，避免构建时出错
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY

  // 生产环境必须提供有效的API密钥
  if (!apiKey || apiKey === 'dummy-key-for-build') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    // 开发环境允许使用dummy key（但会失败）
    logger.warn('[Insights] Using dummy OpenAI API key in development')
  }

  return new OpenAI({
    apiKey: apiKey || 'dummy-key-for-build',
  })
}

/**
 * POST /api/insights/extract
 * 从Gaia对话中提取洞见
 * DB-05: AI密集型操作，添加限流
 */
async function handleExtractInsights(request: NextRequest) {
  try {
    // SEC-10: 请求大小限制（1MB）
    const contentLength = request.headers.get('content-length')
    const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024 // 1MB
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: '请求体过大，最大允许1MB' },
        { status: 413 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { days = 30, min_depth_score = 60 } = body

    logger.debug(`开始提取洞见：user_id=${user.id}, 分析${days}天内的对话`)

    // 1. 获取最近N天的Gaia对话
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: messages, error: queryError } = await supabase
      .from('chat_history')
      .select('id, content, role, ai_content, created_at, agent_type')
      .eq('user_id', user.id)
      .eq('agent_type', 'gaia')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(200) // 限制最多分析200条消息

    if (queryError) throw queryError

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        insights: [],
        message: '未找到Gaia对话记录',
      })
    }

    logger.debug(`找到 ${messages.length} 条Gaia对话`)

    // 2. 格式化对话内容供AI分析
    const conversationText = messages
      .map(m => {
        const userMsg = m.content ? `用户: ${m.content}` : ''
        const aiMsg = m.ai_content ? `Gaia: ${m.ai_content}` : ''
        return [userMsg, aiMsg].filter(Boolean).join('\n')
      })
      .join('\n\n')

    // 3. 调用OpenAI提取洞见
    const prompt = `你是一位深刻的智慧导师，擅长从对话中识别真正的洞见时刻。

请分析以下用户与Gaia的对话记录，提取**深刻的洞见**。

**洞见的特征**：
- 展现了自我觉察的突破
- 对生命、宇宙、人性有了新的理解
- 整合了不同领域的知识
- 体现了深刻的反思和顿悟
- 不是简单的事实陈述，而是智慧的结晶

**对话记录**：
${conversationText.slice(0, 12000)} // 限制长度避免超过token限制

**任务**：
请提取3-8条最有价值的洞见，以JSON数组格式返回。每条洞见包含：

\`\`\`json
[
  {
    "content": "洞见的完整内容（50-200字）",
    "insight_type": "breakthrough|integration|reflection|awareness",
    "related_domains": ["self_awareness", "life_sciences", "universal_laws", "creative_expression", "social_connection"],
    "depth_score": 0-100,
    "originality_score": 0-100,
    "reasoning": "为什么这是一条有价值的洞见（50-100字）"
  }
]
\`\`\`

**评分标准**：
- depth_score: 深度（是否触及本质，超越表面）
- originality_score: 原创性（是否有独特视角）

**重要**：只返回JSON数组，不要其他文字。如果没有找到洞见，返回空数组 []`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位洞见识别专家，擅长从对话中提取深刻的智慧。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const aiResponse = completion.choices[0]?.message?.content || '[]'

    // 清理可能的markdown代码块
    let cleanedResponse = aiResponse.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '')
    }

    let extractedInsights: any[] = []
    try {
      extractedInsights = JSON.parse(cleanedResponse)
    } catch (parseError) {
      logger.error('解析AI响应失败:', parseError)
      logger.error('AI响应:', aiResponse)
      throw new Error('AI响应格式错误')
    }

    // 4. 过滤低质量洞见
    const qualityInsights = extractedInsights.filter(
      (insight: any) => insight.depth_score >= min_depth_score
    )

    logger.info(`提取到 ${qualityInsights.length} 条高质量洞见`)

    // 5. 保存洞见到数据库
    // DB-01: 使用批量插入替代循环插入，避免N+1问题
    const insightsToInsert = qualityInsights.map((insight: {
      content: string
      insight_type?: string
      related_domains?: string[]
      depth_score?: number
      originality_score?: number
      reasoning?: string
    }) => ({
      user_id: user.id,
      content: insight.content,
      insight_type: insight.insight_type || 'general',
      source_type: 'gaia_chat',
      related_domains: insight.related_domains || [],
      depth_score: insight.depth_score || 0,
      originality_score: insight.originality_score || 0,
      ai_reasoning: insight.reasoning || '',
      color: getInsightColor(insight.insight_type || 'general'),
      is_public: false,
    }))

    const { data: savedInsights, error: insertError } = await supabase
      .from('insight_leaves')
      .insert(insightsToInsert)
      .select()

    if (insertError) {
      logger.error('Failed to batch insert insights:', insertError)
    }

    // 6. 更新 consciousness_tree_view 中的叶子数据
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_tree_view')
      .eq('id', user.id)
      .single()

    // DB-01: 处理批量插入结果
    const validInsights = savedInsights || []
    const existingTreeView = (profile?.consciousness_tree_view as Record<string, unknown>) || {}
    const updatedTreeView = {
      ...existingTreeView,
      branches_and_leaves: {
        total_leaves: validInsights.length,
        insights: validInsights.slice(0, 10).map((i: { id: string; content: string; insight_type: string }) => ({ // 只保存最近10条到视图
          id: i.id,
          content: i.content.slice(0, 100) + '...', // 截断过长内容
          type: i.insight_type,
        })),
      },
      last_updated: new Date().toISOString(),
    }

    await supabase
      .from('profiles')
      .update({
        consciousness_tree_view: updatedTreeView,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      insights: validInsights,
      stats: {
        total_messages_analyzed: messages.length,
        insights_extracted: qualityInsights.length,
        insights_saved: validInsights.length,
      },
      message: `成功提取 ${validInsights.length} 条洞见`,
    })
  } catch (error: any) {
    logger.error('提取洞见失败:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? `服务器错误: ${error.message}` : '服务器错误' },
      { status: 500 }
    )
  }
}

// DB-05: AI操作每分钟最多20次
export const POST = withRateLimit(handleExtractInsights, rateLimitConfigs.chat)

/**
 * 根据洞见类型返回颜色
 */
function getInsightColor(type: string): string {
  const colors: Record<string, string> = {
    breakthrough: '#fbbf24', // 突破 - 金色
    integration: '#8b5cf6', // 整合 - 紫色
    reflection: '#3b82f6', // 反思 - 蓝色
    awareness: '#10b981', // 觉察 - 绿色
    general: '#4ade80', // 一般 - 浅绿
  }
  return colors[type] || colors.general
}

/**
 * GET /api/insights/extract
 * 获取用户的洞见列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: insights, error: queryError } = await supabase
      .from('insight_leaves')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (queryError) throw queryError

    return NextResponse.json({
      success: true,
      insights: insights || [],
      total: insights?.length || 0,
    })
  } catch (error: any) {
    logger.error('获取洞见失败:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? `服务器错误: ${error.message}` : '服务器错误' },
      { status: 500 }
    )
  }
}
