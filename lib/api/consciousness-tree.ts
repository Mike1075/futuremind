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

  private async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

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

      return {
        success: true,
        data: {
          domain_scores: data.domain_scores as unknown as DomainScores,
          last_evaluated_at: data.last_evaluated_at || new Date().toISOString(),
          total_evaluations: data.total_evaluations || 0
        }
      }
    } catch (error) {
      console.error('获取领域探索记录失败:', error)
      return { success: false, error: '获取领域探索记录失败' }
    }
  }
}

const consciousnessTreeAPI = new ConsciousnessTreeAPI()
export default consciousnessTreeAPI
