import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/submissions?contentId=xxx
 * 获取用户在某个课程内容下的所有提交记录
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const contentId = searchParams.get('contentId')

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId parameter' },
        { status: 400 }
      )
    }

    // 获取用户的提交记录
    const { data: submissions, error } = await supabase
      .from('user_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_content_id', contentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('[Submissions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/submissions/:id
 * 删除一个提交记录
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission id' },
        { status: 400 }
      )
    }

    // 验证这个提交记录属于当前用户
    const { data: submission } = await supabase
      .from('user_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single()

    if (!submission || (submission as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 403 }
      )
    }

    // 删除提交记录
    const { error } = await supabase
      .from('user_submissions')
      .delete()
      .eq('id', submissionId)

    if (error) {
      console.error('Error deleting submission:', error)
      return NextResponse.json(
        { error: 'Failed to delete submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Submissions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
