// @ts-nocheck
import { createClient } from '@/lib/supabase/client'

export interface AIPChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIPChatHistory {
  messages: AIPChatMessage[]
  project_ids?: string[]
  organization_id?: string
  hasMore: boolean
  totalCount: number
}

class AIPChatAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  /**
   * 加载探索者联盟的聊天历史（分页）
   * 从chat_history表加载，agent_type='member'
   * @param limit 每次加载的记录数（每条记录包含用户消息+AI回复）
   * @param offset 跳过的记录数
   */
  async loadChatHistory(limit: number = 5, offset: number = 0): Promise<{ success: boolean; data?: AIPChatHistory; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 先获取总数
      const { count: totalCount } = await this.supabase
        .from('chat_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('agent_type', 'member')

      // 从chat_history表加载最近的消息（agent_type='member'）
      // 降序获取最新的，然后反转以保持时间顺序
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'member')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('加载聊天历史失败:', error)
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        return { success: true, data: { messages: [], hasMore: false, totalCount: totalCount || 0 } }
      }

      // 反转数据以保持时间顺序（旧消息在前）
      const sortedData = [...data].reverse()

      // 转换为ChatMessage格式（每条记录包含用户消息和AI回复）
      const messages: AIPChatMessage[] = []

      for (const record of sortedData) {
        const timestamp = record.created_at ? new Date(record.created_at) : new Date()

        // 用户消息
        if (record.content) {
          messages.push({
            id: `${record.id}-user`,
            role: 'user',
            content: record.content,
            timestamp
          })
        }

        // AI回复
        if (record.ai_content) {
          messages.push({
            id: `${record.id}-ai`,
            role: 'assistant',
            content: record.ai_content,
            timestamp
          })
        }
      }

      // 提取最后一条记录的元数据
      const lastRecord = sortedData[sortedData.length - 1]
      const metadata = lastRecord.metadata as { project_ids?: string[]; organization_id?: string } | null

      const total = totalCount || 0
      const hasMore = offset + limit < total

      return {
        success: true,
        data: {
          messages,
          project_ids: metadata?.project_ids,
          organization_id: metadata?.organization_id,
          hasMore,
          totalCount: total
        }
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      return { success: false, error: '加载聊天历史失败' }
    }
  }

  /**
   * 清除探索者联盟的聊天历史
   * 删除chat_history表中agent_type='member'的记录
   */
  async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_type', 'member')

      if (error) {
        console.error('清除聊天历史失败:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('清除聊天历史失败:', error)
      return { success: false, error: '清除聊天历史失败' }
    }
  }
}

const aipChatAPI = new AIPChatAPI()
export default aipChatAPI
