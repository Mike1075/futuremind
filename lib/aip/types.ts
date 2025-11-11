/**
 * AIP系统 TypeScript 类型定义
 * AI-Powered Project Management System Type Definitions
 */

// ============ 组织相关类型 ============

export interface Organization {
  id: string
  name: string
  description: string | null
  settings: OrganizationSettings
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  is_global?: boolean       // 全局社区组织
  is_personal?: boolean     // 个人项目空间
  is_system?: boolean       // 系统组织（不可删除）
  user_id?: string          // 个人空间所属用户ID
  [key: string]: any
}

export interface UserOrganization {
  id: string
  user_id: string
  organization_id: string
  role_in_org: OrgRole
  joined_at: string
  created_at: string
  updated_at: string
  organization?: Organization
}

export type OrgRole = 'owner' | 'admin' | 'member'

// ============ 项目相关类型 ============

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  is_public: boolean
  is_recruiting: boolean
  creator_id: string
  organization_id: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  creator?: UserProfile
  organization?: Organization
  members?: ProjectMember[]
  tasks?: Task[]
}

export type ProjectStatus = 'active' | 'completed' | 'archived'

export interface ProjectMember {
  project_id: string
  user_id: string
  role_in_project: ProjectRole
  joined_at: string
  // Relations
  user?: UserProfile
  project?: Project
}

export type ProjectRole = 'owner' | 'manager' | 'member'

// ============ 任务相关类型 ============

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  assignee_id: string | null
  created_by_id: string
  created_by_ai: boolean
  estimated_hours: number | null
  actual_hours: number | null
  due_date: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  project?: Project
  assignee?: UserProfile
  created_by?: UserProfile
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ============ 文档相关类型 ============

export interface Document {
  id: string
  title: string | null
  content: string
  metadata: Record<string, any>
  embedding: number[] | null  // 向量嵌入
  project_id: string | null
  user_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
  // Relations
  project?: Project
  user?: UserProfile
  organization?: Organization
}

// ============ 聊天相关类型 ============

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  agent_type: AgentType
  project_id: string | null
  user_id: string
  metadata: Record<string, any>
  ai_content: string | null
  created_at: string
  // Relations
  user?: UserProfile
  project?: Project
}

export type AgentType = 'organization' | 'project' | 'member'

export interface ChatRequest {
  chatInput: string
  user_id: string
  project_id: string[]
  organization_id: string
}

export interface ChatResponse {
  response: string
  metadata?: Record<string, any>
}

// ============ 通知相关类型 ============

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'invitation'
  | 'join_request'
  | 'task_assigned'
  | 'mention'
  | 'project_update'
  | 'system'

// ============ 邀请相关类型 ============

export interface Invitation {
  id: string
  inviter_id: string
  invitee_email: string
  invitee_id: string | null
  invitation_type: InvitationType
  target_id: string  // project_id or organization_id
  target_name: string
  status: InvitationStatus
  message: string | null
  created_at: string
  updated_at: string
  expires_at: string
  responded_at: string | null
  response_message: string | null
  // Relations
  inviter?: UserProfile
  invitee?: UserProfile
}

export type InvitationType = 'project' | 'organization'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

// ============ 加入请求相关类型 ============

export interface ProjectJoinRequest {
  id: string
  project_id: string
  user_id: string
  status: JoinRequestStatus
  message: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  // Relations
  project?: Project
  user?: UserProfile
  reviewer?: UserProfile
}

export interface OrganizationJoinRequest {
  id: string
  user_id: string
  organization_id: string
  status: JoinRequestStatus
  message: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  // Relations
  user?: UserProfile
  organization?: Organization
  reviewer?: UserProfile
}

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

// ============ 用户相关类型 ============

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_ai_assist_enabled: boolean
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export type UserRole = 'student' | 'teacher' | 'principal'

// ============ API响应类型 ============

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// ============ 表单输入类型 ============

export interface CreateProjectInput {
  name: string
  description?: string
  organization_id: string
  is_public?: boolean
  is_recruiting?: boolean
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  is_public?: boolean
  is_recruiting?: boolean
}

export interface CreateTaskInput {
  title: string
  description?: string
  project_id: string
  priority?: TaskPriority
  assignee_id?: string
  estimated_hours?: number
  due_date?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  estimated_hours?: number
  actual_hours?: number
  due_date?: string
}

export interface CreateOrganizationInput {
  name: string
  description?: string
}

export interface InviteToProjectInput {
  project_id: string
  invitee_email: string
  message?: string
}

export interface InviteToOrganizationInput {
  organization_id: string
  invitee_email: string
  message?: string
}
