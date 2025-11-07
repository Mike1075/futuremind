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
  "feedback": "你的反思非常深刻...",
  "score": 85
}

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
    // 1. 解析请求 - 与evaluate-submission完全一样的方式
    const { user_id, content_id, submission_content, submission_type = 'project_deliverable', day_key } = await req.json()

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

    // 2. 创建提交记录 - 与evaluate-submission完全一样
    const { data: newSubmission, error: insertError } = await supabase
      .from('user_submissions')
      .insert({
        user_id,
        course_content_id: content_id,
        submission_type,
        content: submission_content,
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

    // 3. 获取项目信息
    const { data: courseContent } = await supabase
      .from('course_contents')
      .select('title, project_intro, week_plan')
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

    // 5. 调用OpenAI API - 与evaluate-submission完全一样
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
        .select('id, progress')
        .eq('user_id', user_id)
        .eq('project_id', content_id)
        .eq('status', 'active')
        .single()

      if (selection) {
        const updatedProgress = {
          ...(selection.progress || {}),
          [day_key]: true
        }

        await supabase
          .from('user_selected_projects')
          .update({
            progress: updatedProgress,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', selection.id)
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
