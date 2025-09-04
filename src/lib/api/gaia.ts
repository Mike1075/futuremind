import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  isGaia: boolean
  timestamp: Date
}

export interface ChatConversation {
  id: string
  user_id: string
  messages: ChatMessage[]
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

  // 获取用户的聊天记录
  async getChatHistory(): Promise<{ success: boolean; data?: ChatConversation; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { data, error } = await this.supabase
        .from('gaia_conversations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到记录，返回空记录
          return { 
            success: true, 
            data: {
              id: '',
              user_id: user.id,
              messages: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        }
        return { success: false, error: error.message }
      }

      // 转换消息格式
      const convertedData: ChatConversation = {
        ...data,
        messages: data.messages.map((msg: Record<string, unknown>) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }

      return { success: true, data: convertedData }
    } catch (error) {
      console.error('获取聊天记录失败:', error)
      return { success: false, error: '获取聊天记录失败' }
    }
  }

  // 保存聊天记录
  async saveChatHistory(messages: ChatMessage[]): Promise<{ success: boolean; error?: string }> {
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

      // 检查是否已有记录
      const { data: existing } = await this.supabase
        .from('gaia_conversations')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // 更新现有记录
        const { error } = await this.supabase
          .from('gaia_conversations')
          .update({
            messages: serializableMessages,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) {
          return { success: false, error: error.message }
        }
      } else {
        // 创建新记录
        const { error } = await this.supabase
          .from('gaia_conversations')
          .insert({
            user_id: user.id,
            messages: serializableMessages
          })

        if (error) {
          return { success: false, error: error.message }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('保存聊天记录失败:', error)
      return { success: false, error: '保存聊天记录失败' }
    }
  }

  // 清除聊天记录
  async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('gaia_conversations')
        .delete()
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
  async listUserProjects(): Promise<{ success: boolean; data?: Project[]; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'user' }
      }

      const { data, error } = await this.supabase
        .from('pbl_projects')
        .select('*')
        .order('created_at', { ascending: false })

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


