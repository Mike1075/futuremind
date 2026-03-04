// @ts-nocheck
'use client'

import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { MeditationCalendarView } from './MeditationCalendarView'

interface AprilCourseViewProps {
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

// 热情之旅：平滑渐变（玫红310° → 深红0° → 琥珀金45°）
const APRIL_COLORS = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29
  const hue = (310 + t * 95) % 360
  const sat = 76 + Math.sin(t * Math.PI) * 9
  // 黄色区域降低亮度避免刺眼
  const light = (hue > 25 && hue < 55) ? 46 : 50
  return {
    from: hslToHex(hue, sat, light),
    to: hslToHex((hue + 18) % 360, sat - 10, light + 22)
  }
})

export function AprilCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: AprilCourseViewProps) {
  return (
    <MeditationCalendarView
      courseSystem={courseSystem}
      contents={contents}
      completionMap={completionMap}
      scoreMap={scoreMap}
      bypassDateCheck={bypassScoreCheck}
      year={2026}
      month={4}
      systemKey="desire_flame"
      colors={APRIL_COLORS}
      titleGradient="from-red-400 via-orange-400 to-yellow-400"
      subtitle="克里希那穆提《生命之书》四月主题：欲望、快感、爱与热情"
    />
  )
}
