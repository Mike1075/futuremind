import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          consciousness_level: number
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          consciousness_level?: number
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          consciousness_level?: number
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      seasons: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          season_id: string
          current_day: number
          completed_tasks: string[]
          consciousness_growth: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          season_id: string
          current_day?: number
          completed_tasks?: string[]
          consciousness_growth?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          season_id?: string
          current_day?: number
          completed_tasks?: string[]
          consciousness_growth?: number
          created_at?: string
          updated_at?: string
        }
      }
      gaia_conversations: {
        Row: {
          id: string
          user_id: string
          messages: Record<string, unknown>[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Record<string, unknown>[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Record<string, unknown>[]
          created_at?: string
          updated_at?: string
        }
      }
      pbl_projects: {
        Row: {
          id: string
          title: string
          description: string | null
          season_id: string
          max_participants: number
          current_participants: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          season_id: string
          max_participants?: number
          current_participants?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          season_id?: string
          max_participants?: number
          current_participants?: number
          status?: string
          created_at?: string
        }
      }
      project_participants: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          creator_id: string
          max_members: number
          current_members: number
          status: string
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          creator_id: string
          max_members?: number
          current_members?: number
          status?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          creator_id?: string
          max_members?: number
          current_members?: number
          status?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      group_applications: {
        Row: {
          id: string
          group_id: string
          user_id: string
          message: string | null
          status: string
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          message?: string | null
          status?: string
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          message?: string | null
          status?: string
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          content: Record<string, unknown> | null
          instructor_id: string | null
          difficulty_level: number
          duration_hours: number
          tags: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: Record<string, unknown> | null
          instructor_id?: string | null
          difficulty_level?: number
          duration_hours?: number
          tags?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: Record<string, unknown> | null
          instructor_id?: string | null
          difficulty_level?: number
          duration_hours?: number
          tags?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          course_id: string
          user_id: string
          progress: number
          completed_at: string | null
          enrolled_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          progress?: number
          completed_at?: string | null
          enrolled_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          progress?: number
          completed_at?: string | null
          enrolled_at?: string
        }
      }
    }
  }
}
