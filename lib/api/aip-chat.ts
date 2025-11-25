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
}

class AIPChatAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  /**
   * 加载探索者联盟的聊天历史
   * 从chat_history表加载，agent_type='member'
   */
  async loadChatHistory(): Promise<{ success: boolean; data?: AIPChatHistory; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 从chat_history表加载最近的消息（agent_type='member'）
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'member')
        .order('created_at', { ascending: true })
        .limit(100) // 最多加载100条消息

      if (error) {
        console.error('加载聊天历史失败:', error)
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        return { success: true, data: { messages: [] } }
      }

      // 转换为ChatMessage格式（每条记录包含用户消息和AI回复）
      const messages: AIPChatMessage[] = []

      for (const record of data) {
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
      const lastRecord = data[data.length - 1]
      const metadata = lastRecord.metadata as { project_ids?: string[]; organization_id?: string } | null

      return {
        success: true,
        data: {
          messages,
          project_ids: metadata?.project_ids,
          organization_id: metadata?.organization_id
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
