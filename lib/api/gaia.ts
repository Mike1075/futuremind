// @ts-nocheck - 临时禁用类型检查，conversation_summary表尚未创建
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

export interface ConversationSummary {
  id: string
  user_id: string
  title: string
  message_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  last_message: string
}

class GaiaAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // === 多对话管理方法 ===

  // 获取用户的所有对话列表
  async getConversationList(): Promise<{ success: boolean; data?: ConversationSummary[]; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { data, error } = await this.supabase
        .from('conversation_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      // Filter out any invalid records and ensure all fields are non-null
      const validData = (data || []).filter(item =>
        item.id && item.user_id && item.title
      ) as ConversationSummary[]

      return { success: true, data: validData }
    } catch (error) {
      console.error('获取对话列表失败:', error)
      return { success: false, error: '获取对话列表失败' }
    }
  }

  // 创建新对话
  async createNewConversation(title?: string): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const newConversation = {
        user_id: user.id,
        title: title || '新对话',
        messages: [],
        is_active: true
      }

      const { data, error } = await this.supabase
        .from('gaia_conversations')
        .insert(newConversation)
        .select()
        .single<{
          id: string
          user_id: string
          title: string
          is_active: boolean
          created_at: string
          updated_at: string
        }>()

      if (error) {
        return { success: false, error: error.message }
      }

      const convertedData: ChatConversation = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        messages: [],
        message_count: 0,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return { success: true, data: convertedData }
    } catch (error) {
      console.error('创建新对话失败:', error)
      return { success: false, error: '创建新对话失败' }
    }
  }

  // 获取特定对话
  async getConversation(conversationId: string): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { data, error } = await this.supabase
        .from('gaia_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single<{
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

      // 转换消息格式（复用现有逻辑）
      const rawMessages = (Array.isArray(data.messages) ? data.messages : []) as RawMessageData[]
      const normalizedMessages: ChatMessage[] = rawMessages.map((msg) => ({
        id: typeof msg.id === 'string' ? msg.id : String(Date.now()),
        content: String(msg.content || msg.text || ''),
        isGaia: Boolean(msg.isGaia ?? msg.is_gaia ?? (msg.from === 'gaia')),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }))

      const convertedData: ChatConversation = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        messages: normalizedMessages,
        message_count: data.message_count || 0,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return { success: true, data: convertedData }
    } catch (error) {
      console.error('获取对话失败:', error)
      return { success: false, error: '获取对话失败' }
    }
  }

  // 删除对话（软删除）
  async deleteConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('gaia_conversations')
        .update({ is_active: false })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('删除对话失败:', error)
      return { success: false, error: '删除对话失败' }
    }
  }

  // 保存特定对话的聊天记录
  async saveConversationMessages(conversationId: string, messages: ChatMessage[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 转换消息为可序列化格式
      const serializableMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))

      const { error } = await this.supabase
        .from('gaia_conversations')
        .update({
          messages: serializableMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('保存对话消息失败:', error)
      return { success: false, error: '保存对话消息失败' }
    }
  }

  // 获取用户的聊天记录（获取最新的对话，兼容旧版本）
  async getChatHistory(): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 获取最新的活跃对话
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
        // 没有找到记录，创建一个新对话
        const newConversationResult = await this.createNewConversation('新对话')
        if (newConversationResult.success && newConversationResult.data) {
          return { success: true, data: newConversationResult.data }
        } else {
          return { success: false, error: newConversationResult.error || '创建新对话失败' }
        }
      }

      // 转换消息格式（复用getConversation的逻辑）
      const rawMessages = (Array.isArray(data.messages) ? data.messages : []) as RawMessageData[]
      const normalizedMessages: ChatMessage[] = rawMessages.map((msg) => ({
        id: typeof msg.id === 'string' ? msg.id : String(Date.now()),
        content: String(msg.content || msg.text || ''),
        isGaia: Boolean(msg.isGaia ?? msg.is_gaia ?? (msg.from === 'gaia')),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }))

      const convertedData: ChatConversation = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        messages: normalizedMessages,
        message_count: data.message_count || 0,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }

      return { success: true, data: convertedData }
    } catch (error) {
      console.error('获取聊天记录失败:', error)
      return { success: false, error: '获取聊天记录失败' }
    }
  }

  // 保存聊天记录（保存到最新的活跃对话，兼容旧版本）
  async saveChatHistory(messages: ChatMessage[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 获取最新的活跃对话
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
        return await this.saveConversationMessages(existing.id, messages)
      } else {
        // 创建新对话
        const newConversationResult = await this.createNewConversation('新对话')
        if (newConversationResult.success && newConversationResult.data) {
          return await this.saveConversationMessages(newConversationResult.data.id, messages)
        } else {
          return { success: false, error: newConversationResult.error || '创建新对话失败' }
        }
      }
    } catch (error) {
      console.error('保存聊天记录失败:', error)
      return { success: false, error: '保存聊天记录失败' }
    }
  }

  // 清除所有聊天记录（软删除，设置为非活跃）
  async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('gaia_conversations')
        .update({ is_active: false })
        .eq('user_id', user.id)

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
