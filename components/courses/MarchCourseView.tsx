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

// 31天课程的色彩配置（七脉轮勇气之旅：完整彩虹光谱）
const MARCH_COLORS = [
  { from: '#B71C1C', to: '#C62828' },   // Day 1 - 根轮·深红
  { from: '#C62828', to: '#D32F2F' },   // Day 2 - 根轮·赤红
  { from: '#D32F2F', to: '#E53935' },   // Day 3 - 根轮·明红
  { from: '#E53935', to: '#EF5350' },   // Day 4 - 根轮·亮红
  { from: '#E65100', to: '#EF6C00' },   // Day 5 - 脐轮·深橙
  { from: '#EF6C00', to: '#F57C00' },   // Day 6 - 脐轮·火橙
  { from: '#F57C00', to: '#FF9800' },   // Day 7 - 脐轮·暖橙
  { from: '#FF9800', to: '#FFB300' },   // Day 8 - 脐轮·琥珀
  { from: '#F9A825', to: '#FBC02D' },   // Day 9 - 太阳轮·暖金
  { from: '#FBC02D', to: '#FDD835' },   // Day 10 - 太阳轮·明金
  { from: '#FDD835', to: '#FFEB3B' },   // Day 11 - 太阳轮·阳光
  { from: '#FFEB3B', to: '#FFD600' },   // Day 12 - 太阳轮·纯金
  { from: '#2E7D32', to: '#388E3C' },   // Day 13 - 心轮·森林绿
  { from: '#388E3C', to: '#43A047' },   // Day 14 - 心轮·翡翠
  { from: '#43A047', to: '#4CAF50' },   // Day 15 - 心轮·生命绿
  { from: '#4CAF50', to: '#66BB6A' },   // Day 16 - 心轮·春绿
  { from: '#00838F', to: '#00ACC1' },   // Day 17 - 喉轮·深青
  { from: '#0097A7', to: '#00BCD4' },   // Day 18 - 喉轮·碧青
  { from: '#0288D1', to: '#039BE5' },   // Day 19 - 喉轮·天蓝
  { from: '#1565C0', to: '#1E88E5' },   // Day 20 - 喉轮·宝蓝
  { from: '#1E88E5', to: '#42A5F5' },   // Day 21 - 喉轮·晴空
  { from: '#283593', to: '#3949AB' },   // Day 22 - 眉心轮·靛蓝
  { from: '#3949AB', to: '#5C6BC0' },   // Day 23 - 眉心轮·鸢尾
  { from: '#4527A0', to: '#5E35B1' },   // Day 24 - 眉心轮·深紫
  { from: '#5E35B1', to: '#7E57C2' },   // Day 25 - 眉心轮·紫晶
  { from: '#6A1B9A', to: '#8E24AA' },   // Day 26 - 顶轮·皇紫
  { from: '#8E24AA', to: '#AB47BC' },   // Day 27 - 顶轮·兰紫
  { from: '#AB47BC', to: '#CE93D8' },   // Day 28 - 顶轮·薰衣草
  { from: '#F9A825', to: '#FFC107' },   // Day 29 - 觉醒·金光
  { from: '#FFC107', to: '#FFD54F' },   // Day 30 - 觉醒·金辉
  { from: '#FFD700', to: '#FFF8E1' },   // Day 31 - 觉醒·纯光
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
