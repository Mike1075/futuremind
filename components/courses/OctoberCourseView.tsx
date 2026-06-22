// @ts-nocheck
'use client'

import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { MeditationCalendarView } from './MeditationCalendarView'

interface OctoberCourseViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
  bypassScoreCheck?: boolean
}

// HSL → Hex 转换
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// 七脉轮彩虹渐变（红→橙→黄→绿→蓝→紫→品红），与 1-6 月风格一致
const OCTOBER_COLORS = Array.from({ length: 31 }, (_, i) => {
  const hue = (i / 30) * 330
  const lFrom = (hue > 45 && hue < 85) ? 43 : 50
  return {
    from: hslToHex(hue, 100, lFrom),
    to: hslToHex(hue, 100, lFrom + 17)
  }
})

export function OctoberCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: OctoberCourseViewProps) {
  return (
    <MeditationCalendarView
      courseSystem={courseSystem}
      contents={contents}
      completionMap={completionMap}
      scoreMap={scoreMap}
      bypassDateCheck={bypassScoreCheck}
      year={2026}
      month={10}
      systemKey="time_transformation"
      colors={OCTOBER_COLORS}
      titleGradient="from-amber-400 via-orange-400 to-red-400"
      subtitle="克里希那穆提《生命之书》十月主题：时间、洞见与转化"
    />
  )
}
