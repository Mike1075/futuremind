// @ts-nocheck
'use client'

import { CourseSystem, CourseContent } from '@/lib/supabase/database.types'
import { MeditationCalendarView } from './MeditationCalendarView'

interface MayCourseViewProps {
  courseSystem: CourseSystem
  contents: CourseContent[]
  completionMap: Map<string, boolean>
  scoreMap: Map<string, number>
  bypassScoreCheck?: boolean
}

// 31天课程的色彩配置（智慧之旅：宝蓝→靛紫→碧青→翡翠→金色觉醒）
const MAY_COLORS = [
  { from: '#536DFE', to: '#8C9EFF' },   // Day 1 - 宝石蓝
  { from: '#448AFF', to: '#82B1FF' },   // Day 2 - 皇家蓝
  { from: '#2979FF', to: '#82B1FF' },   // Day 3 - 天际蓝
  { from: '#2196F3', to: '#90CAF9' },   // Day 4 - 晴空蓝
  { from: '#42A5F5', to: '#BBDEFB' },   // Day 5 - 浅蓝
  { from: '#7C4DFF', to: '#B388FF' },   // Day 6 - 智慧紫
  { from: '#651FFF', to: '#B388FF' },   // Day 7 - 深紫
  { from: '#AA00FF', to: '#CE93D8' },   // Day 8 - 紫晶
  { from: '#E040FB', to: '#F3E5F5' },   // Day 9 - 兰花紫
  { from: '#D500F9', to: '#EA80FC' },   // Day 10 - 亮紫
  { from: '#304FFE', to: '#8C9EFF' },   // Day 11 - 海洋蓝
  { from: '#2962FF', to: '#82B1FF' },   // Day 12 - 钴蓝
  { from: '#00B0FF', to: '#80D8FF' },   // Day 13 - 天蓝
  { from: '#0091EA', to: '#80D8FF' },   // Day 14 - 明蓝
  { from: '#00B8D4', to: '#84FFFF' },   // Day 15 - 碧青
  { from: '#00BCD4', to: '#80DEEA' },   // Day 16 - 天青
  { from: '#009688', to: '#80CBC4' },   // Day 17 - 翡翠
  { from: '#1DE9B6', to: '#A7FFEB' },   // Day 18 - 碧玉
  { from: '#00E676', to: '#69F0AE' },   // Day 19 - 翠绿
  { from: '#69F0AE', to: '#B9F6CA' },   // Day 20 - 浅碧
  { from: '#4CAF50', to: '#A5D6A7' },   // Day 21 - 生命绿
  { from: '#8BC34A', to: '#C5E1A5' },   // Day 22 - 春绿
  { from: '#76FF03', to: '#CCFF90' },   // Day 23 - 新芽绿
  { from: '#C6FF00', to: '#F4FF81' },   // Day 24 - 嫩叶绿
  { from: '#AEEA00', to: '#F4FF81' },   // Day 25 - 浅草绿
  { from: '#FFD740', to: '#FFF9C4' },   // Day 26 - 暖金
  { from: '#FFC107', to: '#FFF176' },   // Day 27 - 明金
  { from: '#FFAB00', to: '#FFE57F' },   // Day 28 - 闪耀金
  { from: '#FFD600', to: '#FFF176' },   // Day 29 - 光明黄
  { from: '#FFD740', to: '#FFF9C4' },   // Day 30 - 璀璨金
  { from: '#FFD700', to: '#FFF8E1' },   // Day 31 - 觉醒之光
]

export function MayCourseView({
  courseSystem,
  contents,
  completionMap,
  scoreMap,
  bypassScoreCheck = false
}: MayCourseViewProps) {
  return (
    <MeditationCalendarView
      courseSystem={courseSystem}
      contents={contents}
      completionMap={completionMap}
      scoreMap={scoreMap}
      bypassDateCheck={bypassScoreCheck}
      year={2026}
      month={5}
      systemKey="wisdom_awakening"
      colors={MAY_COLORS}
      titleGradient="from-indigo-400 via-blue-400 to-emerald-400"
      subtitle="克里希那穆提《生命之书》五月主题：智力、情感、语言与制约"
    />
  )
}
