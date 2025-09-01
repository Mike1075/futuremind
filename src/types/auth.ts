// 用户角色类型定义
export type UserRole = 'admin' | 'student' | 'guest'

// 权限定义
export interface Permission {
  resource: string
  action: string
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // 管理员拥有所有权限
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'courses', action: 'read' },
    { resource: 'courses', action: 'create' },
    { resource: 'courses', action: 'update' },
    { resource: 'courses', action: 'delete' },
    { resource: 'groups', action: 'read' },
    { resource: 'groups', action: 'create' },
    { resource: 'groups', action: 'update' },
    { resource: 'groups', action: 'delete' },
    { resource: 'projects', action: 'read' },
    { resource: 'projects', action: 'create' },
    { resource: 'projects', action: 'update' },
    { resource: 'projects', action: 'delete' },
    { resource: 'admin', action: 'access' },
  ],
  student: [
    // 学员权限
    { resource: 'courses', action: 'read' },
    { resource: 'groups', action: 'read' },
    { resource: 'groups', action: 'create' },
    { resource: 'groups', action: 'join' },
    { resource: 'projects', action: 'read' },
    { resource: 'projects', action: 'create' },
    { resource: 'projects', action: 'join' },
    { resource: 'profile', action: 'update' },
  ],
  guest: [
    // 游客权限（只读）
    { resource: 'courses', action: 'read' },
    { resource: 'groups', action: 'read' },
    { resource: 'projects', action: 'read' },
  ]
}

// 扩展用户配置文件接口
export interface ExtendedUserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  consciousness_level: number
  role: UserRole
  created_at: string
  updated_at: string
}

// 小组相关类型
export interface Group {
  id: string
  name: string
  description: string | null
  creator_id: string
  max_members: number
  current_members: number
  status: 'recruiting' | 'active' | 'completed' | 'archived'
  tags: string[]
  created_at: string
  updated_at: string
  creator?: ExtendedUserProfile
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'leader' | 'member'
  joined_at: string
  user?: ExtendedUserProfile
}

export interface GroupApplication {
  id: string
  group_id: string
  user_id: string
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  user?: ExtendedUserProfile
  group?: Group
}

// 课程相关类型
export interface Course {
  id: string
  title: string
  description: string | null
  content: Record<string, unknown> | null
  instructor_id: string | null
  difficulty_level: number
  duration_hours: number
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  instructor?: ExtendedUserProfile
}

export interface CourseEnrollment {
  id: string
  course_id: string
  user_id: string
  progress: number
  completed_at: string | null
  enrolled_at: string
  course?: Course
  user?: ExtendedUserProfile
}

// 扩展项目类型
export interface ExtendedProject {
  id: string
  title: string
  description: string | null
  season_id: string
  creator_id: string | null
  max_participants: number
  current_participants: number
  status: 'active' | 'completed' | 'paused'
  tags: string[]
  difficulty_level: number
  estimated_duration: string | null
  requirements: string | null
  created_at: string
  updated_at: string
  creator?: ExtendedUserProfile
  season?: {
    title: string
  }
}

// 权限检查函数
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.some(p => p.resource === resource && p.action === action)
}

// 检查是否为管理员
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin'
}

// 检查是否为学员或管理员
export function isStudentOrAdmin(userRole: UserRole): boolean {
  return userRole === 'student' || userRole === 'admin'
}

// 检查是否可以访问管理后台
export function canAccessAdmin(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin', 'access')
}
