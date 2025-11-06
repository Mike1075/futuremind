// evaluate-pbl-task 边缘函数
// 核心功能：PBL项目每日任务批改 + 进度更新

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!

// 初始化Supabase客户端（使用Service Role绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// AI评估提示词模板
const EVALUATION_PROMPT = `你是一位经验丰富的PBL项目导师，擅长评估学生的项目制学习成果。

**项目信息**:
{project_info}

**今日任务目标**:
{task_goals}

**需要交付的成果**:
{deliverables}

**学生提交内容**:
{submission_content}

**附件信息**:
{attachments_info}

**你的任务**:
请基于项目目标、今日任务要求和学生的提交内容，进行全面评估，并以**严格的JSON格式**返回评估结果：

{
  "score": 85,
  "feedback": "你的提交非常棒！你完成了...",
  "suggestions": "如果想进一步提升，可以尝试..."
}

**评分标准**:
- 90-100分: 超出预期，展现出深度思考和创新
- 80-89分: 很好地完成了任务，达到了预期目标
- 70-79分: 完成了基本要求，但还有提升空间
- 60-69分: 基本理解任务，但执行不够充分
- 60分以下: 需要重新理解任务要求

**重要**：只输出有效的JSON，不要添加任何Markdown代码块标记。`

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
    const { user_id, project_id, day_key, submission_content, attachments = [] } = await req.json()

    if (!user_id || !project_id || !day_key || !submission_content) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数：user_id, project_id, day_key, submission_content' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    console.log(`📝 开始评估PBL任务：user_id=${user_id}, project_id=${project_id}, day_key=${day_key}`)

    // 2. 获取项目详情
    const { data: project, error: projectError } = await supabase
      .from('course_contents')
      .select('id, title, subtitle, project_intro, week_plan, difficulty_level')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: '项目不存在' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 3. 解析day_key，找到对应的任务
    const dayMatch = day_key.match(/week(\d+)_day(\d+)/)
    if (!dayMatch) {
      return new Response(
        JSON.stringify({ error: 'day_key格式错误' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const weekNum = parseInt(dayMatch[1])
    const dayNum = parseInt(dayMatch[2])

    const weekPlan = project.week_plan?.find((w: any) => w.week === weekNum)

    if (!weekPlan) {
      console.error(`❌ 未找到第${weekNum}周的计划`)
      return new Response(
        JSON.stringify({
          error: '未找到对应的周计划',
          details: `项目「${project.title}」没有第${weekNum}周的计划`
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // activities数组存储每天的活动，使用day字段或索引来匹配
    let dayPlan

    // 如果activities数组只有1个元素，直接使用它（适用于简化的项目结构）
    if (weekPlan.activities && weekPlan.activities.length === 1) {
      console.log('📌 本周只有1个活动，直接使用')
      dayPlan = weekPlan.activities[0]
    } else {
      // 尝试通过day字段匹配
      dayPlan = weekPlan?.activities?.find((d: any) => {
        // 支持多种day格式："1", "Day 1", "第1天", "3-5" (范围)
        const dayStr = String(d.day || '').toLowerCase()
        return dayStr.includes(dayNum.toString()) ||
               dayStr === `day ${dayNum}` ||
               dayStr === `第${dayNum}天` ||
               dayStr === dayNum.toString()
      })

      // 如果找不到，尝试使用索引
      if (!dayPlan) {
        dayPlan = weekPlan?.activities?.[dayNum - 1]
      }

      // 最后的fallback：如果还找不到，使用第一个activity
      if (!dayPlan && weekPlan.activities && weekPlan.activities.length > 0) {
        console.log('⚠️ 未找到匹配的活动，使用第一个活动作为fallback')
        dayPlan = weekPlan.activities[0]
      }
    }

    if (!dayPlan) {
      console.error(`❌ 未找到第${weekNum}周的任何活动`)
      console.error('可用的活动:', weekPlan.activities)
      return new Response(
        JSON.stringify({
          error: '未找到对应的任务计划',
          details: `第${weekNum}周没有任何活动。请检查项目设置。`
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // 4. 创建提交记录
    const { data: newSubmission, error: insertError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        course_content_id: project_id,
        submission_type: 'pbl_task',
        content: submission_content,
        attachments: attachments,
        metadata: {
          day_key,
          week: weekNum,
          day: dayNum,
          task_title: dayPlan.title
        },
        status: 'under_review',
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

    // 5. 构建AI评估提示词
    console.log('🤖 构建AI评估提示词...')

    const projectInfo = `项目名称：${project.title}
项目简介：${project.project_intro || '无'}
难度级别：${project.difficulty_level || '未设定'}
当前周次：第${weekNum}周 - ${weekPlan?.theme || '未命名主题'}
当前天数：第${dayNum}天`

    const taskGoals = `任务标题：${dayPlan.title}
任务描述：${dayPlan.description || '无'}
时间安排：${dayPlan.day || '无'}`

    const deliverables = Array.isArray(dayPlan.deliverables)
      ? dayPlan.deliverables.join('\n')
      : (dayPlan.deliverables || '无特定交付物')

    const attachmentsInfo = attachments.length > 0
      ? attachments.map((a: any, i: number) => `附件${i + 1}：${a.name} (${a.type})`).join('\n')
      : '无附件'

    const prompt = EVALUATION_PROMPT
      .replace('{project_info}', projectInfo)
      .replace('{task_goals}', taskGoals)
      .replace('{deliverables}', deliverables)
      .replace('{submission_content}', submission_content)
      .replace('{attachments_info}', attachmentsInfo)

    // 6. 调用Gemini API
    console.log('🤖 调用Gemini API进行评估...')

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini API调用失败:', errorText)
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    const aiResultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiResultText) {
      throw new Error('Gemini API未返回有效内容')
    }

    console.log('📥 AI返回内容:', aiResultText.substring(0, 200))

    // 7. 解析AI返回的JSON
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
      // 提供默认评估
      aiResult = {
        score: 75,
        feedback: '你的提交已收到！继续保持这样的学习态度。',
        suggestions: '如果能更详细地描述你的思考过程会更好。'
      }
    }

    // 8. 更新提交记录
    console.log('💾 更新提交记录...')

    const { error: updateError } = await supabase
      .from('user_submissions')
      .update({
        feedback: aiResult.feedback || '',
        score: aiResult.score || 0,
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('❌ 更新提交记录失败:', updateError)
    } else {
      console.log('✅ 提交记录已更新')
    }

    // 9. 更新用户项目进度
    console.log('📊 更新项目进度...')

    // 获取用户选择的项目记录
    const { data: selection, error: selectionError } = await supabase
      .from('user_selected_projects')
      .select('id, progress')
      .eq('user_id', user_id)
      .eq('project_id', project_id)
      .eq('status', 'active')
      .single()

    if (selection) {
      const updatedProgress = {
        ...(selection.progress || {}),
        [day_key]: true
      }

      // 计算完成百分比
      const totalDays = project.week_plan?.reduce((sum: number, week: any) => sum + (week.activities?.length || 0), 0) || 0
      const completedDays = Object.values(updatedProgress).filter(Boolean).length
      const completionPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

      const { error: progressError } = await supabase
        .from('user_selected_projects')
        .update({
          progress: updatedProgress,
          completion_percentage: completionPercentage,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', selection.id)

      if (progressError) {
        console.error('❌ 更新项目进度失败:', progressError)
      } else {
        console.log(`✅ 项目进度已更新：${completionPercentage}%`)
      }
    }

    // 10. 返回评估结果
    console.log('✨ 评估完成')

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        evaluation: {
          score: aiResult.score || 0,
          feedback: aiResult.feedback || '',
          suggestions: aiResult.suggestions || ''
        }
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
