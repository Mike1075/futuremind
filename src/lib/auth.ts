/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import {
  ExtendedUserProfile,
  UserRole,
  Group,
  GroupMember,
  GroupApplication,
  Course,
  CourseEnrollment,
  ExtendedProject,
  hasPermission
} from '@/types/auth'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  consciousness_level: number
  role: UserRole
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
  },

  // 小组管理功能
  async createGroup(userId: string, groupData: {
    name: string
    description?: string
    max_members?: number
    tags?: string[]
  }) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...groupData,
        creator_id: userId,
        max_members: groupData.max_members || 20,
        tags: groupData.tags || []
      })
      .select()
      .single()

    return { data, error }
  },

  async getGroups(filters?: {
    status?: string
    tags?: string[]
    search?: string
  }) {
    const supabase = createClient()

    let query = supabase
      .from('groups')
      .select(`
        *,
        creator:profiles!creator_id(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data: groups, error } = await query

    return { groups, error }
  },

  async joinGroup(userId: string, groupId: string, message?: string) {
    const supabase = createClient()

    // 创建申请
    const { data, error } = await supabase
      .from('group_applications')
      .insert({
        group_id: groupId,
        user_id: userId,
        message: message || null
      })
      .select()
      .single()

    return { data, error }
  },

  async approveGroupApplication(applicationId: string, reviewerId: string) {
    const supabase = createClient()

    // 获取申请信息
    const { data: application, error: appError } = await supabase
      .from('group_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return { error: appError || 'Application not found' }
    }

    // 更新申请状态
    const { error: updateError } = await supabase
      .from('group_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId
      })
      .eq('id', applicationId)

    if (updateError) {
      return { error: updateError }
    }

    // 添加用户到小组
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: application.group_id,
        user_id: application.user_id,
        role: 'member'
      })
      .select()
      .single()

    return { data, error }
  },

  // 项目管理功能
  async createProject(userId: string, projectData: {
    title: string
    description?: string
    season_id: string
    max_participants?: number
    tags?: string[]
    difficulty_level?: number
    estimated_duration?: string
    requirements?: string
  }) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('pbl_projects')
      .insert({
        ...projectData,
        creator_id: userId,
        max_participants: projectData.max_participants || 10,
        tags: projectData.tags || [],
        difficulty_level: projectData.difficulty_level || 1
      })
      .select()
      .single()

    return { data, error }
  },

  async getProjectsWithDetails() {
    const supabase = createClient()

    const { data: projects, error } = await supabase
      .from('pbl_projects')
      .select(`
        *,
        creator:profiles!creator_id(id, full_name, email, role),
        season:seasons(title),
        participants:project_participants(count)
      `)
      .order('created_at', { ascending: false })

    return { projects, error }
  },

  // 课程管理功能
  async createCourse(userId: string, courseData: {
    title: string
    description?: string
    content?: Record<string, unknown>
    difficulty_level?: number
    duration_hours?: number
    tags?: string[]
  }) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        instructor_id: userId,
        difficulty_level: courseData.difficulty_level || 1,
        duration_hours: courseData.duration_hours || 1,
        tags: courseData.tags || [],
        status: 'draft'
      })
      .select()
      .single()

    return { data, error }
  },

  async getCourses(filters?: {
    status?: string
    instructor_id?: string
    tags?: string[]
  }) {
    const supabase = createClient()

    let query = supabase
      .from('courses')
      .select(`
        *,
        instructor:profiles!instructor_id(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.instructor_id) {
      query = query.eq('instructor_id', filters.instructor_id)
    }

    const { data: courses, error } = await query

    return { courses, error }
  },

  async enrollInCourse(userId: string, courseId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        user_id: userId
      })
      .select()
      .single()

    return { data, error }
  },

  // 权限检查
  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const { profile } = await this.getUserProfile(userId)
    if (!profile) return false

    return hasPermission(profile.role, resource, action)
  }
}


