/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  consciousness_level: number
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  season_id: string
  current_day: number
  completed_tasks: string[]
  consciousness_growth: number
  created_at: string
  updated_at: string
}

// Client-side auth functions
export const authClient = {
  async signUp(email: string, password: string, fullName: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    return { data, error }
  },

  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  },

  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null, error: string | null }> {
    const supabase = createClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return { profile, error: error?.message || null }
  },

  async updateUserProfile(userId: string, updates: {
    email?: string
    full_name?: string | null
    avatar_url?: string | null
    consciousness_level?: number
  }) {
    const supabase = createClient()

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  },

  async getUserProgress(userId: string): Promise<{ progress: UserProgress | null, error: string | null }> {
    const supabase = createClient()
    
    // Get current active season
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!season) {
      return { progress: null, error: 'No active season found' }
    }

    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('season_id', (season as any).id)
      .single()

    return { progress, error: error?.message || null }
  },

  async updateUserProgress(userId: string, updates: {
    current_day?: number
    completed_tasks?: string[]
    consciousness_growth?: number
  }) {
    const supabase = createClient()
    
    // Get current active season
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!season) {
      return { data: null, error: 'No active season found' }
    }

    // Try to update existing progress
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('season_id', (season as any).id)
      .single()

    if (existingProgress) {
      // Update existing progress
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await (supabase as any)
        .from('user_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('season_id', (season as any).id)
        .select()
        .single()

      return { data, error }
    } else {
      // Create new progress record
      const insertData = {
        user_id: userId,
        season_id: (season as any).id,
        ...updates
      }
      const { data, error } = await (supabase as any)
        .from('user_progress')
        .insert(insertData)
        .select()
        .single()

      return { data, error }
    }
  },

  async completeTask(userId: string, taskId: string) {
    const { progress, error: progressError } = await this.getUserProgress(userId)
    
    if (progressError || !progress) {
      return { error: progressError || 'No progress found' }
    }

    const completedTasks = progress.completed_tasks || []
    if (!completedTasks.includes(taskId)) {
      completedTasks.push(taskId)
      
      const { data, error } = await this.updateUserProgress(userId, {
        completed_tasks: completedTasks,
        consciousness_growth: progress.consciousness_growth + 10
      })

      return { data, error }
    }

    return { data: progress, error: null }
  },

  async getActiveSeasons() {
    const supabase = createClient()
    
    const { data: seasons, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { seasons, error }
  },

  async getPBLProjects() {
    const supabase = createClient()
    
    const { data: projects, error } = await supabase
      .from('pbl_projects')
      .select(`
        *,
        seasons(title),
        project_participants(count)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return { projects, error }
  },

  async joinPBLProject(userId: string, projectId: string) {
    const supabase = createClient()
    
    const insertData = {
      user_id: userId,
      project_id: projectId,
      role: 'participant'
    }
    const { data, error } = await (supabase as any)
      .from('project_participants')
      .insert(insertData)
      .select()
      .single()

    if (!error) {
      // Update project participant count
      await (supabase as any).rpc('increment_project_participants', {
        project_id: projectId
      })
    }

    return { data, error }
  }
}

// Server-side auth functions
export const authServer = {
  async getCurrentUser() {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  async getUserProfile(userId: string) {
    const supabase = createServerClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return { profile, error }
  }
}
