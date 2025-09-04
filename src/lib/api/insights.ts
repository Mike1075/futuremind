import { createClient } from '@/lib/supabase/client';

export interface Insight {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  visibility: 'private' | 'public' | 'guild';
  guild_id?: string;
  status: 'draft' | 'published' | 'archived';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInsightData {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  visibility: 'private' | 'public' | 'guild';
  guild_id?: string;
  status?: 'draft' | 'published';
  user_id?: string; // 添加用户ID字段
}

export interface UpdateInsightData extends Partial<CreateInsightData> {
  id: string;
}

export class InsightsAPI {
  private supabase = createClient();

  // 获取用户的洞见列表
  async getUserInsights(userId: string, status?: string): Promise<Insight[]> {
    let query = this.supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // 获取公开的洞见列表
  async getPublicInsights(limit = 20, offset = 0): Promise<Insight[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // 获取联盟内的洞见
  async getGuildInsights(guildId: string, limit = 20, offset = 0): Promise<Insight[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('visibility', 'guild')
      .eq('guild_id', guildId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // 创建洞见
  async createInsight(data: CreateInsightData): Promise<Insight> {
    // 确保有用户ID
    if (!data.user_id) {
      throw new Error('用户ID是必需的');
    }
    
    const { data: insight, error } = await this.supabase
      .from('insights')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return insight;
  }

  // 更新洞见
  async updateInsight(data: UpdateInsightData): Promise<Insight> {
    const { id, ...updateData } = data;
    const { data: insight, error } = await this.supabase
      .from('insights')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return insight;
  }

  // 删除洞见
  async deleteInsight(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('insights')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 获取单个洞见详情
  async getInsightById(id: string): Promise<Insight | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到
      throw error;
    }
    return data;
  }

  // 搜索洞见（按标题、内容、标签）
  async searchInsights(query: string, visibility: 'public' | 'guild' = 'public', limit = 20): Promise<Insight[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('visibility', visibility)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const insightsAPI = new InsightsAPI();
