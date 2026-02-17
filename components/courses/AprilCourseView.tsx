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

// 30天课程的色彩配置（火焰主题：从暗红到烈焰到金光）
const APRIL_COLORS = [
  { from: '#8B0000', to: '#B22222' },   // Day 1 - 暗火红
  { from: '#A52A2A', to: '#CD5C5C' },   // Day 2 - 炭火棕红
  { from: '#B22222', to: '#DC143C' },   // Day 3 - 深绯红
  { from: '#CD5C5C', to: '#E74C3C' },   // Day 4 - 燃烧红
  { from: '#DC143C', to: '#FF4500' },   // Day 5 - 焰心红
  { from: '#E74C3C', to: '#FF6347' },   // Day 6 - 火焰橙红
  { from: '#FF4500', to: '#FF6B35' },   // Day 7 - 烈焰橙
  { from: '#FF6347', to: '#FF7F50' },   // Day 8 - 珊瑚焰
  { from: '#FF6B35', to: '#FF8C42' },   // Day 9 - 跳动橙
  { from: '#FF7F50', to: '#FFA07A' },   // Day 10 - 温暖橙
  { from: '#FF8C42', to: '#FFB347' },   // Day 11 - 琥珀光
  { from: '#FFA07A', to: '#FFCC70' },   // Day 12 - 蜜金橙
  { from: '#FFB347', to: '#FFD700' },   // Day 13 - 金焰
  { from: '#FFCC70', to: '#FFE066' },   // Day 14 - 阳光金
  { from: '#FFD700', to: '#FFF176' },   // Day 15 - 纯金
  { from: '#E65100', to: '#FF6D00' },   // Day 16 - 熔岩橙
  { from: '#BF360C', to: '#E64A19' },   // Day 17 - 赤陶
  { from: '#D84315', to: '#F4511E' },   // Day 18 - 燃烧棕
  { from: '#F4511E', to: '#FF7043' },   // Day 19 - 热情橙
  { from: '#FF7043', to: '#FF8A65' },   // Day 20 - 柔和焰
  { from: '#FF8A65', to: '#FFAB91' },   // Day 21 - 温柔橘
  { from: '#FFAB91', to: '#FFCCBC' },   // Day 22 - 晨曦粉
  { from: '#FF6E40', to: '#FF9E80' },   // Day 23 - 热情红
  { from: '#FF9E80', to: '#FFD180' },   // Day 24 - 金辉
  { from: '#FFD180', to: '#FFE57F' },   // Day 25 - 烛光黄
  { from: '#FFE57F', to: '#FFF9C4' },   // Day 26 - 柔光黄
  { from: '#F9A825', to: '#FDD835' },   // Day 27 - 向日葵
  { from: '#FDD835', to: '#FFEE58' },   // Day 28 - 明亮黄
  { from: '#FFEE58', to: '#FFF9C4' },   // Day 29 - 月光金
  { from: '#FFD700', to: '#FFFACD' },   // Day 30 - 涅槃金
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
