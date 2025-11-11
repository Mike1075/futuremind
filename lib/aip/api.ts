/**
 * AIP系统 API 工具函数
 * API utility functions for AIP system
 */

// @ts-nocheck - 临时禁用类型检查，待AIP系统类型完善后移除
import { createClient } from '@/lib/supabase/client'
import type {
  Organization,
  Project,
  Task,
  Document,
  ChatRequest,
  ChatResponse,
  Notification,
  Invitation,
  ProjectJoinRequest,
  OrganizationJoinRequest,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateOrganizationInput,
  ApiResponse,
  UserOrganization,
} from './types'

const supabase = createClient()

// ============ 组织相关 API ============

export async function getMyOrganizations(): Promise<ApiResponse<UserOrganization[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: (data as any) || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<ApiResponse<Organization>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // 检查权限（只有teacher和principal可以创建组织）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      throw new Error('只有教师和校长可以创建组织')
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        description: input.description,
      })
      .select()
      .single()

    if (error) throw error

    // 自动将创建者添加为owner
    await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: data.id,
        role_in_org: 'owner',
      })

    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============ 项目相关 API ============

export async function getOrganizationProjects(
  organizationId: string
): Promise<ApiResponse<Project[]>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url),
        organization:organizations(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getPublicProjects(): Promise<ApiResponse<Project[]>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url),
        organization:organizations(id, name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getProjectById(
  projectId: string
): Promise<ApiResponse<Project>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url, email),
        organization:organizations(id, name, description),
        members:project_members(
          *,
          user:user_id(id, full_name, avatar_url, email)
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createProject(
  input: CreateProjectInput
): Promise<ApiResponse<Project>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name,
        description: input.description,
        organization_id: input.organization_id,
        is_public: input.is_public || false,
        is_recruiting: input.is_recruiting || false,
        creator_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // 自动将创建者添加为项目成员
    await supabase
      .from('project_members')
      .insert({
        project_id: data.id,
        user_id: user.id,
        role_in_project: 'owner',
      })

    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ApiResponse<Project>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(input)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteProject(
  projectId: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return { message: '项目已删除' }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getProjectMembers(
  projectId: string
): Promise<ApiResponse<any[]>> {
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id(id, full_name, avatar_url, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============ 任务相关 API ============

export async function getProjectTasks(
  projectId: string
): Promise<ApiResponse<Task[]>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id(id, full_name, avatar_url),
        created_by:created_by_id(id, full_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createTask(
  input: CreateTaskInput
): Promise<ApiResponse<Task>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...input,
        created_by_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ApiResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteTask(taskId: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return { message: '任务已删除' }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============ 通知相关 API ============

export async function getMyNotifications(): Promise<ApiResponse<Notification[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { message: '通知已标记为已读' }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============ 项目加入请求相关 API ============

export async function requestToJoinProject(
  projectId: string,
  message?: string
): Promise<ApiResponse<ProjectJoinRequest>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('project_join_requests')
      .insert({
        project_id: projectId,
        user_id: user.id,
        message: message || null,
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getProjectJoinRequests(
  projectId: string
): Promise<ApiResponse<ProjectJoinRequest[]>> {
  try {
    const { data, error } = await supabase
      .from('project_join_requests')
      .select(`
        *,
        user:user_id(id, full_name, avatar_url, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ============ 文档相关 API ============

export async function getProjectDocuments(
  projectId: string
): Promise<ApiResponse<Document[]>> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [] }
  } catch (error: any) {
    return { error: error.message }
  }
}
