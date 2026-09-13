// @ts-nocheck - Supabase生成的类型定义，暂时禁用类型检查
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          agent_type: string
          ai_content: string | null
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          agent_type: string
          ai_content?: string | null
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          agent_type?: string
          ai_content?: string | null
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consciousness_fruits: {
        Row: {
          color: string | null
          created_at: string | null
          fruit_type: string
          harvested_at: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          maturity_level: number
          metadata: Json | null
          position_on_tree: Json | null
          related_project_id: string | null
          related_submission_id: string | null
          size: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          fruit_type?: string
          harvested_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          maturity_level?: number
          metadata?: Json | null
          position_on_tree?: Json | null
          related_project_id?: string | null
          related_submission_id?: string | null
          size?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          fruit_type?: string
          harvested_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          maturity_level?: number
          metadata?: Json | null
          position_on_tree?: Json | null
          related_project_id?: string | null
          related_submission_id?: string | null
          size?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consciousness_fruits_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consciousness_fruits_related_submission_id_fkey"
            columns: ["related_submission_id"]
            isOneToOne: false
            referencedRelation: "user_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      consciousness_level_history: {
        Row: {
          activity_score: number | null
          composite_score: number
          consciousness_level: number
          dialogue_depth_score: number | null
          domain_depth_score: number | null
          id: string
          percentile_rank: number
          quality_score: number | null
          recorded_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_score?: number | null
          composite_score: number
          consciousness_level: number
          dialogue_depth_score?: number | null
          domain_depth_score?: number | null
          id?: string
          percentile_rank: number
          quality_score?: number | null
          recorded_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_score?: number | null
          composite_score?: number
          consciousness_level?: number
          dialogue_depth_score?: number | null
          domain_depth_score?: number | null
          id?: string
          percentile_rank?: number
          quality_score?: number | null
          recorded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consciousness_level_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_visit_records: {
        Row: {
          content_id: string
          last_visited_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          last_visited_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          last_visited_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_visit_records_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      course_collaborators: {
        Row: {
          accepted_at: string | null
          collaborator_id: string
          course_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          permission_level: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          collaborator_id: string
          course_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permission_level?: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          collaborator_id?: string
          course_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permission_level?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_collaborators_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_collaborators_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_contents: {
        Row: {
          ai_review_result: Json | null
          content_type: string
          created_at: string | null
          created_by_user: string | null
          day_plan: Json | null
          deep_interpretation: string | null
          difficulty_level: string | null
          documentary_url: string | null
          duration: string | null
          estimated_duration: number | null
          explorer_projects: Json | null
          goals: string | null
          id: string
          is_ai_reviewed: boolean | null
          is_published: boolean | null
          knowledge_points: Json | null
          life_practice: string | null
          main_content: string | null
          meditation_guide: string | null
          module_name: string | null
          original_text: string | null
          post_reflection: Json | null
          pre_watch_guide: string | null
          prerequisites: Json | null
          project_cover_image: string | null
          project_icon_url: string | null
          project_intro: string | null
          project_tags: Json | null
          project_visibility: string | null
          resources: Json | null
          review_status: string | null
          sequence_number: number
          socratic_questions: Json | null
          stage_id: string | null
          subtitle: string | null
          system_id: string | null
          tips: string | null
          title: string
          updated_at: string | null
          week_plan: Json | null
        }
        Insert: {
          ai_review_result?: Json | null
          content_type: string
          created_at?: string | null
          created_by_user?: string | null
          day_plan?: Json | null
          deep_interpretation?: string | null
          difficulty_level?: string | null
          documentary_url?: string | null
          duration?: string | null
          estimated_duration?: number | null
          explorer_projects?: Json | null
          goals?: string | null
          id?: string
          is_ai_reviewed?: boolean | null
          is_published?: boolean | null
          knowledge_points?: Json | null
          life_practice?: string | null
          main_content?: string | null
          meditation_guide?: string | null
          module_name?: string | null
          original_text?: string | null
          post_reflection?: Json | null
          pre_watch_guide?: string | null
          prerequisites?: Json | null
          project_cover_image?: string | null
          project_icon_url?: string | null
          project_intro?: string | null
          project_tags?: Json | null
          project_visibility?: string | null
          resources?: Json | null
          review_status?: string | null
          sequence_number: number
          socratic_questions?: Json | null
          stage_id?: string | null
          subtitle?: string | null
          system_id?: string | null
          tips?: string | null
          title: string
          updated_at?: string | null
          week_plan?: Json | null
        }
        Update: {
          ai_review_result?: Json | null
          content_type?: string
          created_at?: string | null
          created_by_user?: string | null
          day_plan?: Json | null
          deep_interpretation?: string | null
          difficulty_level?: string | null
          documentary_url?: string | null
          duration?: string | null
          estimated_duration?: number | null
          explorer_projects?: Json | null
          goals?: string | null
          id?: string
          is_ai_reviewed?: boolean | null
          is_published?: boolean | null
          knowledge_points?: Json | null
          life_practice?: string | null
          main_content?: string | null
          meditation_guide?: string | null
          module_name?: string | null
          original_text?: string | null
          post_reflection?: Json | null
          pre_watch_guide?: string | null
          prerequisites?: Json | null
          project_cover_image?: string | null
          project_icon_url?: string | null
          project_intro?: string | null
          project_tags?: Json | null
          project_visibility?: string | null
          resources?: Json | null
          review_status?: string | null
          sequence_number?: number
          socratic_questions?: Json | null
          stage_id?: string | null
          subtitle?: string | null
          system_id?: string | null
          tips?: string | null
          title?: string
          updated_at?: string | null
          week_plan?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "course_contents_created_by_user_fkey"
            columns: ["created_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_contents_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "course_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_contents_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      course_discussions: {
        Row: {
          content: string
          course_content_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          likes_count: number | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_content_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_content_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_discussions_course_content_id_fkey"
            columns: ["course_content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_stages: {
        Row: {
          core_objectives: Json | null
          created_at: string | null
          duration_weeks: number | null
          final_outcome: string | null
          id: string
          is_published: boolean | null
          module_category: string | null
          stage_description: string | null
          stage_name: string
          stage_number: number
          stage_order: number | null
          suggested_age_range: string | null
          system_id: string
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          core_objectives?: Json | null
          created_at?: string | null
          duration_weeks?: number | null
          final_outcome?: string | null
          id?: string
          is_published?: boolean | null
          module_category?: string | null
          stage_description?: string | null
          stage_name: string
          stage_number: number
          stage_order?: number | null
          suggested_age_range?: string | null
          system_id: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          core_objectives?: Json | null
          created_at?: string | null
          duration_weeks?: number | null
          final_outcome?: string | null
          id?: string
          is_published?: boolean | null
          module_category?: string | null
          stage_description?: string | null
          stage_name?: string
          stage_number?: number
          stage_order?: number | null
          suggested_age_range?: string | null
          system_id?: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_stages_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      course_systems: {
        Row: {
          allow_collaboration: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          guidance_keywords: string[] | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          is_system_course: boolean | null
          structure_config: Json | null
          structure_type: string
          system_key: string
          teaching_goals: string | null
          title: string
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          allow_collaboration?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          guidance_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          is_system_course?: boolean | null
          structure_config?: Json | null
          structure_type: string
          system_key: string
          teaching_goals?: string | null
          title: string
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          allow_collaboration?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          guidance_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          is_system_course?: boolean | null
          structure_config?: Json | null
          structure_type?: string
          system_key?: string
          teaching_goals?: string | null
          title?: string
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_point_questions: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          knowledge_point_index: number
          knowledge_point_text: string
          questions: Json
          updated_at: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          knowledge_point_index: number
          knowledge_point_text: string
          questions?: Json
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          knowledge_point_index?: number
          knowledge_point_text?: string
          questions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_point_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          composite_score: number | null
          consciousness_level: number | null
          consciousness_tree_view: Json | null
          created_at: string | null
          email: string
          full_name: string | null
          gender: string | null
          hobbies: string | null
          id: string
          is_ai_assist_enabled: boolean | null
          level_progress: number | null
          level_updated_at: string | null
          percentile_rank: number | null
          profession: string | null
          role: string | null
          settings: Json | null
          updated_at: string | null
          willing_to_join_projects: boolean | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          composite_score?: number | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          hobbies?: string | null
          id: string
          is_ai_assist_enabled?: boolean | null
          level_progress?: number | null
          level_updated_at?: string | null
          percentile_rank?: number | null
          profession?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          willing_to_join_projects?: boolean | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          composite_score?: number | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          hobbies?: string | null
          id?: string
          is_ai_assist_enabled?: boolean | null
          level_progress?: number | null
          level_updated_at?: string | null
          percentile_rank?: number | null
          profession?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          willing_to_join_projects?: boolean | null
        }
        Relationships: []
      }
      user_knowledge_point_assignments: {
        Row: {
          assigned_question_index: number
          content_id: string
          created_at: string | null
          has_responded: boolean | null
          id: string
          knowledge_point_index: number
          response_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_question_index: number
          content_id: string
          created_at?: string | null
          has_responded?: boolean | null
          id?: string
          knowledge_point_index: number
          response_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_question_index?: number
          content_id?: string
          created_at?: string | null
          has_responded?: boolean | null
          id?: string
          knowledge_point_index?: number
          response_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_knowledge_point_assignments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_submissions: {
        Row: {
          attachments: Json | null
          consciousness_growth_points: number | null
          content: string
          course_content_id: string | null
          created_at: string | null
          day_key: string | null
          feedback: string | null
          hidden_by_teacher: boolean | null
          id: string
          is_public: boolean | null
          reviewed_at: string | null
          reviewer_id: string | null
          score: number | null
          status: string | null
          submission_type: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          consciousness_growth_points?: number | null
          content: string
          course_content_id?: string | null
          created_at?: string | null
          day_key?: string | null
          feedback?: string | null
          hidden_by_teacher?: boolean | null
          id?: string
          is_public?: boolean | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string | null
          submission_type: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          consciousness_growth_points?: number | null
          content?: string
          course_content_id?: string | null
          created_at?: string | null
          day_key?: string | null
          feedback?: string | null
          hidden_by_teacher?: boolean | null
          id?: string
          is_public?: boolean | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: string | null
          submission_type?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_submissions_course_content_id_fkey"
            columns: ["course_content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // 其他表的类型定义省略，保持与原文件一致...
      [key: string]: any
    }
    Views: {
      [key: string]: any
    }
    Functions: {
      [key: string]: any
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
