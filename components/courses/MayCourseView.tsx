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

// 31天课程的色彩配置（智慧主题：从靛蓝深夜到金色觉醒）
const MAY_COLORS = [
  { from: '#1a237e', to: '#283593' },   // Day 1 - 深夜靛蓝
  { from: '#283593', to: '#303f9f' },   // Day 2 - 星空蓝
  { from: '#303f9f', to: '#3949ab' },   // Day 3 - 宝石蓝
  { from: '#3949ab', to: '#3f51b5' },   // Day 4 - 皇家蓝
  { from: '#3f51b5', to: '#5c6bc0' },   // Day 5 - 鸢尾蓝
  { from: '#5c6bc0', to: '#7986cb' },   // Day 6 - 薰衣草蓝
  { from: '#4527a0', to: '#5e35b1' },   // Day 7 - 智慧紫
  { from: '#5e35b1', to: '#7e57c2' },   // Day 8 - 深紫
  { from: '#7e57c2', to: '#9575cd' },   // Day 9 - 紫晶
  { from: '#9575cd', to: '#b39ddb' },   // Day 10 - 淡紫
  { from: '#0d47a1', to: '#1565c0' },   // Day 11 - 海洋蓝
  { from: '#1565c0', to: '#1976d2' },   // Day 12 - 钴蓝
  { from: '#1976d2', to: '#1e88e5' },   // Day 13 - 天际蓝
  { from: '#1e88e5', to: '#42a5f5' },   // Day 14 - 晴空蓝
  { from: '#42a5f5', to: '#64b5f6' },   // Day 15 - 浅蓝
  { from: '#00695c', to: '#00897b' },   // Day 16 - 森林绿
  { from: '#00897b', to: '#009688' },   // Day 17 - 翡翠
  { from: '#009688', to: '#26a69a' },   // Day 18 - 碧玉绿
  { from: '#26a69a', to: '#4db6ac' },   // Day 19 - 薄荷绿
  { from: '#4db6ac', to: '#80cbc4' },   // Day 20 - 浅碧
  { from: '#558b2f', to: '#689f38' },   // Day 21 - 橄榄绿
  { from: '#689f38', to: '#7cb342' },   // Day 22 - 春绿
  { from: '#7cb342', to: '#8bc34a' },   // Day 23 - 新芽绿
  { from: '#8bc34a', to: '#9ccc65' },   // Day 24 - 嫩叶绿
  { from: '#9ccc65', to: '#aed581' },   // Day 25 - 浅草绿
  { from: '#f9a825', to: '#fbc02d' },   // Day 26 - 金色
  { from: '#fbc02d', to: '#fdd835' },   // Day 27 - 明金
  { from: '#fdd835', to: '#ffeb3b' },   // Day 28 - 闪耀黄
  { from: '#ffeb3b', to: '#ffee58' },   // Day 29 - 光明黄
  { from: '#ffee58', to: '#fff176' },   // Day 30 - 璀璨金
  { from: '#ffd700', to: '#fff8e1' },   // Day 31 - 觉醒之光
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
