import { createClient } from '@/lib/supabase/client'

export interface DomainScores {
  self_awareness: { depth_score: number }
  life_sciences: { depth_score: number }
  universal_laws: { depth_score: number }
  creative_expression: { depth_score: number }
  social_connection: { depth_score: number }
}

export interface GrowthScores {
  self_awareness_growth: number
  life_sciences_growth: number
  universal_laws_growth: number
  creative_expression_growth: number
  social_connection_growth: number
}

export interface ConsciousnessTreeView {
  roots: {
    main_roots: Array<{
      domain: string
      length: number
    }>
  }
  trunk: {
    thickness: number
    stability: number
  }
  branches_and_leaves: {
    total_leaves: number
  }
  fruits: Array<{
    id: string
    type: string
    value: string | number
  }>
  last_updated: string | null
}

export interface EvaluationResult {
  success: boolean
  user_id: string
  evaluation: {
    growth_scores: GrowthScores & { evaluation_reasoning?: string }
    ai_reasoning?: string
    messages_analyzed: number
    previous_scores: DomainScores
  }
  update_result: {
    success: boolean
    user_id: string
    previous_scores: DomainScores
    new_scores: DomainScores
    growth_applied: GrowthScores
    tree_view: ConsciousnessTreeView
    timestamp: string
  }
  timestamp: string
}

class ConsciousnessTreeAPI {
  private supabase = createClient()

  // 获取当前用户
  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  // 获取用户的意识树视图
  async getConsciousnessTreeView(): Promise<{ success: boolean; data?: ConsciousnessTreeView; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('consciousness_tree_view')
        .eq('id', user.id)
        .single<{ consciousness_tree_view: ConsciousnessTreeView }>()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data?.consciousness_tree_view }
    } catch (error) {
      console.error('获取意识树视图失败:', error)
      return { success: false, error: '获取意识树视图失败' }
    }
  }

  // 获取用户的领域探索记录
  async getDomainExploration(): Promise<{ success: boolean; data?: { domain_scores: DomainScores; last_evaluated_at: string; total_evaluations: number }; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { data, error } = await this.supabase
        .from('user_domain_exploration')
        .select('domain_scores, last_evaluated_at, total_evaluations')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在，返回默认值
          return {
            success: true,
            data: {
              domain_scores: {
                self_awareness: { depth_score: 0 },
                life_sciences: { depth_score: 0 },
                universal_laws: { depth_score: 0 },
                creative_expression: { depth_score: 0 },
                social_connection: { depth_score: 0 }
              },
              last_evaluated_at: new Date().toISOString(),
              total_evaluations: 0
            }
          }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('获取领域探索记录失败:', error)
      return { success: false, error: '获取领域探索记录失败' }
    }
  }

  // 触发AI评估和意识树更新
  async evaluateAndGrowTree(): Promise<{ success: boolean; data?: EvaluationResult; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 调用Supabase Edge Function
      const { data, error } = await this.supabase.functions.invoke('evaluate-and-grow-tree', {
        body: { user_id: user.id }
      })

      if (error) {
        console.error('调用边缘函数失败:', error)
        return { success: false, error: `评估失败: ${error.message}` }
      }

      if (!data.success) {
        return { success: false, error: data.error || '评估失败' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('评估和更新意识树失败:', error)
      return { success: false, error: '评估和更新意识树失败' }
    }
  }

  // 手动更新意识树（用于测试）
  async manualUpdateTree(growthScores: GrowthScores): Promise<{ success: boolean; data?: DomainScores; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      // 调用数据库RPC函数
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase.rpc as any)('update_exploration_and_tree_view', {
        p_user_id: user.id,
        p_growth_scores_json: growthScores
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('手动更新意识树失败:', error)
      return { success: false, error: '手动更新意识树失败' }
    }
  }

  // 检查是否需要进行评估（基于消息数量）
  async shouldEvaluate(): Promise<{ success: boolean; should_evaluate: boolean; message_count?: number; error?: string }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, should_evaluate: false, error: '用户未登录' }
      }

      // 获取用户的对话记录
      const { data, error } = await this.supabase
        .from('gaia_conversations')
        .select('messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single<{ messages: unknown[] }>()

      if (error && error.code !== 'PGRST116') {
        return { success: false, should_evaluate: false, error: error.message }
      }

      const messageCount = data?.messages?.length || 0
      const shouldEvaluate = messageCount > 0 && messageCount % 10 === 0

      return {
        success: true,
        should_evaluate: shouldEvaluate,
        message_count: messageCount
      }
    } catch (error) {
      console.error('检查评估条件失败:', error)
      return { success: false, should_evaluate: false, error: '检查评估条件失败' }
    }
  }
}

const consciousnessTreeAPI = new ConsciousnessTreeAPI()
export default consciousnessTreeAPI