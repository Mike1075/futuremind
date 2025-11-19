// evaluate-submission 边缘函数
// 核心功能：作业批改 + 意识树生长驱动

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

// 初始化Supabase客户端（使用Service Role绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// AI评估提示词模板
const EVALUATION_PROMPT = `你是一位深刻、慈悲且富有洞察力的未来心灵学院导师与园丁。

**[输入1：学生全局档案]**:
{student_profile}

**[输入2：课程教学总目标]**:
{course_goals}

**[输入3：本次作业要求]**:
{assignment_requirements}

**[输入4：学生近期学习历史]**:
{recent_history}

**[输入5：学生本次提交内容]**:
{submission_content}

**[你的任务]**:
请基于以上所有信息，对学生的本次提交进行一次全面的评估，并以**严格的JSON格式**返回一个**包含两大部分**的结果：

**1. evaluation (评估结果)**:
- feedback: (string) 给学生的鼓励性、建设性反馈文本，100-300字
- score: (integer) 0-100的综合分数，请参考以下评分标准：
  * 60-69分：基本完成作业，有一定思考和表达，但较为简单或表面
  * 70-79分：认真完成作业，有自己的理解和感受，内容较为完整
  * 80-89分：深入思考，结合个人经验，表达清晰且有一定深度
  * 90-100分：卓越的作业，展现深刻洞见，高度契合课程主题，有独特见解或突破性理解

  **重要评分原则**：
  - 对于认真完成、有真实思考的作业，请给予60-75分，鼓励学生继续努力
  - 只有特别优秀、展现深刻洞察、完美契合主题的作业才给90分以上
  - 避免过于苛刻，大部分认真作业应在65-80分范围内

- private_notes_for_gaia: (string) 供系统内部使用的精炼总结

**2. growth_impact (生长指令)**:
- roots_growth: (object, optional) 如果本次提交属于探索新知识领域，格式：{"self_awareness": 2, "life_sciences": 1}（可用域：self_awareness, life_sciences, universal_laws, creative_expression, social_connection）
- trunk_growth: (object, optional) 如果是冥想或深度内省类提交，格式：{"stability": 1, "thickness": 1}
- new_leaf_generated: (object, optional) 如果包含深刻洞见，格式：{"count": 3}
- fruit_generated: (object, optional) 如果是PBL项目最终成果，格式：{"type": "project_fruit", "title": "果实名称", "earned_from": "项目名", "earned_at": "2025-11-03"}

**重要**：只输出有效的JSON，不要添加任何Markdown代码块标记。格式示例：
{
  "evaluation": {
    "feedback": "你的反思非常真诚，能看出你在认真思考课程内容。建议可以进一步结合具体例子，使表达更加生动...",
    "score": 72,
    "private_notes_for_gaia": "学生认真完成作业，有基本理解但深度有待提升"
  },
  "growth_impact": {
    "roots_growth": {"self_awareness": 1},
    "trunk_growth": {"stability": 1, "thickness": 1},
    "new_leaf_generated": {"count": 1}
  }
}`

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // 1. 解析请求
    const { user_id, content_id, submission_content, submission_type = 'reflection', is_public = false } = await req.json()

    if (!user_id || !content_id || !submission_content) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数：user_id, content_id, submission_content' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    console.log(`📝 开始评估：user_id=${user_id}, content_id=${content_id}`)

    // 2. 创建提交记录
    const { data: newSubmission, error: insertError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        course_content_id: content_id,  // 修正字段名
        submission_type,
        content: submission_content,    // 修正字段名
        status: 'under_review',
        is_public: is_public, // 保存作业可见性设置
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ 创建提交记录失败:', insertError)
      return new Response(
        JSON.stringify({ error: '创建提交记录失败: ' + insertError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const submission_id = newSubmission.id
    console.log(`✅ 提交记录已创建：submission_id=${submission_id}`)

    // 3. 搜集上下文信息
    console.log('🔍 搜集上下文信息...')

    // 3.1 获取课程内容（作业要求）
    const { data: courseContent } = await supabase
      .from('course_contents')
      .select('title, subtitle, original_text, main_content, goals, system_id')
      .eq('id', content_id)
      .single()

    // 3.2 获取课程体系（教学目标）
    const { data: courseSystem } = await supabase
      .from('course_systems')
      .select('title, teaching_goals, description')
      .eq('id', courseContent?.system_id)
      .single()

    // 3.3 获取学生档案
    const { data: studentSummary } = await supabase
      .from('student_summaries')
      .select('personality_traits, learning_style, strengths, areas_for_growth, overall_summary')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3.4 获取近期学习历史
    const { data: recentSubmissions } = await supabase
      .from('user_submissions')
      .select('submission_type, content, feedback, score, submitted_at')  // 修正字段名
      .eq('user_id', user_id)
      .order('submitted_at', { ascending: false })
      .limit(5)

    // 4. 构建AI提示词
    console.log('🤖 构建AI评估提示词...')

    const studentProfile = studentSummary
      ? `性格特点: ${studentSummary.personality_traits || '暂无'}
学习风格: ${studentSummary.learning_style || '暂无'}
优势: ${studentSummary.strengths || '暂无'}
成长领域: ${studentSummary.areas_for_growth || '暂无'}
综合评价: ${studentSummary.overall_summary || '暂无'}`
      : '暂无学生档案'

    const courseGoals = courseSystem
      ? `课程：${courseSystem.title}
教学目标：${courseSystem.teaching_goals}
课程描述：${courseSystem.description}`
      : '暂无课程信息'

    const assignmentRequirements = courseContent
      ? `作业标题：${courseContent.title}
副标题：${courseContent.subtitle || '无'}
作业要求：${courseContent.goals || courseContent.main_content || courseContent.original_text || '无'}`
      : '暂无作业要求'

    const recentHistory = recentSubmissions && recentSubmissions.length > 0
      ? recentSubmissions
          .map(
            (s, i) =>
              `[提交${i + 1}] ${s.submission_type} - 分数:${s.score || '未评'} - ${s.submitted_at}`
          )
          .join('\n')
      : '暂无历史记录'

    const prompt = EVALUATION_PROMPT
      .replace('{student_profile}', studentProfile)
      .replace('{course_goals}', courseGoals)
      .replace('{assignment_requirements}', assignmentRequirements)
      .replace('{recent_history}', recentHistory)
      .replace('{submission_content}', submission_content)

    // 5. 调用OpenAI API
    console.log('🤖 调用OpenAI API进行评估...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的教育评估专家。请严格按照JSON格式返回评估结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API调用失败:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResultText = openaiData.choices[0].message.content

    console.log('📥 AI返回内容:', aiResultText.substring(0, 200))

    // 6. 解析AI返回的JSON
    let aiResult
    try {
      // 清理可能的Markdown代码块
      let cleanedText = aiResultText.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
      }

      aiResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('❌ 解析AI返回的JSON失败:', parseError)
      return new Response(
        JSON.stringify({ error: 'AI返回格式错误', details: aiResultText }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 7. 更新提交记录（填入评估结果）
    console.log('💾 更新提交记录...')

    const { error: updateError } = await supabase
      .from('user_submissions')
      .update({
        feedback: aiResult.evaluation?.feedback || '',
        score: aiResult.evaluation?.score || 0,
        consciousness_growth_points: calculateGrowthPoints(aiResult.growth_impact),
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('❌ 更新提交记录失败:', updateError)
      throw new Error(`更新提交记录失败: ${updateError.message}`)
    }

    console.log('✅ 提交记录已更新')

    // 8. 驱动意识树生长（调用RPC函数）
    if (aiResult.growth_impact && Object.keys(aiResult.growth_impact).length > 0) {
      console.log('🌱 驱动意识树生长...')
      console.log('生长指令:', JSON.stringify(aiResult.growth_impact))

      const { data: treeResult, error: treeError } = await supabase.rpc('grow_consciousness_tree', {
        p_user_id: user_id,
        p_growth_instruction: aiResult.growth_impact,
      })

      if (treeError) {
        console.error('❌ 意识树生长失败:', treeError)
      } else {
        console.log('✅ 意识树已生长')
        console.log('更新后的树:', JSON.stringify(treeResult))
      }
    } else {
      console.log('⚠️ 无生长指令，跳过意识树更新')
    }

    // 9. 返回评估结果
    console.log('✨ 评估完成')

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        evaluation: aiResult.evaluation,
        growth_impact: aiResult.growth_impact,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('❌ 评估失败:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '评估失败',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

// 辅助函数：计算总的意识成长点数
function calculateGrowthPoints(growthImpact: any): number {
  if (!growthImpact) return 0

  let points = 0

  // 根系生长：每个domain每点算1分
  if (growthImpact.roots_growth) {
    for (const value of Object.values(growthImpact.roots_growth)) {
      points += Number(value) || 0
    }
  }

  // 树干生长：稳定性和厚度各算1分
  if (growthImpact.trunk_growth) {
    points += Number(growthImpact.trunk_growth.stability) || 0
    points += Number(growthImpact.trunk_growth.thickness) || 0
  }

  // 新叶生成：每片叶子算0.5分
  if (growthImpact.new_leaf_generated?.count) {
    points += (Number(growthImpact.new_leaf_generated.count) || 0) * 0.5
  }

  // 果实生成：每个果实算5分
  if (growthImpact.fruit_generated) {
    points += 5
  }

  return Math.round(points) // 返回整数
}
