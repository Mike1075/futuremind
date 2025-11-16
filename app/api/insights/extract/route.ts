import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// 延迟初始化OpenAI客户端，避免构建时出错
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
  })
}

/**
 * POST /api/insights/extract
 * 从Gaia对话中提取洞见
 */
export async function POST(request: NextRequest) {
  try {
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

    console.log(`🌿 开始提取洞见：user_id=${user.id}, 分析${days}天内的对话`)

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

    console.log(`📊 找到 ${messages.length} 条Gaia对话`)

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
      console.error('解析AI响应失败:', parseError)
      console.error('AI响应:', aiResponse)
      throw new Error('AI响应格式错误')
    }

    // 4. 过滤低质量洞见
    const qualityInsights = extractedInsights.filter(
      (insight: any) => insight.depth_score >= min_depth_score
    )

    console.log(`✨ 提取到 ${qualityInsights.length} 条高质量洞见`)

    // 5. 保存洞见到数据库
    const savedInsights = []
    for (const insight of qualityInsights) {
      const { data: saved, error: insertError } = await supabase
        .from('insight_leaves')
        .insert({
          user_id: user.id,
          content: insight.content,
          insight_type: insight.insight_type || 'general',
          source_type: 'gaia_chat',
          related_domains: insight.related_domains || [],
          depth_score: insight.depth_score || 0,
          originality_score: insight.originality_score || 0,
          ai_reasoning: insight.reasoning || '',
          color: getInsightColor(insight.insight_type),
          is_public: false,
        })
        .select()
        .single()

      if (!insertError && saved) {
        savedInsights.push(saved)
      }
    }

    // 6. 更新 consciousness_tree_view 中的叶子数据
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_tree_view')
      .eq('id', user.id)
      .single()

    const existingTreeView = (profile?.consciousness_tree_view as Record<string, any>) || {}
    const updatedTreeView = {
      ...existingTreeView,
      branches_and_leaves: {
        total_leaves: savedInsights.length,
        insights: savedInsights.slice(0, 10).map(i => ({ // 只保存最近10条到视图
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
      insights: savedInsights,
      stats: {
        total_messages_analyzed: messages.length,
        insights_extracted: qualityInsights.length,
        insights_saved: savedInsights.length,
      },
      message: `成功提取 ${savedInsights.length} 条洞见`,
    })
  } catch (error: any) {
    console.error('❌ 提取洞见失败:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}

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
    console.error('获取洞见失败:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}
