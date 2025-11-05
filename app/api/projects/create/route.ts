import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * POST /api/projects/create
 * 创建用户项目 - 包含AI内容审核
 *
 * Body参数:
 * - title: 项目标题
 * - subtitle: 项目副标题（可选）
 * - project_intro: 项目介绍
 * - project_visibility: 'private' | 'public'
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { title, subtitle, project_intro, project_visibility } = await req.json()

    // 验证必填字段
    if (!title || !title.trim()) {
      return NextResponse.json({ error: '项目标题不能为空' }, { status: 400 })
    }

    if (!project_intro || !project_intro.trim()) {
      return NextResponse.json({ error: '项目介绍不能为空' }, { status: 400 })
    }

    if (!['private', 'public'].includes(project_visibility)) {
      return NextResponse.json({ error: '无效的可见性设置' }, { status: 400 })
    }

    // AI内容审核
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI审核服务未配置' }, { status: 500 })
    }

    const contentToReview = `标题: ${title}\n副标题: ${subtitle || '无'}\n介绍: ${project_intro}`

    const moderationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `你是一个内容审核专家。请审核用户提交的项目内容，检查是否包含以下不当内容：
1. 色情、性暗示内容
2. 暴力、血腥内容
3. 政治敏感话题、政治攻击
4. 人身攻击、仇恨言论
5. 违法犯罪内容

请返回JSON格式：
{
  "approved": true/false,
  "reason": "如果不通过，说明原因"
}

只返回JSON，不要其他文字。如果内容健康、符合道德规范，approved应该为true。`
          },
          {
            role: 'user',
            content: contentToReview
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!moderationResponse.ok) {
      console.error('AI moderation failed:', await moderationResponse.text())
      return NextResponse.json({ error: 'AI审核服务暂时不可用' }, { status: 502 })
    }

    const moderationData = await moderationResponse.json()
    const aiResponse = moderationData.choices?.[0]?.message?.content?.trim()

    let reviewResult
    try {
      reviewResult = JSON.parse(aiResponse || '{}')
    } catch {
      console.error('Failed to parse AI response:', aiResponse)
      return NextResponse.json({ error: 'AI审核结果解析失败' }, { status: 500 })
    }

    // 如果审核不通过，返回错误
    if (!reviewResult.approved) {
      return NextResponse.json({
        error: '内容审核未通过',
        reason: reviewResult.reason || '内容可能包含不当信息，请修改后重试'
      }, { status: 400 })
    }

    // 获取伊卡洛斯课程体系ID
    const { data: icarusSystem } = await (supabase as any)
      .from('course_systems')
      .select('id')
      .eq('system_key', 'icarus')
      .single()

    if (!icarusSystem) {
      return NextResponse.json({ error: '系统错误：找不到伊卡洛斯课程体系' }, { status: 500 })
    }

    // 创建项目（插入到course_contents表）
    const { data: project, error: createError } = await (supabase as any)
      .from('course_contents')
      .insert({
        system_id: icarusSystem.id,
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        project_intro: project_intro.trim(),
        content_type: 'icarus',
        project_visibility,
        is_published: true,
        review_status: 'approved',
        created_by: user.id,
        ai_review_result: {
          approved: true,
          reviewed_at: new Date().toISOString(),
          review_type: 'auto_ai'
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create project:', createError)
      return NextResponse.json({ error: '创建项目失败' }, { status: 500 })
    }

    // 如果是公开项目，自动为创建者添加选择记录
    if (project_visibility === 'public') {
      await (supabase as any)
        .from('user_selected_projects')
        .insert({
          user_id: user.id,
          project_id: project.id,
          status: 'active',
          completion_percentage: 0
        })
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        subtitle: project.subtitle,
        project_intro: project.project_intro,
        project_visibility: project.project_visibility
      }
    })
  } catch (error) {
    console.error('[Create Project] Internal error:', error)
    return NextResponse.json({
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}
