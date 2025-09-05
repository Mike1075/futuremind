// 探索者联盟功能API服务层
// 创建时间: 2024-12-19

import { createClient } from '@/lib/supabase/client';
import type {
  ExplorerGuild,
  GuildMember,
  MysticalInvitation,
  GuildActivity,
  GuildAchievement,
  UserGuildStatus,
  RecommendedGuild,
  CreateGuildRequest,
  UpdateGuildRequest,
  SendInvitationRequest,
  RespondInvitationRequest,
  CreateActivityRequest,
  CreateAchievementRequest,
  GuildStats,
  GuildSearchParams,
  ApiResponse
} from '@/types/alliance';

const supabase = createClient();

export class AllianceAPI {
  // ==================== 探索者联盟管理 ====================
  
  /**
   * 创建新的探索者联盟
   */
  static async createGuild(data: CreateGuildRequest): Promise<ApiResponse<ExplorerGuild>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: guild, error } = await (supabase as any)
        .from('explorer_guilds')
        .insert({
          name: data.name,
          theme: data.theme,
          description: data.description ?? null,
          created_by: user.user.id,
          max_members: data.max_members || 6
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'CREATE_FAILED', message: error.message }
        };
      }

      // 自动将创建者添加为创始人成员
      await this.addMember(guild.id, user.user.id, 'founder');

      return {
        success: true,
        data: guild,
        message: '联盟创建成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '创建联盟时发生未知错误' }
      };
    }
  }

  /**
   * 获取联盟列表
   */
  static async getGuilds(params?: GuildSearchParams): Promise<ApiResponse<ExplorerGuild[]>> {
    try {
      let query = supabase
        .from('explorer_guilds')
        .select('*')
        .order('created_at', { ascending: false });

      // 应用搜索过滤
      if (params?.query) {
        query = query.textSearch('theme', params.query);
      }
      if (params?.status && params.status.length > 0) {
        query = query.in('status', params.status);
      }
      if (params?.member_count_range) {
        query = query.gte('current_members', params.member_count_range.min)
                   .lte('current_members', params.member_count_range.max);
      }

      const { data: guilds, error } = await query;

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: guilds || [],
        message: '获取联盟列表成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取联盟列表时发生未知错误' }
      };
    }
  }

  /**
   * 获取联盟详情
   */
  static async getGuild(id: string): Promise<ApiResponse<ExplorerGuild>> {
    try {
      const { data: guild, error } = await supabase
        .from('explorer_guilds')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '联盟不存在' }
        };
      }

      return {
        success: true,
        data: guild,
        message: '获取联盟详情成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取联盟详情时发生未知错误' }
      };
    }
  }

  /**
   * 更新联盟信息
   */
  static async updateGuild(id: string, data: UpdateGuildRequest): Promise<ApiResponse<ExplorerGuild>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by')
        .eq('id', id)
        .single();

      const createdBy = (guild as { created_by?: string } | null)?.created_by;
      if (!createdBy || createdBy !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '没有权限修改此联盟' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedGuild, error } = await (supabase as any)
        .from('explorer_guilds')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: updatedGuild,
        message: '联盟更新成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '更新联盟时发生未知错误' }
      };
    }
  }

  /**
   * 删除联盟
   */
  static async deleteGuild(id: string): Promise<ApiResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by, current_members')
        .eq('id', id)
        .single();

      const g = (guild as { created_by?: string; current_members?: number } | null);
      if (!g?.created_by || g.created_by !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '没有权限删除此联盟' }
        };
      }

      const currentMembers = (g?.current_members ?? 0);
      if (currentMembers > 1) {
        return {
          success: false,
          error: { code: 'INVALID_OPERATION', message: '联盟中还有其他成员，无法删除' }
        };
      }

      const { error } = await supabase
        .from('explorer_guilds')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: { code: 'DELETE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        message: '联盟删除成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '删除联盟时发生未知错误' }
      };
    }
  }

  // ==================== 成员管理 ====================
  
  /**
   * 添加成员到联盟
   */
  static async addMember(guildId: string, userId: string, role: string = 'explorer'): Promise<ApiResponse<GuildMember>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: member, error } = await (supabase as any)
        .from('guild_members')
        .insert({
          guild_id: guildId,
          user_id: userId,
          role,
          invitation_response: 'accepted'
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'ADD_MEMBER_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: member,
        message: '成员添加成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '添加成员时发生未知错误' }
      };
    }
  }

  /**
   * 获取联盟成员列表
   */
  static async getGuildMembers(guildId: string): Promise<ApiResponse<GuildMember[]>> {
    try {
      const { data: members, error } = await supabase
        .from('guild_members')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('guild_id', guildId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: members || [],
        message: '获取成员列表成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取成员列表时发生未知错误' }
      };
    }
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(guildId: string, userId: string, newRole: string): Promise<ApiResponse<GuildMember>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by')
        .eq('id', guildId)
        .single();

      if (!guild || (guild as { created_by?: string } | null)?.created_by !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '没有权限修改成员角色' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: member, error } = await (supabase as any)
        .from('guild_members')
        .update({ role: newRole })
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: member,
        message: '成员角色更新成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '更新成员角色时发生未知错误' }
      };
    }
  }

  /**
   * 移除联盟成员
   */
  static async removeMember(guildId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by')
        .eq('id', guildId)
        .single();

      if (!guild || (guild as { created_by?: string } | null)?.created_by !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '没有权限移除成员' }
        };
      }

      // 不能移除创始人
      if ((guild as { created_by?: string } | null)?.created_by === userId) {
        return {
          success: false,
          error: { code: 'INVALID_OPERATION', message: '不能移除联盟创始人' }
        };
      }

      const { error } = await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', guildId)
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: { code: 'REMOVE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        message: '成员移除成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '移除成员时发生未知错误' }
      };
    }
  }

  // ==================== 邀请系统 ====================
  
  /**
   * 发送神秘邀请
   */
  static async sendInvitation(data: SendInvitationRequest): Promise<ApiResponse<MysticalInvitation>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by, current_members, max_members')
        .eq('id', data.guild_id)
        .single();

      if (!guild || (guild as { created_by?: string } | null)?.created_by !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '没有权限发送邀请' }
        };
      }

      const cm = (guild as { current_members?: number; max_members?: number } | null)?.current_members ?? 0;
      const mm = (guild as { current_members?: number; max_members?: number } | null)?.max_members ?? 0;
      if (cm >= mm) {
        return {
          success: false,
          error: { code: 'INVALID_OPERATION', message: '联盟成员已满' }
        };
      }

      // 检查是否已经邀请过
      const { data: existingInvitation } = await supabase
        .from('mystical_invitations')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('guild_id', data.guild_id)
        .single();

      if (existingInvitation) {
        return {
          success: false,
          error: { code: 'DUPLICATE_INVITATION', message: '已经向该用户发送过邀请' }
        };
      }

      // 使用数据库函数生成邀请
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .rpc('generate_mystical_invitation', {
          target_user_id: data.user_id,
          guild_id: data.guild_id,
          custom_message: data.custom_message
        });

      if (error) {
        return {
          success: false,
          error: { code: 'INVITATION_FAILED', message: error.message }
        };
      }

      // 获取邀请详情
      const { data: invitationDetails } = await supabase
        .from('mystical_invitations')
        .select('*')
        .eq('user_id', data.user_id)
        .eq('guild_id', data.guild_id)
        .single();

      return {
        success: true,
        data: invitationDetails!,
        message: '邀请发送成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '发送邀请时发生未知错误' }
      };
    }
  }

  /**
   * 获取用户的邀请列表
   */
  static async getUserInvitations(): Promise<ApiResponse<MysticalInvitation[]>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      const { data: invitations, error } = await supabase
        .from('mystical_invitations')
        .select(`
          *,
          guild:explorer_guilds(name, theme, description)
        `)
        .eq('user_id', user.user.id)
        .order('sent_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: invitations || [],
        message: '获取邀请列表成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取邀请列表时发生未知错误' }
      };
    }
  }

  /**
   * 响应邀请
   */
  static async respondToInvitation(data: RespondInvitationRequest): Promise<ApiResponse<void>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 获取邀请详情
      const { data: invitation, error: fetchError } = await supabase
        .from('mystical_invitations')
        .select('*')
        .eq('id', data.invitation_id)
        .eq('user_id', user.user.id)
        .single();

      if (fetchError || !invitation) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: '邀请不存在' }
        };
      }

      if ((invitation as { response?: string }).response !== 'pending') {
        return {
          success: false,
          error: { code: 'INVALID_OPERATION', message: '邀请已经被响应' }
        };
      }

      // 更新邀请状态
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('mystical_invitations')
        .update({
          response: data.response,
          responded_at: new Date().toISOString()
        })
        .eq('id', data.invitation_id);

      if (updateError) {
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: updateError.message }
        };
      }

      // 如果接受邀请，自动加入联盟
      if (data.response === 'accepted') {
        await this.addMember((invitation as { guild_id: string }).guild_id, user.user.id);
      }

      return {
        success: true,
        message: data.response === 'accepted' ? '邀请接受成功，已加入联盟' : '邀请已拒绝'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '响应邀请时发生未知错误' }
      };
    }
  }

  // ==================== 活动系统 ====================
  
  /**
   * 创建联盟活动
   */
  static async createActivity(data: CreateActivityRequest): Promise<ApiResponse<GuildActivity>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查是否为联盟成员
      const { data: membership } = await supabase
        .from('guild_members')
        .select('id')
        .eq('guild_id', data.guild_id)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (!membership) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '只有联盟成员才能创建活动' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: activity, error } = await (supabase as any)
        .from('guild_activities')
        .insert({
          ...data,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'CREATE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: activity,
        message: '活动创建成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '创建活动时发生未知错误' }
      };
    }
  }

  /**
   * 获取联盟活动列表
   */
  static async getGuildActivities(guildId: string, limit: number = 50): Promise<ApiResponse<GuildActivity[]>> {
    try {
      const { data: activities, error } = await supabase
        .from('guild_activities')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: activities || [],
        message: '获取活动列表成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取活动列表时发生未知错误' }
      };
    }
  }

  // ==================== 成就系统 ====================
  
  /**
   * 创建联盟成就
   */
  static async createAchievement(data: CreateAchievementRequest): Promise<ApiResponse<GuildAchievement>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // 检查权限
      const { data: guild } = await supabase
        .from('explorer_guilds')
        .select('created_by')
        .eq('id', data.guild_id)
        .single();

      if (!guild || (guild as { created_by?: string } | null)?.created_by !== user.user.id) {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: '只有联盟创始人才能创建成就' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: achievement, error } = await (supabase as any)
        .from('guild_achievements')
        .insert({
          ...data,
          unlocked_by: user.user.id
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { code: 'CREATE_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: achievement,
        message: '成就创建成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '创建成就时发生未知错误' }
      };
    }
  }

  /**
   * 获取联盟成就列表
   */
  static async getGuildAchievements(guildId: string): Promise<ApiResponse<GuildAchievement[]>> {
    try {
      const { data: achievements, error } = await supabase
        .from('guild_achievements')
        .select('*')
        .eq('guild_id', guildId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: achievements || [],
        message: '获取成就列表成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取成就列表时发生未知错误' }
      };
    }
  }

  // ==================== 推荐系统 ====================
  
  /**
   * 获取推荐联盟
   */
  static async getRecommendedGuilds(): Promise<ApiResponse<RecommendedGuild[]>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recommendations, error } = await (supabase as any)
        .rpc('get_recommended_guilds', {
          user_uuid: user.user.id
        });

      if (error) {
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: recommendations || [],
        message: '获取推荐联盟成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取推荐联盟时发生未知错误' }
      };
    }
  }

  // ==================== 统计信息 ====================
  
  /**
   * 获取联盟统计信息
   */
  static async getGuildStats(guildId: string): Promise<ApiResponse<GuildStats>> {
    try {
      // 获取成员统计
      const { count: totalMembers } = await supabase
        .from('guild_members')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildId);

      const { count: activeMembers } = await supabase
        .from('guild_members')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildId)
        .eq('is_active', true);

      // 获取活动统计
      const { count: totalActivities } = await supabase
        .from('guild_activities')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildId);

      // 获取成就统计
      const { count: totalAchievements } = await supabase
        .from('guild_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildId);

      const stats: GuildStats = {
        total_members: totalMembers || 0,
        active_members: activeMembers || 0,
        total_activities: totalActivities || 0,
        total_achievements: totalAchievements || 0,
        average_activity_per_member: totalMembers ? (totalActivities || 0) / totalMembers : 0,
        member_engagement_rate: totalMembers ? (activeMembers || 0) / totalMembers : 0
      };

      return {
        success: true,
        data: stats,
        message: '获取统计信息成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取统计信息时发生未知错误' }
      };
    }
  }

  // ==================== 用户状态 ====================
  
  /**
   * 获取用户的联盟状态
   */
  static async getUserGuildStatus(): Promise<ApiResponse<UserGuildStatus | null>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '用户未登录' }
        };
      }

      const { data: status, error } = await supabase
        .from('user_guild_status')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return {
          success: false,
          error: { code: 'FETCH_FAILED', message: error.message }
        };
      }

      return {
        success: true,
        data: status || null,
        message: '获取用户状态成功'
      };
    } catch {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: '获取用户状态时发生未知错误' }
      };
    }
  }
}

export default AllianceAPI;
