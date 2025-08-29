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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          consciousness_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          consciousness_level?: number
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
    }
  }
}
