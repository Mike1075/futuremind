// @ts-nocheck
'use client'

import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { MeditationCalendarView } from './MeditationCalendarView'

interface JuneCourseViewProps {
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

// 七脉轮彩虹渐变（红→橙→黄→绿→蓝→紫→品红），与1-3月风格一致
const JUNE_COLORS = Array.from({ length: 30 }, (_, i) => {
  const hue = (i / 29) * 330
  const lFrom = (hue > 45 && hue < 85) ? 43 : 50
  return {
    from: hslToHex(hue, 100, lFrom),
    to: hslToHex(hue, 100, lFrom + 17)
  }
})

export function JuneCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: JuneCourseViewProps) {
  return (
    <MeditationCalendarView
      courseSystem={courseSystem}
      contents={contents}
      completionMap={completionMap}
      scoreMap={scoreMap}
      bypassDateCheck={bypassScoreCheck}
      year={2026}
      month={6}
      systemKey="energy_alchemy"
      colors={JUNE_COLORS}
      titleGradient="from-blue-400 via-emerald-400 to-yellow-400"
      subtitle="克里希那穆提《生命之书》六月主题：能量、注意力与暴力"
    />
  )
}
