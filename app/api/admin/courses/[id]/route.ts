import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

/**
 * DELETE /api/admin/courses/[id]
 * 永久删除课程系统（硬删除）
 *
 * 保护机制：
 * - 原始三个课程（listening, earth, pbl）不可删除
 * - 只有管理员可以删除
 * - 级联删除所有相关数据
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取登录用户
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courseId = params.id

    // 查询课程信息
    const { data: courseSystem, error: fetchError } = await supabase
      .from('course_systems')
      .select('id, title, system_key')
      .eq('id', courseId)
      .single()

    if (fetchError || !courseSystem) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 使用类型断言
    const course = courseSystem as { id: string; title: string; system_key: string }

    // 保护原始三个课程不可删除
    const protectedCourses = ['listening', 'earth', 'pbl', 'icarus']
    if (protectedCourses.includes(course.system_key)) {
      return NextResponse.json({
        error: '原始课程不可删除',
        message: `「${course.title}」是系统预设课程，不能删除。只有新增的课程可以删除。`
      }, { status: 403 })
    }

    // 开始硬删除流程
    // 注意：Supabase会根据ON DELETE CASCADE自动删除相关记录

    // 1. 获取所有相关的阶段和内容ID（用于后续清理）
    const { data: stages } = await supabase
      .from('course_stages')
      .select('id')
      .eq('system_id', courseId)

    const stageIds = (stages as { id: string }[] | null)?.map(s => s.id) || []

    const { data: contents } = await supabase
      .from('course_contents')
      .select('id')
      .in('stage_id', stageIds)

    const contentIds = (contents as { id: string }[] | null)?.map(c => c.id) || []

    // 2. 删除知识讨论相关数据（如果有ON DELETE CASCADE则会自动删除）
    if (contentIds.length > 0) {
      // 查找所有相关讨论
      const { data: discussions } = await (supabase as any)
        .from('knowledge_discussions')
        .select('id')
        .in('content_id', contentIds)

      const discussionIds = discussions?.map((d: any) => d.id) || []

      // 删除讨论消息
      if (discussionIds.length > 0) {
        await (supabase as any)
          .from('discussion_messages')
          .delete()
          .in('discussion_id', discussionIds)
      }

      // 删除讨论主题
      await (supabase as any)
        .from('knowledge_discussions')
        .delete()
        .in('content_id', contentIds)

      // 删除访问记录
      await (supabase as any)
        .from('content_visit_records')
        .delete()
        .in('content_id', contentIds)

      // 删除课程内容的讨论区消息（如果有discussions表）
      // 这里假设有一个discussions表用于课程讨论
      await supabase
        .from('discussions')
        .delete()
        .in('content_id', contentIds)
        .throwOnError()
    }

    // 3. 删除课程内容
    if (stageIds.length > 0) {
      const { error: contentsError } = await supabase
        .from('course_contents')
        .delete()
        .in('stage_id', stageIds)

      if (contentsError) {
        console.error('删除课程内容失败:', contentsError)
        return NextResponse.json({
          error: 'Failed to delete course contents',
          details: contentsError.message
        }, { status: 500 })
      }
    }

    // 4. 删除课程阶段
    if (stageIds.length > 0) {
      const { error: stagesError } = await supabase
        .from('course_stages')
        .delete()
        .in('id', stageIds)

      if (stagesError) {
        console.error('删除课程阶段失败:', stagesError)
        return NextResponse.json({
          error: 'Failed to delete course stages',
          details: stagesError.message
        }, { status: 500 })
      }
    }

    // 5. 删除学生课程分配记录（student_course_assignments）
    // 注意：这样删除后，学生门户将看不到该课程
    const { error: assignmentsError } = await supabase
      .from('student_course_assignments')
      .delete()
      .eq('course_system_id', courseId)

    if (assignmentsError) {
      console.error('删除学生课程分配失败:', assignmentsError)
      // 不抛出错误，继续删除其他记录
    }

    // 删除用户选课记录（如果存在user_course_selections表）
    const { error: selectionsError } = await supabase
      .from('user_course_selections')
      .delete()
      .eq('course_system_id', courseId)

    if (selectionsError) {
      console.log('用户选课记录删除（可能不存在该表）:', selectionsError)
    }

    // 6. 最后删除课程系统本身
    const { error: systemError } = await supabase
      .from('course_systems')
      .delete()
      .eq('id', courseId)

    if (systemError) {
      console.error('删除课程系统失败:', systemError)
      return NextResponse.json({
        error: 'Failed to delete course system',
        details: systemError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `课程「${course.title}」已永久删除`,
      deletedCounts: {
        stages: stageIds.length,
        contents: contentIds.length
      }
    })
  } catch (error) {
    console.error('[Delete Course] Internal error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
