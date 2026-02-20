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

// 31天课程的色彩配置（勇气彩虹之旅：明亮鲜艳的完整光谱）
const MARCH_COLORS = [
  { from: '#FF4444', to: '#FF7777' },   // Day 1 - 烈焰红
  { from: '#FF5252', to: '#FF8A80' },   // Day 2 - 珊瑚红
  { from: '#FF6E40', to: '#FFAB91' },   // Day 3 - 橙红
  { from: '#FF7043', to: '#FFB74D' },   // Day 4 - 暖橙
  { from: '#FF9100', to: '#FFCC80' },   // Day 5 - 琥珀橙
  { from: '#FFA726', to: '#FFE0B2' },   // Day 6 - 金橙
  { from: '#FFB300', to: '#FFE082' },   // Day 7 - 暖金
  { from: '#FFC107', to: '#FFF176' },   // Day 8 - 明金
  { from: '#FFD740', to: '#FFF9C4' },   // Day 9 - 阳光金
  { from: '#C6FF00', to: '#F4FF81' },   // Day 10 - 柠檬绿
  { from: '#76FF03', to: '#CCFF90' },   // Day 11 - 电光绿
  { from: '#00E676', to: '#69F0AE' },   // Day 12 - 翡翠绿
  { from: '#4CAF50', to: '#81C784' },   // Day 13 - 生命绿
  { from: '#1DE9B6', to: '#A7FFEB' },   // Day 14 - 碧玉绿
  { from: '#00E5FF', to: '#84FFFF' },   // Day 15 - 电光青
  { from: '#00BCD4', to: '#80DEEA' },   // Day 16 - 天青
  { from: '#00ACC1', to: '#4DD0E1' },   // Day 17 - 清澈青
  { from: '#2979FF', to: '#82B1FF' },   // Day 18 - 宝蓝
  { from: '#2196F3', to: '#90CAF9' },   // Day 19 - 天蓝
  { from: '#448AFF', to: '#82B1FF' },   // Day 20 - 皇家蓝
  { from: '#536DFE', to: '#8C9EFF' },   // Day 21 - 靛蓝
  { from: '#7C4DFF', to: '#B388FF' },   // Day 22 - 紫晶
  { from: '#651FFF', to: '#B388FF' },   // Day 23 - 电光紫
  { from: '#D500F9', to: '#EA80FC' },   // Day 24 - 亮紫
  { from: '#E040FB', to: '#F3E5F5' },   // Day 25 - 兰花紫
  { from: '#FF4081', to: '#FF80AB' },   // Day 26 - 玫红
  { from: '#F50057', to: '#FF80AB' },   // Day 27 - 品红
  { from: '#FF1744', to: '#FF8A80' },   // Day 28 - 烈红
  { from: '#FFD740', to: '#FFF176' },   // Day 29 - 觉醒金
  { from: '#FFAB00', to: '#FFE57F' },   // Day 30 - 金辉
  { from: '#FFD700', to: '#FFF8E1' },   // Day 31 - 纯光
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
