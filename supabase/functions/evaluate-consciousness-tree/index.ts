import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 意识树5部位数据结构
interface TreePartData {
  growth_value: number // 0-100
  is_solid: boolean
}

interface ConsciousnessTreeView {
  roots: TreePartData
  trunk: TreePartData
  branches: TreePartData
  leaves: TreePartData
  fruits: TreePartData
  last_updated: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[意识树评估] 开始为用户 ${user_id} 进行评估...`)

    // ========== 1. 数据聚合 ==========

    // 1.1 在线时长和登录次数（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: behaviorStats } = await supabase
      .from('user_behavior_stats')
      .select('total_online_minutes, login_count, conversation_turns, submissions_count')
      .eq('user_id', user_id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    const totalOnlineMinutes = behaviorStats?.reduce((sum, s) => sum + (s.total_online_minutes || 0), 0) || 0
    const totalLogins = behaviorStats?.reduce((sum, s) => sum + (s.login_count || 0), 0) || 0
    const totalConversationTurns = behaviorStats?.reduce((sum, s) => sum + (s.conversation_turns || 0), 0) || 0
    const totalSubmissions = behaviorStats?.reduce((sum, s) => sum + (s.submissions_count || 0), 0) || 0

    // 1.2 与Gaia的对话深度（最近20条消息）
    const { data: conversations } = await supabase
      .from('gaia_conversations')
      .select('messages')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const allMessages = conversations?.messages || []
    const recentMessages = allMessages.slice(-20)

    // 1.3 作业提交（最近10条）
    const { data: submissions } = await supabase
      .from('user_submissions')
      .select('submission_type, content, score, consciousness_growth_points, submitted_at')
      .eq('user_id', user_id)
      .order('submitted_at', { ascending: false })
      .limit(10)

    const meditationCount = submissions?.filter(s => s.submission_type === 'meditation_note').length || 0
    const avgScore = submissions?.length
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : 0

    // 1.4 PBL项目进度
    const { data: projects } = await supabase
      .from('user_selected_projects')
      .select('status, completion_percentage, last_activity_at')
      .eq('user_id', user_id)
      .in('status', ['active', 'completed'])

    const activeProjects = projects?.filter(p => p.status === 'active').length || 0
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0
    const avgCompletion = projects?.length
      ? projects.reduce((sum, p) => sum + p.completion_percentage, 0) / projects.length
      : 0

    // ========== 2. 构建AI提示词 ==========
    const prompt = `你是意识树评估大师，负责评估学员的成长状况并生成意识树的5个部位数据。

## 用户行为数据（最近30天）
- 在线时长: ${totalOnlineMinutes} 分钟
- 登录次数: ${totalLogins} 次
- 对话轮次: ${totalConversationTurns} 轮
- 作业提交: ${totalSubmissions} 份（其中冥想日志 ${meditationCount} 份）
- 平均作业分数: ${avgScore.toFixed(1)} 分
- 活跃PBL项目: ${activeProjects} 个
- 完成PBL项目: ${completedProjects} 个
- 项目平均完成度: ${avgCompletion.toFixed(1)}%

## 最近对话内容
${recentMessages.map((m: any, i: number) => `${i + 1}. ${m.isGaia ? '[Gaia]' : '[学员]'}: ${m.content}`).join('\n')}

## 评估要求
请评估以下5个部位的成长值（growth_value: 0-100）：

1. **根系 (roots)**: 知识获取、深度理解
   - 评估依据: 对话深度、问题质量、知识点探索

2. **树干 (trunk)**: 内在稳态、坚持
   - 评估依据: 登录规律、冥想日志数量、持续性

3. **枝干 (branches)**: 探索广度
   - 评估依据: PBL项目数量、不同主题的探索、活跃度

4. **树叶 (leaves)**: 洞见产出
   - 评估依据: 对话中的深刻思考、反思质量、独特见解

5. **果实 (fruits)**: 创造产出
   - 评估依据: 完成的PBL项目、作业质量、成果分享

**评分标准**:
- 0-20: 初步接触
- 21-40: 基础建立
- 41-60: 稳步成长
- 61-80: 显著进步
- 81-100: 卓越表现

请以JSON格式返回，格式如下：
{
  "roots_growth": 数字,
  "trunk_growth": 数字,
  "branches_growth": 数字,
  "leaves_growth": 数字,
  "fruits_growth": 数字,
  "reasoning": "简要评估理由（100字内）"
}`

    // ========== 3. 调用OpenAI API评估 ==========
    console.log('[AI评估] 调用OpenAI API...')

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY未配置')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的意识树评估专家。请严格按照JSON格式返回评估结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('[AI评估失败]', errorText)
      throw new Error('OpenAI API调用失败')
    }

    const openaiData = await openaiResponse.json()
    const aiContent = openaiData.choices[0].message.content

    console.log('[AI评估完成]', aiContent)

    // 解析AI返回的JSON
    let growthScores
    try {
      // 清理可能的Markdown代码块
      let cleanedText = aiContent.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
      }
      growthScores = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('❌ 解析AI返回的JSON失败:', parseError)
      throw new Error('AI返回格式无效')
    }

    // ========== 4. 虚实依赖链逻辑 ==========
    // 根基不稳 → 树干虚 → 枝干虚 → 果实虚

    const roots_solid = growthScores.roots_growth >= 30 // 根>=30才稳固
    const trunk_solid = roots_solid && growthScores.trunk_growth >= 30
    const branches_solid = trunk_solid && growthScores.branches_growth >= 30
    const fruits_solid = branches_solid && growthScores.fruits_growth >= 40

    // 树叶独立判断（基于洞见质量）
    const leaves_solid = growthScores.leaves_growth >= 30

    // ========== 5. 构建意识树数据 ==========
    const treeView: ConsciousnessTreeView = {
      roots: {
        growth_value: Math.min(100, Math.max(0, growthScores.roots_growth)),
        is_solid: roots_solid,
      },
      trunk: {
        growth_value: Math.min(100, Math.max(0, growthScores.trunk_growth)),
        is_solid: trunk_solid,
      },
      branches: {
        growth_value: Math.min(100, Math.max(0, growthScores.branches_growth)),
        is_solid: branches_solid,
      },
      leaves: {
        growth_value: Math.min(100, Math.max(0, growthScores.leaves_growth)),
        is_solid: leaves_solid,
      },
      fruits: {
        growth_value: Math.min(100, Math.max(0, growthScores.fruits_growth)),
        is_solid: fruits_solid,
      },
      last_updated: new Date().toISOString(),
    }

    // ========== 6. 回写数据库 ==========
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ consciousness_tree_view: treeView })
      .eq('id', user_id)

    if (updateError) {
      console.error('[数据回写失败]', updateError)
      throw new Error('更新意识树数据失败')
    }

    console.log('[评估完成] 意识树已更新:', treeView)

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        tree_view: treeView,
        ai_reasoning: growthScores.reasoning,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[意识树评估错误]', error)
    return new Response(
      JSON.stringify({
        error: '意识树评估失败',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
