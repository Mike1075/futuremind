import { createClient } from '@/lib/supabase/server'

/**
 * 互动追踪服务
 * 记录用户的学习行为并计算真实进度
 */

export type InteractionType =
  | 'page_visit'
  | 'section_view'
  | 'knowledge_click'
  | 'question_click'
  | 'reflection_click'
  | 'discussion_start'
  | 'discussion_message'
  | 'deep_discussion'

export type ItemType =
  | 'knowledge_point'
  | 'pre_watch'
  | 'during_watch'
  | 'post_watch'
  | 'reflection'

export class InteractionService {
  /**
   * 记录互动行为（防重复）
   */
  static async recordInteraction(params: {
    userId: string
    contentId: string
    interactionType: InteractionType
    itemIndex?: number
    itemType?: ItemType
    metadata?: Record<string, any>
  }) {
    const supabase = await createClient()

    const { error } = await (supabase
      .from('user_content_interactions') as any)
      .upsert({
        user_id: params.userId,
        content_id: params.contentId,
        interaction_type: params.interactionType,
        item_index: params.itemIndex ?? null,
        item_type: params.itemType ?? null,
        metadata: params.metadata || {},
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,content_id,interaction_type,item_index,item_type',
        ignoreDuplicates: true // 重复点击不覆盖
      })

    if (error) {
      console.error('[InteractionService] Record error:', error)
      throw error
    }

    return { success: true }
  }

  /**
   * 计算内容的真实学习进度
   */
  static async calculateProgress(params: {
    userId: string
    contentId: string
    knowledgePointCount: number
    questionCounts: { pre: number; during: number; post: number }
    reflectionCount: number
  }) {
    const supabase = await createClient()

    const { knowledgePointCount, questionCounts, reflectionCount } = params
    const totalQuestions = questionCounts.pre + questionCounts.during + questionCounts.post
    const totalItems = knowledgePointCount + totalQuestions + reflectionCount

    // 获取所有互动记录
    const { data: interactions, error } = await (supabase
      .from('user_content_interactions') as any)
      .select('*')
      .eq('user_id', params.userId)
      .eq('content_id', params.contentId)

    if (error) {
      console.error('[InteractionService] Query error:', error)
      return { progress: 0, breakdown: {} }
    }

    const interactionSet = new Set(interactions?.map((i: any) => `${i.interaction_type}_${i.item_index}_${i.item_type}`) || [])

    // Level 1: 接触探索（20%）
    // 1% 页面访问 + 19% 点击触发AI问题（不是滚动，是点击每个知识点/问题/反思）
    const hasVisited = interactions?.some((i: any) => i.interaction_type === 'page_visit') || false

    // 统计点击触发AI的次数（knowledge_click, question_click, reflection_click）
    const totalClickableItems = knowledgePointCount + totalQuestions + reflectionCount
    const itemsClicked = new Set(
      interactions?.filter((i: any) =>
        i.interaction_type === 'knowledge_click' ||
        i.interaction_type === 'question_click' ||
        i.interaction_type === 'reflection_click'
      ).map((i: any) => `${i.item_type}_${i.item_index}`) || []
    ).size

    const level1Progress = (hasVisited ? 1 : 0) + (itemsClicked / totalClickableItems * 19)

    // Level 2: 主动思考（30%）
    const knowledgeClicks = interactions?.filter((i: any) => i.interaction_type === 'knowledge_click').length || 0
    const questionClicks = interactions?.filter((i: any) => i.interaction_type === 'question_click').length || 0
    const level2Progress =
      (knowledgeClicks / knowledgePointCount * 15) +
      (questionClicks / totalQuestions * 15)

    // Level 3: 深度对话（40%）- 质量优于数量
    // 按讨论深度评分：0-2轮=0分，3-4轮=5分，5-7轮=10分，8轮+=13.33分
    const discussionsByTopic = new Map<string, number>()

    // 统计每个主题的讨论轮数
    interactions?.forEach((i: any) => {
      if (i.interaction_type === 'discussion_message') {
        const key = `${i.item_type}_${i.item_index}`
        discussionsByTopic.set(key, (discussionsByTopic.get(key) || 0) + 1)
      }
    })

    // 计算每个主题的深度分数
    let totalDepthScore = 0
    discussionsByTopic.forEach((rounds) => {
      if (rounds <= 2) {
        totalDepthScore += 0
      } else if (rounds <= 4) {
        totalDepthScore += 5
      } else if (rounds <= 7) {
        totalDepthScore += 10
      } else {
        totalDepthScore += 13.33  // 深度钻研奖励！
      }
    })

    const level3Progress = Math.min(40, totalDepthScore)

    // Level 4: 知识内化（10%）
    const crossTopicDiscussions = interactions?.filter((i: any) =>
      i.interaction_type === 'discussion_message' &&
      i.metadata?.crossTopic === true
    ).length || 0
    const reflectionDiscussions = interactions?.filter((i: any) =>
      i.interaction_type === 'discussion_start' &&
      i.item_type === 'reflection'
    ).length || 0
    const level4Progress =
      Math.min(7, crossTopicDiscussions * 1.4) + // 最多5次跨主题
      (reflectionDiscussions / Math.max(reflectionCount, 1) * 3)

    const totalProgress = Math.min(100, Math.round(
      level1Progress + level2Progress + level3Progress + level4Progress
    ))

    // 统计深度讨论信息
    const deepTopics = Array.from(discussionsByTopic.entries())
      .filter(([_, rounds]) => rounds >= 8)
      .length

    return {
      progress: totalProgress,
      breakdown: {
        level1: Math.round(level1Progress),
        level2: Math.round(level2Progress),
        level3: Math.round(level3Progress),
        level4: Math.round(level4Progress)
      },
      stats: {
        knowledgeClicks: `${knowledgeClicks}/${knowledgePointCount}`,
        questionClicks: `${questionClicks}/${totalQuestions}`,
        discussedTopics: `${discussionsByTopic.size}/${totalItems}`,
        deepTopics: `${deepTopics}个深度钻研`,
        totalDepthScore: `${Math.round(totalDepthScore)}分`
      }
    }
  }

  /**
   * 获取用户在某个内容的所有互动
   */
  static async getUserInteractions(userId: string, contentId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase
      .from('user_content_interactions') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[InteractionService] Query error:', error)
      return []
    }

    return data || []
  }
}
