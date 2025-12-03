// @ts-nocheck
import { createClient } from '@/lib/supabase/client'

export interface GaiaChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  emotion?: 'curious' | 'excited' | 'thoughtful' | 'supportive'
}

export interface GaiaChatHistory {
  messages: GaiaChatMessage[]
  conversationId: string | null
  hasMore: boolean
  totalCount: number
}

class GaiaChatAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  /**
   * 加载盖亚聊天历史（分页）
   * 从gaia_conversations表加载，messages是JSON数组
   * @param limit 每次加载的消息数
   * @param offset 跳过的消息数
   */
  async loadChatHistory(limit: number = 5, offset: number = 0): Promise<{ success: boolean; data?: GaiaChatHistory; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 获取用户最新的活跃对话
      const { data: conversation, error } = await this.supabase
        .from('gaia_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('加载盖亚聊天历史失败:', error)
        return { success: false, error: error.message }
      }

      if (!conversation || !conversation.messages) {
        return {
          success: true,
          data: {
            messages: [],
            conversationId: null,
            hasMore: false,
            totalCount: 0
          }
        }
      }

      // messages是JSON数组，需要解析
      const allMessages = Array.isArray(conversation.messages)
        ? conversation.messages
        : []

      const totalCount = allMessages.length

      // 从末尾开始取（最新的消息）
      // offset=0 表示最新的5条，offset=5 表示往前的5条
      const startIndex = Math.max(0, totalCount - offset - limit)
      const endIndex = Math.max(0, totalCount - offset)
      const slicedMessages = allMessages.slice(startIndex, endIndex)

      // 转换为GaiaChatMessage格式
      const messages: GaiaChatMessage[] = slicedMessages.map((msg: any, index: number) => ({
        id: `${conversation.id}-${startIndex + index}`,
        role: msg.role || 'assistant',
        content: msg.content || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        emotion: msg.emotion
      }))

      const hasMore = startIndex > 0

      return {
        success: true,
        data: {
          messages,
          conversationId: conversation.id,
          hasMore,
          totalCount
        }
      }
    } catch (error) {
      console.error('加载盖亚聊天历史失败:', error)
      return { success: false, error: '加载盖亚聊天历史失败' }
    }
  }

  /**
   * 清除盖亚聊天历史
   * 重置gaia_conversations的messages为空数组
   */
  async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 将当前对话的messages清空
      const { error } = await this.supabase
        .from('gaia_conversations')
        .update({
          messages: [],
          message_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) {
        console.error('清除盖亚聊天历史失败:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('清除盖亚聊天历史失败:', error)
      return { success: false, error: '清除盖亚聊天历史失败' }
    }
  }

  /**
   * 删除指定的消息
   * @param messageIds 要删除的消息ID数组
   */
  async deleteMessages(messageIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 获取当前对话
      const { data: conversation, error: fetchError } = await this.supabase
        .from('gaia_conversations')
        .select('id, messages')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError || !conversation) {
        return { success: false, error: '找不到对话记录' }
      }

      // 从messageIds中提取索引（格式为 conversationId-index）
      const indicesToDelete = new Set(
        messageIds.map(id => {
          const parts = id.split('-')
          return parseInt(parts[parts.length - 1])
        })
      )

      // 过滤掉要删除的消息
      const allMessages = Array.isArray(conversation.messages) ? conversation.messages : []
      const newMessages = allMessages.filter((_, index) => !indicesToDelete.has(index))

      // 更新数据库
      const { error: updateError } = await this.supabase
        .from('gaia_conversations')
        .update({
          messages: newMessages,
          message_count: newMessages.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除消息失败:', error)
      return { success: false, error: '删除消息失败' }
    }
  }
}

const gaiaChatAPI = new GaiaChatAPI()
export default gaiaChatAPI
