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

// 31天课程的色彩配置（彩虹光谱渐变，与1月课程风格一致）
const MARCH_COLORS = [
  // 红色系 (Days 1-3) - 勇气的火焰
  { from: '#EF4444', to: '#F87171' },   // Day 1 - 正红
  { from: '#DC2626', to: '#EF4444' },   // Day 2 - 深红
  { from: '#EA580C', to: '#FB923C' },   // Day 3 - 朱红
  // 橙色系 (Days 4-6) - 觉知的温暖
  { from: '#F97316', to: '#FB923C' },   // Day 4 - 亮橙
  { from: '#F59E0B', to: '#FBBF24' },   // Day 5 - 琥珀
  { from: '#D97706', to: '#FCD34D' },   // Day 6 - 金橙
  // 黄绿系 (Days 7-9) - 生命的萌芽
  { from: '#EAB308', to: '#FDE047' },   // Day 7 - 明黄
  { from: '#65A30D', to: '#A3E635' },   // Day 8 - 青柠
  { from: '#16A34A', to: '#4ADE80' },   // Day 9 - 翠绿
  // 绿色系 (Days 10-12) - 心的疗愈
  { from: '#059669', to: '#34D399' },   // Day 10 - 翡翠
  { from: '#0D9488', to: '#2DD4BF' },   // Day 11 - 碧绿
  { from: '#0891B2', to: '#22D3EE' },   // Day 12 - 青瓷
  // 蓝色系 (Days 13-16) - 深邃的宁静
  { from: '#0284C7', to: '#38BDF8' },   // Day 13 - 天青
  { from: '#2563EB', to: '#60A5FA' },   // Day 14 - 天蓝
  { from: '#4338CA', to: '#818CF8' },   // Day 15 - 宝蓝
  { from: '#4F46E5', to: '#818CF8' },   // Day 16 - 靛蓝
  // 紫色系 (Days 17-21) - 智慧的转化
  { from: '#6D28D9', to: '#A78BFA' },   // Day 17 - 紫蓝
  { from: '#7C3AED', to: '#A78BFA' },   // Day 18 - 紫晶
  { from: '#8B5CF6', to: '#C4B5FD' },   // Day 19 - 薰衣草
  { from: '#9333EA', to: '#C084FC' },   // Day 20 - 深紫
  { from: '#A855F7', to: '#D8B4FE' },   // Day 21 - 兰花紫
  // 粉紫系 (Days 22-25) - 爱的慈悲
  { from: '#C026D3', to: '#E879F9' },   // Day 22 - 洋紫
  { from: '#D946EF', to: '#F0ABFC' },   // Day 23 - 亮紫
  { from: '#DB2777', to: '#F472B6' },   // Day 24 - 玫红
  { from: '#EC4899', to: '#F9A8D4' },   // Day 25 - 粉红
  // 玫红系 (Days 26-28) - 无惧的力量
  { from: '#E11D48', to: '#FB7185' },   // Day 26 - 绯红
  { from: '#F43F5E', to: '#FDA4AF' },   // Day 27 - 玫瑰
  { from: '#BE123C', to: '#FB7185' },   // Day 28 - 深玫
  // 金色系 (Days 29-31) - 自由之光
  { from: '#F59E0B', to: '#FCD34D' },   // Day 29 - 觉醒金
  { from: '#D97706', to: '#FDE68A' },   // Day 30 - 金辉
  { from: '#CA8A04', to: '#FEF08A' },   // Day 31 - 纯光
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
