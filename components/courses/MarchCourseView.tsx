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

// 31天课程的色彩配置（7脉轮鲜艳渐变）
const MARCH_COLORS = [
  // 🔴 海底轮 Root Chakra - 炽红 (Days 1-5)
  { from: '#FF0000', to: '#FF5555' },   // Day 1 - 纯红
  { from: '#FF1100', to: '#FF4422' },   // Day 2 - 火焰红
  { from: '#FF2200', to: '#FF6633' },   // Day 3 - 赤红
  { from: '#FF3300', to: '#FF7744' },   // Day 4 - 橘红
  { from: '#FF5500', to: '#FF8833' },   // Day 5 - 红橙
  // 🟠 脐轮 Sacral Chakra - 明橙 (Days 6-9)
  { from: '#FF6600', to: '#FF9933' },   // Day 6 - 鲜橙
  { from: '#FF7700', to: '#FFAA33' },   // Day 7 - 暖橙
  { from: '#FF8800', to: '#FFBB44' },   // Day 8 - 金橙
  { from: '#FF9900', to: '#FFCC44' },   // Day 9 - 琥珀
  // 🟡 太阳轮 Solar Plexus - 金黄 (Days 10-13)
  { from: '#FFBB00', to: '#FFDD44' },   // Day 10 - 金黄
  { from: '#FFCC00', to: '#FFEE44' },   // Day 11 - 明黄
  { from: '#DDDD00', to: '#EEFF44' },   // Day 12 - 柠檬黄
  { from: '#AADD00', to: '#CCFF44' },   // Day 13 - 黄绿
  // 🟢 心轮 Heart Chakra - 翠绿 (Days 14-18)
  { from: '#44DD00', to: '#88FF44' },   // Day 14 - 青翠
  { from: '#00DD22', to: '#44FF66' },   // Day 15 - 鲜绿
  { from: '#00CC66', to: '#44FFAA' },   // Day 16 - 碧绿
  { from: '#00BBAA', to: '#44FFDD' },   // Day 17 - 青绿
  { from: '#00AADD', to: '#44DDFF' },   // Day 18 - 碧蓝
  // 🔵 喉轮 Throat Chakra - 宝蓝 (Days 19-22)
  { from: '#0088FF', to: '#44AAFF' },   // Day 19 - 天蓝
  { from: '#0055FF', to: '#4488FF' },   // Day 20 - 宝蓝
  { from: '#0033FF', to: '#4466FF' },   // Day 21 - 皇蓝
  { from: '#2200FF', to: '#6644FF' },   // Day 22 - 靛蓝
  // 🟣 眉心轮 Third Eye - 灵紫 (Days 23-26)
  { from: '#4400FF', to: '#8844FF' },   // Day 23 - 紫蓝
  { from: '#6600FF', to: '#AA44FF' },   // Day 24 - 深紫
  { from: '#8800FF', to: '#BB55FF' },   // Day 25 - 亮紫
  { from: '#AA00FF', to: '#CC55FF' },   // Day 26 - 兰紫
  // 👑 顶轮 Crown Chakra - 品红 (Days 27-31)
  { from: '#CC00FF', to: '#DD55FF' },   // Day 27 - 紫罗兰
  { from: '#EE00DD', to: '#FF55EE' },   // Day 28 - 洋红
  { from: '#FF00AA', to: '#FF55CC' },   // Day 29 - 品红
  { from: '#FF0077', to: '#FF55AA' },   // Day 30 - 玫红
  { from: '#FF0044', to: '#FF5577' },   // Day 31 - 绯红
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
