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
      daily_processing_queue: {
        Row: {
          batch_date: string
          created_at: string
          id: number
          organization_id: string | null
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_date: string
          created_at?: string
          id?: number
          organization_id?: string | null
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_date?: string
          created_at?: string
          id?: number
          organization_id?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discussion_likes: {
        Row: {
          created_at: string | null
          discussion_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discussion_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          discussion_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_likes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_messages: {
        Row: {
          content: string
          created_at: string
          discussion_id: string
          id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "knowledge_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gaia_context_variables: {
        Row: {
          course_guidance_keywords: string[] | null
          course_learning_summary: string | null
          course_system_id: string | null
          course_teaching_goals: string | null
          generated_at: string | null
          id: string
          student_profile: Json | null
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          course_guidance_keywords?: string[] | null
          course_learning_summary?: string | null
          course_system_id?: string | null
          course_teaching_goals?: string | null
          generated_at?: string | null
          id?: string
          student_profile?: Json | null
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          course_guidance_keywords?: string[] | null
          course_learning_summary?: string | null
          course_system_id?: string | null
          course_teaching_goals?: string | null
          generated_at?: string | null
          id?: string
          student_profile?: Json | null
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gaia_context_variables_course_system_id_fkey"
            columns: ["course_system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaia_context_variables_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gaia_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_count: number | null
          messages: Json
          organization_id: string | null
          project_id: string | null
          session_id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          messages?: Json
          organization_id?: string | null
          project_id?: string | null
          session_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          messages?: Json
          organization_id?: string | null
          project_id?: string | null
          session_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gaia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_leaves: {
        Row: {
          ai_reasoning: string | null
          color: string | null
          content: string
          created_at: string | null
          depth_score: number | null
          id: string
          insight_type: string
          is_featured: boolean | null
          is_public: boolean | null
          originality_score: number | null
          position_on_tree: Json | null
          related_domains: Json | null
          source_id: string | null
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          color?: string | null
          content: string
          created_at?: string | null
          depth_score?: number | null
          id?: string
          insight_type?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          originality_score?: number | null
          position_on_tree?: Json | null
          related_domains?: Json | null
          source_id?: string | null
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          color?: string | null
          content?: string
          created_at?: string | null
          depth_score?: number | null
          id?: string
          insight_type?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          originality_score?: number | null
          position_on_tree?: Json | null
          related_domains?: Json | null
          source_id?: string | null
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_type: string
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          message: string | null
          responded_at: string | null
          response_message: string | null
          status: string | null
          target_id: string
          target_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_type: string
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          target_id: string
          target_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_type?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          target_id?: string
          target_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_discussions: {
        Row: {
          content_id: string
          created_at: string
          discussion_type: string
          id: string
          knowledge_point_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          discussion_type: string
          id?: string
          knowledge_point_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          discussion_type?: string
          id?: string
          knowledge_point_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_discussions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      media_resources: {
        Row: {
          course_content_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          external_url: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          resource_type: string | null
        }
        Insert: {
          course_content_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          external_url?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          resource_type?: string | null
        }
        Update: {
          course_content_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          external_url?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_resources_course_content_id_fkey"
            columns: ["course_content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_join_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pbl_project_enrollments: {
        Row: {
          created_at: string | null
          enrolled_at: string | null
          id: string
          notes: string | null
          progress: Json | null
          project_id: string
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          progress?: Json | null
          project_id: string
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          progress?: Json | null
          project_id?: string
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pbl_project_enrollments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          composite_score: number | null
          consciousness_level: number | null
          consciousness_tree_view: Json | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_ai_assist_enabled: boolean | null
          level_progress: number | null
          level_updated_at: string | null
          percentile_rank: number | null
          role: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          composite_score?: number | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_ai_assist_enabled?: boolean | null
          level_progress?: number | null
          level_updated_at?: string | null
          percentile_rank?: number | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          composite_score?: number | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_ai_assist_enabled?: boolean | null
          level_progress?: number | null
          level_updated_at?: string | null
          percentile_rank?: number | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_join_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          project_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_join_requests_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_join_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          joined_at: string | null
          project_id: string
          role_in_project: string | null
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          project_id: string
          role_in_project?: string | null
          user_id: string
        }
        Update: {
          joined_at?: string | null
          project_id?: string
          role_in_project?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_members_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_showcases: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          is_public: boolean
          likes_count: number | null
          project_id: string
          task_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean
          likes_count?: number | null
          project_id: string
          task_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean
          likes_count?: number | null
          project_id?: string
          task_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_showcases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_showcases_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_public: boolean | null
          is_recruiting: boolean | null
          name: string
          organization_id: string
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_recruiting?: boolean | null
          name: string
          organization_id: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_recruiting?: boolean | null
          name?: string
          organization_id?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_likes: {
        Row: {
          created_at: string | null
          id: string
          showcase_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          showcase_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          showcase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_likes_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "project_showcases"
            referencedColumns: ["id"]
          },
        ]
      }
      student_course_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_by_role: string | null
          course_system_id: string | null
          id: string
          status: string | null
          student_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_by_role?: string | null
          course_system_id?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_by_role?: string | null
          course_system_id?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_course_assignments_course_system_id_fkey"
            columns: ["course_system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_course_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          course_id: string | null
          created_at: string | null
          created_by: string | null
          criteria: Json | null
          description: string | null
          group_type: string | null
          id: string
          member_ids: string[] | null
          name: string
          project_id: string | null
          updated_at: string | null
          visible_resource_ids: string[] | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          group_type?: string | null
          id?: string
          member_ids?: string[] | null
          name: string
          project_id?: string | null
          updated_at?: string | null
          visible_resource_ids?: string[] | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          group_type?: string | null
          id?: string
          member_ids?: string[] | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
          visible_resource_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      student_summaries: {
        Row: {
          areas_for_growth: string[] | null
          course_summaries: Json | null
          generated_at: string | null
          generated_by: string | null
          id: string
          last_summary_check_at: string | null
          learning_style: string | null
          messages_since_last_summary: number | null
          overall_summary: string | null
          personality_traits: Json | null
          strengths: string[] | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          valid_until: string | null
        }
        Insert: {
          areas_for_growth?: string[] | null
          course_summaries?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          last_summary_check_at?: string | null
          learning_style?: string | null
          messages_since_last_summary?: number | null
          overall_summary?: string | null
          personality_traits?: Json | null
          strengths?: string[] | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          valid_until?: string | null
        }
        Update: {
          areas_for_growth?: string[] | null
          course_summaries?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          last_summary_check_at?: string | null
          learning_style?: string | null
          messages_since_last_summary?: number | null
          overall_summary?: string | null
          personality_traits?: Json | null
          strengths?: string[] | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string | null
          created_by_ai: boolean | null
          created_by_id: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string | null
          created_by_ai?: boolean | null
          created_by_id: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string | null
          created_by_ai?: boolean | null
          created_by_id?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assignee"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_created_by"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          created_at: string | null
          id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_log: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      user_behavior_stats: {
        Row: {
          avg_submission_time_minutes: number | null
          conversation_minutes: number | null
          conversation_sessions: number | null
          conversation_turns: number | null
          courses_accessed: string[] | null
          date: string
          id: string
          login_count: number | null
          pages_viewed: number | null
          submissions_count: number | null
          total_online_minutes: number | null
          user_id: string | null
          video_watch_minutes: number | null
          videos_completed: number | null
        }
        Insert: {
          avg_submission_time_minutes?: number | null
          conversation_minutes?: number | null
          conversation_sessions?: number | null
          conversation_turns?: number | null
          courses_accessed?: string[] | null
          date: string
          id?: string
          login_count?: number | null
          pages_viewed?: number | null
          submissions_count?: number | null
          total_online_minutes?: number | null
          user_id?: string | null
          video_watch_minutes?: number | null
          videos_completed?: number | null
        }
        Update: {
          avg_submission_time_minutes?: number | null
          conversation_minutes?: number | null
          conversation_sessions?: number | null
          conversation_turns?: number | null
          courses_accessed?: string[] | null
          date?: string
          id?: string
          login_count?: number | null
          pages_viewed?: number | null
          submissions_count?: number | null
          total_online_minutes?: number | null
          user_id?: string | null
          video_watch_minutes?: number | null
          videos_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_interactions: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          interaction_type: string
          item_index: number | null
          item_type: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          item_index?: number | null
          item_type?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          item_index?: number | null
          item_type?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_interactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_domain_exploration: {
        Row: {
          created_at: string | null
          domain_scores: Json | null
          last_evaluated_at: string | null
          total_evaluations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain_scores?: Json | null
          last_evaluated_at?: string | null
          total_evaluations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain_scores?: Json | null
          last_evaluated_at?: string | null
          total_evaluations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_domain_exploration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          organization_id: string
          role_in_org: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id: string
          role_in_org?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id?: string
          role_in_org?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_tasks: string[] | null
          consciousness_growth: number | null
          created_at: string | null
          current_day: number | null
          daily_records: Json
          id: string
          note: string | null
          progress_type: string | null
          progress_value: number | null
          ref_item_id: string | null
          season_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_tasks?: string[] | null
          consciousness_growth?: number | null
          created_at?: string | null
          current_day?: number | null
          daily_records?: Json
          id?: string
          note?: string | null
          progress_type?: string | null
          progress_value?: number | null
          ref_item_id?: string | null
          season_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_tasks?: string[] | null
          consciousness_growth?: number | null
          created_at?: string | null
          current_day?: number | null
          daily_records?: Json
          id?: string
          note?: string | null
          progress_type?: string | null
          progress_value?: number | null
          ref_item_id?: string | null
          season_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_selected_projects: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          id: string
          last_activity_at: string | null
          notes: string | null
          progress: Json | null
          project_id: string
          selected_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          progress?: Json | null
          project_id: string
          selected_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          progress?: Json | null
          project_id?: string
          selected_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_selected_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_selected_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      admin_group_statistics: {
        Row: {
          active_last_week: number | null
          active_students: number | null
          avg_composite_score: number | null
          avg_consciousness_level: number | null
          avg_online_minutes_per_day: number | null
          group_id: string | null
          group_name: string | null
          group_type: string | null
          level_1_count: number | null
          level_2_count: number | null
          level_3_count: number | null
          level_4_count: number | null
          level_5_count: number | null
          level_6_count: number | null
          level_7_count: number | null
          total_online_minutes: number | null
          total_students: number | null
        }
        Relationships: []
      }
      conversation_summary: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          last_message: string | null
          message_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_message?: never
          message_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_message?: never
          message_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gaia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_create_course_groups: { Args: never; Returns: undefined }
      calculate_all_student_levels: {
        Args: never
        Returns: {
          activity_score: number
          composite_score: number
          consciousness_level: number
          dialogue_depth_score: number
          domain_depth_score: number
          percentile_rank: number
          quality_score: number
          user_id: string
        }[]
      }
      can_delete_course: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      can_edit_course: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      can_student_view_resource: {
        Args: { resource_id: string; student_id: string }
        Returns: boolean
      }
      generate_conversation_title: {
        Args: { messages_param: Json }
        Returns: string
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      grow_consciousness_tree: {
        Args: { p_growth_instruction: Json; p_user_id: string }
        Returns: Json
      }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_content_admin: { Args: never; Returns: boolean }
      is_content_editor: { Args: never; Returns: boolean }
      is_content_viewer: { Args: never; Returns: boolean }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_documents_multi: {
        Args: {
          _match_count?: number
          _project_ids: string[]
          _query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      teacher_manages_course: {
        Args: { course_id: string; teacher_id: string }
        Returns: boolean
      }
      teacher_manages_student: {
        Args: { student_id: string; teacher_id: string }
        Returns: boolean
      }
      update_exploration_and_tree_view: {
        Args: { p_growth_scores_json: Json; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
