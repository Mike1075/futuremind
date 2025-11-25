import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'

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

// CQ-02: 定义互动记录类型
interface InteractionRecord {
  id?: string
  user_id: string
  content_id: string
  interaction_type: string  // 使用string以匹配数据库类型
  item_index: number | null
  item_type: string | null  // 使用string以匹配数据库类型
  metadata?: Json
  created_at: string
}

export class InteractionService {
  /**
   * 记录互动行为（防重复）
   */
  // CQ-02: 使用明确类型替代 Record<string, any>
  static async recordInteraction(params: {
    userId: string
    contentId: string
    interactionType: InteractionType
    itemIndex?: number
    itemType?: ItemType
    metadata?: Json
  }) {
    const supabase = await createClient()

    const record: Omit<InteractionRecord, 'id'> = {
      user_id: params.userId,
      content_id: params.contentId,
      interaction_type: params.interactionType,
      item_index: params.itemIndex ?? null,
      item_type: params.itemType ?? null,
      metadata: params.metadata || {},
      created_at: new Date().toISOString()
    }

    // 对于讨论消息，使用 INSERT 而不是 UPSERT，确保每条消息都被记录
    // 对于其他交互类型（点击等），使用 UPSERT 防止重复记录
    let error
    if (params.interactionType === 'discussion_message' || params.interactionType === 'deep_discussion') {
      const { error: insertError } = await supabase
        .from('user_content_interactions')
        .insert(record)
      error = insertError
    } else {
      const { error: upsertError } = await supabase
        .from('user_content_interactions')
        .upsert(record, {
          onConflict: 'user_id,content_id,interaction_type,item_index,item_type',
          ignoreDuplicates: true // 重复点击不覆盖
        })
      error = upsertError
    }

    if (error) {
      logger.error('[InteractionService] Record error:', error)
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
    explorerProjectCount?: number
    explorerProjectScores?: Record<string, number> // 每个项目的最高分
  }) {
    const supabase = await createClient()

    const { knowledgePointCount, questionCounts, reflectionCount, explorerProjectCount = 0, explorerProjectScores = {} } = params
    const totalQuestions = questionCounts.pre + questionCounts.during + questionCounts.post
    const totalItems = knowledgePointCount + totalQuestions + reflectionCount

    // 获取所有互动记录
    // CQ-02: 移除 as any，使用正确的类型
    const { data: interactions, error } = await supabase
      .from('user_content_interactions')
      .select('*')
      .eq('user_id', params.userId)
      .eq('content_id', params.contentId)

    if (error) {
      logger.error('[InteractionService] Query error:', error)
      return { progress: 0, breakdown: {} }
    }

    // CQ-02: 类型安全的数据处理
    const typedInteractions = (interactions || []) as InteractionRecord[]
    const interactionSet = new Set(typedInteractions.map((i) => `${i.interaction_type}_${i.item_index}_${i.item_type}`))

    // Level 1: 接触探索（20%）- 只计算知识点/问题/反思，不含探索者项目
    // 1% 页面访问 + 19% 点击学习项目（知识点/问题/反思）
    // CQ-02: 使用类型化的数组
    const hasVisited = typedInteractions.some((i) => i.interaction_type === 'page_visit')

    // 统计点击触发AI的次数（knowledge_click, question_click, reflection_click）
    const itemsClicked = new Set(
      typedInteractions.filter((i) =>
        i.interaction_type === 'knowledge_click' ||
        i.interaction_type === 'question_click' ||
        i.interaction_type === 'reflection_click'
      ).map((i) => `${i.item_type}_${i.item_index}`)
    ).size

    // 总可点击项目数 = 知识点 + 问题 + 反思（探索者项目单独计算）
    const totalClickableItems = knowledgePointCount + totalQuestions + reflectionCount

    const level1Progress = totalClickableItems > 0
      ? (hasVisited ? 1 : 0) + (itemsClicked / totalClickableItems * 19)
      : (hasVisited ? 1 : 0)

    // Level 2: 主动思考（30%）
    // CQ-02: 使用类型化的数组
    const knowledgeClicks = typedInteractions.filter((i) => i.interaction_type === 'knowledge_click').length
    const questionClicks = typedInteractions.filter((i) => i.interaction_type === 'question_click').length
    const level2Progress =
      (knowledgeClicks / knowledgePointCount * 15) +
      (questionClicks / totalQuestions * 15)

    // Level 3: 深度对话（40%）- 质量优于数量
    // 按讨论深度评分：0-2轮=0分，3-4轮=5分，5-7轮=10分，8轮+=13.33分
    const discussionsByTopic = new Map<string, number>()

    // 统计每个主题的讨论轮数
    // CQ-02: 使用类型化的数组
    typedInteractions.forEach((i) => {
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
    // CQ-02: 使用类型化的数组
    const crossTopicDiscussions = typedInteractions.filter((i) => {
      if (i.interaction_type !== 'discussion_message') return false
      const meta = i.metadata as { crossTopic?: boolean } | null
      return meta?.crossTopic === true
    }).length
    const reflectionDiscussions = typedInteractions.filter((i) =>
      i.interaction_type === 'discussion_start' &&
      i.item_type === 'reflection'
    ).length
    const level4Progress =
      Math.min(7, crossTopicDiscussions * 1.4) + // 最多5次跨主题
      (reflectionDiscussions / Math.max(reflectionCount, 1) * 3)

    // 计算探索者项目进度（独立30%）
    let explorerProgress = 0
    let explorerStats = {
      totalProjects: explorerProjectCount,
      submittedProjects: 0,
      totalScore: 0,
      averageScore: 0
    }

    if (explorerProjectCount > 0) {
      const projectWeight = 30 / explorerProjectCount // 每个项目的权重（总共30%）
      let totalScore = 0
      let submittedCount = 0

      // 遍历每个项目的最高分
      Object.values(explorerProjectScores).forEach((score: number) => {
        if (score > 0) {
          submittedCount++
          totalScore += score
          // 每个项目贡献：(分数/100) × 项目权重
          explorerProgress += (score / 100) * projectWeight
        }
      })

      explorerStats = {
        totalProjects: explorerProjectCount,
        submittedProjects: submittedCount,
        totalScore,
        averageScore: submittedCount > 0 ? Math.round(totalScore / submittedCount) : 0
      }

      logger.debug(`探索者项目进度: ${submittedCount}/${explorerProjectCount}个项目, 平均分${explorerStats.averageScore}, 贡献进度${explorerProgress.toFixed(1)}%`)
    }

    // 知识点和问题部分占70%
    const knowledgeProgress = (level1Progress + level2Progress + level3Progress + level4Progress) * 0.7

    // 总进度 = 知识点问题进度(70%) + 探索者项目进度(30%)
    const totalProgress = Math.min(100, Number((knowledgeProgress + explorerProgress).toFixed(1)))

    logger.debug(`进度组成: 知识点等${knowledgeProgress.toFixed(1)}% + 探索者项目${explorerProgress.toFixed(1)}% = 总计${totalProgress}%`)

    // 统计深度讨论信息
    const deepTopics = Array.from(discussionsByTopic.entries())
      .filter(([_, rounds]) => rounds >= 8)
      .length

    return {
      progress: totalProgress,
      breakdown: {
        knowledge: Number(knowledgeProgress.toFixed(1)), // 知识点问题部分（70%）
        explorer: Number(explorerProgress.toFixed(1)), // 探索者项目部分（30%）
        level1: Math.round(level1Progress * 0.7), // 显示实际贡献
        level2: Math.round(level2Progress * 0.7),
        level3: Math.round(level3Progress * 0.7),
        level4: Math.round(level4Progress * 0.7)
      },
      stats: {
        knowledgeClicks: `${knowledgeClicks}/${knowledgePointCount}`,
        questionClicks: `${questionClicks}/${totalQuestions}`,
        explorerProjects: explorerProjectCount > 0
          ? `${explorerStats.submittedProjects}/${explorerStats.totalProjects} (平均${explorerStats.averageScore}分)`
          : undefined,
        discussedTopics: `${discussionsByTopic.size}/${totalItems}`,
        deepTopics: `${deepTopics}个深度钻研`,
        totalDepthScore: `${Math.round(totalDepthScore)}分`
      }
    }
  }

  /**
   * 获取用户在某个内容的所有互动
   */
  // CQ-02: 返回类型明确化
  static async getUserInteractions(userId: string, contentId: string): Promise<InteractionRecord[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_content_interactions')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[InteractionService] Query error:', error)
      return []
    }

    return (data || []) as InteractionRecord[]
  }
}
