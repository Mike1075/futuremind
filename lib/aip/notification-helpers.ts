/**
 * 通知辅助函数
 * 用于判断通知类型和状态
 */

export interface UnifiedInteraction {
  id: string
  interactionType: 'notification' | 'project_request'
  title: string
  message: string
  status: 'pending' | 'approved' | 'rejected' | 'read' | 'unread'
  created_at: string
  metadata?: any
  applicantName?: string
  applicantEmail?: string
  requestMessage?: string
  originalRequest?: any
}

// 检查是否是需要审核的文档通知
export const isFileReviewNotification = (interaction: UnifiedInteraction): boolean => {
  if (interaction.interactionType !== 'notification') return false
  const notif = interaction.originalRequest
  return notif?.type === 'file_review_request'
}

// 检查文档是否待审核（未处理）
export const isPendingFileReview = (interaction: UnifiedInteraction): boolean => {
  return isFileReviewNotification(interaction) && interaction.status === 'unread'
}

// 检查是否是收到的邀请通知
export const isInvitationReceivedNotification = (interaction: UnifiedInteraction): boolean => {
  if (interaction.interactionType !== 'notification') return false
  const notif = interaction.originalRequest
  return notif?.type === 'invitation_received'
}

// 检查邀请是否待响应
export const isPendingInvitation = (interaction: UnifiedInteraction): boolean => {
  return isInvitationReceivedNotification(interaction) && interaction.status === 'unread'
}

// 判断项目是否可删除
export const canDeleteInteraction = (interaction: UnifiedInteraction): boolean => {
  // 待审核的项目申请不可删除
  if (interaction.interactionType === 'project_request' && interaction.status === 'pending') {
    return false
  }
  // 待审核的文档通知不可删除
  if (isPendingFileReview(interaction)) {
    return false
  }
  // 待响应的邀请不可删除
  if (isPendingInvitation(interaction)) {
    return false
  }
  return true
}

// 格式化日期为相对时间
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays}天前`
  } else if (diffHours > 0) {
    return `${diffHours}小时前`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`
  } else {
    return '刚刚'
  }
}
