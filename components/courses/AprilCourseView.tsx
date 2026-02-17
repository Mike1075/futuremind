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

// 30天课程的色彩配置（七脉轮热情之旅：红→橙→金→玫瑰→紫→金光）
const APRIL_COLORS = [
  { from: '#C62828', to: '#D32F2F' },   // Day 1 - 根轮深红
  { from: '#D32F2F', to: '#E53935' },   // Day 2 - 烈焰红
  { from: '#E53935', to: '#EF5350' },   // Day 3 - 明红
  { from: '#E91E63', to: '#EC407A' },   // Day 4 - 玫红
  { from: '#AD1457', to: '#D81B60' },   // Day 5 - 深玫瑰
  { from: '#E65100', to: '#EF6C00' },   // Day 6 - 脐轮深橙
  { from: '#EF6C00', to: '#F57C00' },   // Day 7 - 火焰橙
  { from: '#FF6D00', to: '#FF9100' },   // Day 8 - 琥珀橙
  { from: '#FF8F00', to: '#FFA000' },   // Day 9 - 暖橙
  { from: '#FFA000', to: '#FFB300' },   // Day 10 - 金橙
  { from: '#F9A825', to: '#FBC02D' },   // Day 11 - 太阳轮暖金
  { from: '#FBC02D', to: '#FDD835' },   // Day 12 - 向日葵
  { from: '#FDD835', to: '#FFEB3B' },   // Day 13 - 明黄
  { from: '#FFD600', to: '#FFE082' },   // Day 14 - 光明黄
  { from: '#FFB300', to: '#FFD54F' },   // Day 15 - 蜜金
  { from: '#C2185B', to: '#E91E63' },   // Day 16 - 心轮玫红
  { from: '#E91E63', to: '#F06292' },   // Day 17 - 柔粉
  { from: '#EC407A', to: '#F48FB1' },   // Day 18 - 玫瑰
  { from: '#D81B60', to: '#F50057' },   // Day 19 - 烈粉
  { from: '#FF4081', to: '#FF80AB' },   // Day 20 - 亮粉
  { from: '#7B1FA2', to: '#9C27B0' },   // Day 21 - 顶轮深紫
  { from: '#9C27B0', to: '#AB47BC' },   // Day 22 - 紫晶
  { from: '#AB47BC', to: '#CE93D8' },   // Day 23 - 薰衣草
  { from: '#6A1B9A', to: '#8E24AA' },   // Day 24 - 皇家紫
  { from: '#8E24AA', to: '#BA68C8' },   // Day 25 - 灵性紫
  { from: '#E65100', to: '#F57C00' },   // Day 26 - 涅槃橙
  { from: '#FF8F00', to: '#FFC107' },   // Day 27 - 金光
  { from: '#FFC107', to: '#FFD54F' },   // Day 28 - 金辉
  { from: '#FFD54F', to: '#FFE082' },   // Day 29 - 璀璨金
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
