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

// 30天课程的色彩配置（能量之旅：电光蓝→翠绿→琥珀→烈火→紫光→金辉）
const JUNE_COLORS = [
  { from: '#536DFE', to: '#8C9EFF' },   // Day 1 - 电光蓝
  { from: '#448AFF', to: '#82B1FF' },   // Day 2 - 靛蓝能量
  { from: '#2979FF', to: '#82B1FF' },   // Day 3 - 蓝色能量
  { from: '#00B0FF', to: '#80D8FF' },   // Day 4 - 清澈蓝
  { from: '#00B8D4', to: '#84FFFF' },   // Day 5 - 天青
  { from: '#00BCD4', to: '#80DEEA' },   // Day 6 - 碧青
  { from: '#1DE9B6', to: '#A7FFEB' },   // Day 7 - 翡翠
  { from: '#00E676', to: '#69F0AE' },   // Day 8 - 翠绿
  { from: '#4CAF50', to: '#81C784' },   // Day 9 - 生命绿
  { from: '#8BC34A', to: '#C5E1A5' },   // Day 10 - 青草绿
  { from: '#76FF03', to: '#CCFF90' },   // Day 11 - 荧光绿
  { from: '#C6FF00', to: '#F4FF81' },   // Day 12 - 柠檬绿
  { from: '#FFEA00', to: '#FFF59D' },   // Day 13 - 闪电黄
  { from: '#FFC107', to: '#FFF176' },   // Day 14 - 琥珀光
  { from: '#FF9100', to: '#FFCC80' },   // Day 15 - 能量橙
  { from: '#FF6E40', to: '#FFAB91' },   // Day 16 - 炽热橙
  { from: '#FF5722', to: '#FF8A65' },   // Day 17 - 熔岩橙
  { from: '#FF5252', to: '#FF8A80' },   // Day 18 - 力量红
  { from: '#FF1744', to: '#FF8A80' },   // Day 19 - 烈焰红
  { from: '#F50057', to: '#FF80AB' },   // Day 20 - 玫瑰红
  { from: '#D500F9', to: '#EA80FC' },   // Day 21 - 亮紫
  { from: '#AA00FF', to: '#CE93D8' },   // Day 22 - 皇家紫
  { from: '#7C4DFF', to: '#B388FF' },   // Day 23 - 宇宙紫
  { from: '#651FFF', to: '#B388FF' },   // Day 24 - 灵性紫
  { from: '#E040FB', to: '#F3E5F5' },   // Day 25 - 薰衣草
  { from: '#2196F3', to: '#90CAF9' },   // Day 26 - 宁静蓝
  { from: '#00BCD4', to: '#80DEEA' },   // Day 27 - 清明青
  { from: '#009688', to: '#80CBC4' },   // Day 28 - 和谐绿
  { from: '#FFAB00', to: '#FFE57F' },   // Day 29 - 光明金
  { from: '#FFD700', to: '#FFF8E1' },   // Day 30 - 炼金之光
]

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
