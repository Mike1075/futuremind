// 探索者联盟功能类型定义
// 创建时间: 2024-12-19

export interface ExplorerGuild {
  id: string;
  name: string;
  theme: string;
  description?: string;
  status: GuildStatus;
  max_members: number;
  current_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  invitation_response: InvitationResponse;
  is_active: boolean;
}

export interface InterestGravityField {
  id: string;
  theme: string;
  keywords: string[];
  user_ids: string[];
  strength: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface MysticalInvitation {
  id: string;
  user_id: string;
  guild_id: string;
  invitation_text: string;
  sent_at: string;
  response: InvitationResponse;
  responded_at?: string;
  expires_at: string;
}

export interface GuildActivity {
  id: string;
  guild_id: string;
  user_id: string;
  activity_type: ActivityType;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GuildAchievement {
  id: string;
  guild_id: string;
  achievement_type: AchievementType;
  title: string;
  description?: string;
  icon_name?: string;
  unlocked_at: string;
  unlocked_by?: string;
}

export interface GuildOverview {
  id: string;
  name: string;
  theme: string;
  description?: string;
  status: GuildStatus;
  max_members: number;
  current_members: number;
  created_at: string;
  creator_email: string;
  active_members_count: number;
}

export interface UserGuildStatus {
  user_id: string;
  email: string;
  guild_id?: string;
  guild_name?: string;
  guild_theme?: string;
  user_role?: MemberRole;
  joined_at?: string;
  is_active?: boolean;
}

export interface RecommendedGuild {
  guild_id: string;
  guild_name: string;
  guild_theme: string;
  match_score: number;
  reason: string;
}

// 枚举类型
export enum GuildStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum MemberRole {
  EXPLORER = 'explorer',
  COORDINATOR = 'coordinator',
  FOUNDER = 'founder'
}

export enum InvitationResponse {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

export enum ActivityType {
  MESSAGE = 'message',
  PROJECT_UPDATE = 'project_update',
  MILESTONE = 'milestone',
  FILE_SHARE = 'file_share',
  MEETING = 'meeting'
}

export enum AchievementType {
  MILESTONE = 'milestone',
  COLLABORATION = 'collaboration',
  INNOVATION = 'innovation',
  COMMUNITY = 'community'
}

// 创建联盟的请求类型
export interface CreateGuildRequest {
  name: string;
  theme: string;
  description?: string;
  max_members?: number;
}

// 更新联盟的请求类型
export interface UpdateGuildRequest {
  name?: string;
  theme?: string;
  description?: string;
  status?: GuildStatus;
  max_members?: number;
}

// 邀请用户的请求类型
export interface SendInvitationRequest {
  user_id: string;
  guild_id: string;
  custom_message?: string;
}

// 响应邀请的请求类型
export interface RespondInvitationRequest {
  invitation_id: string;
  response: InvitationResponse;
}

// 加入联盟的请求类型
export interface JoinGuildRequest {
  guild_id: string;
  role?: MemberRole;
}

// 创建活动的请求类型
export interface CreateActivityRequest {
  guild_id: string;
  activity_type: ActivityType;
  content: string;
  metadata?: Record<string, any>;
}

// 创建成就的请求类型
export interface CreateAchievementRequest {
  guild_id: string;
  achievement_type: AchievementType;
  title: string;
  description?: string;
  icon_name?: string;
}

// 联盟统计信息
export interface GuildStats {
  total_members: number;
  active_members: number;
  total_activities: number;
  total_achievements: number;
  average_activity_per_member: number;
  member_engagement_rate: number;
}

// 用户兴趣分析结果
export interface UserInterestAnalysis {
  user_id: string;
  primary_interests: string[];
  secondary_interests: string[];
  interest_strength: Record<string, number>;
  recommended_themes: string[];
  potential_collaborators: string[];
}

// 联盟匹配结果
export interface GuildMatchResult {
  guild: ExplorerGuild;
  match_score: number;
  match_reasons: string[];
  common_interests: string[];
  potential_contribution: string;
}

// 实时通信类型
export interface GuildMessage {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'file' | 'link' | 'milestone';
  created_at: string;
  user?: {
    email: string;
    role: MemberRole;
  };
}

// 联盟项目类型
export interface GuildProject {
  id: string;
  guild_id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  milestones: ProjectMilestone[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string[];
}

// 错误类型
export interface AllianceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// API响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: AllianceError;
  success: boolean;
  message?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 搜索和过滤类型
export interface GuildSearchParams {
  query?: string;
  status?: GuildStatus[];
  theme_keywords?: string[];
  member_count_range?: {
    min: number;
    max: number;
  };
  created_date_range?: {
    from: string;
    to: string;
  };
}

// 通知类型
export interface GuildNotification {
  id: string;
  user_id: string;
  guild_id: string;
  type: 'invitation' | 'activity' | 'achievement' | 'milestone' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// 导出所有类型
export type {
  ExplorerGuild,
  GuildMember,
  InterestGravityField,
  MysticalInvitation,
  GuildActivity,
  GuildAchievement,
  GuildOverview,
  UserGuildStatus,
  RecommendedGuild,
  CreateGuildRequest,
  UpdateGuildRequest,
  SendInvitationRequest,
  RespondInvitationRequest,
  JoinGuildRequest,
  CreateActivityRequest,
  CreateAchievementRequest,
  GuildStats,
  UserInterestAnalysis,
  GuildMatchResult,
  GuildMessage,
  GuildProject,
  ProjectMilestone,
  AllianceError,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
  GuildSearchParams,
  GuildNotification
};
