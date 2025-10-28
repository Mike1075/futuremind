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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          diff?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_locale: string | null
          id: string
          module_id: string | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_locale?: string | null
          id?: string
          module_id?: string | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_locale?: string | null
          id?: string
          module_id?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_item_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "content_module"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["module_id"]
          },
        ]
      }
      content_locale: {
        Row: {
          content: Json
          id: string
          locale: string
          summary: string | null
          title: string
          version_id: string | null
        }
        Insert: {
          content?: Json
          id?: string
          locale: string
          summary?: string | null
          title: string
          version_id?: string | null
        }
        Update: {
          content?: Json
          id?: string
          locale?: string
          summary?: string | null
          title?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_locale_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_version"
            referencedColumns: ["id"]
          },
        ]
      }
      content_module: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_module_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_relation: {
        Row: {
          id: string
          relation_type: string
          source_item_id: string | null
          target_item_id: string | null
          weight: number | null
        }
        Insert: {
          id?: string
          relation_type: string
          source_item_id?: string | null
          target_item_id?: string | null
          weight?: number | null
        }
        Update: {
          id?: string
          relation_type?: string
          source_item_id?: string | null
          target_item_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_relation_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_relation_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "content_relation_target_item_id_fkey"
            columns: ["target_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_relation_target_item_id_fkey"
            columns: ["target_item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
        ]
      }
      content_version: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string | null
          state: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          state: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          state?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_version_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_version_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_version_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
        ]
      }
      course_contents: {
        Row: {
          content_type: string
          created_at: string | null
          day_plan: Json | null
          deep_interpretation: string | null
          documentary_url: string | null
          estimated_duration: number | null
          id: string
          is_published: boolean | null
          knowledge_points: Json | null
          life_practice: string | null
          meditation_guide: string | null
          original_text: string | null
          post_reflection: Json | null
          pre_watch_guide: string | null
          prerequisites: Json | null
          sequence_number: number
          socratic_questions: Json | null
          subtitle: string | null
          system_id: string | null
          title: string
          updated_at: string | null
          week_plan: Json | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          day_plan?: Json | null
          deep_interpretation?: string | null
          documentary_url?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          knowledge_points?: Json | null
          life_practice?: string | null
          meditation_guide?: string | null
          original_text?: string | null
          post_reflection?: Json | null
          pre_watch_guide?: string | null
          prerequisites?: Json | null
          sequence_number: number
          socratic_questions?: Json | null
          subtitle?: string | null
          system_id?: string | null
          title: string
          updated_at?: string | null
          week_plan?: Json | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          day_plan?: Json | null
          deep_interpretation?: string | null
          documentary_url?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean | null
          knowledge_points?: Json | null
          life_practice?: string | null
          meditation_guide?: string | null
          original_text?: string | null
          post_reflection?: Json | null
          pre_watch_guide?: string | null
          prerequisites?: Json | null
          sequence_number?: number
          socratic_questions?: Json | null
          subtitle?: string | null
          system_id?: string | null
          title?: string
          updated_at?: string | null
          week_plan?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "course_contents_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      course_systems: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          structure_config: Json | null
          structure_type: string
          system_key: string
          title: string
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          structure_config?: Json | null
          structure_type: string
          system_key: string
          title: string
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          structure_config?: Json | null
          structure_type?: string
          system_key?: string
          title?: string
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      explorer_participations: {
        Row: {
          contribution_score: number | null
          id: string
          joined_at: string
          project_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          contribution_score?: number | null
          id?: string
          joined_at?: string
          project_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          contribution_score?: number | null
          id?: string
          joined_at?: string
          project_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explorer_participations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "explorer_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explorer_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      explorer_projects: {
        Row: {
          assessment_criteria: Json | null
          category: string
          created_at: string
          creator_id: string | null
          current_participants: number
          day_plan: Json | null
          description: string | null
          difficulty_label: string | null
          difficulty_level: string
          duration_weeks: number
          end_date: string | null
          id: string
          learning_objectives: Json
          max_participants: number
          module_name: string | null
          related_content_ids: Json | null
          requirements: Json
          resources: Json | null
          start_date: string | null
          status: string
          system_id: string | null
          tags: string[]
          title: string
          updated_at: string
          week_plan: Json | null
        }
        Insert: {
          assessment_criteria?: Json | null
          category: string
          created_at?: string
          creator_id?: string | null
          current_participants?: number
          day_plan?: Json | null
          description?: string | null
          difficulty_label?: string | null
          difficulty_level: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          learning_objectives?: Json
          max_participants?: number
          module_name?: string | null
          related_content_ids?: Json | null
          requirements?: Json
          resources?: Json | null
          start_date?: string | null
          status?: string
          system_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          week_plan?: Json | null
        }
        Update: {
          assessment_criteria?: Json | null
          category?: string
          created_at?: string
          creator_id?: string | null
          current_participants?: number
          day_plan?: Json | null
          description?: string | null
          difficulty_label?: string | null
          difficulty_level?: string
          duration_weeks?: number
          end_date?: string | null
          id?: string
          learning_objectives?: Json
          max_participants?: number
          module_name?: string | null
          related_content_ids?: Json | null
          requirements?: Json
          resources?: Json | null
          start_date?: string | null
          status?: string
          system_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          week_plan?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "explorer_projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explorer_projects_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "course_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      explorer_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string
          project_id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "explorer_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explorer_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "explorer_projects"
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
      media_asset: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string | null
          meta: Json | null
          module_id: string | null
          type: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          meta?: Json | null
          module_id?: string | null
          type?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          meta?: Json | null
          module_id?: string | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "media_asset_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "content_module"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["module_id"]
          },
        ]
      }
      media_resources: {
        Row: {
          course_content_id: string | null
          created_at: string | null
          description: string | null
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
      pbl_projects: {
        Row: {
          created_at: string | null
          current_participants: number | null
          description: string | null
          id: string
          max_participants: number | null
          season_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          id?: string
          max_participants?: number | null
          season_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          id?: string
          max_participants?: number | null
          season_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pbl_projects_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consciousness_level: number | null
          consciousness_tree_view: Json | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          consciousness_level?: number | null
          consciousness_tree_view?: Json | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_participants: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pbl_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_optimization_rules: {
        Row: {
          rule_id: number
          rules_text: string
          updated_at: string | null
        }
        Insert: {
          rule_id?: number
          rules_text: string
          updated_at?: string | null
        }
        Update: {
          rule_id?: number
          rules_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      publish_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          id: string
          item_id: string | null
          notes: string | null
          version_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          notes?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publish_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "publish_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_version"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      trigger_log: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: number
          message: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          message?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: number
          message?: string | null
        }
        Relationships: []
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
            foreignKeyName: "user_progress_ref_item_id_fkey"
            columns: ["ref_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_ref_item_id_fkey"
            columns: ["ref_item_id"]
            isOneToOne: false
            referencedRelation: "v_published_content"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "user_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
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
          feedback: string | null
          id: string
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
          feedback?: string | null
          id?: string
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
          feedback?: string | null
          id?: string
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
      v_published_content: {
        Row: {
          item_content: Json | null
          item_id: string | null
          item_slug: string | null
          item_summary: string | null
          item_title: string | null
          locale: string | null
          module_id: string | null
          module_key: string | null
          module_title: string | null
          published_at: string | null
          version_number: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_conversation_title: {
        Args: { messages_param: Json }
        Returns: string
      }
      is_content_admin: { Args: never; Returns: boolean }
      is_content_editor: { Args: never; Returns: boolean }
      is_content_viewer: { Args: never; Returns: boolean }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
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
