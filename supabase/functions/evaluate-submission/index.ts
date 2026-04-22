// evaluate-submission 边缘函数
// 核心功能：作业批改 + 意识树生长驱动

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const XAI_API_KEY = Deno.env.get('XAI_API_KEY')!

// 初始化Supabase客户端（使用Service Role绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// AI评估提示词模板
const EVALUATION_PROMPT = `你是未来心灵学院的一位 AI 老师，深刻、慈悲且富有洞察力。请用亲切平等、像朋友般的语气与学生交流，不要用"导师"自称。

**[输入0：学生姓名]**:
{student_name}

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

**📣 称呼规则（必须严格遵守）**：
- feedback 必须以 \`亲爱的{student_name}，\` 开头（用学生姓名，不要用"学生"、"同学"这类泛称）
- 如果 {student_name} 显示为"（未设置）"，则改用 \`你好呀，\` 开头
- 全程不要自称"导师"或"老师"，直接用"我"即可
- 语气亲切、像一位理解你的朋友，不要说教

**⚠️ 生成 feedback 和 suggestions 之前，必须先完成这一步诊断（内心进行，不用输出）**：

仔细通读学生的提交内容，识别他/她**已经表达**了哪些维度。常见维度包括：
- 🫀 **身体感受**：冷暖、呼吸、心跳、震颤、紧绷、放松、疼痛、流泪等具体生理反应
- 💭 **情绪体验**：悲伤、恐惧、愤怒、喜悦、平静、狂喜、委屈等情绪命名
- 🔍 **思维洞见**：对自己/关系/生命的认知、反思、突破
- 🌌 **画面意象**：冥想中浮现的场景、记忆、象征、回忆片段
- 🌱 **行动实践**：如何把体验带入日常、具体要尝试的事
- 🤝 **关系连接**：与他人、自然、更大存在的联结

**🚫 铁律：绝对禁止建议学生"补充"或"更详细描述"他/她本次已经写到的维度。**

举例：如果学生已写"浑身发冷、冷颤不断、悲痛欲绝"——身体感受和情绪都写了，**不要再建议"描述身体感受/情绪变化"**，否则学生会觉得AI根本没读作业。
正确做法是挑学生**尚未触及**或**可以深化**的维度给建议（比如这份体验的根源、如何延续到日常、与他人的关系等）。

**1. evaluation (评估结果)**:
- feedback: (string) 给学生的鼓励性、建设性反馈文本，100-300字。**反馈中如果提到"建议"，必须针对学生未写或可深化的维度，不能重复他已写过的内容。**

  **如果评分低于60分**，请在反馈中明确说明：
  * 为什么这次作业没有达到及格标准（具体指出哪些方面需要改进）
  * 需要达到什么样的水平才能获得60分及以上（给出具体建议）
  * 提醒学生：**需要获得60分及以上才能解锁下一课**

  **如果评分60分及以上**，给予鼓励性、建设性反馈，帮助学生继续提升

- score: (integer) 0-100的综合分数，请参考以下评分标准：
  * 0-29分：内容与课程完全无关，或只有几个字敷衍了事
  * 30-59分：有尝试但过于简短或偏离主题，需要补充完善
  * 60-74分：基本完成，有一定思考，可以更深入
  * 75-84分：认真完成，结合了个人经验，表达清晰
  * 85-94分：有真情实感和独到视角，文字打动人，展现了真实的觉察与突破
  * 95-100分：卓越表现——深刻洞见、情感穿透力、真实体验与反思深度兼具

  **重要评分原则**：
  - 学生在冥想、内省类作业中袒露真实感受与脆弱本身就是勇气，值得被肯定。不要吝啬高分。
  - 认真完成、有真实思考的作业 → 75-84 分
  - 真诚投入、有真实情感或身体感受、有自我觉察或突破 → 85-94 分
  - 文字穿透力强、洞见独到、深度与真情兼具 → 95-100 分
  - **不要只因"还有改进空间"就把分数压在 80 分以下**——改进空间请在 suggestions 里写，不应该压低分数
  - 冥想/内省类作业评分时，真诚与感受力 > 文字技巧；愿意触碰脆弱与痛苦的作业应给予高分回应

- suggestions: (string) 改进建议，**所有分数段都必须提供**，像一位温暖的老师给学生的成长指引

- private_notes_for_gaia: (string) 供系统内部使用的精炼总结

**改进建议(suggestions)撰写指南**：

⚠️ **重要**：每次回复都要有变化，像真人老师一样自然、亲切，不要使用固定模板！
**必须先基于上面那一步诊断（学生已写了哪些维度），再决定建议学生朝哪个方向深化。**
以下是不同分数段的风格与方向库，**从学生尚未触及的维度里挑一个来建议，不要机械套用**：

📌 **90-100分**：充分肯定，邀请深化练习
- 风格：欣赏成就 + 进阶探索邀请
- 方向库（任选一个学生未涉及的）：把觉察延伸到某个具体日常场景 / 观察这份体验背后更深的根源 / 在关系中保持这份觉知 / 把洞见写成一句话分享给他人

📌 **80-89分**：赞赏深度，引导延展
- 风格：高度认可 + 精进方向
- 方向库（**必须挑学生本次没写到的维度**）：
  * 若学生偏重身体感受→邀请探索情绪命名或背后的意象
  * 若学生偏重情绪/洞见→邀请观察身体是如何承载这份情绪的，或把洞见落到一个具体行动
  * 若身体、情绪、洞见都已涵盖→邀请把这份觉察带入关系/日常/下一次实修

📌 **60-79分**：鼓励连接，给出练习方向
- 风格：肯定努力 + 具体建议
- 方向库：放慢速度再体验一次 / 记录冥想中一个具体瞬间 / 尝试连续几天记录变化 / 把一个小洞见带入当天某件具体的事

📌 **30-59分**：理解过程，降低压力
- 风格：理解困难 + 清晰指引
- 参考："冥想需要慢慢适应，别着急。建议找个安静的时刻重新听一遍..."

📌 **0-29分**：温和引导，强调真诚
- 风格：不批评 + 基础引导
- 参考："这次可能需要重新完成。别担心，找个安静的时间，写下一句真实感受就好..."

❌ **反面示例（绝对避免的回复模式）**：
学生提交："冥想中我浑身发冷、冷颤不断，悲痛欲绝，但感到一种置之死地而后生的狂喜。"
错误建议："建议更详细地描述冥想中身体的感觉，比如情绪变化和身体反应。"
→ 学生已经写了身体（发冷、冷颤）和情绪（悲痛、狂喜），这样的建议会让她觉得AI根本没读她的作业。
正确做法：挑她**未触及**的维度，例如："这份'置之死地而后生'的感受很珍贵。可以试着看看它是否指向某段过往经历，或者把这份勇气带到明天的某个具体决定里，观察它如何改变你的行动。"

**2. growth_impact (生长指令)**:
- roots_growth: (object, optional) 如果本次提交属于探索新知识领域，格式：{"self_awareness": 2, "life_sciences": 1}（可用域：self_awareness, life_sciences, universal_laws, creative_expression, social_connection）
- trunk_growth: (object, optional) 如果是冥想或深度内省类提交，格式：{"stability": 1, "thickness": 1}
- new_leaf_generated: (object, optional) 如果包含深刻洞见，格式：{"count": 3}
- fruit_generated: (object, optional) 如果是PBL项目最终成果，格式：{"type": "project_fruit", "title": "果实名称", "earned_from": "项目名", "earned_at": "2025-11-03"}

**重要**：只输出有效的JSON，不要添加任何Markdown代码块标记。格式示例：
{
  "evaluation": {
    "feedback": "你的反思非常真诚，能看出你在认真思考课程内容...",
    "score": 72,
    "suggestions": "你已经迈出了很好的一步！下次可以试着把这份觉察带到日常里的一个具体瞬间，比如早上醒来的第一分钟，看看它会如何改变你的反应。期待你的下一次分享！",
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

    // 🔒 安全检查：验证课程解锁状态（防止通过API绕过解锁限制）
    const unlockCheck = await checkCourseUnlock(user_id, content_id)
    if (!unlockCheck.isUnlocked) {
      console.log(`🚫 课程未解锁：${unlockCheck.reason}`)
      return new Response(
        JSON.stringify({ error: unlockCheck.reason || '该课程尚未解锁，无法提交作业' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

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
    // 注意：不同课程的作业要求字段不同
    // - 聆听课程/通用课程: goals, main_content
    // - 破晓觉醒课程: life_practice（生活实践）, meditation_guide（冥想练习）
    const { data: courseContent } = await supabase
      .from('course_contents')
      .select('title, subtitle, original_text, main_content, goals, life_practice, meditation_guide, system_id')
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

    // 3.3b 获取学生姓名（用于 AI 反馈称呼）
    const { data: studentProfile2 } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single()
    const studentName = studentProfile2?.full_name?.trim() || '（未设置）'

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

    // 构建作业要求，优先级：
    // 1. life_practice（生活实践） - 破晓觉醒课程的主要作业
    // 2. goals（今日目标） - 通用课程
    // 3. main_content（主要内容） - 备选
    // 4. original_text（原文） - 最后备选
    const assignmentText = courseContent?.life_practice
      || courseContent?.goals
      || courseContent?.main_content
      || courseContent?.original_text
      || '无'

    // 如果有冥想练习指南，也加入作业上下文
    const meditationContext = courseContent?.meditation_guide
      ? `\n冥想练习指南：${courseContent.meditation_guide}`
      : ''

    const assignmentRequirements = courseContent
      ? `作业标题：${courseContent.title}
副标题：${courseContent.subtitle || '无'}
作业要求：${assignmentText}${meditationContext}`
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
      .replace(/\{student_name\}/g, studentName)
      .replace('{student_profile}', studentProfile)
      .replace('{course_goals}', courseGoals)
      .replace('{assignment_requirements}', assignmentRequirements)
      .replace('{recent_history}', recentHistory)
      .replace('{submission_content}', submission_content)

    // 5. 调用 xAI Grok API（OpenAI 兼容格式）
    console.log('🤖 调用 xAI Grok API 进行评估...')

    const openaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
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
      console.error('❌ xAI API 调用失败:', errorText)
      throw new Error(`xAI API error: ${errorText}`)
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

    // 8. 🔥 自动解锁下一课（如果分数≥60）
    const score = aiResult.evaluation?.score || 0
    if (score >= 60) {
      console.log(`🔓 分数${score}≥60，自动解锁下一课...`)

      try {
        // 查询或创建 user_progress 记录
        const { data: existingProgress } = await supabase
          .from('user_progress')
          .select('id, completed')
          .eq('user_id', user_id)
          .eq('content_id', content_id)
          .single()

        if (existingProgress) {
          // 更新现有记录
          await supabase
            .from('user_progress')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('id', existingProgress.id)

          console.log('✅ 已更新 user_progress，标记为已完成')
        } else {
          // 创建新记录
          await supabase
            .from('user_progress')
            .insert({
              user_id,
              content_id,
              completed: true,
              completed_at: new Date().toISOString(),
            })

          console.log('✅ 已创建 user_progress 记录，标记为已完成')
        }
      } catch (progressError) {
        console.error('⚠️ 更新 user_progress 失败（不影响主流程）:', progressError)
      }
    } else {
      console.log(`⚠️ 分数${score}<60，不解锁下一课`)
    }

    // 9. 驱动意识树生长（调用RPC函数）
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

    // 10. 返回评估结果（包含是否解锁信息）
    console.log('✨ 评估完成')

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        evaluation: aiResult.evaluation,
        growth_impact: aiResult.growth_impact,
        unlocked_next: score >= 60,  // 🔥 告知前端是否解锁下一课
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

// 管理员邮箱白名单（与 app/courses/[system_key]/[content_id]/page.tsx 保持一致）
// 这些账号用于测试/演示，可以跳过链式解锁检查
const ADMIN_EMAILS = ['3368327@qq.com', 'onestnet@gmail.com']

// 辅助函数：检查课程解锁状态（链式检查）
async function checkCourseUnlock(
  userId: string,
  contentId: string
): Promise<{ isUnlocked: boolean; reason?: string }> {
  try {
    // 0. 管理员邮箱白名单绕过（用于测试/演示）
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || ''
    if (ADMIN_EMAILS.includes(email)) {
      console.log(`🔓 管理员账户 ${email}，跳过链式解锁检查`)
      return { isUnlocked: true }
    }

    // 1. 获取当前课程内容及其所属体系
    const { data: content, error: contentError } = await supabase
      .from('course_contents')
      .select('id, sequence_number, system_id')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return { isUnlocked: false, reason: '课程不存在' }
    }

    // 2. 获取课程体系信息
    const { data: system, error: systemError } = await supabase
      .from('course_systems')
      .select('id, structure_type')
      .eq('id', content.system_id)
      .single()

    if (systemError || !system) {
      return { isUnlocked: false, reason: '课程体系不存在' }
    }

    // 只对 daily_sequential 类型（倾听课程）进行检查
    if (system.structure_type !== 'daily_sequential') {
      return { isUnlocked: true }
    }

    // 第一天永远解锁
    if (content.sequence_number === 1) {
      return { isUnlocked: true }
    }

    // 3. 获取该课程体系中所有 sequence_number < 当前 的课程
    const { data: previousContents, error: prevError } = await supabase
      .from('course_contents')
      .select('id, sequence_number')
      .eq('system_id', system.id)
      .eq('is_published', true)
      .lt('sequence_number', content.sequence_number)
      .order('sequence_number', { ascending: true })

    if (prevError || !previousContents) {
      return { isUnlocked: false, reason: '查询课程失败' }
    }

    if (previousContents.length === 0) {
      return { isUnlocked: true }
    }

    // 4. 获取用户在这些课程中的提交分数
    const previousContentIds = previousContents.map(c => c.id)

    const { data: submissions, error: subError } = await supabase
      .from('user_submissions')
      .select('course_content_id, score')
      .eq('user_id', userId)
      .in('course_content_id', previousContentIds)
      .eq('status', 'approved')

    if (subError) {
      return { isUnlocked: false, reason: '查询提交记录失败' }
    }

    // 5. 创建分数映射（取最高分）
    const scoreMap = new Map<string, number>()
    submissions?.forEach(sub => {
      if (!sub.course_content_id) return
      const existingScore = scoreMap.get(sub.course_content_id) || 0
      if (sub.score && sub.score > existingScore) {
        scoreMap.set(sub.course_content_id, sub.score)
      }
    })

    // 6. 链式检查：从第1天开始，每一天都必须>=60分
    for (const prevContent of previousContents) {
      const score = scoreMap.get(prevContent.id) || 0
      if (score < 60) {
        return {
          isUnlocked: false,
          reason: `需要先完成第${prevContent.sequence_number}天的课程（获得60分以上）`
        }
      }
    }

    return { isUnlocked: true }
  } catch (error) {
    console.error('检查课程解锁状态失败:', error)
    return { isUnlocked: false, reason: '检查解锁状态失败' }
  }
}
