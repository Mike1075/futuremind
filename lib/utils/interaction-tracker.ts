/**
 * 前端互动追踪工具
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

// 防抖：避免短时间内重复发送
const recentInteractions = new Set<string>()
const DEBOUNCE_TIME = 3000 // 3秒内同一操作不重复记录

export async function recordInteraction(params: {
  contentId: string
  interactionType: InteractionType
  itemIndex?: number
  itemType?: ItemType
  metadata?: Record<string, any>
}) {
  // 生成唯一key
  const key = `${params.contentId}_${params.interactionType}_${params.itemIndex}_${params.itemType}`

  // 对于讨论消息，不进行防抖检查，确保每条消息都被记录
  const shouldDebounce = params.interactionType !== 'discussion_message' && params.interactionType !== 'deep_discussion'

  // 防抖检查（仅对非讨论消息）
  if (shouldDebounce && recentInteractions.has(key)) {
    return { success: true, cached: true }
  }

  // 标记为已发送（仅对非讨论消息）
  if (shouldDebounce) {
    recentInteractions.add(key)
    setTimeout(() => recentInteractions.delete(key), DEBOUNCE_TIME)
  }

  try {
    const response = await fetch('/api/interactions/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      console.error('[Interaction Tracker] Failed to record:', await response.text())
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('[Interaction Tracker] Error:', error)
    return { success: false }
  }
}

/**
 * 获取地球课程内容的实时进度
 */
export async function getEarthProgress(contentId: string) {
  try {
    const response = await fetch(`/api/progress/calculate-earth?contentId=${contentId}`)

    if (!response.ok) {
      console.error('[Progress] Failed to fetch')
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[Progress] Error:', error)
    return null
  }
}
