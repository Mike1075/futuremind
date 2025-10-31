import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户权限
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 获取课程数据
    const courseData = await request.json()
    const { system_key, title, description, structure_type, teaching_goals, guidance_keywords, contents } = courseData

    if (!system_key || !title || !description || !structure_type || !contents) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    console.log('💾 开始保存课程数据...')
    console.log('📚 课程标题:', title)
    console.log('📊 内容单元数:', contents.length)

    // 1. 创建课程体系
    const { data: courseSystem, error: systemError } = await (supabase
      .from('course_systems') as any)
      .insert({
        system_key,
        title,
        description,
        structure_type,
        teaching_goals: teaching_goals || description,
        guidance_keywords: guidance_keywords || [],
        total_units: contents.length,
        is_active: true,
        display_order: 999  // 新课程默认排最后
      })
      .select()
      .single()

    if (systemError) {
      console.error('❌ 创建课程体系失败:', systemError)
      return NextResponse.json(
        { error: '创建课程体系失败: ' + systemError.message },
        { status: 500 }
      )
    }

    console.log('✅ 课程体系创建成功, ID:', courseSystem.id)

    // 2. 批量插入课程内容
    const contentsToInsert = contents.map((content: any) => ({
      system_id: courseSystem.id,
      content_type: content.content_type || structure_type,
      sequence_number: content.sequence_number,
      title: content.title,
      subtitle: content.subtitle || '',
      original_text: content.original_text || '',
      deep_interpretation: content.deep_interpretation || null,
      meditation_guide: content.meditation_guide || null,
      life_practice: content.life_practice || null,
      documentary_url: content.documentary_url || null,
      pre_watch_guide: content.pre_watch_guide || null,
      knowledge_points: content.knowledge_points || null,
      socratic_questions: content.socratic_questions || null,
      post_reflection: content.post_reflection || null,
      week_plan: content.week_plan || null,
      day_plan: content.day_plan || null,
      prerequisites: content.prerequisites || null,
      estimated_duration: content.estimated_duration || 0,
      is_published: content.is_published || false
    }))

    const { error: contentsError } = await (supabase
      .from('course_contents') as any)
      .insert(contentsToInsert)

    if (contentsError) {
      console.error('❌ 插入课程内容失败:', contentsError)
      // 如果内容插入失败，删除已创建的课程体系
      await (supabase
        .from('course_systems') as any)
        .delete()
        .eq('id', courseSystem.id)

      return NextResponse.json(
        { error: '插入课程内容失败: ' + contentsError.message },
        { status: 500 }
      )
    }

    console.log('✅ 课程内容插入成功')
    console.log('🎉 课程创建完成!')

    return NextResponse.json({
      success: true,
      courseSystemId: courseSystem.id,
      contentsCount: contents.length
    })

  } catch (error) {
    console.error('❌ 创建课程失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '创建课程失败',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
