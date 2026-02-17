// @ts-nocheck
'use client'

import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { MeditationCalendarView } from './MeditationCalendarView'

interface MarchCourseViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
  bypassScoreCheck?: boolean
}

// 31天课程的色彩配置（从温暖到冷色再到金色的渐变）
const MARCH_COLORS = [
  { from: '#FF6B6B', to: '#FF8E53' },   // Day 1 - 温暖红橙
  { from: '#FFB347', to: '#FFCC70' },   // Day 2 - 阳光橙黄
  { from: '#9CCC65', to: '#66BB6A' },   // Day 3 - 自然绿
  { from: '#26C6DA', to: '#4DD0E1' },   // Day 4 - 清澈青
  { from: '#5C6BC0', to: '#7E57C2' },   // Day 5 - 靛蓝紫
  { from: '#AB47BC', to: '#BA68C8' },   // Day 6 - 神秘紫
  { from: '#EC407A', to: '#F06292' },   // Day 7 - 温柔粉
  { from: '#78909C', to: '#90A4AE' },   // Day 8 - 沉静灰蓝
  { from: '#FFD54F', to: '#FFF176' },   // Day 9 - 金色光明
  { from: '#E57373', to: '#EF5350' },   // Day 10 - 烈焰红
  { from: '#F06292', to: '#EC407A' },   // Day 11 - 玫瑰粉
  { from: '#BA68C8', to: '#AB47BC' },   // Day 12 - 兰紫
  { from: '#9575CD', to: '#7E57C2' },   // Day 13 - 薰衣草
  { from: '#7986CB', to: '#5C6BC0' },   // Day 14 - 鸢尾蓝
  { from: '#64B5F6', to: '#42A5F5' },   // Day 15 - 天空蓝
  { from: '#4FC3F7', to: '#29B6F6' },   // Day 16 - 湖水蓝
  { from: '#4DD0E1', to: '#26C6DA' },   // Day 17 - 碧波青
  { from: '#4DB6AC', to: '#26A69A' },   // Day 18 - 翡翠绿
  { from: '#81C784', to: '#66BB6A' },   // Day 19 - 春芽绿
  { from: '#AED581', to: '#9CCC65' },   // Day 20 - 新叶绿
  { from: '#DCE775', to: '#D4E157' },   // Day 21 - 柠檬黄绿
  { from: '#FFF176', to: '#FFEE58' },   // Day 22 - 明黄
  { from: '#FFD54F', to: '#FFCA28' },   // Day 23 - 暖阳金
  { from: '#FFB74D', to: '#FFA726' },   // Day 24 - 琥珀橙
  { from: '#FF8A65', to: '#FF7043' },   // Day 25 - 日落橙
  { from: '#A1887F', to: '#8D6E63' },   // Day 26 - 大地棕
  { from: '#90A4AE', to: '#78909C' },   // Day 27 - 银灰蓝
  { from: '#E0E0E0', to: '#BDBDBD' },   // Day 28 - 月光银
  { from: '#CE93D8', to: '#BA68C8' },   // Day 29 - 暮光紫
  { from: '#F48FB1', to: '#F06292' },   // Day 30 - 晨曦粉
  { from: '#FFD700', to: '#FFC107' },   // Day 31 - 觉醒金
]

export function MarchCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: MarchCourseViewProps) {
  return (
    <MeditationCalendarView
      courseSystem={courseSystem}
      contents={contents}
      completionMap={completionMap}
      scoreMap={scoreMap}
      bypassDateCheck={bypassScoreCheck}
      year={2026}
      month={3}
      systemKey="dependency_freedom"
      colors={MARCH_COLORS}
      titleGradient="from-rose-400 via-purple-400 to-indigo-400"
      subtitle="克里希那穆提《生命之书》三月主题：依赖、执著、关系、恐惧"
    />
  )
}
