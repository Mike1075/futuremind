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

// 30天课程的色彩配置（能量主题：从深蓝电光到翠绿聚焦到金色炼金）
const JUNE_COLORS = [
  { from: '#1A237E', to: '#283593' },   // Day 1 - 深夜蓝
  { from: '#283593', to: '#3949AB' },   // Day 2 - 靛蓝电光
  { from: '#3949AB', to: '#5C6BC0' },   // Day 3 - 蓝紫能量
  { from: '#1565C0', to: '#1E88E5' },   // Day 4 - 清澈蓝
  { from: '#0277BD', to: '#039BE5' },   // Day 5 - 天空蓝
  { from: '#00838F', to: '#00ACC1' },   // Day 6 - 深青
  { from: '#00695C', to: '#00897B' },   // Day 7 - 翡翠绿
  { from: '#2E7D32', to: '#43A047' },   // Day 8 - 森林绿
  { from: '#388E3C', to: '#66BB6A' },   // Day 9 - 生命绿
  { from: '#558B2F', to: '#7CB342' },   // Day 10 - 青草绿
  { from: '#33691E', to: '#689F38' },   // Day 11 - 橄榄绿
  { from: '#827717', to: '#9E9D24' },   // Day 12 - 黄绿过渡
  { from: '#F57F17', to: '#FDD835' },   // Day 13 - 闪电黄
  { from: '#FF8F00', to: '#FFB300' },   // Day 14 - 琥珀光
  { from: '#EF6C00', to: '#FB8C00' },   // Day 15 - 能量橙
  { from: '#E65100', to: '#F4511E' },   // Day 16 - 炽热橙
  { from: '#BF360C', to: '#E64A19' },   // Day 17 - 熔岩红
  { from: '#D32F2F', to: '#E53935' },   // Day 18 - 力量红
  { from: '#C62828', to: '#EF5350' },   // Day 19 - 烈焰红
  { from: '#AD1457', to: '#E91E63' },   // Day 20 - 玫瑰红
  { from: '#6A1B9A', to: '#AB47BC' },   // Day 21 - 神秘紫
  { from: '#4A148C', to: '#7B1FA2' },   // Day 22 - 皇家紫
  { from: '#311B92', to: '#5E35B1' },   // Day 23 - 宇宙紫
  { from: '#4527A0', to: '#7E57C2' },   // Day 24 - 灵性紫
  { from: '#512DA8', to: '#9575CD' },   // Day 25 - 薰衣草
  { from: '#1565C0', to: '#42A5F5' },   // Day 26 - 宁静蓝
  { from: '#0097A7', to: '#4DD0E1' },   // Day 27 - 清明青
  { from: '#00796B', to: '#4DB6AC' },   // Day 28 - 和谐绿
  { from: '#FFB300', to: '#FFD54F' },   // Day 29 - 光明金
  { from: '#FFD700', to: '#FFFACD' },   // Day 30 - 炼金之光
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
