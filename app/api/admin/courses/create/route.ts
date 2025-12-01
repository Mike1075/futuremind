// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份（使用普通client）
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || !['principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足，仅限校长和老师创建课程' }, { status: 403 })
    }

    // 使用Service Role Client进行数据库操作（绕过RLS）
    const serviceSupabase = createServiceClient()

    // 获取课程数据
    const courseData = await request.json()
    const { system_key, title, description, structure_type, teaching_goals, guidance_keywords, contents } = courseData

    if (!system_key || !title || !description || !structure_type || !contents) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    logger.info('开始保存课程数据', { title, contentsCount: contents.length })

    // 1. 检查system_key是否已存在，如果存在则添加时间戳后缀
    let uniqueSystemKey = system_key
    const { data: existingCourse } = await serviceSupabase
      .from('course_systems')
      .select('system_key')
      .eq('system_key', system_key)
      .single()

    if (existingCourse) {
      const timestamp = Date.now().toString().slice(-6) // 使用最后6位时间戳
      uniqueSystemKey = `${system_key}-${timestamp}`
    }

    // 2. 创建课程体系（使用Service Role绕过RLS）
    const { data: courseSystem, error: systemError } = await serviceSupabase
      .from('course_systems')
      .insert({
        system_key: uniqueSystemKey,
        title,
        description,
        structure_type,
        teaching_goals: teaching_goals || description,
        guidance_keywords: guidance_keywords || [],
        total_units: contents.length,
        is_active: true,
        display_order: 999,  // 新课程默认排最后
        created_by: user.id  // 记录创建者，用于权限控制
      })
      .select()
      .single()

    if (systemError) {
      logger.error('创建课程体系失败', systemError)
      return NextResponse.json(
        { error: '创建课程体系失败' },
        { status: 500 }
      )
    }

    // 2. 批量插入课程内容（使用Service Role绕过RLS）
    const contentsToInsert = contents.map((content: any) => ({
      system_id: courseSystem.id,
      content_type: content.content_type || structure_type,
      sequence_number: content.sequence_number,
      title: content.title,
      subtitle: content.subtitle || '',
      original_text: content.original_text || '',
      // Listening课程字段
      deep_interpretation: content.deep_interpretation || null,
      meditation_guide: content.meditation_guide || null,
      life_practice: content.life_practice || null,
      // Earth课程字段
      documentary_url: content.documentary_url || null,
      pre_watch_guide: content.pre_watch_guide || null,
      knowledge_points: content.knowledge_points || null,
      socratic_questions: content.socratic_questions || null,
      post_reflection: content.post_reflection || null,
      // PBL课程字段
      week_plan: content.week_plan || null,
      day_plan: content.day_plan || null,
      // 通用Daily课程字段
      goals: content.goals || null,
      main_content: content.main_content || null,
      duration: content.duration || null,
      tips: content.tips || null,
      // 通用字段
      prerequisites: content.prerequisites || null,
      estimated_duration: content.estimated_duration || 0,
      is_published: content.is_published || false
    }))

    const { error: contentsError } = await serviceSupabase
      .from('course_contents')
      .insert(contentsToInsert)

    if (contentsError) {
      logger.error('插入课程内容失败', contentsError)
      // 如果内容插入失败，删除已创建的课程体系
      await serviceSupabase
        .from('course_systems')
        .delete()
        .eq('id', courseSystem.id)

      return NextResponse.json(
        { error: '插入课程内容失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      courseSystemId: courseSystem.id,
      contentsCount: contents.length
    })

  } catch (error) {
    logger.error('创建课程失败', error)
    return NextResponse.json(
      { error: '创建课程失败' },
      { status: 500 }
    )
  }
}
