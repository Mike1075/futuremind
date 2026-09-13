// @ts-nocheck
/**
 * 盖亚对话 API
 * V3.2 - 单对话模式：每个用户只有一个对话记录，所有消息统一存储
 */
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  isGaia: boolean
  timestamp: Date
}

interface RawMessageData {
  id?: string | number
  content?: string
  text?: string
  isGaia?: boolean
  is_gaia?: boolean
  from?: string
  role?: 'user' | 'assistant'
  timestamp?: string | Date
}

export interface ChatConversation {
  id: string
  user_id: string
  title: string
  messages: ChatMessage[]
  message_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

class GaiaAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // 标准化消息格式（支持多种历史格式）
  private normalizeMessages(rawMessages: unknown[]): ChatMessage[] {
    const messages = (Array.isArray(rawMessages) ? rawMessages : []) as RawMessageData[]
    return messages.map((msg) => {
      // 判断是否是盖亚消息，优先检查 role 字段
      let isGaiaMessage = false
      if (msg.role) {
        isGaiaMessage = msg.role === 'assistant'
      } else if (msg.isGaia !== undefined) {
        isGaiaMessage = msg.isGaia === true
      } else if (msg.is_gaia !== undefined) {
        isGaiaMessage = msg.is_gaia === true
      } else if (msg.from) {
        isGaiaMessage = msg.from === 'gaia'
      }

      return {
        id: typeof msg.id === 'string' ? msg.id : String(Date.now() + Math.random()),
        content: String(msg.content || msg.text || ''),
        isGaia: isGaiaMessage,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }
    })
  }

  // 获取用户的唯一对话记录
  async getChatHistory(): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 获取用户唯一的活跃对话
      const { data, error } = await this.supabase
        .from('gaia_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle<{
          id: string
          user_id: string
          title: string
          messages: unknown[]
          message_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }>()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        // 没有找到记录，创建用户的唯一对话
        const { data: newData, error: createError } = await this.supabase
          .from('gaia_conversations')
          .insert({
            user_id: user.id,
            title: '与盖亚的对话',
            messages: [],
            is_active: true
          })
          .select()
          .single<{
            id: string
            user_id: string
            title: string
            is_active: boolean
            created_at: string
            updated_at: string
          }>()

        if (createError) {
          return { success: false, error: createError.message }
        }

        return {
          success: true,
          data: {
            id: newData.id,
            user_id: newData.user_id,
            title: newData.title,
            messages: [],
            message_count: 0,
            is_active: newData.is_active,
            created_at: newData.created_at,
            updated_at: newData.updated_at
          }
        }
      }

      // 转换消息格式
      const normalizedMessages = this.normalizeMessages(data.messages)

      return {
        success: true,
        data: {
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          messages: normalizedMessages,
          message_count: data.message_count || 0,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      }
    } catch (error) {
      console.error('获取聊天记录失败:', error)
      return { success: false, error: '获取聊天记录失败' }
    }
  }

  // 保存聊天记录到用户的唯一对话
  async saveChatHistory(messages: ChatMessage[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 转换消息为可序列化格式
      const serializableMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }))

      // 获取用户的活跃对话
      const { data: existing } = await this.supabase
        .from('gaia_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>()

      if (existing) {
        // 更新现有对话
        const { error } = await this.supabase
          .from('gaia_conversations')
          .update({
            messages: serializableMessages,
            message_count: messages.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (error) {
          console.error('保存消息失败:', error)
          return { success: false, error: error.message }
        }
      } else {
        // 创建新对话（首次使用）
        const { error } = await this.supabase
          .from('gaia_conversations')
          .insert({
            user_id: user.id,
            title: '与盖亚的对话',
            messages: serializableMessages,
            message_count: messages.length,
            is_active: true
          })

        if (error) {
          console.error('创建对话失败:', error)
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('保存聊天记录失败:', error)
      return { success: false, error: '保存聊天记录失败' }
    }
  }

  // 清空聊天记录（只清空消息，保留对话记录）
  async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 清空用户对话的消息内容
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
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('清除聊天记录失败:', error)
      return { success: false, error: '清除聊天记录失败' }
    }
  }

  // 上传项目文档
  async uploadProjectDocument({ projectId, file }: { projectId: string; file: File }): Promise<{ success: boolean; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)

      const response = await fetch('/api/n8n/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || '上传失败' }
      }

      return { success: true }
    } catch (error) {
      console.error('上传文档失败:', error)
      return { success: false, error: '上传文档失败' }
    }
  }

  // 获取用户的项目列表
  async listUserProjects(): Promise<{ success: boolean; data?: { id: string; title?: string }[]; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'user' }
      }

      const { data, error } = await this.supabase
        .from('course_contents')
        .select('*')
        .eq('content_type', 'pbl_project')
        .order('created_at', { ascending: false})

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return { success: false, error: '获取项目列表失败' }
    }
  }
}

const gaiaAPI = new GaiaAPI()
export default gaiaAPI
