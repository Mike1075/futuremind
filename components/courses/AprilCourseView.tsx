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

// 30天课程的色彩配置（热情之旅：烈红→暖橙→金阳→玫瑰→紫光→金辉）
const APRIL_COLORS = [
  { from: '#FF1744', to: '#FF8A80' },   // Day 1 - 烈焰红
  { from: '#FF5252', to: '#FF8A80' },   // Day 2 - 珊瑚红
  { from: '#F44336', to: '#EF9A9A' },   // Day 3 - 明红
  { from: '#E91E63', to: '#F48FB1' },   // Day 4 - 玫红
  { from: '#FF4081', to: '#FF80AB' },   // Day 5 - 亮粉红
  { from: '#FF6E40', to: '#FFAB91' },   // Day 6 - 暖橙
  { from: '#FF9100', to: '#FFCC80' },   // Day 7 - 火焰橙
  { from: '#FF6D00', to: '#FFB74D' },   // Day 8 - 琥珀橙
  { from: '#FFA726', to: '#FFE0B2' },   // Day 9 - 金橙
  { from: '#FFB300', to: '#FFE082' },   // Day 10 - 暖金
  { from: '#FFC107', to: '#FFF176' },   // Day 11 - 向日葵
  { from: '#FFD740', to: '#FFF9C4' },   // Day 12 - 明黄
  { from: '#FFEA00', to: '#FFF59D' },   // Day 13 - 光明黄
  { from: '#FFD600', to: '#FFF176' },   // Day 14 - 阳光金
  { from: '#FFAB00', to: '#FFE57F' },   // Day 15 - 蜜金
  { from: '#FF4081', to: '#FF80AB' },   // Day 16 - 玫瑰红
  { from: '#F50057', to: '#FF80AB' },   // Day 17 - 品红
  { from: '#EC407A', to: '#F8BBD0' },   // Day 18 - 柔粉
  { from: '#E91E63', to: '#F48FB1' },   // Day 19 - 玫瑰
  { from: '#FF69B4', to: '#FFB6D9' },   // Day 20 - 亮粉
  { from: '#D500F9', to: '#EA80FC' },   // Day 21 - 亮紫
  { from: '#AA00FF', to: '#CE93D8' },   // Day 22 - 紫晶
  { from: '#E040FB', to: '#F3E5F5' },   // Day 23 - 薰衣草
  { from: '#7C4DFF', to: '#B388FF' },   // Day 24 - 皇家紫
  { from: '#651FFF', to: '#B388FF' },   // Day 25 - 灵性紫
  { from: '#FF9100', to: '#FFCC80' },   // Day 26 - 涅槃橙
  { from: '#FFA726', to: '#FFE0B2' },   // Day 27 - 金光
  { from: '#FFC107', to: '#FFF176' },   // Day 28 - 金辉
  { from: '#FFD740', to: '#FFF9C4' },   // Day 29 - 璀璨金
  { from: '#FFD700', to: '#FFF8E1' },   // Day 30 - 涅槃之光
]

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
