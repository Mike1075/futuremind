import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/consciousness/calculate-trunk
 * 计算树干粗细和稳定性（基于冥想数据）
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

    console.log(`🌳 开始计算树干粗细：user_id=${user.id}`)

    // 1. 获取最近90天的冥想记录
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: meditations, error: queryError } = await supabase
      .from('user_submissions')
      .select('submitted_at, content')
      .eq('user_id', user.id)
      .eq('submission_type', 'meditation')
      .gte('submitted_at', ninetyDaysAgo.toISOString())
      .order('submitted_at', { ascending: true })

    if (queryError) throw queryError

    const meditationRecords = meditations || []
    console.log(`📊 找到 ${meditationRecords.length} 条冥想记录`)

    // 2. 解析冥想记录
    const parsedMeditations = meditationRecords.map(m => {
      try {
        const content = JSON.parse(m.content)
        return {
          date: new Date(m.submitted_at).toISOString().split('T')[0],
          duration_minutes: content.duration_minutes || 0,
          submitted_at: m.submitted_at,
        }
      } catch {
        return {
          date: new Date(m.submitted_at).toISOString().split('T')[0],
          duration_minutes: 0,
          submitted_at: m.submitted_at,
        }
      }
    })

    // 3. 计算关键指标

    // 3.1 总次数得分 (0-100)
    const totalCount = parsedMeditations.length
    const countScore = Math.min(100, (totalCount / 90) * 100) // 90天每天1次 = 100分

    // 3.2 连续性得分 - 计算最长连续天数 (0-100)
    const meditationDates = [...new Set(parsedMeditations.map(m => m.date))].sort()
    let longestStreak = 0
    let currentStreak = 1

    for (let i = 1; i < meditationDates.length; i++) {
      const prevDate = new Date(meditationDates[i - 1])
      const currDate = new Date(meditationDates[i])
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
      } else {
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak)
    const streakScore = Math.min(100, (longestStreak / 30) * 100) // 30天连续 = 100分

    // 3.3 规律性得分 - 基于冥想分布的均匀程度 (0-100)
    let regularityScore = 0
    if (meditationDates.length > 1) {
      // 计算每周的冥想天数
      const weeklyMeditations: Record<string, number> = {}
      meditationDates.forEach(date => {
        const d = new Date(date)
        const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`
        weeklyMeditations[weekKey] = (weeklyMeditations[weekKey] || 0) + 1
      })

      const weekCounts = Object.values(weeklyMeditations)
      if (weekCounts.length > 0) {
        const avgPerWeek = weekCounts.reduce((a, b) => a + b, 0) / weekCounts.length
        const variance = weekCounts.reduce((sum, count) => sum + Math.pow(count - avgPerWeek, 2), 0) / weekCounts.length
        const stdDev = Math.sqrt(variance)

        // 标准差越小，规律性越高
        // 完美规律(每周相同天数): stdDev=0, score=100
        // 不规律(标准差>=3): score=0
        regularityScore = Math.max(0, 100 - (stdDev / 3) * 100)
      }
    }

    // 4. 综合稳定性得分 (0-100)
    const stabilityScore = Math.round(
      countScore * 0.4 +      // 总次数 40%
      streakScore * 0.4 +     // 连续性 40%
      regularityScore * 0.2   // 规律性 20%
    )

    // 5. 树干粗细计算 (1-50的范围)
    // 稳定性 0-100 映射到 粗细 5-50
    const thickness = Math.round(5 + (stabilityScore / 100) * 45)

    console.log(`📈 计算结果:`)
    console.log(`  - 总次数得分: ${countScore.toFixed(1)}`)
    console.log(`  - 连续性得分: ${streakScore.toFixed(1)} (最长连续${longestStreak}天)`)
    console.log(`  - 规律性得分: ${regularityScore.toFixed(1)}`)
    console.log(`  - 综合稳定性: ${stabilityScore}`)
    console.log(`  - 树干粗细: ${thickness}`)

    // 6. 更新 profiles.consciousness_tree_view 中的树干数据
    const { data: profile } = await supabase
      .from('profiles')
      .select('consciousness_tree_view')
      .eq('id', user.id)
      .single()

    const existingTreeView = (profile?.consciousness_tree_view as Record<string, any>) || {}
    const updatedTreeView = {
      ...existingTreeView,
      trunk: {
        thickness,
        stability: stabilityScore,
      },
      last_updated: new Date().toISOString(),
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        consciousness_tree_view: updatedTreeView,
      })
      .eq('id', user.id)

    if (profileUpdateError) throw profileUpdateError

    return NextResponse.json({
      success: true,
      user_id: user.id,
      trunk: {
        thickness,
        stability: stabilityScore,
      },
      meditation_stats: {
        total_sessions: totalCount,
        unique_days: meditationDates.length,
        longest_streak: longestStreak,
        count_score: Math.round(countScore),
        streak_score: Math.round(streakScore),
        regularity_score: Math.round(regularityScore),
      },
      message: '树干粗细计算完成',
    })
  } catch (error: any) {
    console.error('❌ 计算失败:', error)
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    )
  }
}
