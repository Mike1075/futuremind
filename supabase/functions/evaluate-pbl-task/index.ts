// evaluate-pbl-task 边缘函数
// 基于evaluate-submission，用于PBL项目任务批改

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// 环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

// 初始化Supabase客户端（使用Service Role绕过RLS）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// AI评估提示词模板
const EVALUATION_PROMPT = `你是一位经验丰富的PBL项目导师。

**项目信息**:
{project_info}

**学生提交内容**:
{submission_content}

**你的任务**:
请评估学生的提交，并以JSON格式返回：

{
  "feedback": "你的评价内容...",
  "score": 85
}

**评估要点**：
1. **如果学生上传了图片**：
   - 必须在反馈开头用"【图片内容】"标签详细描述你看到的内容（物品、场景、文字、颜色等）
   - 评估图片内容是否与项目主题相关
   - 例如："【图片内容】我看到图片中是一个地球仪...\\n\\n【评价】你的观察很仔细..."

2. **如果学生只提交了文字**：
   - 直接评估文字内容的质量和相关性
   - 不要因为"没有图片"而降分
   - 只要文字内容与项目相关且质量好，就应该给高分
   - 例如："你的文字描述很详细，充分展示了你的思考过程..."

3. **评分规则（严格执行）**：
   - 内容与项目主题完全无关：0-10分
   - 内容相关但质量很差：11-30分
   - 内容相关且质量一般：31-60分
   - 内容相关且质量良好：61-85分
   - 内容相关且质量优秀：86-100分

4. **评分依据**：
   - 内容是否与项目主题相关（最重要）
   - 思考深度和完整性
   - 观察/实验的细致程度
   - 不要因为提交形式（图片vs文字）而产生偏见

**重要**：
- 图片不是必须的，文字提交同样可以获得高分
- 与项目无关的内容必须低于10分
- 只输出有效的JSON，不要添加Markdown代码块标记`

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
    // 1. 解析请求 - 与evaluate-submission完全一样的方式
    const { user_id, content_id, submission_content, submission_type = 'project_deliverable', day_key, attachments = [], is_public = false } = await req.json()

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

    console.log(`📝 开始评估：user_id=${user_id}, content_id=${content_id}, day_key=${day_key}`)

    // 2. 创建提交记录 - 保存附件信息、day_key和可见性设置
    const { data: newSubmission, error: insertError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        course_content_id: content_id,
        submission_type,
        content: submission_content,
        attachments: attachments.length > 0 ? attachments : null, // 保存图片URL
        day_key: day_key || null, // 保存项目/任务标识
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

    // 3. 获取项目信息（包括sequence_number用于模块判断）
    const { data: courseContent } = await supabase
      .from('course_contents')
      .select('title, project_intro, week_plan, explorer_projects, sequence_number')
      .eq('id', content_id)
      .single()

    // 4. 构建AI提示词
    console.log('🤖 构建AI评估提示词...')

    const projectInfo = courseContent
      ? `项目：${courseContent.title}\n简介：${courseContent.project_intro || '无'}`
      : '暂无项目信息'

    const prompt = EVALUATION_PROMPT
      .replace('{project_info}', projectInfo)
      .replace('{submission_content}', submission_content)

    // 5. 调用OpenAI API - 支持图片识别
    console.log('🤖 调用OpenAI API进行评估...')
    console.log('📎 附件数量:', attachments.length)

    // 构建消息内容（支持图片）
    let userMessage: any

    // 检查是否有图片附件
    const imageAttachments = attachments.filter((att: any) => att.type === 'image')

    if (imageAttachments.length > 0) {
      // 有图片时，使用多模态格式
      console.log('🖼️ 检测到图片附件，使用视觉模式')
      const contentParts = [
        {
          type: 'text',
          text: prompt
        }
      ]

      // 添加所有图片
      for (const img of imageAttachments) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: img.url
          }
        })
      }

      userMessage = {
        role: 'user',
        content: contentParts
      }
    } else {
      // 没有图片时，使用纯文本格式
      userMessage = {
        role: 'user',
        content: prompt
      }
    }

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
            content: '你是一位专业的教育评估专家。请严格按照JSON格式返回评估结果。如果学生提交了图片，请仔细观察图片内容，评估是否与项目要求相符。',
          },
          userMessage,
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

    // 6. 解析AI返回的JSON - 与evaluate-submission完全一样
    let aiResult
    try {
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

    // 7. 更新提交记录 - 与evaluate-submission完全一样
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

    // 8. 更新PBL项目进度（如果有day_key）
    if (day_key) {
      console.log('📊 更新项目进度...')

      const { data: selection } = await supabase
        .from('user_selected_projects')
        .select('id, progress, project_id')
        .eq('user_id', user_id)
        .eq('project_id', content_id)
        .eq('status', 'active')
        .single()

      if (selection) {
        // 查询该 day_key 的所有提交记录，找到最高分
        const { data: submissions } = await supabase
          .from('user_submissions')
          .select('score')
          .eq('user_id', user_id)
          .eq('course_content_id', content_id)
          .eq('day_key', day_key)
          .not('score', 'is', null)
          .order('score', { ascending: false })
          .limit(1)

        const highestScore = submissions && submissions.length > 0 ? submissions[0].score : aiResult.score || 0

        console.log(`📊 ${day_key} 的最高分: ${highestScore}`)

        // 更新 progress，存储最高分而非布尔值
        const updatedProgress = {
          ...((selection.progress as Record<string, number>) || {}),
          [day_key]: highestScore
        }

        // ===== 新的模块化进度计算逻辑 =====
        let completionPercentage = 0

        // 检查是否为探索者项目
        const isExplorerProject = day_key.startsWith('explorer_project_')

        if (isExplorerProject && courseContent?.explorer_projects) {
          // 探索者联盟项目：保持原逻辑
          try {
            const explorerProjects = Array.isArray(courseContent.explorer_projects)
              ? courseContent.explorer_projects
              : JSON.parse(courseContent.explorer_projects)

            const totalTasks = explorerProjects.length
            const completedTasks = Object.keys(updatedProgress).filter(
              key => key.startsWith('explorer_project_') && (updatedProgress[key] || 0) > 0
            ).length

            if (totalTasks > 0) {
              completionPercentage = Math.round((completedTasks / totalTasks) * 100)
            }

            console.log(`✅ 探索者项目进度：${completedTasks}/${totalTasks} = ${completionPercentage}%`)
          } catch (error) {
            console.error('❌ 解析explorer_projects失败:', error)
          }
        } else if (courseContent?.week_plan && courseContent?.sequence_number) {
          // === PBL项目：模块化进度计算 ===
          try {
            const projectSeq = courseContent.sequence_number
            console.log(`📊 项目序号: ${projectSeq}`)

            // 1. 判断项目属于哪个模块
            let moduleNumber = 0
            if (projectSeq >= 1 && projectSeq <= 4) moduleNumber = 1
            else if (projectSeq >= 5 && projectSeq <= 8) moduleNumber = 2
            else if (projectSeq >= 9 && projectSeq <= 12) moduleNumber = 3

            console.log(`📊 所属模块: ${moduleNumber}`)

            // 2. 查询用户在该模块的所有项目
            const moduleProjectIds: string[] = []
            const { data: allProjects } = await supabase
              .from('course_contents')
              .select('id, sequence_number')
              .gte('sequence_number', (moduleNumber - 1) * 4 + 1)
              .lte('sequence_number', moduleNumber * 4)

            if (allProjects) {
              for (const proj of allProjects) {
                moduleProjectIds.push(proj.id)
              }
            }

            console.log(`📊 模块${moduleNumber}的项目IDs:`, moduleProjectIds)

            // 3. 查询用户选择的该模块内的所有项目
            const { data: userModuleProjects } = await supabase
              .from('user_selected_projects')
              .select('project_id, progress, course_contents(sequence_number, week_plan)')
              .eq('user_id', user_id)
              .in('project_id', moduleProjectIds)
              .in('status', ['active', 'paused', 'completed'])

            console.log(`📊 用户在模块${moduleNumber}选择了 ${userModuleProjects?.length || 0} 个项目`)

            // 4. 计算每个项目的完成度（考虑得分权重），取最高值
            let maxProjectCompletion = 0

            if (userModuleProjects && userModuleProjects.length > 0) {
              for (const userProj of userModuleProjects) {
                const projSeq = (userProj as any).course_contents?.sequence_number
                const projWeekPlan = (userProj as any).course_contents?.week_plan
                const projProgress = userProj.progress || {}

                if (!projWeekPlan) continue

                // 计算该项目的总天数
                let projTotalDays = 0
                const weekPlan = Array.isArray(projWeekPlan) ? projWeekPlan : JSON.parse(projWeekPlan)
                weekPlan.forEach((week: any) => {
                  if (week.activities && Array.isArray(week.activities)) {
                    projTotalDays += week.activities.length
                  }
                })

                if (projTotalDays === 0) continue

                // 计算该项目的实际完成度（考虑得分权重）
                const projPrefix = `project_${projSeq}_`
                let totalWeightedProgress = 0

                for (const [key, score] of Object.entries(projProgress)) {
                  if (key.startsWith(projPrefix) && typeof score === 'number' && score > 0) {
                    // 每天的基础进度 = 1 / 总天数
                    const baseProgress = 1 / projTotalDays
                    // 实际进度 = 基础进度 × (得分/100)
                    const actualProgress = baseProgress * (score / 100)
                    totalWeightedProgress += actualProgress
                  }
                }

                // 项目完成度（0-1）
                const projCompletion = totalWeightedProgress

                console.log(`📊 项目${projSeq}: 总天数=${projTotalDays}, 加权进度=${(projCompletion * 100).toFixed(2)}%`)

                // 取最大值
                if (projCompletion > maxProjectCompletion) {
                  maxProjectCompletion = projCompletion
                }
              }
            }

            // 5. 总进度 = 该模块最高项目完成度 * 33.3%
            completionPercentage = Math.round(maxProjectCompletion * 33.3)

            console.log(`✅ 模块${moduleNumber}进度: ${(maxProjectCompletion * 100).toFixed(1)}% * 33.3% = ${completionPercentage}%`)
          } catch (error) {
            console.error('❌ 模块化进度计算失败:', error)
          }
        }

        await supabase
          .from('user_selected_projects')
          .update({
            progress: updatedProgress,
            completion_percentage: completionPercentage,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', selection.id)

        console.log(`✅ 项目进度已更新：completion_percentage=${completionPercentage}%`)
      }
    }

    // 9. 返回评估结果 - 与evaluate-submission完全一样
    console.log('✨ 评估完成')

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        evaluation: {
          feedback: aiResult.feedback || '',
          score: aiResult.score || 0,
        },
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
