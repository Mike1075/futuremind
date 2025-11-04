// review-user-content 边缘函数
// 功能：AI内容审核 - 检测用户创建的内容是否符合社区准则

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

// 初始化Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 内容审核提示词
const REVIEW_PROMPT = `你是未来心灵学院的内容审核AI助手。请审核用户提交的内容是否符合以下社区准则：

**社区准则：**
1. ❌ 不能包含色情、暴力、血腥等不适内容
2. ❌ 不能涉及政治话题、政治立场或政治争议
3. ❌ 不能包含人身攻击、侮辱、歧视、仇恨言论
4. ❌ 不能包含危险、违法或伤害他人的内容
5. ✅ 必须符合基本的社会准则和道德规范
6. ✅ 鼓励积极、建设性、富有教育意义的内容

**待审核内容：**
{content}

**你的任务：**
请仔细分析上述内容，判断是否符合社区准则，并以严格的JSON格式返回审核结果。

**返回格式：**
{
  "approved": true/false,
  "reason": "审核结果说明（简短、清晰）",
  "violations": ["违规类型1", "违规类型2"],
  "severity": "low/medium/high",
  "suggestions": "如果未通过，给用户的修改建议"
}

**重要**：
- 只输出有效的JSON，不要添加任何Markdown标记
- approved为true表示通过审核，false表示拒绝
- violations数组为空表示无违规
- severity表示违规严重程度（如果有违规）
- 对于边缘情况，倾向于谨慎（拒绝）而非放行
- 对于纯粹的学术讨论、教育内容要宽容
`

interface ReviewRequest {
  content: string
  contentType: string // 'pbl_project' | 'comment' | 'reflection' 等
}

interface ReviewResult {
  approved: boolean
  reason: string
  violations: string[]
  severity?: 'low' | 'medium' | 'high'
  suggestions?: string
}

serve(async (req) => {
  try {
    // 验证请求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 解析请求体
    const { content, contentType }: ReviewRequest = await req.json()

    // 验证输入
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be a non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 快速预检：内容过短（少于10字符）直接拒绝
    if (content.trim().length < 10) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: '内容过短，不符合最低长度要求',
          violations: ['insufficient_content'],
          severity: 'low',
          suggestions: '请提供更详细、完整的内容描述'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 快速预检：敏感词黑名单（简单示例）
    const sensitiveKeywords = [
      '色情', '暴力', '血腥', '政治', '习近平', '共产党',
      '傻逼', '操你', '去死', '杀人', '自杀'
    ]

    const lowerContent = content.toLowerCase()
    const foundSensitiveWords = sensitiveKeywords.filter(keyword =>
      lowerContent.includes(keyword.toLowerCase())
    )

    if (foundSensitiveWords.length > 0) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: '内容包含敏感词汇，不符合社区准则',
          violations: ['sensitive_keywords'],
          severity: 'high',
          suggestions: '请移除敏感内容，使用文明、友善的语言'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 调用OpenAI进行深度审核
    const prompt = REVIEW_PROMPT.replace('{content}', content)

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的内容审核助手，专注于判断内容是否符合社区准则。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // 较低温度确保审核一致性
        max_tokens: 500
      })
    })

    if (!openaiResponse.ok) {
      console.error('[OpenAI Error]', await openaiResponse.text())
      throw new Error('OpenAI API request failed')
    }

    const openaiData = await openaiResponse.json()
    const aiResponseText = openaiData.choices[0]?.message?.content || '{}'

    // 解析AI返回的JSON
    let reviewResult: ReviewResult
    try {
      // 清理可能的Markdown标记
      let cleanedText = aiResponseText.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      reviewResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[Parse Error]', parseError, 'Raw text:', aiResponseText)
      // 解析失败时默认拒绝
      return new Response(
        JSON.stringify({
          approved: false,
          reason: '审核系统暂时无法处理此内容，请稍后重试',
          violations: ['system_error'],
          severity: 'medium',
          suggestions: '请确保内容清晰、完整，并符合社区准则'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 记录审核日志到数据库（可选）
    try {
      await supabase.from('content_review_logs').insert({
        content_type: contentType,
        content_preview: content.substring(0, 200),
        review_result: reviewResult,
        created_at: new Date().toISOString()
      })
    } catch (logError) {
      // 日志记录失败不影响主流程
      console.error('[Log Error]', logError)
    }

    // 返回审核结果
    return new Response(
      JSON.stringify(reviewResult),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Function Error]', error)
    return new Response(
      JSON.stringify({
        approved: false,
        reason: '审核系统发生错误',
        violations: ['system_error'],
        severity: 'medium',
        suggestions: '请稍后重试'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
