import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/meditation/record
 * 记录用户的冥想练习
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取当前登录用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { duration_minutes, notes, meditation_type = 'general' } = body

    if (!duration_minutes || duration_minutes < 1) {
      return NextResponse.json(
        { error: '请提供有效的冥想时长（分钟）' },
        { status: 400 }
      )
    }

    // 创建冥想记录（使用 user_submissions 表）
    const { data: submission, error: insertError } = await supabase
      .from('user_submissions')
      .insert({
        user_id: user.id,
        submission_type: 'meditation',
        content: JSON.stringify({
          duration_minutes,
          meditation_type,
          notes: notes || '',
          recorded_at: new Date().toISOString(),
        }),
        status: 'approved', // 冥想记录自动批准
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: '冥想记录已保存',
      data: submission,
    })
  } catch (error: any) {
    logger.error('[冥想] 记录冥想失败', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? `服务器错误: ${error.message}` : '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/meditation/record
 * 获取用户的冥想记录
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权：请先登录' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')

    // 计算日期范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 查询冥想记录
    const { data: meditations, error: queryError } = await supabase
      .from('user_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('submission_type', 'meditation')
      .gte('submitted_at', startDate.toISOString())
      .order('submitted_at', { ascending: false })

    if (queryError) throw queryError

    // 解析内容
    const parsedMeditations = (meditations || []).map(m => {
      try {
        const content = JSON.parse(m.content)
        return {
          id: m.id,
          ...content,
          submitted_at: m.submitted_at,
        }
      } catch {
        return {
          id: m.id,
          duration_minutes: 0,
          meditation_type: 'unknown',
          notes: m.content,
          submitted_at: m.submitted_at,
        }
      }
    })

    // 计算统计数据
    const totalSessions = parsedMeditations.length
    const totalMinutes = parsedMeditations.reduce((sum, m) => sum + (m.duration_minutes || 0), 0)

    // 计算连续天数
    const meditationDates = parsedMeditations.map(m =>
      new Date(m.submitted_at).toISOString().split('T')[0]
    )
    const uniqueDates = [...new Set(meditationDates)].sort().reverse()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i])
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (uniqueDates[i] === expectedDateStr) {
        tempStreak++
        if (i === 0 || uniqueDates[i - 1]) {
          currentStreak = tempStreak
        }
      } else {
        break
      }
    }

    // 计算最长连续天数
    tempStreak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1])
      const currDate = new Date(uniqueDates[i])
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return NextResponse.json({
      success: true,
      data: parsedMeditations,
      stats: {
        total_sessions: totalSessions,
        total_minutes: totalMinutes,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        unique_days: uniqueDates.length,
      }
    })
  } catch (error: any) {
    logger.error('[冥想] 获取冥想记录失败', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? `服务器错误: ${error.message}` : '服务器错误' },
      { status: 500 }
    )
  }
}
