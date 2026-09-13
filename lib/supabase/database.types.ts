// @ts-nocheck
// 这个文件保留是为了向后兼容
// 所有类型现在从 @/types/database 导出
export type { Database } from '@/types/database'
import type { Database } from '@/types/database'

// 常用类型别名
export type CourseContent = Database['public']['Tables']['course_contents']['Row']
export type CourseSystem = Database['public']['Tables']['course_systems']['Row']
export type CourseStage = Database['public']['Tables']['course_stages']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserSubmission = Database['public']['Tables']['user_submissions']['Row']
export type MediaResource = Database['public']['Tables']['media_resources']['Row']
export type UserSelectedProject = Database['public']['Tables']['user_selected_projects']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']

// Insert and Update types
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Progress type (从 user_progress.progress_type 提取)
export type ProgressType = 'reading' | 'meditation' | 'pbl' | 'insight' | 'artifact'

// Resource 类型（对应 course_contents.resources 的 JSONB 结构）
export interface Resource {
  type: string
  title: string
  url: string
  duration?: string
}

// ExplorerProject 类型（对应 course_contents.explorer_projects 的 JSONB 结构）
export interface ExplorerProject {
  title: string
  name?: string
  description: string
  difficulty: string
  materials?: string[]
  steps?: string[]
  learning_goals?: string[]
  icon?: string
  goal?: string
  tips?: string[]
  expectedOutcome?: string
}

// CQ-02: 添加更多JSON结构类型定义，减少as any使用

// Gaia对话消息类型
export interface GaiaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

// 苏格拉底式问题结构
export interface SocraticQuestions {
  questions?: Array<{
    question: string
    hint?: string
    followUp?: string
  }>
  [key: string]: unknown
}

// 周计划结构
export interface WeekPlan {
  weeks?: Array<{
    week: number
    title: string
    description?: string
    tasks?: Array<{
      title: string
      description?: string
      type?: string
    }>
  }>
  [key: string]: unknown
}

// 文档元数据类型
export interface DocumentMetadata {
  source?: string
  title?: string
  author?: string
  file_id?: string
  chunk_index?: number
  total_chunks?: number
  created_at?: string
  [key: string]: unknown
}

// 意识果实元数据
export interface FruitMetadata {
  source_type?: string
  source_id?: string
  title?: string
  content_preview?: string
  score?: number
  [key: string]: unknown
}

// 类型守卫函数
export function isGaiaMessage(obj: unknown): obj is GaiaMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'role' in obj &&
    'content' in obj &&
    typeof (obj as GaiaMessage).role === 'string' &&
    typeof (obj as GaiaMessage).content === 'string'
  )
}

export function isGaiaMessageArray(arr: unknown): arr is GaiaMessage[] {
  return Array.isArray(arr) && arr.every(isGaiaMessage)
}
